"""Generate matching editable, vector, raster and animated architecture assets."""
from pathlib import Path
import xml.etree.ElementTree as ET
import html, json, math, textwrap
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
BG="#f3f0e6"; INK="#283c32"; ACC="#aa5137"; PALE="#fcfaf4"
nodes=[]
for prefix,x in (("a",60),("b",1130)):
    specs=[
      ("ui",210,76,"Field notebook + FastAPI",["Notes / camera / upload / sourced packs"]),
      ("model",310,76,"Local MiniLM embeddings",["Text to 384 numbers; cached on device"]),
      ("edge",410,76,"Qdrant Edge",["Dense + lexical retrieval; hybrid ranking"]),
      ("journal",510,76,"SQLite journal",["Records / revisions / durable outbox"]),
      ("photo",610,76,"Local photo files",["Compressed JPEG / EXIF removed / dedup"]),
      ("policy",710,66,"Policy + resource controls",["Approval / privacy / storage / selection"])]
    for k,y,h,title,lines in specs:nodes.append(dict(id=prefix+k,x=x,y=y,w=410,h=h,title=title,lines=lines))
nodes += [
 dict(id="gateway",x=590,y=310,w=420,h=110,title="Version-aware exchange gateway",lines=["Manual or opt-in background exchange","Receipts / retries / conflicts / withdrawals"]),
 dict(id="server",x=590,y=465,w=420,h=92,title="Qdrant Server",lines=["Shared dense + sparse vectors","Approved record metadata"]),
 dict(id="blobs",x=590,y=610,w=420,h=92,title="Gateway journal + photo files",lines=["Revision history / separate attachments","64 KiB chunks / SHA-256 verification"])]
edges=[
 ("capture","aui","amodel",[(265,286),(265,310)]),
 ("embed","amodel","aedge",[(265,386),(265,410)]),
 ("remember","aedge","ajournal",[(265,486),(265,510)]),
 ("photo","aui","aphoto",[(60,248),(48,248),(48,648),(60,648)]),
 ("approval","ajournal","apolicy",[(470,548),(490,548),(490,743),(470,743)]),
 ("send","apolicy","gateway",[(470,743),(530,743),(530,365),(590,365)]),
 ("index","gateway","server",[(800,420),(800,465)]),
 ("attachments","gateway","blobs",[(1010,390),(1040,390),(1040,656),(1010,656)]),
 ("receive","gateway","bpolicy",[(1010,340),(1080,340),(1080,743),(1130,743)]),
 ("store","bpolicy","bjournal",[(1540,743),(1552,743),(1552,548),(1540,548)]),
 ("bindex","bjournal","bedge",[(1335,510),(1335,486)]),
 ("bembed","bmodel","bedge",[(1335,386),(1335,410)]),
 ("bquery","bui","bmodel",[(1335,286),(1335,310)])]
stages=[
 ("Capture","Record a find, or load a sourced reference.", "Photos are working copies. Reference notes remain distinct from field discoveries.",["aui","aphoto"],["photo"]),
 ("Remember","Build local semantic memory.", "Cached MiniLM embeds text; Qdrant Edge retrieves it. SQLite preserves records and versions.",["amodel","aedge","ajournal"],["capture","embed","remember"]),
 ("Retrieve","Keep working without internet.", "Semantic and lexical rankings combine in hybrid search. Photos are attachments, not image embeddings.",["aui","aedge"],["capture","embed"]),
 ("Decide","Share deliberately; carry only useful knowledge.", "Sensitive, unapproved and local-only records stay local. Storage and site/material selection bound memory.",["apolicy","ajournal"],["approval"]),
 ("Exchange","Transfer approved changes in bounded cycles.", "Background retry is opt-in. Durable receipts and resumable photo chunks handle interrupted connectivity.",["gateway","server","blobs","apolicy"],["send","index","attachments"]),
 ("Receive","Another field unit gains offline memory.", "Received records enter its own SQLite journal and Qdrant Edge. Photos need explicit sharing approval.",["bpolicy","bjournal","bedge","bui"],["receive","store","bindex"]),
 ("Reconcile","Preserve edits and review disagreements.", "Version conflicts require a decision. Withdrawal propagates; local edits survive. Audit history is not erased.",["ajournal","gateway","bjournal"],["send","receive"])]
