# Small real-source reference pack

The downloadable file `public/reference-pack-met-materials.json` contains eight text-only museum references: two Indian bronze vessels, two Egyptian stone-bead records and four Etruscan/Greek/Roman ceramic bowls. This deliberately mixed collection demonstrates material/word/semantic retrieval; it is not an Indian excavation dataset, typology classifier or representative benchmark.

## Sources and rights

Catalogue metadata was checked against the official object pages on 7 October 2026. The API returned HTTP 403 from the development connection, so this is a manually curated snapshot of published catalogue fields, not a successful API export.

The Met publishes select catalogue datasets under CC0: https://metmuseum.github.io/
Each imported note includes its object-level URL and accession number. No images, curatorial essays, unpublished observations or new historical conclusions are bundled. Material filters (Ceramic/Metal/Stone) are application categories; the exact catalogue medium remains in the notes. Museum attributions may change.

| Object | Accession | Official source |
| --- | --- | --- |
| Vase — Indian bronze vessel | 1982.65 | https://www.metmuseum.org/art/collection/search/453159 |
| Chalice — Indian bronze cup | 1986.501.11 | https://www.metmuseum.org/art/collection/search/37725 |
| String of beads — Egyptian carnelian | 25.3.94 | https://www.metmuseum.org/art/collection/search/548768 |
| Drop beads — carnelian, beryl and steatite | 22.1.1286 | https://www.metmuseum.org/art/collection/search/557494 |
| Terracotta bowl — Etruscan | 06.1021.274 | https://www.metmuseum.org/art/collection/search/247440 |
| Terracotta bowl — Campanian black glaze | X.21.38 | https://www.metmuseum.org/art/collection/search/256617 |
| Terracotta bowl — Roman Arretine ware | 2002.283 | https://www.metmuseum.org/art/collection/search/257612 |
| Terracotta bowl — Roman red slip ware | 17.194.860 | https://www.metmuseum.org/art/collection/search/250086 |

## Use without disturbing the demo

1. Open System & activity and download the museum reference pack.
2. Import it into an empty second field unit if you want to keep the original synthetic expedition separate.
3. Search “Indian bronze chalice”, “carnelian stone beads” and “Roman red slip bowl”. Inspect the source URL and museum accession in a result.
4. Use material filters. Do not apply an excavation-layer filter: reference records have no local excavation layer.
5. Re-importing the same file preserves existing records rather than creating duplicates.

Imports stay local and unapproved. Original photographs are not included or required. The JSON is small; the fixed embedding-model/index overhead still exists and must be included when explaining device requirements.

Say: “These are sourced museum catalogue references. Our seed expedition is synthetic. The application retrieves related records; it does not date or authenticate a find.”

For a domain pilot, replace this general reference pack with a small collection selected by a practitioner, with appropriate permissions and relevance to one research question.
