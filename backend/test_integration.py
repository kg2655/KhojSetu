"""Integration checks use real Qdrant Edge, cached MiniLM and a live Qdrant Server.
Start the exchange gateway first; never substitute a fake vector engine.
"""
import os
from pathlib import Path
import pytest
import httpx
from qdrant_client import QdrantClient, models
from .models import RecordInput, SearchInput, policy
from .store import Store
from .vectors import VectorMemory

ROOT = Path(__file__).resolve().parent.parent
GATEWAY = os.getenv('KHOJ_TEST_SYNC_URL', 'http://127.0.0.1:8010')


@pytest.fixture
def units(tmp_path):
    a = Store(tmp_path/'a', VectorMemory(tmp_path/'a/edge', ROOT/'.models'), 'TEST-A')
    b = Store(tmp_path/'b', VectorMemory(tmp_path/'b/edge', ROOT/'.models'), 'TEST-B')
    for s in (a,b):
        s.set_setting('fieldMode', 'false')
    yield a,b
    a.close()
    b.close()


def observation(**kwargs):
    return RecordInput(title='Painted ceramic fragment',
        fieldNotes='Red pottery sherd decorated with triangular geometric patterns.',
        **{'approved': True, 'importance': 'High', **kwargs}).model_dump()


def test_privacy_policy():
    r = observation()
    assert policy(r)[0]
    assert not policy({**r, 'sensitive': True})[0]
    assert not policy({**r, 'visibility': 'LOCAL'})[0]
    assert not policy({**r, 'approved': False})[0]
    assert not policy({**r, 'importance': 'Routine'})[0]
    assert not policy({**r, 'importance': 'Medium'}, metered=True)[0]
    assert policy({**r, 'visibility': 'SHARED', 'importance': 'Routine'})[0]


def test_real_edge_search_and_metadata(units):
    a,_ = units
    r = a.save(observation())
    for mode in ['SEMANTIC','EXACT','HYBRID']:
        result = a.search(SearchInput(query='decorated ceramic pottery', mode=mode))
        assert result['results'][0]['record']['id'] == r['id']
        assert result['results'][0]['score'] > 0
        assert a.search(SearchInput(query='ceramic', mode=mode, layer='L5'))['results'] == []


def test_failed_exchange_keeps_queue_and_edit_versions(units):
    a,_ = units
    r = a.save(observation())
    with pytest.raises(ConnectionError):
        a.sync('http://127.0.0.1:1')
    assert a.get(r['id'])['syncStatus'] == 'PENDING'
    assert a.get(r['id'])['baseRevision'] == 0
    with pytest.raises(ValueError):
        a.save({**observation(), 'expectedVersion': 0}, r['id'])
    a.set_setting('fieldMode', 'true')
    with pytest.raises(ValueError):
        a.sync(GATEWAY)


def test_real_server_two_devices_conflict_and_idempotency(units):
    a,b = units
    public = a.save(observation())
    private = a.save(observation(sensitive=True))
    unapproved = a.save(observation(approved=False))
    assert a.sync(GATEWAY)['uploaded'] == 1
    assert a.sync(GATEWAY)['uploaded'] == 0
    b.sync(GATEWAY)
    assert b.get(public['id']) is not None
    assert b.get(private['id']) is None
    assert b.get(unapproved['id']) is None
    # Independently inspect Qdrant Server, beyond the gateway's SQLite journal.
    client = QdrantClient(url=os.getenv('QDRANT_URL','http://127.0.0.1:6333'))
    points = client.retrieve('khojsetu_shared_v1', [public['uuid'], private['uuid']], with_vectors=True)
    assert len(points) == 1
    assert len(points[0].vector['dense']) == 384
    client.close()
    ar,br = a.get(public['id']),b.get(public['id'])
    a.save({**ar, 'fieldNotes':'Local observation: incision on the inner face.', 'expectedVersion':ar['version']}, ar['id'])
    b.save({**br, 'fieldNotes':'Shared observation: painted line on the outer face.', 'expectedVersion':br['version']}, br['id'])
    assert b.sync(GATEWAY)['uploaded'] == 1
    assert a.sync(GATEWAY)['conflicts'] >= 1
    conflict = a.get(public['id'])
    assert 'inner face' in conflict['fieldNotes']
    assert 'outer face' in conflict['conflict']['record']['fieldNotes']
    a.resolve(public['id'], 'MERGED', conflict['version'])
    assert a.sync(GATEWAY)['uploaded'] == 1
    b.sync(GATEWAY)
    merged = b.get(public['id'])
    assert 'inner face' in merged['fieldNotes'] and 'outer face' in merged['fieldNotes']
    assert not merged.get('conflict')


def test_restart_rebuilds_local_index(tmp_path):
    directory = tmp_path/'restart'
    a = Store(directory, VectorMemory(directory/'edge', ROOT/'.models'))
    r = a.save(observation())
    a.close()
    b = Store(directory, VectorMemory(directory/'edge', ROOT/'.models'))
    assert b.get(r['id'])['syncStatus'] == 'PENDING'
    assert b.search(SearchInput(query='decorated pottery'))['results'][0]['record']['id'] == r['id']
    b.close()
