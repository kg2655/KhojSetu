import json
import os
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Literal
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from .models import RecordInput, SearchInput, policy
from .vectors import VectorMemory, MODEL
from .store import Store
from .worker import SyncWorker
from .photos import photo_path, directory_bytes, MAX_INPUT

ROOT = Path(__file__).resolve().parent.parent


@asynccontextmanager
async def lifespan(app):
    directory = Path(os.getenv('KHOJ_DATA', ROOT / '.data/field-07'))
    vectors = VectorMemory(directory / 'edge', ROOT / '.models', offline=True)
    app.state.store = Store(directory, vectors, os.getenv('KHOJ_DEVICE', 'FIELD-07'))
    app.state.model_bytes = directory_bytes(ROOT / '.models')
    app.state.worker = SyncWorker(app.state.store)
    app.state.worker.start()
    yield
    await run_in_threadpool(app.state.worker.close)
    app.state.store.close()


app = FastAPI(title='KhojSetu field unit', lifespan=lifespan)


def store():
    return app.state.store


@app.get('/api/state')
def state():
    s = store()
    with s.lock:
        records = s.records()
        return {'records': records, 'logs': s.logs(), 'device': s.device,
                'engine': 'Qdrant Edge 0.8.0', 'embeddingModel': MODEL,
                'fieldMode': s.setting('fieldMode', 'true') == 'true',
                'connection': s.setting('connection', 'Not checked'),
                'lastSync': s.setting('lastSync'),
                'pending': sum(r['syncStatus'] in ('PENDING','WITHDRAWAL_PENDING') for r in records),
                'conflicts': sum(bool(r.get('conflict')) for r in records),
                'syncActive': s.setting('syncActive','false') == 'true',
                'autoSync': s.setting('autoSync','false') == 'true',
                'metered': s.setting('metered','false') == 'true',
                'transferKiB': int(s.setting('transferKiB','256')),
                'nextSync': s.setting('nextSync'),
                'downloadSite': s.setting('downloadSite',''),
                'downloadMaterial': s.setting('downloadMaterial',''),
                'lastExchange': json.loads(s.setting('lastExchange','null'))}


@app.post('/api/records')
def create(data: RecordInput):
    try:
        return store().save(data.model_dump())
    except ValueError as e:
        raise HTTPException(409, str(e))


@app.put('/api/records/{rid}')
def update(rid: str, data: RecordInput):
    try:
        return store().save(data.model_dump(), rid)
    except KeyError as e:
        raise HTTPException(404, str(e))
    except ValueError as e:
        raise HTTPException(409, str(e))


@app.post('/api/search')
def search(data: SearchInput):
    return store().search(data)


@app.post('/api/assistant')
def assistant(data: SearchInput):
    result = store().search(data)
    evidence = result['results'][:5]
    # Extractive evidence, never invented typology, dating or archaeological interpretation.
    result['answer'] = ('Insufficient evidence in local field memory.' if not evidence else
        '\n\n'.join(f"[{e['record']['id']}] {e['record']['title']} — {e['record']['grid']}, "
                    f"{e['record']['layer']}: {e['record']['fieldNotes']}" for e in evidence))
    result['assistantMode'] = 'Extractive evidence review · no generative model'
    return result


class Settings(BaseModel):
    fieldMode: bool | None = None
    autoSync: bool | None = None
    metered: bool | None = None
    transferKiB: int | None = Field(default=None, ge=64, le=8192)
    downloadSite: str | None = Field(default=None, max_length=120)
    downloadMaterial: Literal['','Ceramic','Stone','Metal','Bone','Organic','Glass','Other'] | None = None
    storageMiB: int | None = Field(default=None, ge=192, le=4096)


@app.post('/api/settings')
def settings(data: Settings):
    try:
        values = data.model_dump(exclude_none=True)
        if "downloadSite" in values:
            values["downloadSite"] = values["downloadSite"].strip()
        store().configure(values)
    except ValueError as exc:
        raise HTTPException(409,str(exc))
    return state()



class SyncRequest(BaseModel):
    metered: bool = False


