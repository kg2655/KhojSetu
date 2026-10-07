# KhojSetu architecture and resource tradeoffs

## What runs on the field device

React calls the local FastAPI service. SQLite is the record/version and durable-outbox journal. Cached MiniLM produces 384-dimensional dense vectors; stable lexical sparse vectors provide keyword retrieval. Qdrant Edge executes local searches and the application combines ranks. Edge payloads contain only IDs and filter fields; complete record data remains in SQLite.

Policy-only edits reuse stored embeddings. Lexical-only search skips the dense model. These reduce unnecessary work without changing the embedding model.

Photos are separate content-addressed files, never base64 vector payloads. Working copies are JPEG, at most 1600 pixels, with EXIF removed. Identical compressed content shares one file. The original is not overwritten or archived automatically.

## Exchange protocol

1. Under the short record lock, capture a versioned upload envelope and persist it in the outbox.
2. Release the lock before contacting the gateway.
3. If an acknowledgement was lost, consult its event receipt before retrying the original envelope.
4. An acknowledgement advances the shared base revision; it marks the record clean only if its current event matches the uploaded event.
5. Newer local edits remain pending. A conflict preserves the shared observation for explicit resolution.
6. Incremental downloads advance their cursor only after local persistence.
7. Photo metadata is sent only with explicit photo approval. Photos transfer separately in chunks and become complete only after SHA-256 verification.

Only one exchange runs per device. Requests have timeouts, and cycle work is bounded. Background exchange is optional, normally runs around every 30 seconds, and uses exponential backoff up to roughly five minutes plus jitter after failure. Field mode stops new requests; an already in-flight request may complete.

The gateway commits pending changes to its SQLite journal before writing Qdrant. An interrupted write is replayed before acknowledgement or delivery of changes. This is a single-writer recovery design, not a distributed transaction system.

## Budgets and protection

- Default field-data admission budget: 512 MiB; configurable from 192 to 4096 MiB.
- Model cache and software dependencies are outside that budget; the UI reports model size separately.
- The budget counts logical file sizes, including Edge preallocation. It does not measure resident RAM or allocated filesystem blocks.
- Photo uploads and downloaded chunks check available budget and reserve free disk headroom.
- Records and vector storage can grow in allocation steps; admission checks are not a hard filesystem quota.
- Default transfer allowance: 256 KiB in each direction per cycle, configurable from 64 to 8192 KiB.
- At most 20 record uploads, 20 downloaded changes and 16 photo data requests per cycle.
- Body-byte counters exclude protocol overhead and small control responses. Automatic repeated cycles accumulate network usage.
- Attached evidence, pending upload photos and conflict photos are protected from cleanup. Only unattached files older than 24 hours can be cleared.
- No automatic deletion of attached evidence is implemented.

## Small local datasets

The 40-record synthetic expedition is intentional. The design is suitable for demonstrating a useful local working collection, not claiming millions of offline observations on every device. The current release downloads the approved shared change stream in bounded pages. Selective expedition packs and removable reference caches remain planned extensions.

## Boundaries

The demo's Qdrant Server runs in Docker on the same laptop. No cloud account is required. A remote deployment must add HTTPS and configure the shared token. The token authenticates a team endpoint; it is not per-user authorization or multi-team isolation.

Images are attachments, not image embeddings. The assistant extracts source notes rather than inventing archaeological interpretations. Shared-copy deletion, full-resolution photo archives, native phone execution and distributed gateway scaling are not implemented.