zones=[(30,145,470,655,"FIELD UNIT A / LOCAL EDGE"),(560,145,480,655,"SHARED TEAM ARCHIVE"),(1100,145,470,655,"FIELD UNIT B / LOCAL EDGE")]

def svg():
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 850" role="img" aria-label="Two local field units exchange approved records through a gateway and Qdrant Server"><style>text{{font-family:Segoe UI,Arial,sans-serif;fill:{INK}}}.wire{{fill:none;stroke:#b4beae;stroke-width:3}}.node rect{{fill:{PALE};stroke:#b8c4b0;stroke-width:2}}.active rect{{fill:#e3ecd8;stroke:{ACC};stroke-width:4}}.wire.active{{stroke:{ACC};stroke-dasharray:9 6;animation:flow 1s linear infinite}}@keyframes flow{{to{{stroke-dashoffset:-30}}}}@media(prefers-reduced-motion:reduce){{.wire.active{{animation:none}}}}</style><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#85947b"/></marker></defs>',
    f'<rect width="1600" height="850" fill="{BG}"/><text x="40" y="55" font-size="36" font-weight="700">KhojSetu / memory that travels with the team</text><text x="40" y="94" font-size="21">Remember locally. Share selectively. Keep working when disconnected.</text>']
    for x,y,w,h,title in zones:
        out += [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="{"#eee3d5" if x==560 else "#e6ebdf"}" stroke="#c5cdbb"/>',f'<text x="{x+20}" y="{y+35}" font-size="18" font-weight="700">{title}</text>']
    out += ['<text x="590" y="235" font-size="21">Connection needed only for exchange</text><text x="590" y="267" font-size="17">Demo: gateway + server hosted locally</text>']
    for key,src,dst,pts in edges:
        out.append(f'<path id="e-{key}" class="wire" d="M'+' L'.join(f'{x} {y}' for x,y in pts)+'" marker-end="url(#arrow)"'+(' marker-start="url(#arrow)"' if key in ("send","receive","remember","bindex") else "")+'/>')
    for n in nodes:
        out.append(f'<g id="n-{n["id"]}" class="node"><rect x="{n["x"]}" y="{n["y"]}" width="{n["w"]}" height="{n["h"]}" rx="9"/><text x="{n["x"]+15}" y="{n["y"]+29}" font-size="22" font-weight="600">{html.escape(n["title"])}</text>')
        for i,line in enumerate(n["lines"]):out.append(f'<text x="{n["x"]+15}" y="{n["y"]+53+i*22}" font-size="16">{html.escape(line)}</text>')
        out.append('</g>')
    out.append('<text x="40" y="830" font-size="17">Two physical laptops require LAN setup and rehearsal. Each field unit runs its own local backend, model and Edge shard.</text></svg>')
    return "".join(out)

# All boxes and connectors remain editable in diagrams.net.
mx=ET.Element("mxfile",host="app.diagrams.net",type="device")
def page(name):
    diagram=ET.SubElement(mx,"diagram",name=name)
    model=ET.SubElement(diagram,"mxGraphModel",grid="1",gridSize="10",page="1",pageWidth="1600",pageHeight="1020",background=BG)
    root=ET.SubElement(model,"root")
    ET.SubElement(root,"mxCell",id="0");ET.SubElement(root,"mxCell",id="1",parent="0")
    return root
def box(root,key,value,x,y,w,h,fill=PALE,size=20):
    c=ET.SubElement(root,"mxCell",id=key,value=value,vertex="1",parent="1",style=f"rounded=1;whiteSpace=wrap;html=0;fillColor={fill};strokeColor=#bac5b0;fontColor={INK};fontSize={size};fontFamily=Helvetica;align=left;spacing=16;")
    ET.SubElement(c,"mxGeometry",x=str(x),y=str(y),width=str(w),height=str(h),attrib={"as":"geometry"})
root=page("01 Final architecture")
box(root,"title","KhojSetu / offline memory and selective exchange",30,25,1540,80,BG,30)
for i,(x,y,w,h,title) in enumerate(zones):
    box(root,"zone"+str(i),title,x,y,w,h,"#eee3d5" if i==1 else "#e6ebdf",18)
    root[-1].set("style",root[-1].get("style")+"verticalAlign=top;")
for n in nodes:box(root,n["id"],n["title"]+"\n"+"\n".join(n["lines"]),n["x"],n["y"],n["w"],n["h"],size=18)
for key,src,dst,pts in edges:
    c=ET.SubElement(root,"mxCell",id="e"+key,edge="1",parent="1",source=src,target=dst,style=f"edgeStyle=orthogonalEdgeStyle;rounded=1;endArrow=block;strokeColor={ACC};strokeWidth=2;flowAnimation=1;{"startArrow=block;startFill=1;" if key in ("send","receive","remember","bindex") else ""}")
    geo=ET.SubElement(c,"mxGeometry",relative="1",attrib={"as":"geometry"})
    arr=ET.SubElement(geo,"Array",attrib={"as":"points"})
    for x,y in pts[1:-1]:ET.SubElement(arr,"mxPoint",x=str(x),y=str(y))
box(root,"boundary","Local search needs no network. Exchange needs a reachable gateway. Current demo server: local Docker.\nPhotos are attachments, not image embeddings. Two-laptop LAN deployment still needs setup/rehearsal.",30,825,1540,125,BG,21)
root=page("02 Reliability and resource rules")
for i,(title,body) in enumerate([
 ("01 / PRIVATE BY DEFAULT","Approval, sensitivity, visibility and priority decide uploads. Photo sharing requires explicit approval."),
 ("02 / DURABLE EXCHANGE","SQLite outbox records an event before transmission. Receipts reconcile uncertain acknowledgements; newer edits remain pending."),
 ("03 / BOUNDED TRANSFERS","Up to 20 normal record uploads and 20 downloaded changes per cycle. Configurable body-byte budgets; photo chunks up to 64 KiB."),
 ("04 / RECOVER AND REVIEW","Version mismatch creates a reviewable conflict. Background retry backs off. Shared withdrawal is distinct from erasing audit history."),
 ("05 / SMALL LOCAL MEMORY","Selective site/material downloads, pin/remove/restore references, admission budgets and protected unused-photo cleanup."),
 ("06 / DATA AND LIMITS","40 synthetic seed records; optional 8 sourced museum references. Pack limit: 100 text records / 1 MiB. Model and index overhead still apply.")]):
    box(root,"rule"+str(i),title+"\n\n"+body,50+(i%2)*770,60+(i//2)*270,730,235,"#e6ebdf" if i%2==0 else "#eee3d5",23)
box(root,"limits","Not claimed: image recognition, generative archaeological expertise, native phone execution, public cloud deployment or production multi-team access.",50,875,1500,95,BG,22)
ET.indent(mx)
ET.ElementTree(mx).write(ROOT/"public/khojsetu-flow.drawio",encoding="utf-8",xml_declaration=True)

# Raster exports use the same layout as the vector source.
def font(size,bold=False):
    path=Path("C:/Windows/Fonts")/("segoeuib.ttf" if bold else "segoeui.ttf")
    return ImageFont.truetype(str(path),size) if path.exists() else ImageFont.load_default(size=size)
def frame(stage,tick):
    im=Image.new("RGB",(1600,1020),BG);d=ImageDraw.Draw(im)
    d.text((40,18),"KhojSetu / memory that travels with the team",font=font(35,True),fill=INK)
    d.text((40,73),"Remember locally. Share selectively. Keep working when disconnected.",font=font(22),fill=INK)
    for x,y,w,h,title in zones:
        d.rounded_rectangle((x,y,x+w,y+h),16,fill="#eee3d5" if x==560 else "#e6ebdf")
        d.text((x+20,y+16),title,font=font(18,True),fill=INK)
    d.text((590,215),"Connection needed only for exchange",font=font(21),fill=INK)
    d.text((590,247),"Demo: gateway + server hosted locally",font=font(17),fill=INK)
    for key,src,dst,pts in edges:
        active=key in stages[stage][4];color=ACC if active else "#b4beae"
        d.line(pts,fill=color,width=4 if active else 2)
        x,y=pts[-1];px,py=pts[-2];angle=math.atan2(y-py,x-px)
        d.polygon([(x,y),(x-12*math.cos(angle)+5*math.sin(angle),y-12*math.sin(angle)-5*math.cos(angle)),(x-12*math.cos(angle)-5*math.sin(angle),y-12*math.sin(angle)+5*math.cos(angle))],fill=color)
        if key in ("send","receive","remember","bindex"):
            sx,sy=pts[0];nx,ny=pts[1];theta=math.atan2(sy-ny,sx-nx)
            d.polygon([(sx,sy),(sx-12*math.cos(theta)+5*math.sin(theta),sy-12*math.sin(theta)-5*math.cos(theta)),(sx-12*math.cos(theta)-5*math.sin(theta),sy-12*math.sin(theta)+5*math.cos(theta))],fill=color)
        if active:
            lengths=[math.dist(a,b) for a,b in zip(pts,pts[1:])];pos=sum(lengths)*(tick+1)/5
            for a,b,length in zip(pts,pts[1:],lengths):
                if pos<=length:
                    t=pos/length;x=a[0]+(b[0]-a[0])*t;y=a[1]+(b[1]-a[1])*t
                    d.ellipse((x-6,y-6,x+6,y+6),fill=ACC);break
                pos-=length
    for n in nodes:
        active=n["id"] in stages[stage][3];x=n["x"];y=n["y"]
        d.rounded_rectangle((x,y,x+n["w"],y+n["h"]),9,fill="#e3ecd8" if active else PALE,outline=ACC if active else "#b8c4b0",width=3 if active else 1)
        d.text((x+15,y+8),n["title"],font=font(22,True),fill=INK)
        for i,line in enumerate(n["lines"]):d.text((x+15,y+39+i*22),line,font=font(16),fill=INK)
    d.text((40,812),"Two physical laptops require LAN setup/rehearsal; each unit has its own local backend, model and Edge shard.",font=font(18),fill=INK)
    d.rounded_rectangle((30,857,1570,978),12,fill="#293d32")
    d.text((55,872),f"{stage+1:02} / "+stages[stage][1],font=font(26,True),fill="#fff9e9")
    for i,line in enumerate(textwrap.wrap(stages[stage][2],125)):
        d.text((55,914+i*24),line,font=font(20),fill="#d7e3ca")
    d.text((40,991),"CONCEPTUAL WORKFLOW / NOT LIVE DATABASE ACTIVITY",font=font(14),fill=INK)
    return im
frames=[frame(s,t) for s in range(len(stages)) for t in range(4)]
(ROOT/"docs/media").mkdir(exist_ok=True)
frame(4,2).save(ROOT/"docs/media/khojsetu-flow.png")
frames[0].save(ROOT/"docs/media/khojsetu-flow.gif",save_all=True,append_images=frames[1:],duration=750,loop=0,optimize=True)
vector=svg()
(ROOT/"docs/media/khojsetu-flow.svg").write_text(vector,encoding="utf-8")
stage_json=json.dumps(stages)
page_html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KhojSetu / Final architecture</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3f0e6;color:#283c32;font:16px/1.5 system-ui,sans-serif}header,main{max-width:1600px;margin:auto;padding:24px}header{display:flex;justify-content:space-between;gap:20px}header b{font:30px Georgia,serif}a{color:inherit}svg{width:100%;height:auto;display:block}.diagram{overflow:auto;border:1px solid #c4ccba;border-radius:12px}svg{min-width:950px}.bar,.controls{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}button{font:inherit;padding:9px 16px;border:1px solid #acbba1;border-radius:6px;background:#fcfaf4;color:#283c32;cursor:pointer}button[aria-current=true]{background:#293d32;color:#fff}section.story{background:#293d32;color:#fff9e9;border-radius:12px;padding:24px}h1{font:36px Georgia,serif;margin:0}h2{margin:0}#words{max-width:1100px}small{display:block;margin:16px 0}button:focus-visible,a:focus-visible{outline:3px solid #aa5137;outline-offset:3px}@media print{.controls,.bar{display:none}svg{min-width:0}}
</style><header><div><b>KhojSetu</b><div>Discover. Remember. Connect.</div></div><a href="/">Open working application</a></header><main><h1>Two field units. One considered memory.</h1><p>Local capture and retrieval, explicit sharing, and recoverable exchange.</p><div class="diagram">'''+vector+'''</div><div class="bar" aria-label="Story stages"></div><section class="story" aria-live="polite"><h2 id="heading"></h2><p id="words"></p></section><div class="controls"><button id="back">Previous</button><button id="play">Play story</button><button id="next">Next</button><a href="khojsetu-flow.drawio" download>Editable draw.io</a></div><small>Conceptual animation, not live database activity. Network arrows show exchange in both directions across cycles.</small><details><summary>What is implemented / what this diagram does not claim</summary><p>Real local MiniLM embeddings, Qdrant Edge dense/sparse retrieval, SQLite recovery journals, storage admission budgets, selective downloads, camera/upload, approved resumable photo exchange, retries, conflict review and withdrawal. Reference packs contain text; museum references are distinct from synthetic seed data.</p><p>Current shared server: local Docker. Two physical laptops need LAN configuration and rehearsal. No image embeddings, generative archaeological conclusions, native phone execution or production multi-team deployment are claimed. Withdrawal does not erase server audit history or exported copies.</p></details></main><script>
const stages='''+stage_json+''';let current=0,timer=null;const bar=document.querySelector('.bar');
function show(i){current=(i+stages.length)%stages.length;const s=stages[current];document.getElementById('heading').textContent=(current+1)+' / '+s[1];document.getElementById('words').textContent=s[2];document.querySelectorAll('.active').forEach(n=>n.classList.remove('active'));s[3].forEach(id=>document.getElementById('n-'+id).classList.add('active'));s[4].forEach(id=>document.getElementById('e-'+id).classList.add('active'));[...bar.children].forEach((b,j)=>b.setAttribute('aria-current',String(j===current)));}
function pause(){clearInterval(timer);timer=null;document.getElementById('play').textContent='Play story';}
stages.forEach((s,i)=>{const b=document.createElement('button');b.textContent=(i+1)+' '+s[0];b.onclick=()=>{pause();show(i)};bar.appendChild(b)});
document.getElementById('back').onclick=()=>{pause();show(current-1)};document.getElementById('next').onclick=()=>{pause();show(current+1)};document.getElementById('play').onclick=()=>{if(timer){pause();return}document.getElementById('play').textContent='Pause';timer=setInterval(()=>{if(current===stages.length-1){pause();return}show(current+1)},6500)};
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){pause();show(current+(e.key==='ArrowRight'?1:-1))}});show(0);
</script></html>'''
(ROOT/"public/pitch.html").write_text(page_html,encoding="utf-8")
print("Generated draw.io (2 editable pages), SVG, PNG, 28-frame GIF and standalone interactive HTML.")
