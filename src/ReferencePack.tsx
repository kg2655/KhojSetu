import {useState} from 'react';

export function ReferencePack({onChanged}:{onChanged:()=>Promise<unknown>}){
  const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  async function upload(){
    if(!file)return;
    setBusy(true);setMessage('');setError('');
    try{
      if(file.size>1024*1024)throw new Error('Choose a reference pack smaller than 1 MiB.');
      const r=await fetch('/api/reference-packs',{method:'POST',headers:{'Content-Type':'application/json'},body:file});
      const d=await r.json();
      if(!r.ok)throw new Error(typeof d.detail==='string'?d.detail:'Invalid reference pack. Check its format and required source information.');
      setMessage(d.pack+': '+d.imported+' imported, '+d.skipped+' existing entries preserved. '+(d.blocked||'Ready for offline search.'));
      await onChanged();
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <section className="reference-memory">
    <h2>Bring a small reference pack</h2>
    <p>Import up to 100 text references from a JSON file, at most 1 MiB. Every pack identifies its source, permission and whether it is synthetic. Imported notes stay local; no source website is contacted.</p>
    <p>Re-importing the same pack preserves existing entries and your edits. Use a new entry ID for a separate revision. Reference notes use R0/L1 as display placeholders, not excavation coordinates.</p>
    <label>Reference pack file<input type="file" accept=".json,application/json" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);setError('');setMessage('');}}/></label>
    <div className="button-row"><button type="button" className="primary" disabled={busy||!file} onClick={upload}>{busy?'Importing references…':'Import local references'}</button><a className="text-button" href="/reference-pack-example.json" download>Download synthetic example</a></div>
    {error&&<p className="photo-error" role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  </section>;
}
