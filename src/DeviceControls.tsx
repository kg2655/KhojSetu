import { useEffect, useState } from 'react';
type Storage = {dataBytes:number;photoBytes:number;indexBytes:number;otherBytes:number;budgetBytes:number;modelBytes:number;freeDiskBytes:number;recordCount:number;protectedPhotos:number};
type Settings = {autoSync:boolean;metered:boolean;transferKiB:number};
const size=(n:number)=>n<1024*1024?(n/1024).toFixed(1)+' KiB':(n/1024/1024).toFixed(1)+' MiB';
export function DeviceControls({settings,onSaved}:{settings:Settings;onSaved:()=>Promise<unknown>}){
  const [storage,setStorage]=useState<Storage|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  async function load(){const r=await fetch('/api/storage');if(!r.ok)throw new Error('Cannot read storage usage.');setStorage(await r.json());}
  useEffect(()=>{load().catch(e=>setError(e.message));},[]);
  async function submit(body:unknown,path='/settings'){
    setBusy(true);setError('');setNotice('');
    try{const r=await fetch('/api'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(typeof d.detail==='string'?d.detail:'Check the limits and try again.');await load();await onSaved();setNotice(path.includes('cleanup')?size(d.freedBytes)+' freed. Attached photographs were protected.':'Device preferences saved.');}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  if(!storage)return <p role="status">{error||'Reading device storage…'}</p>;
  const percent=Math.min(100,storage.dataBytes/storage.budgetBytes*100);
  return <section className="sheet device-controls">
    <span className="eyebrow">DEVICE MEMORY & CONNECTION</span><h2>A small, deliberate field memory</h2>
    <p>{size(storage.dataBytes)} of {size(storage.budgetBytes)} field-data budget · {storage.recordCount} records</p>
    <progress max={100} value={percent} aria-label="Device field-data storage usage"/>
    <div className="storage-breakdown"><span>Photos <b>{size(storage.photoBytes)}</b></span><span>Edge index <b>{size(storage.indexBytes)}</b></span><span>Journal & other <b>{size(storage.otherBytes)}</b></span><span>Shared model cache <b>{size(storage.modelBytes)}</b></span></div>
    <p className="storage-explanation">Model cache is a fixed cost outside the field-data budget. {size(storage.freeDiskBytes)} disk space is free. Admission checks reserve space; this is not an operating-system disk quota.</p>
    <form onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget);void submit({storageMiB:Number(d.get('storageMiB')),transferKiB:Number(d.get('transferKiB')),autoSync:d.get('autoSync')==='on',metered:d.get('metered')==='on'});}}>
      <div className="form-grid"><label>Field-data budget (MiB)<input name="storageMiB" type="number" min={192} max={4096} defaultValue={storage.budgetBytes/1024/1024} required/></label><label>Each direction per cycle (KiB)<input name="transferKiB" type="number" min={64} max={8192} defaultValue={settings.transferKiB} required/></label></div>
      <label className="checkline"><input name="autoSync" type="checkbox" defaultChecked={settings.autoSync}/> Automatically exchange when field mode is off. Retries back off when unavailable.</label>
      <label className="checkline"><input name="metered" type="checkbox" defaultChecked={settings.metered}/> Limited link: prioritize high-importance uploads and photos.</label>
      <small>At most 20 record uploads and 20 downloaded changes per cycle. Transfer limits count change bodies and photo chunks, not HTTP/TLS overhead or acknowledgements. Automatic cycles normally run about every 30 seconds.</small>
      <div className="button-row"><button disabled={busy} className="primary">Save preferences</button><button disabled={busy} type="button" className="secondary" onClick={()=>submit({},'/storage/cleanup')}>Clear unused photos</button><button disabled={busy} type="button" className="secondary" onClick={()=>load().catch(e=>setError(e.message))}>Refresh usage</button></div>
    </form>
    <p className="storage-explanation">Cleanup removes only unattached files older than 24 hours. Attached findings, pending work and conflict evidence are never removed automatically. The original 40-record expedition remains intentionally small.</p>
    {error&&<p className="photo-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  </section>;
}
