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

The 40-record synthetic expedition is intentional. The design is suitable for demonstrating a useful local working collection, not claiming millions of offline observations on every device. Under System & activity, select an exact site name and/or material for new downloads. Matching is case-insensitive. The gateway filters before sending vector/record data, while always delivering updates to previously shared records already on the device. A finding that matched an earlier revision remains tracked if later reclassified. Changing the selection safely resets the download cursor and replays history; existing revisions are skipped and local evidence is never removed.

Selection requests exclude never-shared private record IDs. Up to 5,000 known shared IDs are supported per filtered request; this is a bounded small-device design, not a large-catalog subscription service. The gateway examines at most 1,000 change events per selected page and returns a cursor to resume. Subscription metadata is control traffic outside the content-byte counter.

Unchanged downloaded references can be pinned, removed locally and explicitly restored. Removal is journalled before deleting the Edge point, so startup repairs an interrupted operation. Removed IDs are excluded from automatic downloads; an explicit restore replays history even if the current site/material selection would exclude that record. Your own or locally edited records, pending changes, conflicts and unverified/private photo evidence are protected. Legacy records without ownership metadata are conservatively protected. Shared records are not deleted by cache removal. Edge files can retain preallocated capacity for reuse.

Curated reference-pack import remains a planned extension.

## Boundaries

The demo's Qdrant Server runs in Docker on the same laptop. No cloud account is required. A remote deployment must add HTTPS and configure the shared token. The token authenticates a team endpoint; it is not per-user authorization or multi-team isolation.

Images are attachments, not image embeddings. The assistant extracts source notes rather than inventing archaeological interpretations. Secure erasure of audit/exported copies, full-resolution photo archives, native phone execution and distributed gateway scaling are not implemented.


## Explicit shared withdrawal

A researcher explicitly confirms withdrawal in a record's detail panel. The device persists the versioned request and retains its local notes. A stale shared revision becomes a conflict, requiring review. Retrying a lost acknowledgement uses the same event ID.

The gateway records and applies a tombstone, removing the active vector point. Change responses suppress historical content when the latest revision is withdrawn. Connected devices receive the tombstone: unchanged downloaded copies are removed; local creations, edits or conflicting notes are retained privately. Server-side revision history and stored photo files are retained for audit/recovery; exported copies and offline devices cannot be instantaneously erased. This feature must not be represented as secure erasure or guaranteed recall of all copies.

Normal field mode pauses withdrawal transmission too. Team-token access is the current authorization boundary; per-user deletion privileges are not implemented.
