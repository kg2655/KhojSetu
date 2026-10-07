"""Bounded exchange. Network waits never hold the interactive store lock."""
import json
import time
import httpx
from .models import policy
from .photos import CHUNK, photo_path, write_chunk

def encoded(value):
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

class ExchangeMixin:
    def _paused(self):
        with self.lock:
            return getattr(self, "stopping", False) or self.setting("fieldMode", "true") == "true"

    def _status(self, value):
        with self.lock:
            self.set_setting("connection", value)

    def sync(self, url, token="", metered=False):
        if not self.sync_lock.acquire(blocking=False):
            raise ValueError("An exchange is already running.")
        result = dict(uploaded=0, downloaded=0, conflicts=0, deferred=0,
                      uploadedBytes=0, downloadedBytes=0, photosUploaded=0,
                      photosDownloaded=0, withdrawals=0, morePending=False)
        try:
            if self._paused():
                raise ValueError("Field mode is active. Enable exchange before connecting.")
            with self.lock:
                budget = int(self.setting("transferKiB", "256")) * 1024
                ids = [r["id"] for r in sorted(self.records(), key=lambda r:r["importance"] != "High")]
                self.set_setting("syncActive", "true")
            self._status("Connecting")
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            with httpx.Client(base_url=url, headers=headers, timeout=httpx.Timeout(8, connect=3)) as client:
                client.get("/health").raise_for_status()
                self._status("Transferring")
                sent = 0
                with self.lock:
                    withdrawals=[json.loads(row[0]) for row in self.db.execute("SELECT body FROM withdrawal_queue")]
                for envelope in withdrawals[:20]:
                    if self._paused():
                        break
                    body=encoded(envelope)
                    if result["uploadedBytes"]+len(body)>budget:
                        result["morePending"]=True
                        break
                    response=client.post("/withdraw",content=body,headers={"Content-Type":"application/json"})
                    result["uploadedBytes"]+=len(body)
                    if response.status_code==409:
                        with self.lock:
                            current=self.get(envelope["id"])
                            current.update(conflict=response.json()["detail"],syncStatus="CONFLICT",withdrawalPending=False)
                            self.persist(current)
                            self.db.execute("DELETE FROM withdrawal_queue WHERE id=?",(envelope["id"],))
                            self.db.commit()
                            result["conflicts"]+=1
                        continue
                    response.raise_for_status()
                    with self.lock:
                        current=self.get(envelope["id"])
                        self.apply_withdrawal({"id":current["id"],"uuid":current["uuid"],"withdrawn":True},response.json()["revision"])
                        result["withdrawals"]+=1
                for rid in ids:
                    if self._paused() or sent >= 20:
                        result["morePending"] = True
                        break
                    with self.lock:
                        saved_row = self.db.execute("SELECT body FROM outbox WHERE id=?", (rid,)).fetchone()
                    if saved_row:
                        original = json.loads(saved_row[0])
                        receipt = client.get("/receipts/" + original["eventId"])
                        receipt.raise_for_status()
                        revision = receipt.json().get("revision")
                        with self.lock:
                            current = self.get(rid)
                            if revision is not None:
                                current["baseRevision"] = revision
                                if current["eventId"] == original["eventId"]:
                                    current.update(dirty=False,syncStatus="SYNCED",sharedWithdrawn=False)
                                self.persist(current)
                            if revision is not None or not policy(current,metered)[0]:
                                self.db.execute("DELETE FROM outbox WHERE id=?", (rid,))
                                self.db.commit()
                    with self.lock:
                        r = self.get(rid)
                        saved = self.db.execute("SELECT body FROM outbox WHERE id=?", (rid,)).fetchone()
                        if r.get("conflict") or r.get("withdrawalPending"):
                            continue
                        if not policy(r, metered)[0]:
                            if r.get("dirty"):
                                result["deferred"] += 1
                            # Do not retransmit content after approval has been withdrawn.
                            continue
                        if not r.get("dirty") and not saved:
                            continue
                        if saved:
                            envelope = json.loads(saved[0])
                        else:
                            vec = json.loads(self.db.execute("SELECT vectors FROM records WHERE id=?", (rid,)).fetchone()[0])
                            public = {k:v for k,v in r.items() if k not in
                                      ("imageUrl", "conflict", "photoBackedUp", "pinned", "localOwned", "sharedWithdrawn", "withdrawalPending")}
                            if not r.get("sharePhoto"):
                                public.update(photoHash=None, photoBytes=0)
                            envelope = dict(record=public, vectors=vec,
                                            baseRevision=r["baseRevision"], eventId=r["eventId"])
                        body = encoded(envelope)
                        if result["uploadedBytes"] + len(body) > budget:
                            result["morePending"] = True
                            break
                        self.db.execute("INSERT OR REPLACE INTO outbox VALUES (?,?)", (rid, json.dumps(envelope)))
                        self.db.commit()
                    # Outbox survives a lost acknowledgement or process restart.
                    response = client.post("/exchange", content=body, headers={"Content-Type":"application/json"})
                    result["uploadedBytes"] += len(body)
                    sent += 1
                    if response.status_code not in (200, 409):
                        response.raise_for_status()
                    with self.lock:
                        current = self.get(rid)
                        if response.status_code == 409:
                            current.update(conflict=response.json()["detail"], syncStatus="CONFLICT")
                            result["conflicts"] += 1
                        else:
                            current["baseRevision"] = response.json()["revision"]
                            if current["eventId"] == envelope["eventId"]:
                                current.update(dirty=False, syncStatus="SYNCED",sharedWithdrawn=False)
                            # A newer edit stays dirty; only its base revision is advanced.
                            result["uploaded"] += 1
                        self.persist(current)
                        self.db.execute("DELETE FROM outbox WHERE id=?", (rid,))
                        self.db.commit()
                if not self._paused():
                    with self.lock:
                        cursor = int(self.setting("cursor", "0"))
                        selection_site = self.setting("downloadSite","")
                        selection_material = self.setting("downloadMaterial","")
                        known_ids = [r["id"] for r in self.records() if r.get("baseRevision",0)>0]
                        known_ids += [row[0] for row in self.db.execute("SELECT id FROM evicted WHERE revision IS NULL")]
                        excluded_ids = [row[0] for row in self.db.execute("SELECT id FROM evicted WHERE revision IS NOT NULL")]
                        restore_pending = bool(self.db.execute("SELECT 1 FROM evicted WHERE revision IS NULL").fetchone())
                        # A full local budget pauses downloads, not local evidence deletion.
                        allow_download = self.storage()["dataBytes"] + budget < self.storage()["budgetBytes"]
                    if allow_download:
                        if selection_site or selection_material or excluded_ids or restore_pending:
                            if len(known_ids)>5000 or len(excluded_ids)>5000:
                                raise ValueError("Filtered exchange supports up to 5,000 local records. Use all-material/all-site exchange.")
                            response = client.post("/changes/query", json={"after":cursor,"limit":20,"max_bytes":budget,
                                "site":selection_site,"material":selection_material,"known_ids":known_ids,"excluded_ids":excluded_ids})
                        else:
                            response = client.get("/changes", params={"after":cursor, "limit":20, "max_bytes":budget})
                        response.raise_for_status()
                        if len(response.content) > budget:
                            raise ValueError("Gateway exceeded the requested download budget.")
                        result["downloadedBytes"] += len(response.content)
                        page = response.json()
                        result["skippedBySelection"] = page.get("skipped",0)
                        with self.lock:
                            for change in page["changes"]:
                                remote, revision = change["record"], change["revision"]
                                local = self.get(remote["id"])
                                if remote.get("withdrawn"):
                                    if self.apply_withdrawal(remote,revision):
                                        result["withdrawals"]+=1
                                    self.set_setting("cursor",change["seq"])
                                    continue
                                if local and revision <= local.get("baseRevision", 0):
                                    continue
                                # A pending acknowledgement must be reconciled before downloads.
                                if self.db.execute("SELECT 1 FROM outbox WHERE id=?", (remote["id"],)).fetchone():
                                    result["morePending"] = True
                                    break
                                if local and local.get("dirty"):
                                    local.update(conflict={"record":remote,"revision":revision}, syncStatus="CONFLICT")
                                    self.persist(local)
                                    result["conflicts"] += 1
                                else:
                                    incoming = {**remote, "baseRevision":revision, "dirty":False,
                                                "conflict":None, "syncStatus":"SYNCED",
                                                "imageUrl":None, "photoBackedUp":False,
                                                "pinned":local.get("pinned",False) if local else False,
                                                "localOwned":local.get("localOwned",True) if local else False}
                                    if local and local.get("photoHash") and not local.get("sharePhoto"):
                                        for key in ("photoHash","photoBytes","imageUrl","sharePhoto"):
                                            incoming[key] = local.get(key)
                                    digest = incoming.get("photoHash")
                                    if digest and photo_path(self.photo_dir, digest).exists():
                                        incoming["imageUrl"] = "/api/photos/" + digest
                                    self.persist(incoming, change["vectors"])
                                    self.db.execute("DELETE FROM evicted WHERE id=? AND revision IS NULL",(incoming["id"],))
                                    self.db.commit()
                                    result["downloaded"] += 1
                                self.set_setting("cursor", change["seq"])
                            else:
                                self.set_setting("cursor", page["cursor"])
                        result["morePending"] |= page["hasMore"]
                        if page.get("requiredBytes"):
                            result["downloadBlocked"] = "Next record exceeds this cycle's download budget."
                    else:
                        result["downloadBlocked"] = "Free device storage or increase its budget to receive more knowledge."
                self._exchange_photos(client, budget, result, metered)
            with self.lock:
                self.set_setting("lastSync", time.time())
                self.set_setting("lastExchange", json.dumps(result))
                self.set_setting("connection", "Paused" if self._paused() else "Connected")
                self.log("Knowledge exchanged", json.dumps(result))
            return result
        except (httpx.HTTPError, OSError) as exc:
            self._status("Unavailable — retry queued")
            with self.lock:
                self.log("Exchange interrupted", "Unacknowledged changes remain queued. Local work is available.")
            raise ConnectionError("Shared server is unavailable. Local records and pending changes are safe.") from exc
        finally:
            with self.lock:
                self.set_setting("syncActive", "false")
            self.sync_lock.release()

    def _exchange_photos(self, client, budget, result, metered):
        with self.lock:
            records = self.records()
        requests = 0
        for snapshot in records:
            if requests >= 16 or self._paused():
                break
            with self.lock:
                r = self.get(snapshot["id"])
                digest = r.get("photoHash")
                if (not digest or not r.get("sharePhoto") or r.get("dirty") or
                    r.get("conflict") or not policy(r, metered)[0]):
                    continue
            final = photo_path(self.photo_dir, digest)
            if final.exists() and not r.get("photoBackedUp"):
                if result["uploadedBytes"] >= budget:
                    result["morePending"] = True
                    continue
                response = client.get("/photos/" + digest + "/status")
                response.raise_for_status()
                position = response.json()
                while not position["complete"] and requests < 16 and not self._paused():
                    remaining = budget - result["uploadedBytes"]
                    if remaining <= 0:
                        result["morePending"] = True
                        break
                    with self.lock:
                        current = self.get(r["id"])
                        if current.get("dirty") or current.get("photoHash") != digest or not policy(current, metered)[0]:
                            break
                    with final.open("rb") as stream:
                        stream.seek(position["offset"])
                        chunk = stream.read(min(CHUNK, remaining))
                    if not chunk:
                        raise ValueError("Shared photo offset is invalid.")
                    response = client.put("/photos/" + digest, params={"offset":position["offset"],
                                          "total":final.stat().st_size}, content=chunk)
                    result["uploadedBytes"] += len(chunk)
                    requests += 1
                    response.raise_for_status()
                    position = response.json()
                if position["complete"]:
                    with self.lock:
                        current = self.get(r["id"])
                        if current.get("photoHash") == digest:
                            current["photoBackedUp"] = True
                            self.persist(current)
                    result["photosUploaded"] += 1
            elif not final.exists():
                part = photo_path(self.photo_dir, digest, True)
                while requests < 16 and not self._paused():
                    remaining = budget - result["downloadedBytes"]
                    if remaining <= 0:
                        result["morePending"] = True
                        break
                    with self.lock:
                        if not self.has_room(min(CHUNK, remaining)):
                            result["downloadBlocked"] = "Photo download paused: device storage budget."
                            break
                    offset = part.stat().st_size if part.exists() else 0
                    response = client.get("/photos/" + digest, params={"offset":offset,"limit":min(CHUNK,remaining)})
                    requests += 1
                    if response.status_code == 404:
                        break  # Metadata may arrive before the source finishes uploading its photo.
                    response.raise_for_status()
                    body = response.content
                    if len(body) > min(CHUNK, remaining):
                        raise ValueError("Photo response exceeded its transfer budget.")
                    with self.lock:
                        result["downloadedBytes"] += len(body)
                        position = write_chunk(self.photo_dir, digest, offset, int(response.headers["X-Photo-Size"]), body)
                        if position["complete"]:
                            current = self.get(r["id"])
                            if current.get("photoHash") == digest:
                                current.update(imageUrl="/api/photos/"+digest, photoBackedUp=True)
                                self.persist(current)
                            result["photosDownloaded"] += 1
                            break
