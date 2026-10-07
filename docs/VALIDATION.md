# Verification

Use a disposable server; do not run test writes against the expedition used for presentation.

## Offline checks

```powershell
.\.venv\Scripts\python.exe -m pytest backend/test_final_round.py -q -k "not gateway"
npm run lint
npm run build
```

The Python checks use real Qdrant Edge and the locally cached embedding model. HTTP faults are deliberately injected to reproduce lost acknowledgements and stalled connections; vector retrieval is not mocked.

## Gateway and photo checks

Open Docker Desktop, then start a disposable server on an unused port:

```powershell
docker run -d --rm --name khojsetu-final-test -p 127.0.0.1:6334:6333 qdrant/qdrant:v1.19.1
.\.venv\Scripts\python.exe -m pytest backend/test_final_round.py -q
docker stop khojsetu-final-test
```

Each gateway test creates a unique Qdrant collection and an isolated journal. The test token is a fixture value, not a production credential.

The original five checks remain in backend/test_integration.py. To run those separately against an isolated gateway, configure KHOJ_TEST_SYNC_URL, QDRANT_URL and KHOJ_COLLECTION consistently with that gateway; give the gateway its own KHOJ_CLOUD_DATA directory. They include two-device conflict resolution and restart recovery.

## Verified on 7 October 2026

- 16 checks passed across the original and final-round suites.
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
