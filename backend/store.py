import json
import sqlite3
import time
import uuid
from pathlib import Path
from threading import RLock
import httpx
from .models import policy
from .vectors import text_for


class Store:
    def __init__(self, directory: Path, vectors, device='FIELD-07'):
        directory.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(directory / 'field.sqlite', check_same_thread=False)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.executescript('''
            CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY, body TEXT, vectors TEXT);
            CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, time REAL, action TEXT, detail TEXT);
            CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
        ''')
        self.lock, self.vectors, self.device = RLock(), vectors, device
        # SQLite is the recovery journal; replay makes the Edge index crash-repairable.
        for body, vec in self.db.execute('SELECT body,vectors FROM records'):
            self.vectors.upsert(json.loads(body), json.loads(vec))

    def setting(self, key, default=''):
        row = self.db.execute('SELECT value FROM settings WHERE key=?', (key,)).fetchone()
        return row[0] if row else default

    def set_setting(self, key, value):
        self.db.execute('INSERT OR REPLACE INTO settings VALUES (?,?)', (key, str(value)))
        self.db.commit()

    def records(self):
        return [json.loads(row[0]) for row in self.db.execute('SELECT body FROM records ORDER BY rowid DESC')]

    def get(self, rid):
        row = self.db.execute('SELECT body FROM records WHERE id=?', (rid,)).fetchone()
        return json.loads(row[0]) if row else None

    def log(self, action, detail):
        self.db.execute('INSERT INTO events(time,action,detail) VALUES (?,?,?)', (time.time(), action, detail))
        self.db.commit()

    def logs(self):
        return [dict(zip(['id', 'time', 'action', 'detail'], row)) for row in self.db.execute(
            'SELECT id,time,action,detail FROM events ORDER BY id DESC LIMIT 100')]

    def persist(self, record, vectors=None):
        vectors = vectors or self.vectors.encode(text_for(record))
        self.db.execute('INSERT OR REPLACE INTO records VALUES (?,?,?)',
                        (record['id'], json.dumps(record), json.dumps(vectors)))
        self.db.commit()
        self.vectors.upsert(record, vectors)

    def save(self, data, rid=None):
        with self.lock:
            old = self.get(rid) if rid else None
            if rid and not old:
                raise KeyError('Record not found')
            if old and data.get('expectedVersion') != old['version']:
                raise ValueError('This record changed. Reopen it before saving.')
            if old and old.get('conflict'):
                raise ValueError('Resolve the exchange conflict before editing this record.')
            now = time.time()
            r = {**(old or {}), **data}
            r.pop('expectedVersion', None)
            r.update(id=rid or f'ARC-{uuid.uuid4().hex[:8].upper()}',
                     uuid=old['uuid'] if old else str(uuid.uuid4()),
                     version=old['version'] + 1 if old else 1,
                     baseRevision=old.get('baseRevision', 0) if old else 0,
                     createdAtTimestamp=old['createdAtTimestamp'] if old else now * 1000,
                     updatedAt=now, device=self.device, dirty=True, eventId=str(uuid.uuid4()))
            eligible, reason = policy(r)
            r.update(syncStatus='PENDING' if eligible else 'LOCAL_ONLY', policyReason=reason,
                     memoryStatus='SHARED' if eligible else 'LOCAL', conflict=None)
            self.persist(r)
            self.log('Record saved', f"{r['id']} · revision {r['version']} · {reason}")
            return r

    def search(self, request):
        started = time.perf_counter()
        with self.lock:
            found = self.vectors.search(request.query, request.mode,
                {'layer': request.layer, 'material': request.material}, request.limit)
            results = [{'record': self.get(p.payload['id']), 'score': score, 'method': method}
                       for p, score, method in found]
        return {'results': results, 'elapsedMs': round((time.perf_counter()-started)*1000, 1),
                'engine': 'Qdrant Edge 0.8.0', 'mode': request.mode}

    def sync(self, url, token='', metered=False):
        with self.lock:
            if self.setting('fieldMode', 'true') == 'true':
                raise ValueError('Field mode is active. Enable exchange before connecting.')
            uploaded = downloaded = conflicts = deferred = 0
            headers = {'Authorization': f'Bearer {token}'} if token else {}
            try:
                with httpx.Client(base_url=url, headers=headers, timeout=20) as client:
                    client.get('/health').raise_for_status()
                    for r in sorted(self.records(), key=lambda x: x['importance'] != 'High'):
                        if not r.get('dirty') or r.get('conflict'):
                            continue
                        if not policy(r, metered)[0]:
                            deferred += 1
                            continue
                        vec = json.loads(self.db.execute('SELECT vectors FROM records WHERE id=?', (r['id'],)).fetchone()[0])
                        # Image attachments remain device-local in this release.
                        public = {k: v for k, v in r.items() if k not in ('imageUrl', 'conflict')}
                        response = client.post('/exchange', json={'record': public, 'vectors': vec,
                            'baseRevision': r['baseRevision'], 'eventId': r['eventId']})
                        if response.status_code == 409:
                            r.update(conflict=response.json()['detail'], syncStatus='CONFLICT')
                            self.persist(r, vec)
                            conflicts += 1
                            continue
                        response.raise_for_status()
                        r.update(baseRevision=response.json()['revision'], dirty=False, syncStatus='SYNCED')
                        self.persist(r, vec)
                        uploaded += 1
                    cursor = int(self.setting('cursor', '0'))
                    while True:
                        response = client.get('/changes', params={'after': cursor})
                        response.raise_for_status()
                        page = response.json()
                        for change in page['changes']:
                            remote = change['record']
                            local = self.get(remote['id'])
                            revision = change['revision']
                            if local and revision <= local.get('baseRevision', 0):
                                continue
                            if local and local.get('dirty'):
                                local.update(conflict={'record': remote, 'revision': revision}, syncStatus='CONFLICT')
                                self.persist(local)
                                conflicts += 1
                            else:
                                incoming = {**remote, 'baseRevision': revision, 'dirty': False,
                                    'conflict': None, 'syncStatus': 'SYNCED'}
                                if local:
                                    incoming['imageUrl'] = local.get('imageUrl')
                                self.persist(incoming, change['vectors'])
                                downloaded += 1
                        cursor = page['cursor']
                        self.set_setting('cursor', cursor)
                        if not page['hasMore']:
                            break
                self.set_setting('lastSync', time.time())
                self.set_setting('connection', 'Connected')
                result = dict(uploaded=uploaded, downloaded=downloaded, conflicts=conflicts, deferred=deferred)
                self.log('Knowledge exchanged', json.dumps(result))
                return result
            except (httpx.HTTPError, OSError) as exc:
                self.set_setting('connection', 'Unavailable')
                self.log('Exchange interrupted', 'Unacknowledged changes remain queued. Retry when the server is reachable.')
                raise ConnectionError('Shared server is unavailable. Local records and pending changes are safe.') from exc

    def resolve(self, rid, choice, expected_version):
        with self.lock:
            r = self.get(rid)
            if not r or not r.get('conflict'):
                raise ValueError('No unresolved conflict for this record.')
            if r['version'] != expected_version:
                raise ValueError('Record changed; reload before resolving.')
            conflict = r['conflict']
            remote = conflict['record']
            if choice == 'SHARED':
                r = {**remote, 'imageUrl': r.get('imageUrl'), 'dirty': False, 'syncStatus': 'SYNCED'}
            else:
                if choice == 'MERGED':
                    r['fieldNotes'] += '\n\n[Shared observation]\n' + remote['fieldNotes']
                r.update(dirty=True, syncStatus='PENDING', eventId=str(uuid.uuid4()))
            r.update(baseRevision=conflict['revision'], conflict=None, version=expected_version + 1)
            if r['dirty'] and not policy(r)[0]:
                r['syncStatus'] = 'LOCAL_ONLY'
            self.persist(r)
            self.log('Conflict resolved', f'{rid} · {choice.lower()} · both versions inspected')
            return r

    def close(self):
        self.vectors.close()
        self.db.close()
