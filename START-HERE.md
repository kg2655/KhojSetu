# Your KhojSetu walkthrough

The project folder is `C:\Users\user\Documents\Qdrant Arch\KhojSetu`.

## What is running?

| Part | What it does | Where to see it |
| --- | --- | --- |
| Field application | Your notebook, local model, Qdrant Edge and record journal | http://localhost:8000 |
| Exchange gateway | Checks revisions and moves approved records between devices and Qdrant Server | http://localhost:8010/docs |
| Qdrant Server | Stores shared vectors; runs inside Docker | http://localhost:6333/dashboard |

`localhost` means **this laptop**. None of these addresses publish your project on the internet. All three ports bind to loopback. Docker is a way to run the server with its dependencies packaged together. No external service account is required for this local setup.

Qdrant **Edge** and Qdrant **Server** are different. Edge runs inside the Python field app and stores searchable vectors in `.data/field-07/edge`. Server runs in Docker and holds shared knowledge. The server dashboard does not show your private Edge memory.

## Start it next time

Open PowerShell in this project folder. For local recording and search only:

```powershell
.\Start-KhojSetu.ps1
```

For the complete local edge-to-server workflow, first open Docker Desktop and wait until its engine is running, then:

```powershell
.\Start-KhojSetu.ps1 -WithExchange
```

Open http://localhost:8000. The launcher runs Python in the background and prints the log locations. If Windows blocks script execution, you can use the manual commands below instead of changing your system policy.

Closing Docker's **window** usually leaves its engine running in the system tray. Choosing **Quit Docker Desktop** stops it. Field memory still works while Docker is stopped; exchange will report the unavailable server and keep its queue.

Stop the services started by the launcher:

```powershell
.\Stop-KhojSetu.ps1
```

This stops only processes whose IDs and start times were recorded by the launcher, plus this project's Docker container. It preserves data. A server started manually in a terminal can be stopped using Ctrl+C in that terminal.

## Do each step manually

These commands assume the one-time installation has already been completed (it has on this laptop).

1. Open Docker Desktop. In PowerShell in the project folder, run:

   ```powershell
   docker compose up -d
   ```

   Docker reads `compose.yaml`, downloads the official Qdrant image if needed and starts `khojsetu-qdrant-1`. `-d` means background mode. See it in Docker Desktop → Containers → khojsetu. The database is saved in the persistent `khojsetu_khojsetu-qdrant` volume.

2. In a terminal, start the shared gateway:

   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn backend.cloud:app --host 127.0.0.1 --port 8010
   ```

3. In another terminal, start the field app:

   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
   ```

4. Open http://localhost:8000. Keep those terminals running. Steps 1–2 are optional when you only need local memory.

## Try the product

1. The field station shows exact grid/layer record counts. Click a grid square or a specimen to inspect a record.
2. In **Ask the archive**, search `decorated pottery with geometric patterns`. Switch between semantic, lexical and hybrid retrieval. Filter to L3. Timing includes embedding and retrieval; scores are ranking values, not certainty percentages.
3. Use **Review evidence** for quoted field notes with source IDs. This is an extractive assistant, not a generative chatbot.
4. **Record a finding**. Leave it unapproved or mark it sensitive: it stays local. Approve a high-priority AUTO record: it becomes pending.
5. In **Knowledge exchange**, enable exchange, then press **Exchange now**. Actual acknowledgements update the queue. Refresh Qdrant's dashboard and open `khojsetu_shared_v1` to inspect the shared points and their named dense/lexical vectors.
6. Turn field mode back on. Record and search continue to work, while exchange is deliberately blocked. For a real outage test, stop the Qdrant container and attempt an exchange with field mode off. The queue remains intact; restart the container to retry.

## Demonstrate two field devices and a conflict

```powershell
.\Start-KhojSetu.ps1 -SecondUnit
```

Open http://localhost:8001. This is a separate local field unit with a separate SQLite journal and Edge shard. Do not seed it if you want to demonstrate downloads. Enable exchange and receive FIELD-07's shared records. Edit the same shared record independently in both units. Exchange unit 08, then unit 07. Unit 07 shows the two versions. Choose local, shared or both notes, then exchange again. A merge preserves both observations verbatim; it does not infer scientific conclusions.

