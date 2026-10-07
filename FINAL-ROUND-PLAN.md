# KhojSetu final-round implementation plan
Updated 7 October 2026. Presentation: 11 October.

## Implemented in this update
- Nonblocking network exchange with a durable outbox and version-safe acknowledgements.
- Receipt reconciliation when acknowledgement is uncertain, including after sharing is revoked.
- Opt-in background exchange, retry backoff and explicit field-mode pause.
- Bounded metadata uploads/downloads and visible per-cycle body-byte counters.
- Camera/upload controls, compressed working photos, EXIF removal and content-based deduplication.
- Explicit photo-sharing approval and resumable, checksum-verified attachment transfers.
- Device storage accounting, admission budgets and protected-evidence cleanup.
- Leaner Edge payloads; no re-embedding for policy-only edits; no dense embedding for lexical-only queries.
- Recoverable gateway writes and isolated regression tests.
- Updated evaluator-facing architecture and limitations.

## Remaining before the presentation
- Test the physical camera on the actual laptop and choose a permitted real photograph.
- Obtain practitioner feedback and any appropriately licensed reference data.
- Rehearse the two-device workflow, explain the stack and prepare the presentation.
- Capture a backup demonstration.
- Freeze features on 10 October.

## Explicitly deferred
- Expedition-specific reference packs and eviction of downloaded records.
- Shared deletion/tombstone propagation.
- Image embeddings and generative archaeological answers.
- Native phone deployment and secure phone-to-laptop deployment.
- Multi-team authorization and distributed gateway scaling.
- Full-resolution original-photo archives.

These are not claimed as shipped features. Current shared-server hosting remains local Docker; a public cloud deployment is optional and would require separate configuration.
