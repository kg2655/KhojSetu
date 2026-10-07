"""Regression checks use real Qdrant Edge and local embeddings; HTTP faults are injected deliberately."""
import io
import json
import threading
import time
from pathlib import Path

import httpx
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from .models import RecordInput, SearchInput
from .store import Store
from .vectors import VectorMemory
from .photos import compress_photo, photo_path, write_chunk, CHUNK
from . import exchange

ROOT = Path(__file__).resolve().parent.parent
REAL_CLIENT = httpx.Client

@pytest.fixture
def unit(tmp_path):
    s = Store(tmp_path/"unit", VectorMemory(tmp_path/"unit/edge", ROOT/".models"), "TEST-FINAL")
    s.set_setting("fieldMode","false")
    yield s
    s.close()

def record(**kwargs):
    return RecordInput(**{"title":"Painted ceramic fragment","fieldNotes":"Red ceramic with geometric triangular painted lines.",
                          "approved":True,"importance":"High",**kwargs}).model_dump()

def mock_client(monkeypatch, handler):
    monkeypatch.setattr(exchange.httpx, "Client", lambda **kwargs:REAL_CLIENT(**kwargs,transport=httpx.MockTransport(handler)))

def empty_changes():
    return {"changes":[],"cursor":0,"hasMore":False}

def test_search_and_new_edit_during_stalled_upload(unit, monkeypatch):
    r = unit.save(record())
    entered, release = threading.Event(), threading.Event()
    errors, result = [], []
    def handler(request):
        if request.url.path == "/exchange":
            entered.set()
            assert release.wait(10)
            return httpx.Response(200,json={"revision":1})
        return httpx.Response(200,json=empty_changes() if request.url.path=="/changes" else {})
    mock_client(monkeypatch,handler)
    def sync():
        try: result.append(unit.sync("http://test"))
        except Exception as exc: errors.append(exc)
    thread=threading.Thread(target=sync);thread.start()
    try:
        assert entered.wait(5)
        start=time.monotonic()
        assert unit.search(SearchInput(query="decorated pottery"))["results"][0]["record"]["id"] == r["id"]
        updated=unit.save({**record(fieldNotes="Updated observation: red ceramic with incised triangles."),
                           "expectedVersion":r["version"]},r["id"])
        assert time.monotonic()-start < 3
    finally:
        release.set();thread.join(12)
    assert not errors
    current=unit.get(r["id"])
    assert current["eventId"] == updated["eventId"]
    assert current["dirty"] and current["baseRevision"] == 1
    assert current["syncStatus"] == "PENDING"

def test_lost_ack_retries_original_event_before_new_edit(unit,monkeypatch):
    r=unit.save(record())
    attempts=[]
    def failed(request):
        if request.url.path=="/exchange":
            attempts.append(json.loads(request.content))
            raise httpx.ReadError("Acknowledgement lost")
        return httpx.Response(200,json={})
    mock_client(monkeypatch,failed)
    with pytest.raises(ConnectionError): unit.sync("http://test")
    unit.save({**record(fieldNotes="Newer notes after an uncertain upload."),"expectedVersion":1},r["id"])
    def success(request):
        if request.url.path=="/exchange":
            attempts.append(json.loads(request.content))
            return httpx.Response(200,json={"revision":1})
        return httpx.Response(200,json=empty_changes() if request.url.path=="/changes" else {})
    mock_client(monkeypatch,success)
    unit.sync("http://test")
    assert attempts[0] == attempts[1]
    assert unit.get(r["id"])["dirty"]
    assert unit.get(r["id"])["baseRevision"] == 1
    assert not unit.db.execute("SELECT * FROM outbox").fetchall()

def test_only_changed_embedding_text_is_reencoded(unit,monkeypatch):
    r=unit.save(record())
    def forbidden(text): raise AssertionError("Policy-only change re-embedded text")
    monkeypatch.setattr(unit.vectors,"encode",forbidden)
    unit.save({**record(importance="Medium"),"expectedVersion":1},r["id"])

