# Offline reference packs

Open **System & activity → Bring a small reference pack**. Download the synthetic example to see the JSON format. Replace its content only with notes you have permission to use, and state the source and license/permission accurately. The importer records those declarations; it does not verify their truth or fetch the source website.

Each pack requires schemaVersion 1, a stable id, title, source, license, evidenceType (SYNTHETIC or REFERENCE), and 1–100 records. An optional sourceUrl can identify an HTTP/HTTPS source. Each record requires a unique stable id, title and fieldNotes; material and tags are optional. Unknown fields are rejected. See public/reference-pack-example.json.

Files are limited to 1 MiB. Notes are limited to 8,000 characters and tags to 20 entries of 80 characters each. All records are validated before importing begins. Imports do not download images or load executable content.

Imports stay local and unapproved. Existing entries are skipped, preserving edits. A new entry ID represents a separate revision; reusing a pack ID and entry ID will not overwrite existing content. The importer reports any storage-limited partial completion. Re-import the same file after freeing space or increasing the budget to resume safely.

Source, permission and synthetic/reference status are retained in structured metadata and initially included in the notes. Source declarations are not an expert endorsement. Imported references are excluded from the excavation grid and layer search filters. R0/L1 are internal form placeholders, not source coordinates; the detail view labels location as not applicable. Shared exchange still requires explicit researcher approval and the usual visibility/priority rules.

Imports use the cached embedding model and real Qdrant Edge. They hold the exchange lock to avoid concurrent synchronization, but release the interactive record lock while encoding each note. Budget checks are admission estimates, not a strict operating-system quota. Original files remain with the user; photo archives and automatic revision replacement are outside this text-pack format.

A separate eight-record museum pack is available from the same panel. See [source records and limitations](DATASET-SOURCES.md). It is text-only, marked REFERENCE, and never loaded automatically into the synthetic expedition.
