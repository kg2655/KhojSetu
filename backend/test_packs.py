"""Offline reference-pack checks use a real Edge index and isolated device memory."""
import json
import pytest
from pydantic import ValidationError
from .packs import parse_pack, import_pack, MAX_PACK
from .models import SearchInput
from .test_final_round import unit

def payload():
    return dict(schemaVersion=1,id="survey-library",title="Permitted reference notes",
                source="Test fixture, not field evidence",license="Synthetic test text",
                evidenceType="SYNTHETIC",records=[
                dict(id="one",title="Painted pottery reference",fieldNotes="Red ceramic decorated with triangles.",material="Ceramic"),
                dict(id="two",title="Stone reference note",fieldNotes="Illustrative stone with a polished surface.",material="Stone")])

def pack(data=None):
    return parse_pack(json.dumps(data or payload()).encode())

def test_import_search_provenance_and_preserve_edits(unit):
    first=import_pack(unit,pack())
    assert first["imported"]==2 and not first["remaining"]
    records=unit.records()
    assert all(r["visibility"]=="LOCAL" and not r["approved"] and not r["sharePhoto"] for r in records)
    assert all(r["referenceSource"]["evidenceType"]=="SYNTHETIC" for r in records)
    assert all("Source:" in r["fieldNotes"] and "License/permission:" in r["fieldNotes"] for r in records)
    result=unit.search(SearchInput(query="painted pottery"))
    assert result["results"]
    assert not unit.search(SearchInput(query="pottery",layer="L1"))["results"]
    original=records[0]
    unit.save({**original,"fieldNotes":"My independent notes must be preserved.","expectedVersion":1},original["id"])
    again=import_pack(unit,pack())
    assert again["skipped"]==2 and again["imported"]==0
    assert unit.get(original["id"])["fieldNotes"]=="My independent notes must be preserved."
    assert len(unit.records())==2

def test_pack_bounds_and_duplicate_validation():
    for change in ({"records":[]},{"schemaVersion":2},{"license":""},{"source":""},{"approved":True}):
        with pytest.raises(ValidationError): pack({**payload(),**change})
    invalid=payload()
    invalid["records"][1]["id"]="one"
    with pytest.raises(ValidationError):pack(invalid)
    invalid=payload()
    invalid["records"][0]["imageUrl"]="https://example.com/image.jpg"
    with pytest.raises(ValidationError):pack(invalid)
    with pytest.raises(ValueError):parse_pack(b" "*(MAX_PACK+1))

def test_storage_partial_import_retries_without_duplicates(unit,monkeypatch):
    checks=iter((True,True,False))
    original=unit.has_room
    monkeypatch.setattr(unit,"has_room",lambda size:next(checks))
    first=import_pack(unit,pack())
    assert first["imported"]==1 and first["remaining"]==1 and first["blocked"]
    monkeypatch.setattr(unit,"has_room",original)
    second=import_pack(unit,pack())
    assert second["imported"]==1 and second["skipped"]==1
    assert len(unit.records())==2

def test_pack_waits_for_exchange(unit):
    unit.sync_lock.acquire()
    try:
        with pytest.raises(ValueError,match="Wait for exchange"):import_pack(unit,pack())
        assert not unit.records()
    finally:unit.sync_lock.release()


def test_pack_api_bounds_and_local_only_import(unit,monkeypatch):
    from fastapi.testclient import TestClient
    from . import app as field
    monkeypatch.setattr(field,"store",lambda:unit)
    client=TestClient(field.app)
    try:
        assert client.post("/api/reference-packs",content=b"x"*(MAX_PACK+1)).status_code==413
        assert client.post("/api/reference-packs",content=b"not json").status_code==422
        assert not unit.records()
        response=client.post("/api/reference-packs",json=payload())
        assert response.status_code==200 and response.json()["imported"]==2
        assert all(not r["approved"] for r in unit.records())
        evidence=client.post("/api/assistant",json={"query":"painted pottery"}).json()
        assert "Imported reference; no excavation location" in evidence["answer"]
        assert "R0, L1" not in evidence["answer"]
    finally:client.close()


def test_museum_pack_import_and_material_retrieval(unit):
    from pathlib import Path
    path=Path(__file__).resolve().parent.parent/"public/reference-pack-met-materials.json"
    imported=parse_pack(path.read_bytes())
    assert imported.evidenceType=="REFERENCE" and len(imported.records)==8
    assert all("https://www.metmuseum.org/art/collection/search/" in r.fieldNotes for r in imported.records)
    assert import_pack(unit,imported)["imported"]==8
    for query,material,expected in (("Indian bronze chalice","Metal","met-37725"),
                                     ("carnelian beryl steatite beads","Stone","met-557494"),
                                     ("Roman red slip ware bowl","Ceramic","met-250086")):
        results=unit.search(SearchInput(query=query,material=material,limit=3))["results"]
        assert any(r["record"]["referenceSource"]["entryId"]==expected for r in results)
    assert import_pack(unit,imported)["skipped"]==8
    assert len(unit.records())==8
