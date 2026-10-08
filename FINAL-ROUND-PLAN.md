# KhojSetu final-round implementation plan
Updated 8 October 2026. Presentation: 11 October.

Status: core prototype implemented. Remaining work focuses on device validation and demonstration rehearsal.

## Implemented in this update
- Nonblocking network exchange with a durable outbox and version-safe acknowledgements.
- Receipt reconciliation when acknowledgement is uncertain, including after sharing is revoked.
- Opt-in background exchange, retry backoff and explicit field-mode pause.
- Bounded metadata uploads/downloads and visible per-cycle body-byte counters.
- Camera/upload controls, compressed working photos, EXIF removal and content-based deduplication.
- Explicit photo-sharing approval and resumable, checksum-verified attachment transfers.
- Selective site/material downloads with safe history replay and updates for already-held records.
- Explicit shared withdrawal with version checks, tombstone propagation and preservation of local evidence.
- Pinning, safe removal and explicit restoration of unchanged downloaded references.
- Device storage accounting, admission budgets and protected-evidence cleanup.
- Leaner Edge payloads; no re-embedding for policy-only edits; no dense embedding for lexical-only queries.
- Recoverable gateway writes and isolated regression tests.
- Bounded offline reference-pack import with source/permission labels, duplicate protection and storage-limited retry.
- Updated evaluator-facing architecture and limitations.
- Three public-domain Met photographs bundled offline with object-level attribution; eight sourced reference notes and one-click import.
- Field station workflow shortcuts, reference gallery and correct source imagery for matching references.
- Explicit local-service disconnection warning and automatic UI recovery.
- Read-only service-readiness checker (Check-KhojSetu.ps1).
- Schematic excavation plan with occupancy shading, layer depth summaries and explanatory legend.
- Refreshed README screenshot, architecture GIF/SVG/PNG, editable diagram and interactive pitch; archived originals preserved.

## Remaining before the presentation
- Test the physical camera on the actual laptop and choose a permitted real photograph.
- Seek practitioner feedback; use cited desk research if no interview is available. Existing sourced museum data is demonstration reference material, not field validation.
- Measure process RAM and total installation size on the actual presentation device; low-spec performance is not established.
- Configure and rehearse two physical devices, or explicitly demonstrate two local units on one laptop.
- Prepare the final PPT and Hindi/Hinglish roles; use a labelled prerecorded teammate segment if needed.
- Capture a backup demonstration.
- Freeze features on 10 October.

## Explicitly deferred
- Secure erasure of revision history, retained attachments and exported copies.
- Image embeddings and generative archaeological answers.
- Native phone deployment and secure phone-to-laptop deployment.
- Multi-team authorization and distributed gateway scaling.
- Full-resolution original-photo archives.

These are not claimed as shipped features. Current shared-server hosting remains local Docker; a public cloud deployment is optional and would require separate configuration.
