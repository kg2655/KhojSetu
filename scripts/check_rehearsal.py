"""Exercise only the isolated rehearsal services. Never targets the main notebook."""
import json, statistics, time
from pathlib import Path
import httpx

ROOT = Path(__file__).resolve().parents[1]
a, b = 'http://127.0.0.1:8002', 'http://127.0.0.1:8003'

def call(base, path, body=None):
    with httpx.Client(timeout=45, trust_env=False) as client:
        response = client.get(base+path) if body is None else client.post(base+path,json=body)
        response.raise_for_status()
        return response.json()

def main():
    assert call(a,'/api/state')['device']=='REHEARSAL-A', 'Wrong unit on port 8002'
    assert call(b,'/api/state')['device']=='REHEARSAL-B', 'Wrong unit on port 8003'
    assert call(a,'/api/state')['fieldMode'], 'Start Fresh before verification: field mode must be enabled'
    checks=[]
    marker=str(time.time_ns())
    public=call(a,'/api/records',dict(title='Rehearsal painted ceramic '+marker,fieldNotes='Modern demonstration cup with painted triangular blue lines. Training prop, not an archaeological find.',material='Ceramic',approved=True,importance='High',visibility='SHARED',site='Rehearsal'))
    private=call(a,'/api/records',dict(title='Private rehearsal note '+marker,fieldNotes='Training-only restricted context. Must stay on this device.',sensitive=True,approved=True,importance='High'))
    assert call(a,'/api/state')['fieldMode'], 'Start Fresh before verification: field mode must be enabled'
    durations=[]
    for mode in ('SEMANTIC','EXACT','HYBRID'):
        for _ in range(5):
            result=call(a,'/api/search',dict(query='painted ceramic triangular blue',mode=mode))
            assert any(x['record']['id']==public['id'] for x in result['results'])
            durations.append(result['elapsedMs'])
    checks.append('Local semantic, lexical and hybrid retrieval while exchange is paused')
    for base in (a,b): call(base,'/api/settings',dict(fieldMode=False,autoSync=False))
    try:
        sent=call(a,'/api/sync',{})
        call(b,'/api/sync',{})
        received={r['id'] for r in call(b,'/api/state')['records']}
        assert public['id'] in received
        assert private['id'] not in received
        checks.extend(['Approved record reaches second independent unit','Sensitive record remains local'])
        assert sent['uploadedBytes']<=256*1024 and sent['downloadedBytes']<=256*1024
        checks.append('Reported record transfer stays within default per-direction budget')
    finally:
        for base in (a,b): call(base,'/api/settings',dict(fieldMode=True,autoSync=False))
    report={'checks':checks,'searchSamples':len(durations),'medianReportedSearchMs':statistics.median(durations),'maxReportedSearchMs':max(durations),'scope':'Two loopback processes on this laptop, small reference dataset; not a two-physical-device or minimum-hardware benchmark. Rehearsal records intentionally remain; use Fresh for a clean demo.'}
    out=ROOT/'.data/rehearsals/latest-check.json'
    out.write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))

if __name__=='__main__': main()