def test_photo_compression_dedup_and_protected_cleanup(unit):
    image=Image.new("RGB",(2400,1800),(160,100,60))
    data=io.BytesIO();image.save(data,"PNG")
    first=unit.add_photo(data.getvalue());second=unit.add_photo(data.getvalue())
    assert first["photoHash"] == second["photoHash"]
    assert first["width"] == 1600
    assert len(list(unit.photo_dir.glob("*.jpg"))) == 1
    r=unit.save(record(**{k:first[k] for k in ("photoHash","photoBytes","imageUrl")}))
    import os
    os.utime(photo_path(unit.photo_dir,first["photoHash"]),(1,1))
    assert unit.cleanup_photos()["freedBytes"] == 0
    assert unit.get(r["id"])["imageUrl"]
    with pytest.raises(ValueError): unit.add_photo(b"not a photograph")
    unit.set_setting("storageMiB","0")
    with pytest.raises(ValueError): unit.save(record(title="No room for this new record"))

def test_chunk_retries_and_hash_verification(tmp_path):
    import hashlib
    data=b"a"*70000
    digest=hashlib.sha256(data).hexdigest()
    first=write_chunk(tmp_path,digest,0,len(data),data[:CHUNK])
    duplicate=write_chunk(tmp_path,digest,0,len(data),data[:CHUNK])
    assert first == duplicate
    assert write_chunk(tmp_path,digest,CHUNK,len(data),data[CHUNK:])["complete"]
    assert photo_path(tmp_path,digest).read_bytes() == data
    with pytest.raises(ValueError):
        write_chunk(tmp_path,"0"*64,0,3,b"bad")

def test_metered_upload_budget_and_field_pause(unit,monkeypatch):
    unit.set_setting("transferKiB","64")
    for _ in range(8): unit.save(record())
    unit.save(record(importance="Medium"))
    requests=[]
    def handler(request):
        requests.append(request)
        return httpx.Response(200,json={"revision":1} if request.url.path=="/exchange"
                              else empty_changes() if request.url.path=="/changes" else {})
    mock_client(monkeypatch,handler)
    outcome=unit.sync("http://test",metered=True)
    assert 0 < outcome["uploadedBytes"] <= 64*1024
    assert outcome["uploaded"] < 8
    assert outcome["morePending"]
    assert all(json.loads(r.content)["record"]["importance"]=="High" for r in requests if r.url.path=="/exchange")
    unit.set_setting("fieldMode","true")
    before=len(requests)
    with pytest.raises(ValueError): unit.sync("http://test")
    assert len(requests)==before

@pytest.fixture
def gateway(tmp_path,monkeypatch):
    # Requires the isolated real server on port 6334. No demo collections are touched.
    monkeypatch.setenv("QDRANT_URL","http://127.0.0.1:6334")
    monkeypatch.setenv("KHOJ_CLOUD_DATA",str(tmp_path/"shared"))
    monkeypatch.setenv("KHOJ_SYNC_TOKEN","test-secret")
    from . import cloud
    import uuid
    monkeypatch.setattr(cloud,"COLLECTION","test_"+uuid.uuid4().hex)
    with TestClient(cloud.app) as client:
        yield client
        cloud.qdrant.delete_collection(cloud.COLLECTION)

def route_gateway(monkeypatch,gateway):
    def handler(request):
        return gateway.request(request.method,str(request.url).replace("http://test",""),
                               content=request.content,headers=dict(request.headers))
    mock_client(monkeypatch,handler)

