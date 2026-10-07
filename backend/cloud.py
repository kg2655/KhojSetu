"""Single-writer shared gateway. Bind locally, or place behind HTTPS with KHOJ_SYNC_TOKEN."""
import json
import math
import os
import sqlite3
import uuid
from pathlib import Path
from threading import RLock
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Depends, Query, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient, models
from .models import policy, RecordInput
from .photos import photo_path, write_chunk, CHUNK, MAX_PHOTO
from .exchange import encoded

COLLECTION = os.getenv("KHOJ_COLLECTION", "khojsetu_shared_v1")
lock = RLock()


def apply_row(row):
    seq, revision, body, vectors = row
    record, vec = json.loads(body), json.loads(vectors)
    qdrant.upsert(COLLECTION, points=[models.PointStruct(
        id=record["uuid"], vector={"dense":vec["dense"],"lexical":models.SparseVector(**vec["lexical"])},
        payload={**record,"cloudRevision":revision})], wait=True)
    db.execute("UPDATE changes SET applied=1 WHERE seq=?", (seq,))
    db.commit()


def repair_pending():
    for row in db.execute("SELECT seq,revision,body,vectors FROM changes WHERE applied=0 ORDER BY seq").fetchall():
        apply_row(row)


@asynccontextmanager
async def lifespan(app):
    global db, qdrant, photo_dir
    root = Path(os.getenv("KHOJ_CLOUD_DATA", ".data/cloud"))
    root.mkdir(parents=True, exist_ok=True)
    photo_dir = root / "photos"
    photo_dir.mkdir(exist_ok=True)
    db = sqlite3.connect(root/"exchange.sqlite", check_same_thread=False)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("""CREATE TABLE IF NOT EXISTS changes(seq INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT UNIQUE, id TEXT, revision INTEGER, body TEXT, vectors TEXT, applied INTEGER DEFAULT 1)""")
    if "applied" not in {row[1] for row in db.execute("PRAGMA table_info(changes)")}:
        db.execute("ALTER TABLE changes ADD COLUMN applied INTEGER DEFAULT 1")
    db.commit()
    qdrant = QdrantClient(url=os.getenv("QDRANT_URL","http://127.0.0.1:6333"),
                         api_key=os.getenv("QDRANT_API_KEY") or None, timeout=8)
    if not qdrant.collection_exists(COLLECTION):
        qdrant.create_collection(COLLECTION,
            vectors_config={"dense":models.VectorParams(size=384,distance=models.Distance.COSINE)},
            sparse_vectors_config={"lexical":models.SparseVectorParams()})
        # Rebuild shared vectors from the journal if the collection was lost.
        db.execute("UPDATE changes SET applied=0")
        db.commit()
    repair_pending()
    yield
    db.close()
    qdrant.close()


app = FastAPI(title="KhojSetu shared knowledge gateway", lifespan=lifespan)

def authorize(authorization: str = Header(default="")):
    import secrets
    token = os.getenv("KHOJ_SYNC_TOKEN","")
    if token and not secrets.compare_digest(authorization,f"Bearer {token}"):
        raise HTTPException(401,"Exchange token required")


class Exchange(BaseModel):
    record: dict
    vectors: dict
    baseRevision: int = Field(ge=0)
    eventId: str = Field(min_length=1, max_length=100)


@app.get("/health", dependencies=[Depends(authorize)])
def health():
    qdrant.get_collection(COLLECTION)
    return {"status":"ready","engine":"Qdrant Server","collection":COLLECTION}


@app.post("/exchange", dependencies=[Depends(authorize)])
def exchange(req: Exchange):
    try:
        RecordInput.model_validate(req.record)
        uuid.UUID(req.record["uuid"])
        if not isinstance(req.record["id"],str) or len(req.record["id"]) > 100:
            raise ValueError()
        dense, lexical = req.vectors["dense"], req.vectors["lexical"]
        if len(dense) != 384 or not all(math.isfinite(v) for v in dense):
            raise ValueError()
        if len(lexical["indices"]) != len(lexical["values"]) or len(lexical["indices"]) > 20000:
            raise ValueError()
        models.SparseVector(**lexical)
    except (ValueError, KeyError, TypeError):
        raise HTTPException(422,"Invalid record or embedding.")
    if not policy(req.record)[0]:
        raise HTTPException(422,"Record is not approved for sharing")
    # Device-local fields never become shared payloads, even for a manually crafted request.
    record = {k:v for k,v in req.record.items() if k not in ("imageUrl","conflict","photoBackedUp","pinned")}
    if not record.get("sharePhoto"):
        record.update(photoHash=None,photoBytes=0)
    with lock:
        repair_pending()
        seen = db.execute("SELECT revision,id,body,vectors FROM changes WHERE event=?", (req.eventId,)).fetchone()
        if seen:
            if seen[1] != record["id"] or json.loads(seen[2]) != record or json.loads(seen[3]) != req.vectors:
                raise HTTPException(422,"An event ID cannot be reused for different content.")
            return {"revision":seen[0]}
        latest = db.execute("SELECT revision,body FROM changes WHERE id=? ORDER BY seq DESC LIMIT 1",(record["id"],)).fetchone()
        revision = latest[0] if latest else 0
        if req.baseRevision != revision:
            raise HTTPException(409,{"revision":revision,"record":json.loads(latest[1]) if latest else {}})
        revision += 1
        # Journal first; an interrupted Qdrant write is replayed before acknowledging or serving changes.
        cur = db.execute("INSERT INTO changes(event,id,revision,body,vectors,applied) VALUES (?,?,?,?,?,0)",
                         (req.eventId,record["id"],revision,json.dumps(record),json.dumps(req.vectors)))
        db.commit()
        apply_row((cur.lastrowid,revision,json.dumps(record),json.dumps(req.vectors)))
        return {"revision":revision}


