"""Single-writer exchange gateway: revisions in SQLite, shared vectors in Qdrant Server.
Run one worker. A shared deployment requires TLS and KHOJ_SYNC_TOKEN.
"""
import json
import os
import sqlite3
from pathlib import Path
from threading import RLock
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
from qdrant_client import QdrantClient, models
from .models import policy

COLLECTION = 'khojsetu_shared_v1'
lock = RLock()


@asynccontextmanager
async def lifespan(app):
    global db, qdrant
    root = Path(os.getenv('KHOJ_CLOUD_DATA', '.data/cloud'))
    root.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(root / 'exchange.sqlite', check_same_thread=False)
    db.execute('PRAGMA journal_mode=WAL')
    db.executescript('''
        CREATE TABLE IF NOT EXISTS changes(seq INTEGER PRIMARY KEY AUTOINCREMENT,
            event TEXT UNIQUE, id TEXT, revision INTEGER, body TEXT, vectors TEXT);
    ''')
    qdrant = QdrantClient(url=os.getenv('QDRANT_URL', 'http://127.0.0.1:6333'),
                         api_key=os.getenv('QDRANT_API_KEY') or None, timeout=15)
    if not qdrant.collection_exists(COLLECTION):
        qdrant.create_collection(COLLECTION,
            vectors_config={'dense': models.VectorParams(size=384, distance=models.Distance.COSINE)},
            sparse_vectors_config={'lexical': models.SparseVectorParams()})
    yield
    db.close()
    qdrant.close()


app = FastAPI(title='KhojSetu shared knowledge gateway', lifespan=lifespan)


def authorize(authorization: str = Header(default='')):
    import secrets
    token = os.getenv('KHOJ_SYNC_TOKEN', '')
    if token and not secrets.compare_digest(authorization, f'Bearer {token}'):
        raise HTTPException(401, 'Exchange token required')


class Exchange(BaseModel):
    record: dict
    vectors: dict
    baseRevision: int
    eventId: str


@app.get('/health', dependencies=[Depends(authorize)])
def health():
    qdrant.get_collection(COLLECTION)
    return {'status': 'ready', 'engine': 'Qdrant Server', 'collection': COLLECTION}


@app.post('/exchange', dependencies=[Depends(authorize)])
def exchange(req: Exchange):
    if not policy(req.record)[0]:
        raise HTTPException(422, 'Record is not approved for sharing')
    with lock:
        seen = db.execute('SELECT revision FROM changes WHERE event=?', (req.eventId,)).fetchone()
        if seen:
            return {'revision': seen[0]}
        latest = db.execute('SELECT revision,body FROM changes WHERE id=? ORDER BY seq DESC LIMIT 1',
                            (req.record['id'],)).fetchone()
        revision = latest[0] if latest else 0
        if req.baseRevision != revision:
            raise HTTPException(409, {'revision': revision, 'record': json.loads(latest[1]) if latest else {}})
        revision += 1
        # wait=True: only acknowledge after the server applied the vectors.
        qdrant.upsert(COLLECTION, points=[models.PointStruct(id=req.record['uuid'], vector={
            'dense': req.vectors['dense'], 'lexical': models.SparseVector(**req.vectors['lexical'])},
            payload={**req.record, 'cloudRevision': revision})], wait=True)
        db.execute('INSERT INTO changes(event,id,revision,body,vectors) VALUES (?,?,?,?,?)',
                   (req.eventId, req.record['id'], revision, json.dumps(req.record), json.dumps(req.vectors)))
        db.commit()
        return {'revision': revision}


@app.get('/changes', dependencies=[Depends(authorize)])
def changes(after: int = 0):
    with lock:
        rows = db.execute('SELECT seq,revision,body,vectors FROM changes WHERE seq>? ORDER BY seq LIMIT 100', (after,)).fetchall()
        return {'changes': [{'revision': r[1], 'record': json.loads(r[2]), 'vectors': json.loads(r[3])} for r in rows],
                'cursor': rows[-1][0] if rows else after, 'hasMore': len(rows) == 100}