def test_real_gateway_auth_bounded_download_and_photo_roundtrip(unit,gateway,monkeypatch,tmp_path):
    assert gateway.get("/health").status_code == 401
    image=Image.effect_noise((1600,1600),100).convert("RGB")
    buf=io.BytesIO();image.save(buf,"JPEG",quality=90)
    photo=unit.add_photo(buf.getvalue())
    r=unit.save(record(**{k:photo[k] for k in ("photoHash","photoBytes","imageUrl")},sharePhoto=True))
    private=unit.save(record(sensitive=True))
    route_gateway(monkeypatch,gateway)
    unit.set_setting("transferKiB","64")
    first=unit.sync("http://test","test-secret")
    assert first["uploaded"]==1
    assert not unit.get(r["id"]).get("photoBackedUp")
    for _ in range(30):
        result=unit.sync("http://test","test-secret")
        assert result["uploadedBytes"] <= 64*1024
        assert result["downloadedBytes"] <= 64*1024
        if unit.get(r["id"]).get("photoBackedUp"): break
    assert unit.get(r["id"])["photoBackedUp"]
    b=Store(tmp_path/"second",VectorMemory(tmp_path/"second/edge",ROOT/".models"),"TEST-B")
    try:
        b.set_setting("fieldMode","false");b.set_setting("transferKiB","64")
        for _ in range(30):
            result=b.sync("http://test","test-secret")
            assert result["downloadedBytes"] <= 64*1024
            local=b.get(r["id"])
            if local and local.get("imageUrl"): break
        assert b.get(private["id"]) is None
        assert local["imageUrl"]
        assert photo_path(b.photo_dir,photo["photoHash"]).read_bytes()==photo_path(unit.photo_dir,photo["photoHash"]).read_bytes()
        response=gateway.get("/changes?max_bytes=1024",headers={"Authorization":"Bearer test-secret"})
        assert len(response.content)<=1024 and response.json()["requiredBytes"]>1024
    finally: b.close()

def test_gateway_recovers_pending_qdrant_write(unit,gateway,monkeypatch):
    from . import cloud
    r=unit.save(record())
    original=cloud.qdrant.upsert
    def fail(*args,**kwargs): raise RuntimeError("Injected server interruption")
    monkeypatch.setattr(cloud.qdrant,"upsert",fail)
    payload={"record":r,"vectors":json.loads(unit.db.execute("SELECT vectors FROM records WHERE id=?",(r["id"],)).fetchone()[0]),
             "baseRevision":0,"eventId":r["eventId"]}
    with pytest.raises(RuntimeError):
        gateway.post("/exchange",json=payload,headers={"Authorization":"Bearer test-secret"})
    assert cloud.db.execute("SELECT applied FROM changes").fetchone()[0]==0
    monkeypatch.setattr(cloud.qdrant,"upsert",original)
    response=gateway.post("/exchange",json=payload,headers={"Authorization":"Bearer test-secret"})
    assert response.status_code==200 and response.json()["revision"]==1
    assert cloud.db.execute("SELECT COUNT(*) FROM changes").fetchone()[0]==1
    assert cloud.db.execute("SELECT applied FROM changes").fetchone()[0]==1

def test_field_api_photo_and_settings(tmp_path,monkeypatch):
    from .app import app
    monkeypatch.setenv("KHOJ_DATA",str(tmp_path/"api-field"))
    with TestClient(app) as client:
        assert client.get("/api/state").json()["fieldMode"]
        assert client.post("/api/settings",json={"storageMiB":1}).status_code==422
        assert client.post("/api/settings",json={"transferKiB":64}).json()["transferKiB"]==64
        selected=client.post("/api/settings",json={"downloadMaterial":"Stone","downloadSite":"  River Camp  "})
        assert selected.status_code==200
        assert selected.json()["downloadSite"]=="River Camp"
        assert selected.json()["downloadMaterial"]=="Stone"
        assert client.post("/api/settings",json={"downloadMaterial":"Unknown"}).status_code==422
        data=io.BytesIO();Image.new("RGB",(600,400),"brown").save(data,"PNG")
        response=client.post("/api/photos",content=data.getvalue(),headers={"Content-Type":"image/png"})
        assert response.status_code==200
        photo=response.json()
        saved=client.post("/api/records",json=record(**{k:photo[k] for k in ("photoHash","photoBytes","imageUrl")}))
        assert saved.status_code==200
        assert client.get(photo["imageUrl"]).headers["content-type"]=="image/jpeg"
        assert client.get("/api/storage").json()["photoBytes"]>0
        assert client.get("/api/storage").json()["modelBytes"]>0

