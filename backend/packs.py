"""Bounded, offline-only reference packs. Imports never overwrite existing evidence."""
import time
import uuid
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator
from .models import RecordInput
from .vectors import text_for

MAX_PACK = 1024 * 1024

class PackEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9._-]+$")
    title: str = Field(min_length=3, max_length=200)
    fieldNotes: str = Field(min_length=5, max_length=8000)
    material: Literal["Ceramic","Stone","Metal","Bone","Organic","Glass","Other"] = "Other"
    tags: list[Annotated[str, Field(max_length=80)]] = Field(default_factory=list, max_length=20)

class ReferencePack(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schemaVersion: Literal[1]
    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9._-]+$")
    title: str = Field(min_length=3, max_length=200)
    source: str = Field(min_length=3, max_length=400)
    sourceUrl: HttpUrl | None = None
    license: str = Field(min_length=3, max_length=200)
    evidenceType: Literal["SYNTHETIC","REFERENCE"]
    records: list[PackEntry] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def unique_entries(self):
        if len({r.id for r in self.records}) != len(self.records):
            raise ValueError("Entry IDs must be unique within a pack.")
        if self.sourceUrl and len(str(self.sourceUrl)) > 500:
            raise ValueError("Source URL is too long.")
        return self

def parse_pack(body):
    if len(body) > MAX_PACK:
        raise ValueError("Reference packs must be at most 1 MiB.")
    return ReferencePack.model_validate_json(body)

def import_pack(store, pack):
    if not store.sync_lock.acquire(blocking=False):
        raise ValueError("Wait for exchange or another import to finish.")
    result = dict(imported=0, skipped=0, remaining=0, blocked="", pack=pack.title)
    try:
        for index, entry in enumerate(pack.records):
            key = str(uuid.uuid5(uuid.NAMESPACE_URL, "khojsetu:pack:"+pack.id+":"+entry.id))
            rid = "REF-" + key
            with store.lock:
                if store.get(rid):
                    result["skipped"] += 1
                    continue
                if not store.has_room(65536):
                    result.update(remaining=len(pack.records)-index,
                                  blocked="Storage budget reached. Free space or raise the budget, then re-import this file.")
                    break
                provenance = dict(packId=pack.id, entryId=entry.id, title=pack.title,
                                  source=pack.source, sourceUrl=str(pack.sourceUrl or ""),
                                  license=pack.license, evidenceType=pack.evidenceType)
                label = "Synthetic illustration" if pack.evidenceType == "SYNTHETIC" else "Imported reference; not a field discovery"
                notes = (f"[{label}]\n{entry.fieldNotes}\n\nSource: {pack.source}\n"
                         f"Source URL: {pack.sourceUrl or 'Not provided'}\nLicense/permission: {pack.license}")
                data = RecordInput(title=entry.title, fieldNotes=notes, material=entry.material,
                    tags=entry.tags, site="Reference library", sector="Reference", grid="R0",
                    layer="L1", recordedBy="Reference pack", artifactType="Reference note",
                    visibility="LOCAL", approved=False).model_dump()
                now=time.time()
                data.update(id=rid, uuid=key, version=1, baseRevision=0, localOwned=True,
                    createdAtTimestamp=now*1000, updatedAt=now, device=store.device, dirty=True,
                    eventId=str(uuid.uuid4()), syncStatus="LOCAL_ONLY", memoryStatus="LOCAL",
                    policyReason="Imported reference stays local until explicitly approved.",
                    conflict=None, referenceSource=provenance)
                # Encoding stays outside the interactive lock; imports hold no network connection.
            vectors=store.vectors.encode(text_for(data))
            with store.lock:
                if not store.has_room(65536):
                    result.update(remaining=len(pack.records)-index,blocked="Storage budget reached. Re-import after freeing space.")
                    break
                store.persist(data,vectors)
                result["imported"] += 1
        with store.lock:
            store.log("Reference pack imported",f"{pack.title}: {result['imported']} added, {result['skipped']} preserved.")
        return result
    finally:
        store.sync_lock.release()
