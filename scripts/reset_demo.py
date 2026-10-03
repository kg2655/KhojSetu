"""Explicit demo reset with backups. Stop field/gateway services before running.
Usage: python -m scripts.reset_demo --confirm
"""
import argparse
import json
import socket
from datetime import datetime
from pathlib import Path
import httpx
from backend.models import RecordInput
from backend.store import Store
from backend.vectors import VectorMemory

ROOT = Path(__file__).resolve().parents[1]


def local_path(path):
    resolved = path.resolve()
    resolved.relative_to(ROOT / '.data')
    return resolved


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--confirm', action='store_true', required=True)
    parser.parse_args()
    for port in (8000, 8001, 8010):
        with socket.socket() as sock:
            if sock.connect_ex(('127.0.0.1', port)) == 0:
                raise SystemExit(f'Stop the service on port {port} before resetting.')
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    backup = local_path(ROOT / '.data/backups' / stamp)
    backup.mkdir(parents=True)
    collection = 'khojsetu_shared_v1'
    # Back up the exact local Qdrant collection, including vectors, before clearing it.
    with httpx.Client(base_url='http://127.0.0.1:6333', timeout=30) as client:
        existing = client.get(f'/collections/{collection}')
        points = []
        if existing.status_code != 404:
            existing.raise_for_status()
            offset = None
            while True:
                body = dict(limit=100, with_payload=True, with_vector=True)
                if offset is not None:
                    body['offset'] = offset
                response = client.post(f'/collections/{collection}/points/scroll', json=body)
                response.raise_for_status()
                result = response.json()['result']
                points.extend(result['points'])
                offset = result.get('next_page_offset')
                if offset is None:
                    break
        (backup / 'qdrant-shared-points.json').write_text(json.dumps(points), encoding='utf-8')
        assert len(json.loads((backup / 'qdrant-shared-points.json').read_text())) == len(points)
        # Build and verify the replacement first. Old directories are preserved by rename.
        replacement = local_path(ROOT / '.data' / ('fresh-' + stamp))
        memory = Store(replacement, VectorMemory(replacement / 'edge', ROOT / '.models'))
        try:
            for record in json.loads((ROOT / 'backend/demo.json').read_text(encoding='utf-8')):
                memory.save(RecordInput.model_validate({**record, 'visibility':'AUTO', 'approved':True}).model_dump())
            records = memory.records()
            assert len(records) == 40
            assert sum(r['syncStatus'] == 'PENDING' for r in records) == 35
            assert sum(r['syncStatus'] == 'LOCAL_ONLY' for r in records) == 5
            memory.log('Synthetic dataset loaded', 'Fresh demonstration state: 40 synthetic field records.')
        finally:
            memory.close()
        for name in ('field-07', 'field-08', 'cloud'):
            original = local_path(ROOT / '.data' / name)
            destination = local_path(backup / name)
            if original.exists():
                original.rename(destination)
        replacement.rename(local_path(ROOT / '.data/field-07'))
        if existing.status_code != 404:
            client.delete(f'/collections/{collection}').raise_for_status()
    print(f'Restored 40 records: 35 pending, 5 local-only, field mode enabled.')
    print(f'Backed up {len(points)} shared points and previous field/gateway data to {backup}')
    print('The gateway recreates an empty shared collection on its next startup.')


if __name__ == '__main__':
    main()
