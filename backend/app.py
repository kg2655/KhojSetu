import json
import os
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Literal
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from .models import RecordInput, SearchInput, policy
from .vectors import VectorMemory, MODEL
from .store import Store

ROOT = Path(__file__).resolve().parent.parent


@asynccontextmanager
async def lifespan(app):
    directory = Path(os.getenv('KHOJ_DATA', ROOT / '.data/field-07'))
    vectors = VectorMemory(directory / 'edge', ROOT / '.models', offline=True)
    app.state.store = Store(directory, vectors, os.getenv('KHOJ_DEVICE', 'FIELD-07'))
    yield
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
                'pending': sum(r['syncStatus'] == 'PENDING' for r in records),
                'conflicts': sum(bool(r.get('conflict')) for r in records)}


@app.post('/api/records')
def create(data: RecordInput):
    return store().save(data.model_dump())


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
    fieldMode: bool


@app.post('/api/settings')
def settings(data: Settings):
    with store().lock:
        store().set_setting('fieldMode', str(data.fieldMode).lower())
        store().log('Field mode' if data.fieldMode else 'Exchange enabled',
                    'Local search remains available. Server connectivity is checked during exchange.')
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


if (ROOT / 'dist').exists():
    app.mount('/', StaticFiles(directory=ROOT / 'dist', html=True), name='web')
