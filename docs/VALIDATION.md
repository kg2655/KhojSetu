# Verification

Use a disposable server; do not run test writes against the expedition used for presentation.

## Offline checks

```powershell
.\.venv\Scripts\python.exe -m pytest backend/test_final_round.py backend/test_packs.py -q -k "not gateway"
npm run lint
npm run build
```

The Python checks use real Qdrant Edge and the locally cached embedding model. HTTP faults are deliberately injected to reproduce lost acknowledgements and stalled connections; vector retrieval is not mocked.

## Gateway and photo checks

Open Docker Desktop, then start a disposable server on an unused port:

```powershell
docker run -d --rm --name khojsetu-final-test -p 127.0.0.1:6334:6333 qdrant/qdrant:v1.19.1
.\.venv\Scripts\python.exe -m pytest backend/test_final_round.py backend/test_packs.py -q
docker stop khojsetu-final-test
```

Each gateway test creates a unique Qdrant collection and an isolated journal. The test token is a fixture value, not a production credential.

The original five checks remain in backend/test_integration.py. To run those separately against an isolated gateway, configure KHOJ_TEST_SYNC_URL, QDRANT_URL and KHOJ_COLLECTION consistently with that gateway; give the gateway its own KHOJ_CLOUD_DATA directory. They include two-device conflict resolution and restart recovery.

## Verified on 7 October 2026

- 29 final-round/reference-pack checks passed in the latest full run; the original five integration checks passed earlier (34 checks total).
- Selective-download tests cover out-of-scope revisions, safe widening/narrowing, blocking selection changes during in-flight exchange, and not disclosing never-shared private IDs.
- Reference-cache tests verify own/pinned/edited-record protection, removal from real Edge search, exclusion from later downloads, explicit restoration and interrupted-removal recovery.
- Withdrawal tests verify active Qdrant removal, suppression of withdrawn history in change responses, preservation of local edits, stale-revision conflicts and idempotent retry after a lost acknowledgement.
- Reference-pack tests cover API/file limits, duplicate IDs, provenance, offline search, layer-filter exclusion, preservation of edits, partial storage-limited retry and exchange exclusion. The importer controls were also inspected in the browser.
- Republish recovery tests verify restoration across withdrawal history and device restart, plus receipt reconciliation after a lost republish acknowledgement without duplicate uploads.
- TypeScript checking and production build passed.
- Browser upload: a labelled 800 × 600 test image was compressed from about 13 KiB to 9 KiB, saved, and displayed in the record and archive. It was not presented as archaeological evidence.
- Real-server photo roundtrip completed across multiple 64 KiB cycles with matching file hashes.
- Opt-in background exchange drained the 35-record test queue through repeated 64 KiB cycles without manual exchange clicks.
- The browser's physical camera permission/capture path still needs a check with the presentation laptop.
- A small warm-search sample on the development Windows laptop contained 42 records (40 seed records plus isolated test observations): 15 hybrid searches, median 5.7 ms and maximum 8.2 ms reported by the service. This excludes cold startup and is not a quality, scale, or cross-device benchmark.
- That preview reported about 166 MiB field-data logical file size and 87 MiB shared model cache. Python/Node dependencies and RAM are not included.

## Presentation preflight

1. Start the ordinary field app and exchange service using START-HERE.md.
2. Confirm the intended dataset and inspect device storage.
3. Check webcam permission or bring a photograph for upload.
4. Demonstrate a local-only record, an approved record and explicit photo sharing.
5. Use a small transfer allowance to show progress over multiple cycles.
6. Disconnect or pause exchange and verify local search still works.
7. Demonstrate conflicting edits on two field units.
8. Keep a recorded backup demonstration and freeze the build before the presentation.

## Sourced museum pack checkpoint

Six reference-pack tests passed after adding the eight-record catalogue snapshot. The added test imports the file into isolated real Edge memory, checks three material-filtered retrieval queries and verifies duplicate-free re-import. These are smoke checks, not archaeological accuracy evaluation. Type checking and production build passed. The ordinary synthetic expedition was not modified.

## Final presentation assets

Production build passed. Both editable draw.io pages and SVG parsed successfully; GIF has 28 frames. Archived source assets were checked against previous versions (HTML checkout line endings preserved). Browser checks verified initial rendering, Next navigation and direct Reconcile selection at /pitch.html. These are presentation checks; backend tests were not rerun for this documentation-only change.

## Finale usability checkpoint - 8 October 2026

Added Capture / Retrieve / Exchange entry points on the field station. State refresh requests have an eight-second timeout and share an in-flight request. A disconnected local backend now produces a persistent stale-record warning and disables the exchange-mode toggle; successful polling restores the ready state. Field mode remains distinct from backend unavailability.

Type checking and production build passed. Browser checks verified the search shortcut and visual layout. An isolated read-only preview verified service failure (HTTP 503), warning visibility, disabled toggle and automatic recovery; the normal 40-record field dataset was not changed. Check-KhojSetu.ps1 passed against the real field app/gateway, and correctly returned exit code 1 for an unavailable gateway. The script performs no synchronization or data writes. Camera capture and physical two-laptop exchange remain manual preflight items.
