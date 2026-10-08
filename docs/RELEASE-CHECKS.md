# Release verification, 8 October 2026

- `npm run lint` and `npm run build`: passed.
- `backend/test_final_round.py` plus `backend/test_packs.py`: 30 passed, with real Qdrant Edge and a separate Qdrant Server on 6334.
- `backend/test_integration.py`: 5 passed against the isolated rehearsal gateway and collection, not the main shared collection.
- `scripts/check_rehearsal.py`: semantic, lexical and hybrid local retrieval passed; approved record reached B; sensitive record stayed local; reported default transfer budget respected.
- Rehearsal Fresh completed and restored A to eight museum references, B empty; prior sessions retained. Restart timestamp comparison corrected for PowerShell JSON datetime parsing.

Timing sample: 15 searches on the tiny rehearsal dataset on this laptop, median reported search time 5.4 ms, maximum 21.4 ms. This excludes browser round-trip and does not establish low-spec or large-dataset performance. Machine has approximately 24 GiB physical RAM. Model/dependency costs are separate from the field-data admission budget.

Test warnings: a Starlette/httpx deprecation and inability to update the optional pytest cache. Neither caused a failing test. Actual webcam permission, projector readability and two physical laptops remain manual acceptance checks. No image recognition, scientific dating or production multi-team deployment is claimed.
