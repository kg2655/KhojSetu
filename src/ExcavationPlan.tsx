import type {CSSProperties} from 'react';
type Observation={grid:string;layer:string;depth:number;material:string};
const layers=['L1','L2','L3','L4','L5'];
const rows=['A','B','C','D'];
const columns=[10,11,12,13,14];
const tones=['#d9c9a7','#c1a27b','#a7825c','#88684c','#665543'];
function depthRange(records:Observation[]){
  const depths=records.map(r=>r.depth).filter(d=>Number.isFinite(d)&&d>0);
  if(!depths.length)return 'No recorded depths';
  const low=Math.min(...depths),high=Math.max(...depths);
  return low===high?`${low.toFixed(2)} m recorded`:`${low.toFixed(2)}–${high.toFixed(2)} m recorded`;
}
export function ExcavationPlan({records,layer,cell,onLayer,onCell}:{records:Observation[];layer:string;cell:string;onLayer:(value:string)=>void;onCell:(value:string)=>void}){
  const selected=records.filter(r=>r.layer===layer);
  const plotted=selected.filter(r=>rows.some(row=>columns.some(column=>r.grid===row+column)));
  const occupied=new Set(plotted.map(r=>r.grid)).size;
  return <section className="sheet map-sheet field-plan">
    <div className="sheet-head"><div><span className="eyebrow">FIELD RECORDING / PLAN VIEW</span><h2>Explore the excavation</h2></div><span className="plan-stamp">SCHEMATIC<br/>SECTOR B</span></div>
    <p className="plan-help">A grid identifies a horizontal square. A layer groups recorded observations below the surface. Select both to inspect their notes.</p>
    <div className="layer-profile" aria-label="Recorded layers">{layers.map((l,i)=>{const group=records.filter(r=>r.layer===l);return <button key={l} aria-pressed={layer===l} aria-label={`${l}, ${group.length} records`} style={{'--soil':tones[i]} as CSSProperties} onClick={()=>onLayer(l)}><span className="soil-swatch" aria-hidden="true"/><strong>{l}</strong><span>{depthRange(group)}</span><b>{group.length}<small> records</small></b></button>;})}</div>
    <div className="plan-summary"><strong>{layer} / horizontal plan</strong><span>{occupied} occupied squares · {plotted.length} records</span></div>
    <div className="excavation survey-plan"><div className="grid-labels"><span/>{columns.map(n=><span key={n}>{n}</span>)}</div>{rows.map(row=><div className="grid-row" key={row}><span>{row}</span>{columns.map(n=>{const id=row+n;const found=plotted.filter(r=>r.grid===id);return <button key={id} aria-label={`Grid ${id}, ${found.length} findings`} aria-pressed={cell===id} className={'grid-cell '+(cell===id?'chosen':'')+(found.length?' occupied':'')} style={{'--density':Math.min(found.length,5)} as CSSProperties} onClick={()=>onCell(id)}><small>{id}</small>{found.length?<span className="plan-count">{found.length}<em>{found.length===1?'record':'records'}</em></span>:<span className="survey-cross" aria-hidden="true">+</span>}</button>;})}</div>)}</div>
    <div className="plan-legend"><span><i className="legend-empty"/> No records</span><span><i className="legend-filled"/> Recorded context</span><span><i className="legend-selected"/> Selected square</span></div>
    {selected.length!==plotted.length&&<p className="plan-help">{selected.length-plotted.length} records in this layer are outside the displayed A10–D14 grid. Find them in the archive.</p>}
    <details className="plan-key"><summary>How to read this plan</summary><p>Counts come from your field records; museum references are excluded. Depth ranges summarize entered values, not measured layer boundaries. Colour bands distinguish labels and do not identify soil, age or cultural period. Empty squares mean no records, not an excavated or archaeologically empty area. The diagram has no surveyed scale, orientation or precise find positions.</p></details>
  </section>;
}
