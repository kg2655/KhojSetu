# Push the final version and manage the local demo

## What belongs in the submission?

Commit the application source, backend source, dependency manifests/lockfile, Docker Compose file, synthetic seed dataset, README, pitch guides, interactive HTML and editable diagram. The README embeds `docs/media/khojsetu-flow.gif`.

The following are intentionally ignored: `.data` (your entered records, databases, backups and logs), `.models`, `.venv`, `node_modules`, `dist`, private `.env` files and Python caches. Your random demo entries are not in `backend/demo.json`, so they will not reach GitHub with the source.

## Files to edit later

| File | Purpose |
| --- | --- |
| `README.md` | Main GitHub page: current features, setup, proof and limitations |
| `public/pitch.html` | Standalone animated explanation; served at `/pitch.html` |
| `public/khojsetu-flow.drawio` | Editable diagram for draw.io / diagrams.net |
| `docs/media/khojsetu-flow.gif` | Animated image that GitHub displays inside the README |
| `PITCH-PREP.md` | Full speaking preparation and judge Q&A |
| `START-HERE.md` | Local installation, start/stop and Docker walkthrough |

GitHub renders the GIF and Mermaid diagram. It does not execute the pitch HTML in a repository file view. A reviewer can download the HTML or run the app. Your localhost links only work on your own computer; submit the repository URL, not localhost.

## Direct push to Kannu's repository

Remote: `https://github.com/kg2655/KhojSetu.git`. Your contributor account must have write permission, and branch rules must permit direct pushes to `main`.

Open PowerShell in the project folder:

```powershell
cd 'C:\Users\user\Documents\ChatGPT\Qdrant Arch\KhojSetu'
git status
git branch --show-current
git fetch origin
git rev-list --left-right --count HEAD...origin/main
```

Before your first local commit, `0 0` means your base matches the latest remote. After committing, `1 0` normally means one local commit is ready to push. Any nonzero second number means someone added remote commits; reconcile those before pushing.

Review the diff and ignored-file list:

```powershell
git diff --stat
git status --short --untracked-files=normal
git check-ignore .data .models .venv node_modules dist
```

If these changes are not already committed:

```powershell
git add .
git diff --cached --stat
git commit -m "Implement offline Qdrant Edge memory and real knowledge exchange"
```

Then publish:

```powershell
git push origin main
```

If Git opens browser authentication, sign in with **your own GitHub account that has contributor access**. Do not use Kannu's credentials. A permission rejection can indicate a wrong signed-in account or branch protection. If branch rules require a pull request, push a branch and use the repository's normal review process.

If someone pushed in the meantime and Git rejects a non-fast-forward push:

```powershell
git fetch origin
git rebase origin/main
```

If files conflict, Git names them. Resolve each carefully, stage it and run `git rebase --continue`, or `git rebase --abort` to return to the previous state. Then push again. Do not force-push over teammates' work.

## What happened to the demo entries?

Knowledge exchange sends all eligible pending records, not only the record most recently opened. The earlier demo uploaded the original eligible queue in batches and later uploaded additional approved entries. Shared records were real points in the local Qdrant Server. The “deferred” count includes records retained by policy; it does not necessarily mean a failure.

The cleanup saves the previous field and gateway directories plus shared point/vector data under `.data/backups/<timestamp>`. It then restores 40 original synthetic records: 35 pending, 5 local-only, no conflicts, field mode enabled. The shared collection is cleared and recreated empty by the gateway on its next startup. Backups stay local and are ignored by Git.

## Browser tabs, services and Docker

- Chrome tabs merely display the app, pitch and dashboard. Closing a tab does not stop its server or erase records.
- Closing Docker's window usually leaves its engine running. Quit Docker Desktop to stop the engine.
- Stop project processes with `Stop-KhojSetu.ps1`. It preserves data.
- Start again using `Start-KhojSetu.ps1 -WithExchange` after opening Docker Desktop.
- You can close the old localhost tabs. Reopen the links after restarting services.

## Reset again only when deliberately clearing demo data

Stop all field units and the gateway, but keep the project's Qdrant container running. Then:

```powershell
.\.venv\Scripts\python.exe -m scripts.reset_demo --confirm
```

This command backs up local demo state and clears **only** `khojsetu_shared_v1` on `127.0.0.1:6333`. It is intended for this local demo, not a production server. To restore a backup, stop services, restore the archived field/gateway directories together, and restore the archived shared points to the correctly configured collection. Keep all parts from the same backup timestamp.
