# Resume checkpoint - 7 October 2026

Repository: C:/Users/user/Documents/Qdrant Arch/KhojSetu
Branch: final-round. Recovery checkpoint 1cbbf7f is published; the subsequent reference-pack update passed 29 combined feature tests. Only the owner is currently working on the repository; normal non-force pushes are authorized.

Recovery verified: republished references survive history replay and device restart; recovered upload receipts clear obsolete withdrawn status without resending. All 24 final-round tests passed against real Qdrant Edge and an isolated Qdrant Server. Docker recovered after manual Quit/reopen. Field-07 runs at localhost:8000 with 40 records, field mode enabled.

Implemented: camera/upload interface, compressed working photos, explicit attachment approval, resumable checksum-verified photo exchange, nonblocking bounded synchronization, durable outbox and receipt reconciliation, opt-in automatic retry, storage accounting/admission budgets, protected-photo cleanup, leaner Edge payloads, embedding reuse and selective site/material downloads with safe history replay, plus protected local-reference removal/restoration, explicit shared withdrawal and bounded offline reference-pack import.

Validation: 34 regression checks passed across targeted runs (29 final-round/reference-pack checks in the latest full run and five earlier integration checks), using real Qdrant Edge and a disposable real Qdrant Server. TypeScript and production build passed. Browser photo upload/save/display and automatic draining of the test queue were verified. Physical webcam capture still needs a presentation-device check. See docs/VALIDATION.md.

The original field-07 demo and edited draw.io were not altered by tests. Preview/test services used ports 8002, 8011 and 6334, separate from the ordinary demo. The ordinary app is on port 8000. Disposable test services may be running during validation; stop them after testing.

Remaining: check webcam on the presentation laptop, obtain permitted real images/practitioner feedback, rehearse two-device demo and prepare presentation/backup recording. Image embeddings, native phone deployment and multi-team scaling are explicitly deferred; see FINAL-ROUND-PLAN.md.

To resume: open this repository and inspect git status/log; manually open Docker Desktop; run Start-KhojSetu.ps1 -WithExchange and open localhost:8000. Publish tested checkpoints with normal non-force pushes.

Preferences: conserve credits, explain simply, keep the user updated, use project-focused submission names, preserve edited draw.io and keep personal pitch guides out of prominent README links. Docker's stale-socket startup failure was resolved by a normal manual Quit/reopen, not factory reset.

UI audit checkpoint: reference provenance is shown independently of editable notes. Archive, detail view, editor and evidence answers distinguish references from field locations. Five reference-pack tests, type checking and build passed after the fixes. Isolated browser review verified archive/detail/editor behavior using UI-REVIEW on port 8002; the normal 40-record dataset was untouched. Physical webcam, permitted real data and rehearsal remain presentation preflight items.

Dataset checkpoint: public/reference-pack-met-materials.json contains eight sourced museum catalogue references (6,437 bytes), with per-record accession IDs and official URLs. The API returned 403; source fields were checked against official object pages instead. No images or curatorial essays are bundled. Six pack tests, type checking and build passed. The dataset is downloadable in System & activity and was tested in isolated memory; it was not imported into the ordinary expedition. Sources and boundaries: docs/DATASET-SOURCES.md. Practitioner worksheet: docs/FIELD-VALIDATION-WORKSHEET.md.

Presentation checkpoint (7 October 2026): Updated README architecture, two-page editable draw.io, SVG/PNG, 28-frame GIF and standalone interactive pitch. Previous edited draw.io, GIF, PNG, pitch and rendering scripts are preserved under docs/archive/pre-final-2026-10-07. Production build and diagram structure checks passed; browser verified Next and direct Reconcile navigation. Physical two-laptop rehearsal remains pending.
