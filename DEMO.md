# Five-minute evaluation demo

Start the field app and exchange gateway with Start-KhojSetu.ps1 -WithExchange. Prepare a second field unit with Start-KhojSetu.ps1 -SecondUnit. Open localhost:8000 and localhost:8001; keep the second unit ready before presenting. Use a permitted photograph and clearly distinguish synthetic seed records from real observations.

1. **45 seconds — offline memory.** Keep Field mode enabled. Search “decorated pottery with geometric patterns”, switch Semantic/Hybrid and filter L3. Open a result and point to its original notes. Explain that the cached MiniLM model embeds locally and Qdrant Edge retrieves locally. Show the measured search time without calling it a production benchmark.
2. **60 seconds — real capture and privacy.** Upload a permitted photo, or use the laptop camera after checking its permission beforehand. Save a high-priority finding with local-only visibility. Show its compressed working photo and searchable notes. Explain that image similarity search is not implemented: retrieval searches the description, not image pixels.
3. **45 seconds — limited device resources.** Open System & activity. Show field-data usage, the separate model-cache cost and the per-cycle transfer allowance. Explain selective site/material downloads. Optionally show a small sourced reference pack prepared before the demo; references remain distinct from field discoveries.
4. **60 seconds — controlled exchange.** Edit the finding, approve sharing, select Shared visibility and explicitly approve its photo. Disable Field mode and use Exchange now. Point to actual byte counts, queue state and verified photo-transfer status. Automatic exchange is opt-in and retries with backoff. Open localhost:6333/dashboard and inspect khojsetu_shared_v1: dense vectors, lexical sparse vectors and approved metadata are real Qdrant Server points.
5. **90 seconds — two devices and changing knowledge.** Exchange on the second unit and open the received finding/photo. Edit the same record on both units, exchange the second unit first, then the first. Show the conflict and choose how to retain evidence. If time is short, show the successful transfer and explain the automated conflict checks; do not claim a live conflict occurred unless it did.

Close: “Qdrant Edge is the local retrieval engine. Qdrant Server stores shared vectors. KhojSetu adds privacy policy, storage and transfer budgets, durable retries, revision checks, conflict review and a usable field notebook.”

## Real-image reference demonstration

Before presenting, use **Add 8 museum references** on Field station. This preserves the 40 synthetic records and adds clearly labelled local-only references. The three real Met photographs are already bundled for offline display. Choose **Search notes** beneath an object, then **Search memory**; open the matching reference to show the image and source. Retrieval still searches text, not image pixels. These objects span different regions/periods and are not one excavation dataset. Museum source links require internet; reference viewing and search do not.

Run `Check-KhojSetu.ps1 -WithExchange -SecondUnit` after starting both units. It checks service readiness without changing records; it does not replace the end-to-end rehearsal.

## Optional demonstrations

- Pin an unchanged downloaded reference, then unpin and remove only its local copy. Restore it through exchange. Locally authored or edited evidence is protected.
- Explicitly withdraw a shared record. Connected units remove unchanged downloaded copies while retaining their own edits privately. This is not secure erasure of audit history or exported copies.
- Import the synthetic format example twice into a disposable field unit: the second import preserves existing records. Use a permitted real reference pack when available; the importer records source declarations but does not certify them.

## Accurate boundaries

This is a single-team localhost deployment. Native phone execution, image embeddings, generative archaeological conclusions, per-user access control and distributed gateway scaling are not shipped. The assistant extracts original retrieved notes. Photos are compressed working copies with explicit, resumable exchange; full-resolution original-photo archival is not implemented. Seed records and the example reference pack are synthetic.

See docs/VALIDATION.md for completed checks and measured development-laptop timings. Test the physical webcam and rehearse on the actual presentation laptop. Keep a recording as a backup for hardware or venue problems.
