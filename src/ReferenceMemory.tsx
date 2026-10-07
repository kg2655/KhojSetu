import { useEffect, useState } from 'react';
type Reference={id:string;title:string;version:number;pinned:boolean;reason:string};
type Removed={id:string;title:string;revision:number|null};
type Catalogue={references:Reference[];removed:Removed[]};
export function ReferenceMemory({onChanged}:{onChanged:()=>Promise<unknown>}){
  const [data,setData]=useState<Catalogue>({references:[],removed:[]});
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  async function load(){const r=await fetch('/api/references');if(!r.ok)throw new Error('Could not read reference memory.');setData(await r.json());}
  useEffect(()=>{load().catch(e=>setError(e.message));},[]);
  async function act(path:string,body:unknown,message:string){
    setBusy(true);setError('');setNotice('');
    try{const response=await fetch('/api'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw new Error(typeof result.detail==='string'?result.detail:'The reference changed. Refresh and retry.');await load();await onChanged();setNotice(message);}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <section className="reference-memory">
    <div className="section-line"><h2>Downloaded reference memory</h2><button type="button" className="text-button" disabled={busy} onClick={()=>load().catch(e=>setError(e.message))}>Refresh references</button></div>
    <p>Remove an unchanged downloaded copy to reclaim local space. Its shared record remains available for restoration when connected. Your own observations and locally edited evidence are protected.</p>
    {!data.references.length&&<p className="empty-note">No removable downloads yet. Findings created on this device are protected; references appear after another field unit shares them.</p>}
    {data.references.map(r=><div className="reference-row" key={r.id}><div><strong>{r.title}</strong><small>{r.id} · {r.reason||'Unchanged shared reference · local copy can be removed'}</small></div><div className="button-row"><button type="button" className="secondary" disabled={busy} onClick={()=>act('/records/'+r.id+'/pin',{pinned:!r.pinned,expectedVersion:r.version},r.pinned?'Reference unpinned.':'Reference pinned for offline use.')}>{r.pinned?'Unpin':'Keep offline'}</button><button type="button" className="secondary" disabled={busy||Boolean(r.reason)} onClick={()=>act('/references/'+r.id+'/remove',{expectedVersion:r.version},'Local copy removed. The shared record was not deleted.')}>Remove local copy</button></div></div>)}
    {data.removed.length>0&&<h3>Removed from this device</h3>}
    {data.removed.map(r=><div className="reference-row" key={r.id}><div><strong>{r.title}</strong><small>{r.revision===null?'Restore queued — enable exchange to download.':'Excluded from automatic downloads until you restore it.'}</small></div><button type="button" className="secondary" disabled={busy||r.revision===null} onClick={()=>act('/references/'+r.id+'/restore',{},'Restore queued. Enable exchange or use Exchange now.')}>{r.revision===null?'Restore queued':'Restore reference'}</button></div>)}
    <small>Vector index files may retain preallocated space after removal. Storage is reused as new records arrive; attachment files can be reclaimed immediately when no other evidence needs them.</small>
    {error&&<p className="photo-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  </section>;
}