def test_revoked_sharing_reconciles_receipt_without_resending(unit,monkeypatch):
    r=unit.save(record())
    def failed(request):
        if request.url.path=="/exchange": raise httpx.ReadError("Lost acknowledgement")
        return httpx.Response(200,json={})
    mock_client(monkeypatch,failed)
    with pytest.raises(ConnectionError): unit.sync("http://test")
    unit.save({**record(sensitive=True),"expectedVersion":1},r["id"])
    requests=[]
    def receipt(request):
        requests.append(request.url.path)
        if request.url.path.startswith("/receipts/"): return httpx.Response(200,json={"revision":1})
        return httpx.Response(200,json=empty_changes() if request.url.path=="/changes" else {})
    mock_client(monkeypatch,receipt)
    unit.sync("http://test")
    assert "/exchange" not in requests
    assert unit.get(r["id"])["syncStatus"]=="LOCAL_ONLY"
    assert unit.get(r["id"])["baseRevision"]==1
    assert not unit.db.execute("SELECT * FROM outbox").fetchall()


def test_restart_clears_stale_activity_and_preserves_outbox(tmp_path):
    folder=tmp_path/"restart"
    first=Store(folder,VectorMemory(folder/"edge",ROOT/".models"))
    r=first.save(record())
    first.db.execute("INSERT INTO outbox VALUES (?,?)",(r["id"],json.dumps({"eventId":r["eventId"],"record":r})))
    first.db.commit()
    first.set_setting("syncActive","true")
    first.close()
    second=Store(folder,VectorMemory(folder/"edge",ROOT/".models"))
    try:
        assert second.setting("syncActive")=="false"
        assert second.setting("connection")=="Not checked"
        assert second.db.execute("SELECT COUNT(*) FROM outbox").fetchone()[0]==1
        assert second.get(r["id"])["dirty"]
    finally: second.close()

def test_selected_gateway_history_and_existing_record_updates(unit,gateway,monkeypatch,tmp_path):
    ceramic=unit.save(record(material="Ceramic",site="River Camp"))
    stone=unit.save(record(material="Stone",site="River Camp"))
    elsewhere=unit.save(record(material="Ceramic",site="Hill Camp"))
    route_gateway(monkeypatch,gateway)
    unit.sync("http://test","test-secret")
    # A finding that once matched must arrive with its current revision, not stale classification.
    unit.save({**record(material="Stone",site="River Camp"),"expectedVersion":1},ceramic["id"])
    unit.sync("http://test","test-secret")
    b=Store(tmp_path/"selected",VectorMemory(tmp_path/"selected/edge",ROOT/".models"),"SELECTED")
    try:
        b.configure({"fieldMode":False,"downloadSite":"river camp","downloadMaterial":"Ceramic"})
        first=b.sync("http://test","test-secret")
        assert first["downloaded"]==2
        assert b.get(ceramic["id"])["material"]=="Stone"
        assert b.get(stone["id"]) is None
        assert b.get(elsewhere["id"]) is None
        current=unit.get(ceramic["id"])
        unit.save({**record(material="Metal",site="Hill Camp",fieldNotes="Reclassified following examination."),
                   "expectedVersion":current["version"]},ceramic["id"])
        unit.sync("http://test","test-secret")
        b.sync("http://test","test-secret")
        assert b.get(ceramic["id"])["material"]=="Metal"
        assert b.get(ceramic["id"])["site"]=="Hill Camp"
        b.configure({"downloadMaterial":"","downloadSite":""})
        assert b.setting("cursor")=="0"
        b.sync("http://test","test-secret")
        assert b.get(stone["id"]) and b.get(elsewhere["id"])
        assert len(b.records())==3
        b.configure({"downloadMaterial":"Glass","downloadSite":"Unknown Site"})
        b.sync("http://test","test-secret")
        assert len(b.records())==3  # Narrowing a pack never silently deletes evidence.
    finally: b.close()

