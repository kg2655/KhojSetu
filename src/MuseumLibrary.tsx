import {useState} from 'react';
import {ArrowUpRight, BookOpen, LoaderCircle, Search} from 'lucide-react';
import references from './data/museumReferences.json';

export const MUSEUM_PACK_ID='met-comparative-materials-2026-10-v1';
export function museumImage(source?:{packId?:string;entryId?:string}){
  return source?.packId===MUSEUM_PACK_ID?references.find(r=>'met-'+r.id===source.entryId):undefined;
}

export function MuseumLibrary({importedIds,onImported,onSearch}:{importedIds:string[];onImported:()=>Promise<unknown>;onSearch:(query:string)=>void}){
  const imported=importedIds.length;
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  async function addReferences(){
    setBusy(true);setError('');setMessage('');
    try{
      const pack=await fetch('/reference-pack-met-materials.json');
      if(!pack.ok)throw new Error('The bundled reference pack is unavailable. Rebuild the app and retry.');
      const response=await fetch('/api/reference-packs',{method:'POST',headers:{'Content-Type':'application/json'},body:await pack.text()});
      const result=await response.json();
      if(!response.ok)throw new Error(typeof result.detail==='string'?result.detail:'Could not import museum references.');
      setMessage(`${result.imported} references added; ${result.skipped} existing entries preserved. ${result.blocked||'Ready for local text search.'}`);
      await onImported();
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <section className="museum-library" aria-label="Museum reference library">
    <div className="museum-intro"><div><span className="eyebrow">THE REFERENCE SHELF / OPEN COLLECTIONS</span><h2>Real objects. Traceable knowledge.</h2><p>Study museum references alongside your field notes. These objects come from different places and periods; they are not finds from this expedition.</p></div><div className="museum-action"><span>{imported} / 8 reference notes in local memory</span><button className="primary" disabled={busy||imported>=8} onClick={addReferences}>{busy?<LoaderCircle size={16} className="spin"/>:<BookOpen size={16}/>} {busy?'Adding local references…':imported>=8?'Reference pack added':'Add 8 museum references'}</button><small>Local import · existing notes preserved</small></div></div>
    <div className="museum-cards">{references.map((r,i)=><article className="museum-card" key={r.id}><div className="museum-photo"><img src={r.image} alt={`${r.title}, ${r.origin}, The Metropolitan Museum of Art`} loading="lazy"/><span>0{i+1} / {r.material}</span></div><div className="museum-caption"><span className="eyebrow">{r.origin} · {r.date}</span><h3>{r.title}</h3><p>The Met · {r.accession}</p><div className="museum-links"><a href={r.sourceUrl} target="_blank" rel="noreferrer">Museum source <ArrowUpRight size={13}/></a><button disabled={!importedIds.includes('met-'+r.id)} onClick={()=>onSearch(r.query)}><Search size={13}/> Search notes</button></div></div></article>)}</div>
    <p className="museum-footnote">Public-domain photographs · bundled for offline viewing · text retrieval, not image recognition. Source links require internet. Add the reference pack to search its notes.</p>
    {error&&<p role="alert" className="photo-error">{error}</p>}{message&&<p role="status">{message}</p>}
  </section>;
}
