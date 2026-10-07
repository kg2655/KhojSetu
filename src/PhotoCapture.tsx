import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

export type Photo = {photoHash:string|null; photoBytes:number; imageUrl:string|null};
const bytes = (n:number) => (n/1024).toFixed(0)+' KiB';

export function PhotoCapture({value,onChange,onBusy}:{value:Photo;onChange:(photo:Photo)=>void;onBusy:(busy:boolean)=>void}){
  const video=useRef<HTMLVideoElement>(null);
  const stream=useRef<MediaStream|null>(null);
  const mounted=useRef(true);
  const [camera,setCamera]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState('');
  const [info,setInfo]=useState('');
  function stop(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCamera(false);}
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;stream.current?.getTracks().forEach(t=>t.stop());};},[]);
  useEffect(()=>{if(camera&&video.current)video.current.srcObject=stream.current;},[camera]);
  async function upload(file:Blob){
    setError('');setBusy(true);onBusy(true);
    try{
      if(file.size>10*1024*1024)throw new Error('Choose a photo below 10 MiB.');
      const response=await fetch('/api/photos',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream'},body:file});
      const data=await response.json();
      if(!response.ok)throw new Error(data.detail||'Photo could not be saved.');
      if(mounted.current){onChange(data);setInfo(bytes(data.originalBytes)+' input → '+bytes(data.photoBytes)+' working copy · '+data.width+' × '+data.height);}
    }catch(e){if(mounted.current)setError((e as Error).message);}
    finally{if(mounted.current){setBusy(false);onBusy(false);}}
  }
  async function start(){
    setError('');
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera needs localhost or HTTPS. You can upload a photo instead.');
      const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1600}},audio:false});
      if(!mounted.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;setCamera(true);
    }catch(e){setError('Camera unavailable or permission declined. Upload a photo, or allow camera access. '+(e as Error).message);}
  }
  async function capture(){
    if(!video.current?.videoWidth)return;
    const canvas=document.createElement('canvas');
    const scale=Math.min(1,1600/video.current.videoWidth);
    canvas.width=Math.round(video.current.videoWidth*scale);canvas.height=Math.round(video.current.videoHeight*scale);
    canvas.getContext('2d')!.drawImage(video.current,0,0,canvas.width,canvas.height);
    canvas.toBlob(blob=>{stop();if(blob)void upload(blob);},'image/jpeg',0.9);
  }
  return <section className="photo-capture">
    <span className="eyebrow">FIELD PHOTOGRAPH</span>
    <p>Attach a real photograph. A compressed working copy stays on this device; your original file is unchanged.</p>
    {value.imageUrl&&<img className="photo-preview" src={value.imageUrl} alt="Attached field photograph"/>}
    {camera&&<div className="camera-view"><video ref={video} autoPlay playsInline muted aria-label="Camera preview"/><div className="button-row"><button type="button" className="primary" onClick={capture}>Capture photograph</button><button type="button" className="secondary" onClick={stop}>Close camera</button></div></div>}
    <div className="button-row">
      <button type="button" className="secondary" disabled={busy||camera} onClick={start}><Camera size={16}/> Use camera</button>
      <label className="secondary upload-photo"><Upload size={16}/> {busy?'Compressing & saving…':'Upload photo'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);e.target.value='';}}/></label>
      {value.photoHash&&<button type="button" className="secondary" disabled={busy} onClick={()=>{onChange({photoHash:null,photoBytes:0,imageUrl:null});setInfo('');}}><X size={14}/> Remove from record</button>}
    </div>
    {info&&<p role="status">{info}</p>}
    {error&&<p className="photo-error" role="alert">{error}</p>}
    <small>JPEG working copy, up to 1600 px. Location/EXIF metadata is removed. Keep original research images separately. Search uses written notes, not photo contents.</small>
  </section>;
}