def test_selection_change_waits_for_exchange_and_does_not_reset_other_settings(unit):
    unit.set_setting("cursor","91")
    unit.sync_lock.acquire()
    try:
        with pytest.raises(ValueError):
            unit.configure({"downloadMaterial":"Ceramic"})
        assert unit.setting("cursor")=="91"
        unit.configure({"fieldMode":True})  # Pausing remains available during an exchange.
    finally: unit.sync_lock.release()
    unit.configure({"transferKiB":64})
    assert unit.setting("cursor")=="91"
    unit.configure({"downloadMaterial":"Ceramic"})
    assert unit.setting("cursor")=="0"

def test_selection_does_not_disclose_unshared_private_ids(unit,monkeypatch):
    private=unit.save(record(sensitive=True))
    unit.configure({"downloadMaterial":"Ceramic"})
    selections=[]
    def handler(request):
        if request.url.path=="/changes/query":
            selections.append(json.loads(request.content))
            return httpx.Response(200,json=empty_changes())
        return httpx.Response(200,json={})
    mock_client(monkeypatch,handler)
    unit.sync("http://test")
    assert private["id"] not in selections[0]["known_ids"]

def test_cache_protects_own_pinned_and_locally_edited_records(unit):
    own=unit.save(record())
    with pytest.raises(ValueError,match="Created or edited"):
        unit.evict(own["id"],own["version"])
    reference=unit.save(record(title="Downloaded ceramic reference"))
    reference.update(localOwned=False,dirty=False,syncStatus="SYNCED",baseRevision=1)
    unit.persist(reference)
    unit.pin(reference["id"],True,reference["version"])
    with pytest.raises(ValueError,match="Pinned"):
        unit.evict(reference["id"],reference["version"])
    unit.pin(reference["id"],False,reference["version"])
    unit.save({**record(fieldNotes="Locally added evidence on this reference."),"expectedVersion":1},reference["id"])
    with pytest.raises(ValueError,match="Created or edited"):
        unit.evict(reference["id"],2)

def test_cache_gateway_remove_excludes_and_restores(unit,gateway,monkeypatch,tmp_path):
    public=unit.save(record(material="Ceramic"))
    route_gateway(monkeypatch,gateway)
    unit.sync("http://test","test-secret")
    b=Store(tmp_path/"cache",VectorMemory(tmp_path/"cache/edge",ROOT/".models"),"CACHE")
    try:
        b.set_setting("fieldMode","false")
        b.sync("http://test","test-secret")
        local=b.get(public["id"])
        assert local["localOwned"] is False
        assert not b.cache_reason(local)
        b.evict(local["id"],local["version"])
        assert b.get(local["id"]) is None
        assert not b.search(SearchInput(query="painted ceramic"))["results"]
        source=unit.get(public["id"])
        unit.save({**record(fieldNotes="Updated shared observation after cache removal."),"expectedVersion":source["version"]},public["id"])
        unit.sync("http://test","test-secret")
        b.sync("http://test","test-secret")
        assert b.get(local["id"]) is None
        b.configure({"downloadMaterial":"Glass","downloadSite":"Different site"})
        b.restore_reference(local["id"])
        b.sync("http://test","test-secret")
        assert b.get(local["id"])["fieldNotes"]=="Updated shared observation after cache removal."
        assert not b.cache_catalogue()["removed"]
        assert b.search(SearchInput(query="updated shared observation"))["results"]
    finally: b.close()

def test_cache_interrupted_removal_is_recovered(tmp_path,monkeypatch):
    folder=tmp_path/"evict-restart"
    first=Store(folder,VectorMemory(folder/"edge",ROOT/".models"))
    r=first.save(record())
    r.update(localOwned=False,dirty=False,baseRevision=1,syncStatus="SYNCED")
    first.persist(r)
    def fail(point_id): raise OSError("Injected interruption after durable removal intent")
    monkeypatch.setattr(first.vectors,"remove",fail)
    with pytest.raises(OSError): first.evict(r["id"],1)
    first.close()
    second=Store(folder,VectorMemory(folder/"edge",ROOT/".models"))
    try:
        assert second.get(r["id"]) is None
        assert not second.search(SearchInput(query="painted ceramic"))["results"]
        assert second.cache_catalogue()["removed"][0]["id"]==r["id"]
    finally: second.close()
