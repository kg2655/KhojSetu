# Five-minute evaluation demo

Open http://localhost:8000. Docker and the exchange gateway are only needed for steps 4–5. Use START-HERE.md to start them.

1. **30 seconds — the problem.** Remote excavation teams need useful local memory, even without internet. KhojSetu connects field observations through offline semantic retrieval and selective exchange.
2. **60 seconds — local memory.** Show Field mode and the excavation grid. Open a finding. Search “decorated pottery with geometric patterns”; switch Semantic/Hybrid and filter L3. Point out Qdrant Edge and the measured timing. This is real local MiniLM inference and real Edge retrieval.
3. **60 seconds — intelligent policy.** Create a high-priority record, approve it, select Automatic visibility. It queues for sharing. Explain that sensitive, unapproved and explicitly local records stay on the device; routine AUTO records are retained locally. Limited-link mode defers lower-priority uploads.
4. **60 seconds — real exchange.** Enable exchange and press Exchange now. Show actual uploaded counts and the activity log. Open http://localhost:6333/dashboard and inspect khojsetu_shared_v1. These are real points, with 384-dimensional dense vectors, lexical sparse vectors and archaeological metadata.
5. **90 seconds — two devices / evolving memory.** If the second unit is already running on port 8001, download shared records there. Edit one shared record independently in each unit, exchange the second unit first, then the first. Show both versions and merge the notes. If time is tight, explain the verified two-device integration test instead of pretending a conflict occurred in the live UI.

Close: “Qdrant Edge is our local search engine. Qdrant Server stores the shared vectors. Our application adds privacy/priority policy, a durable queue, version checks, conflict review and the field notebook.”

Be precise: this is a working localhost reference implementation, not a deployed multi-tenant cloud service. Exchange is manually triggered. The assistant extracts source notes, rather than using a generative LLM. Photos are not embedded or synchronized. All preloaded archaeological records are synthetic.

Verified in this session: frontend type-check and production build; five integration tests using real Edge and a live Server; browser hybrid search returned relevant records with a measured 17.7 ms on the 40-record synthetic dataset. This timing is one small-data measurement, not a production benchmark.
