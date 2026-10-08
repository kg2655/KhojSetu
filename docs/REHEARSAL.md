# Isolated rehearsal

Run from the project directory after normal installation and model preparation. Open Docker Desktop first.

```powershell
.\Rehearse-KhojSetu.ps1 Fresh
```

Open A at http://localhost:8002 and B at http://localhost:8003. A has eight museum reference notes, B is empty. Museum photographs are bundled in the Reference library. No synthetic expedition is auto-loaded. Both field units start with exchange paused.

- `Start` resumes the current practice session, restarting its services.
- `Fresh` stops the tracked rehearsal services and creates a new session and Qdrant collection. It does **not** erase the previous session or main notebook.
- `Stop` stops only tracked rehearsal processes, keeping data and Docker available.
- `Status` prints the current paths and process IDs.

Every session occupies storage in `.data/rehearsals` plus a separate Qdrant collection. Fresh is archival, not a space reclamation command. Avoid repeatedly creating sessions unnecessarily. Main data at `.data/field-07` and the usual shared collection are untouched.

## Automated workflow check

Run this only after Fresh; it intentionally creates two clearly labeled training records:

```powershell
.\.venv\Scripts\python.exe -X utf8 scripts/check_rehearsal.py
```

It verifies the unit identities, local semantic/lexical/hybrid retrieval, approved exchange, sensitive-note retention and reported transfer budget. Results go to `.data/rehearsals/latest-check.json`. It leaves field mode enabled. Run Fresh once afterwards for the clean stage demonstration. This is two independent processes on one machine, not proof of two physical laptops.

## Five-minute manual sequence

1. A: Museum references, inspect source labels. Ask the archive: `bronze vessel` with no context filters.
2. A: Record a finding. Title `Training cup with painted lines`. Notes `Modern household demonstration prop with blue painted triangular lines. Not an archaeological discovery.` Material Ceramic, High importance, Shared visibility, researcher approval enabled, sensitivity off. Attach a photograph if wanted.
3. A: search `decorated ceramic cup` in field mode. The record should appear locally.
4. A: make a separate sensitive training note. Explain why it must stay local.
5. A and B: enable exchange. Click Exchange now on A, then B. Repeat cycles for photos if needed. B should have the approved cup, not the sensitive note or local-only museum pack.
6. Optional conflict: edit the shared cup differently on A and B before either exchanges. Exchange A, then B. Show conflict review, keep both notes, then exchange again. Do this only after rehearsing the basic path.
7. Reset the stage by running Fresh. Close stale browser dialogs and reload both tabs. A returns to eight museum notes; B is empty.

Camera use and actual disconnected-Wi-Fi operation require a manual check on the demonstration laptop. Field mode proves exchange is paused; it is not itself evidence that the network is physically disconnected.