@app.post('/api/sync')
def sync(data: SyncRequest):
    try:
        return store().sync(os.getenv('KHOJ_SYNC_URL', 'http://127.0.0.1:8010'),
                            os.getenv('KHOJ_SYNC_TOKEN', ''), data.metered)
    except ValueError as e:
        raise HTTPException(409, str(e))
    except ConnectionError as e:
        raise HTTPException(503, str(e))


class Resolution(BaseModel):
    choice: Literal['LOCAL', 'SHARED', 'MERGED']
    expectedVersion: int


@app.post('/api/conflicts/{rid}')
def resolve(rid: str, data: Resolution):
    try:
        return store().resolve(rid, data.choice, data.expectedVersion)
    except ValueError as e:
        raise HTTPException(409, str(e))


@app.post('/api/seed')
def seed():
    with store().lock:
        if store().records():
            raise HTTPException(409, 'Demo data can only be loaded into an empty field unit.')
        for r in json.loads((ROOT / 'backend/demo.json').read_text(encoding='utf-8')):
            data = RecordInput.model_validate({**r, 'visibility': 'AUTO',
                                              'approved': True}).model_dump()
            store().save(data)
        store().log('Synthetic dataset loaded', 'Illustrative records only; these are not real archaeological evidence.')
    return state()


class ReferenceAction(BaseModel):
    expectedVersion: int

class PinAction(ReferenceAction):
    pinned: bool

@app.post('/api/records/{rid}/withdraw')
def withdraw_record(rid: str, data: ReferenceAction):
    try:
        return store().request_withdrawal(rid,data.expectedVersion)
    except ValueError as exc:
        raise HTTPException(409,str(exc))

@app.get('/api/references')
def references():
    return store().cache_catalogue()

@app.post('/api/references/{rid}/remove')
def remove_reference(rid: str, data: ReferenceAction):
    try:
        return store().evict(rid,data.expectedVersion)
    except ValueError as exc:
        raise HTTPException(409,str(exc))

@app.post('/api/references/{rid}/restore')
def restore_reference(rid: str):
    try:
        return store().restore_reference(rid)
    except ValueError as exc:
        raise HTTPException(409,str(exc))

@app.post('/api/records/{rid}/pin')
def pin_record(rid: str, data: PinAction):
    try:
        return store().pin(rid,data.pinned,data.expectedVersion)
    except ValueError as exc:
        raise HTTPException(409,str(exc))

@app.get('/api/storage')
def storage():
    with store().lock:
        return {**store().storage(), 'modelBytes': app.state.model_bytes}


@app.post('/api/storage/cleanup')
def cleanup():
    return store().cleanup_photos()


@app.post('/api/reference-packs')
async def upload_reference_pack(request: Request):
    from .packs import MAX_PACK, parse_pack, import_pack
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_PACK:
            raise HTTPException(413, 'Reference packs must be at most 1 MiB.')
        body.extend(chunk)
    try:
        pack = parse_pack(bytes(body))
    except ValueError:
        raise HTTPException(422, 'Invalid reference pack. Check schemaVersion, unique IDs, source, license, evidenceType and 1–100 records.')
    try:
        return await run_in_threadpool(import_pack, store(), pack)
    except ValueError as exc:
        raise HTTPException(409, str(exc))


@app.post('/api/photos')
async def upload_photo(request: Request):
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > MAX_INPUT:
            raise HTTPException(413, 'Choose an image smaller than 10 MiB.')
    try:
        return await run_in_threadpool(store().add_photo, bytes(body))
    except ValueError as exc:
        raise HTTPException(422, str(exc))


@app.get('/api/photos/{digest}')
def photo(digest: str):
    try:
        path = photo_path(store().photo_dir, digest)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    if not path.exists():
        raise HTTPException(404, 'Photo is not available on this device yet.')
    return FileResponse(path, media_type='image/jpeg',
                        headers={'Cache-Control':'private, max-age=3600'})


if (ROOT / 'dist').exists():
    app.mount('/', StaticFiles(directory=ROOT / 'dist', html=True), name='web')