@app.get("/receipts/{event_id}", dependencies=[Depends(authorize)])
def receipt(event_id: str):
    with lock:
        repair_pending()
        row = db.execute("SELECT revision FROM changes WHERE event=? AND applied=1",(event_id,)).fetchone()
        return {"revision":row[0] if row else None}


@app.get("/changes", dependencies=[Depends(authorize)])
def changes(after: int = Query(0,ge=0), limit: int = Query(100,ge=1,le=100),
            max_bytes: int = Query(4*1024*1024,ge=1024,le=8*1024*1024)):
    with lock:
        repair_pending()
        rows = db.execute("SELECT seq,revision,body,vectors FROM changes WHERE seq>? ORDER BY seq LIMIT ?",
                          (after,limit+1)).fetchall()
        page = {"changes":[],"cursor":after,"hasMore":False}
        for row in rows[:limit]:
            change = {"seq":row[0],"revision":row[1],"record":json.loads(row[2]),"vectors":json.loads(row[3])}
            candidate = {"changes":page["changes"]+[change],"cursor":row[0],"hasMore":True}
            size = len(encoded(candidate))
            if size + 128 > max_bytes:
                page["hasMore"] = True
                if not page["changes"]:
                    page["requiredBytes"] = size + 128
                break
            page = candidate
        else:
            page["hasMore"] = len(rows) > limit
        return Response(encoded(page), media_type="application/json")


def shared_photo_size(digest):
    try:
        photo_path(photo_dir,digest)
    except ValueError as exc:
        raise HTTPException(400,str(exc))
    # Only hashes referenced by currently approved shared revisions are transferable.
    rows = db.execute("""SELECT c.body FROM changes c JOIN
        (SELECT id,MAX(seq) seq FROM changes WHERE applied=1 GROUP BY id) latest
        ON c.seq=latest.seq""").fetchall()
    for (body,) in rows:
        r = json.loads(body)
        if r.get("photoHash") == digest and r.get("sharePhoto") and policy(r)[0]:
            return r.get("photoBytes",0)
    raise HTTPException(404,"No approved shared photo references this file.")


@app.get("/photos/{digest}/status", dependencies=[Depends(authorize)])
def photo_status(digest: str):
    with lock:
        shared_photo_size(digest)
        final, part = photo_path(photo_dir,digest), photo_path(photo_dir,digest,True)
        return {"offset":final.stat().st_size if final.exists() else part.stat().st_size if part.exists() else 0,
                "complete":final.exists()}


@app.put("/photos/{digest}", dependencies=[Depends(authorize)])
async def upload_photo(digest: str, request: Request, offset: int = Query(ge=0), total: int = Query(gt=0,le=MAX_PHOTO)):
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > CHUNK:
            raise HTTPException(413,"Photo chunks must be at most 64 KiB.")
    with lock:
        if shared_photo_size(digest) != total:
            raise HTTPException(422,"Photo size differs from its approved record.")
        try:
            return write_chunk(photo_dir,digest,offset,total,body)
        except ValueError as exc:
            raise HTTPException(422,str(exc))


@app.get("/photos/{digest}", dependencies=[Depends(authorize)])
def download_photo(digest: str, offset: int = Query(0,ge=0), limit: int = Query(CHUNK,ge=1,le=CHUNK)):
    with lock:
        shared_photo_size(digest)
        file = photo_path(photo_dir,digest)
        if not file.exists():
            raise HTTPException(404,"Photo has not finished uploading.")
        if offset >= file.stat().st_size:
            raise HTTPException(416,"Invalid photo offset.")
        with file.open("rb") as stream:
            stream.seek(offset)
            return Response(stream.read(limit),media_type="application/octet-stream",
                            headers={"X-Photo-Size":str(file.stat().st_size)})
