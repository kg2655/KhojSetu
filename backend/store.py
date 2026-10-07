import json
import sqlite3
import time
import uuid
from pathlib import Path
from threading import RLock, Lock
from .models import policy
from .vectors import text_for
from .exchange import ExchangeMixin
from .photos import directory_bytes, photo_path, compress_photo
import hashlib
import shutil


class Store(ExchangeMixin):
    def __init__(self, directory: Path, vectors, device='FIELD-07'):
        directory.mkdir(parents=True, exist_ok=True)
        self.directory = directory
        self.photo_dir = directory / "photos"
        self.photo_dir.mkdir(exist_ok=True)
        self.sync_lock = Lock()
        self.db = sqlite3.connect(directory / 'field.sqlite', check_same_thread=False)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.executescript('''
            CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY, body TEXT, vectors TEXT);
            CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, time REAL, action TEXT, detail TEXT);
            CREATE TABLE IF NOT EXISTS evicted(id TEXT PRIMARY KEY, uuid TEXT, title TEXT, revision INTEGER);
            CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY, body TEXT);
            CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
        ''')
        self.lock, self.vectors, self.device = RLock(), vectors, device
        # Process-local activity must never survive an interrupted run.
        self.set_setting("syncActive", "false")
        self.set_setting("connection", "Not checked")
        self.set_setting("nextSync", "")
        # Eviction intent precedes index removal; replay repairs an interrupted removal.
        for row in self.db.execute("SELECT id,uuid FROM evicted WHERE revision IS NOT NULL").fetchall():
            self.vectors.remove(row[1])
            self.db.execute("DELETE FROM records WHERE id=?", (row[0],))
        self.db.commit()
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
        if vectors is None:
            previous = self.db.execute("SELECT body,vectors FROM records WHERE id=?", (record['id'],)).fetchone()
            if previous and text_for(json.loads(previous[0])) == text_for(record):
                vectors = json.loads(previous[1])
            else:
                vectors = self.vectors.encode(text_for(record))
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
            digest = data.get('photoHash')
            if digest and (not old or digest != old.get('photoHash')) and not photo_path(self.photo_dir, digest).exists():
                raise ValueError('Photo is missing. Upload it again before saving.')
            if not self.has_room(32768):
                raise ValueError('Device storage budget is full. Increase the budget or clear unused photos before saving.')
            now = time.time()
            r = {**(old or {}), **data}
            r.pop('expectedVersion', None)
            r['localOwned'] = True
            r.update(id=rid or f'ARC-{uuid.uuid4().hex[:8].upper()}',
                     uuid=old['uuid'] if old else str(uuid.uuid4()),
                     version=old['version'] + 1 if old else 1,
                     baseRevision=old.get('baseRevision', 0) if old else 0,
                     createdAtTimestamp=old['createdAtTimestamp'] if old else now * 1000,
                     updatedAt=now, device=self.device, dirty=True, eventId=str(uuid.uuid4()))
            if digest:
                r['imageUrl'] = '/api/photos/' + digest if photo_path(self.photo_dir, digest).exists() else None
                r['photoBytes'] = photo_path(self.photo_dir, digest).stat().st_size if r['imageUrl'] else r.get('photoBytes', 0)
            else:
                r.update(imageUrl=None, photoBytes=0)
            if not old or digest != old.get('photoHash') or not r.get('sharePhoto'):
                r['photoBackedUp'] = False
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

    def cache_reason(self, r):
        if r.get("localOwned", True):
            return "Created or edited on this device."
        if r.get("pinned"):
            return "Pinned for offline use."
        if r.get("dirty") or r.get("conflict"):
            return "Pending work or a conflict must be resolved first."
        if r.get("sensitive") or r.get("visibility") == "LOCAL":
            return "Private local evidence is protected."
        if self.db.execute("SELECT 1 FROM outbox WHERE id=?", (r["id"],)).fetchone():
            return "An upload acknowledgement is still pending."
        if not r.get("baseRevision"):
            return "No shared copy is confirmed."
        if r.get("photoHash") and (not r.get("sharePhoto") or not r.get("photoBackedUp")):
            return "The photograph is not confirmed on the shared server."
        return ""

    def cache_catalogue(self):
        with self.lock:
            entries = []
            for r in self.records():
                if not r.get("localOwned", True):
                    entries.append({"id":r["id"],"title":r["title"],"version":r["version"],
                                    "pinned":r.get("pinned",False),"reason":self.cache_reason(r)})
            removed = [dict(zip(("id","title","revision"),row)) for row in self.db.execute(
                "SELECT id,title,revision FROM evicted ORDER BY rowid DESC")]
            return {"references":entries,"removed":removed}

    def pin(self, rid, pinned, expected_version):
        with self.lock:
            r = self.get(rid)
            if not r:
                raise ValueError("Record is no longer on this device.")
            if r["version"] != expected_version:
                raise ValueError("Record changed. Refresh before changing its pin.")
            r["pinned"] = pinned
            self.persist(r)
            return r

    def evict(self, rid, expected_version):
        if not self.sync_lock.acquire(blocking=False):
            raise ValueError("Wait for the current exchange to finish before removing a downloaded reference.")
        try:
            with self.lock:
                r = self.get(rid)
                if not r or r["version"] != expected_version:
                    raise ValueError("Record changed. Refresh before removing its cached copy.")
                reason = self.cache_reason(r)
                if reason:
                    raise ValueError(reason)
                self.db.execute("INSERT OR REPLACE INTO evicted VALUES (?,?,?,?)",
                                (rid,r["uuid"],r["title"],r["baseRevision"]))
                self.db.commit()
                self.vectors.remove(r["uuid"])
                self.db.execute("DELETE FROM records WHERE id=?", (rid,))
                self.db.commit()
                digest = r.get("photoHash")
                if digest:
                    protected = {item.get("photoHash") for item in self.records()}
                    protected.update(item["conflict"]["record"].get("photoHash") for item in self.records() if item.get("conflict"))
                    protected.update(json.loads(row[0])["record"].get("photoHash") for row in self.db.execute("SELECT body FROM outbox"))
                    if digest not in protected:
                        for partial in (False,True):
                            file = photo_path(self.photo_dir,digest,partial)
                            if file.exists():
                                file.unlink()
                self.log("Downloaded reference removed", f"{rid}: shared copy retained; restore available.")
                return {"removed":rid}
        finally:
            self.sync_lock.release()

    def restore_reference(self, rid):
        if not self.sync_lock.acquire(blocking=False):
            raise ValueError("Wait for the current exchange to finish before restoring a reference.")
        try:
            with self.lock:
                if not self.db.execute("SELECT 1 FROM evicted WHERE id=?", (rid,)).fetchone():
                    raise ValueError("No removed reference with this ID.")
                # NULL marks an explicit restore request and keeps the ID subscribed outside the selection.
                self.db.execute("UPDATE evicted SET revision=NULL WHERE id=?", (rid,))
                self.set_setting("cursor",0)
                self.log("Reference restore requested", f"{rid}: reconnect and exchange to download.")
                return {"requested":rid}
        finally:
            self.sync_lock.release()

    def configure(self, values):
        selection_keys = {"downloadSite","downloadMaterial"}
        owns_sync = False
        try:
            with self.lock:
                selection_changed = any(k in values and values[k] != self.setting(k,"") for k in selection_keys)
                if selection_changed:
                    owns_sync = self.sync_lock.acquire(blocking=False)
                    if not owns_sync:
                        raise ValueError("Wait for the current exchange to finish before changing the download selection.")
                    # Replay history under the new selection; existing revisions are skipped safely.
                    self.set_setting("cursor",0)
                for key, value in values.items():
                    self.set_setting(key,str(value).lower() if isinstance(value,bool) else value)
                self.log("Device settings updated","Download selection and resource preferences saved.")
        finally:
            if owns_sync:
                self.sync_lock.release()

    def storage(self):
        photos = directory_bytes(self.photo_dir)
        edge = directory_bytes(self.directory / "edge")
        total = directory_bytes(self.directory)
        return dict(dataBytes=total, photoBytes=photos, indexBytes=edge,
                    otherBytes=max(0,total-photos-edge),
                    budgetBytes=int(self.setting("storageMiB","512"))*1024*1024,
                    freeDiskBytes=shutil.disk_usage(self.directory).free,
                    recordCount=len(self.records()),
                    protectedPhotos=sum(bool(r.get("photoHash")) for r in self.records()))

    def has_room(self, size):
        usage = self.storage()
        return (usage["dataBytes"] + size <= usage["budgetBytes"] and
                usage["freeDiskBytes"] > size + 16*1024*1024)

    def add_photo(self, data):
        body, width, height = compress_photo(data)
        digest = hashlib.sha256(body).hexdigest()
        with self.lock:
            target = photo_path(self.photo_dir, digest)
            if not target.exists():
                if not self.has_room(len(body) + 32768):
                    raise ValueError("Photo would exceed the device storage budget. Increase it or clear unused photos.")
                temporary = target.with_suffix(".tmp")
                temporary.write_bytes(body)
                temporary.replace(target)
            return dict(photoHash=digest, photoBytes=len(body), imageUrl="/api/photos/"+digest,
                        width=width, height=height, originalBytes=len(data))

    def cleanup_photos(self):
        # Attached evidence is never automatically removed. A day protects open, unsaved forms.
        with self.lock:
            referenced = {r.get("photoHash") for r in self.records()}
            for r in self.records():
                if r.get("conflict"):
                    referenced.add(r["conflict"]["record"].get("photoHash"))
            for row in self.db.execute("SELECT body FROM outbox"):
                referenced.add(json.loads(row[0])["record"].get("photoHash"))
            removed = 0
            for file in self.photo_dir.iterdir():
                if file.stem not in referenced and file.stat().st_mtime < time.time()-86400:
                    removed += file.stat().st_size
                    file.unlink()
            self.log("Unused photo cleanup", f"{removed} bytes freed. Attached photographs were protected.")
            return {"freedBytes": removed}

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
                local_photo = {k:r.get(k) for k in ('photoHash','photoBytes','imageUrl','sharePhoto','photoBackedUp')}
                preserve = not r.get('sharePhoto')
                r = {**remote, 'imageUrl': None, 'dirty': False, 'syncStatus': 'SYNCED'}
                if preserve:
                    r.update(local_photo)
                elif r.get('photoHash') and photo_path(self.photo_dir, r['photoHash']).exists():
                    r['imageUrl'] = '/api/photos/' + r['photoHash']
            else:
                if choice == 'MERGED':
                    r['fieldNotes'] += '\n\n[Shared observation]\n' + remote['fieldNotes']
                r.update(dirty=True, syncStatus='PENDING', eventId=str(uuid.uuid4()), localOwned=True)
            r.update(baseRevision=conflict['revision'], conflict=None, version=expected_version + 1)
            if r['dirty'] and not policy(r)[0]:
                r['syncStatus'] = 'LOCAL_ONLY'
            self.persist(r)
            self.log('Conflict resolved', f'{rid} · {choice.lower()} · both versions inspected')
            return r

    def close(self):
        self.vectors.close()
        self.db.close()