## What was installed and where?

- `node_modules`: frontend dependencies, installed with `npm install`.
- `.venv`: isolated Python dependencies from `backend/requirements.txt`.
- `.models`: one-time MiniLM model download. Ordinary startup uses `local_files_only=True`; it makes no model download or hosted inference calls.
- `.data/field-07`: private record journal, exchange cursor, logs and Qdrant Edge data.
- `.data/cloud`: the gateway's durable revision/change journal.
- Docker volume: Qdrant Server's shared vector storage.
- `dist`: compiled interface served by Python; no Google Fonts or remote scripts are required.

If reinstalling on another Windows computer with Python 3.12+ and Node 22+:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
npm ci
.\.venv\Scripts\python.exe -m backend.prepare
npm run build
```

Internet is needed for that initial installation and model download. Afterwards the local app is self-contained. The model and databases are excluded from Git.

## Do I need a Qdrant account?

**No for everything above.** Qdrant Cloud is optional if you want an externally hosted shared database. You would create a cluster, then set `QDRANT_URL` and `QDRANT_API_KEY` in the gateway's environment. Never put its key in React or commit it. A remote gateway also requires HTTPS, an exchange token (`KHOJ_SYNC_TOKEN` on both ends) and appropriate deployment access control. The current installation is deliberately a single-team, localhost demo.

## Known boundaries

- Local text embeddings and hybrid retrieval run on the device. Photos are compressed attachments, with explicit sharing approval and resumable synchronization; image embeddings are not implemented.
- Exchange can be manual or opt-in automatic. Field mode pauses new exchange requests; an in-flight request may finish.
- Metadata and photo transfer work is bounded per cycle. Repeated cycles accumulate traffic; counters exclude protocol overhead and small control responses.
- Making a record local does not automatically retract earlier copies. Use explicit withdrawal; audit history and exported copies are not securely erased.
- Storage admission budgets exclude model/dependency storage and RAM. They are not hard filesystem quotas.
- The gateway is single-worker, single-team. Production multi-team authorization and distributed scaling are deferred.
- Synthetic observations are demonstration data. Sourced museum reference packs are separate background knowledge, not field discoveries or expert validation.

## Check before the demonstration

```powershell
.\Check-KhojSetu.ps1 -WithExchange -SecondUnit
```

This read-only check reports the local app, second unit and shared gateway, plus build/model availability. Omit `-SecondUnit` for one unit and `-WithExchange` for local-only work. It does not seed, synchronize, delete or modify records. Missing services produce a nonzero exit code and suggested startup commands. Camera permission, actual offline search and end-to-end exchange still require a manual rehearsal.

Two local units on one laptop are not two physical devices. For two laptops, install the project/model on each, give each a distinct `KHOJ_DEVICE` and separate `KHOJ_DATA`, and point `KHOJ_SYNC_URL` at the same reachable gateway. Keep each field app on localhost for camera access. The shared gateway requires a secured HTTPS endpoint and matching `KHOJ_SYNC_TOKEN`; the default launcher exposes nothing to the LAN. Do not open the field API or raw Qdrant port to the public network. Until the endpoint is configured and rehearsed, use the two-local-unit demonstration above.

## Checks

```powershell
npm run lint
npm run build
.\.venv\Scripts\python.exe -m pytest backend/test_integration.py -q
```

Integration tests use actual Qdrant Edge and the cached model; the two-device test also requires the local gateway and Qdrant Server. Tests create synthetic records in the shared collection.


## Final-round photo and resource controls

- Record a finding: take a webcam photograph or upload JPEG/PNG/WebP. Keep original research files separately.
- In the form, explicitly enable photo exchange only when appropriate; the record must also be approved and non-sensitive.
- System & activity: inspect field-data storage and model cache separately, set budgets, and optionally enable automatic exchange.
- Field mode pauses exchange. Network requests do not hold the local search/edit lock.
- Exchange now is one bounded cycle. A larger queue or photo can require several cycles.
- A phone cannot use the laptop's localhost URL. Phone browser access requires a separately configured reachable server; browser camera access needs HTTPS or another supported secure context.
