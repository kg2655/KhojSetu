"""Export an editable, uncompressed draw.io diagram. No external dependencies."""
from pathlib import Path
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
mx = ET.Element('mxfile', host='app.diagrams.net', type='device')

def page(name):
    diagram = ET.SubElement(mx, 'diagram', name=name, id=name.replace(' ', '-'))
    model = ET.SubElement(diagram, 'mxGraphModel', dx='1500', dy='850', grid='1', gridSize='10',
                         page='1', pageScale='1', pageWidth='1500', pageHeight='850', background='#F4F1E7')
    tree = ET.SubElement(model, 'root')
    ET.SubElement(tree, 'mxCell', id='0')
    ET.SubElement(tree, 'mxCell', id='1', parent='0')
    return tree

def box(tree, key, value, x,y,w,h, fill='#FAF8F0', stroke='#C8CDB8', size=18, extra=''):
    cell=ET.SubElement(tree,'mxCell',id=key,value=value,vertex='1',parent='1',
        style=f'rounded=1;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};fontColor=#34412E;fontFamily=Helvetica;fontSize={size};spacing=15;arcSize=10;{extra}')
    ET.SubElement(cell,'mxGeometry',x=str(x),y=str(y),width=str(w),height=str(h),attrib={'as':'geometry'})

def text(tree,key,value,x,y,w,h,size=20,color='#34412E'):
    box(tree,key,value,x,y,w,h,'none','none',size,f'align=left;verticalAlign=middle;fontColor={color};')

def edge(tree,key,source,target,label='',color='#708353',extra=''):
    cell=ET.SubElement(tree,'mxCell',id=key,value=label,edge='1',parent='1',source=source,target=target,
        style=f'edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;endFill=1;strokeColor={color};strokeWidth=2;fontSize=13;fontColor=#6E755E;labelBackgroundColor=#F4F1E7;{extra}')
    ET.SubElement(cell,'mxGeometry',relative='1',attrib={'as':'geometry'})

t=page('01 Memory and exchange')
text(t,'brand','<b>KHOJSETU</b>  /  DISCOVER. REMEMBER. CONNECT.',40,25,1350,45,24)
text(t,'title','From a field discovery to shared archaeological memory',40,78,1390,60,36)
box(t,'zone','',40,170,970,540,'#EBEEDF','#BFCBAC',18,'dashed=1;')
box(t,'cloudzone','',1040,170,420,540,'#F0E5D6','#D2BCA0',18,'dashed=1;')
text(t,'device','FIELD LAPTOP  ·  recording and retrieval work offline',65,181,900,50,18)
text(t,'shared','SHARED TEAM KNOWLEDGE',1060,181,360,50,17)
box(t,'record','<b>1. RECORD</b><br><br>Field notebook<br><font style="font-size:14px">Notes · grid · layer · depth</font>',75,270,250,140)
box(t,'model','<b>2. EMBED LOCALLY</b><br><br>MiniLM text model<br><font style="font-size:14px">Text → 384 numbers</font>',375,270,250,140)
box(t,'edge','<b>3. SEARCH & REMEMBER</b><br><br>Qdrant Edge<br><font style="font-size:14px">Dense + lexical vectors<br>Metadata filters</font>',675,270,295,140,'#DFE8D1','#91A779')
edge(t,'e1','record','model','description')
edge(t,'e2','model','edge','vectors + context')
box(t,'journal','<b>SQLite record journal</b><br>Records · versions · queue · activity',75,535,250,115,'#E0E6D4')
box(t,'private','<b>RETAIN LOCALLY</b><br>Sensitive · unapproved<br>Explicitly local records',375,535,250,115,'#F1DECF','#D0A283')
box(t,'policy','<b>4. SHARING POLICY</b><br>Approval · sensitivity<br>Visibility · priority',675,535,295,115)
edge(t,'e3','record','journal','save')
edge(t,'e4','edge','policy','pending changes')
edge(t,'e5','policy','private','not eligible','#A56444')
box(t,'gateway','<b>5. EXCHANGE GATEWAY</b><br>Version checks · retry IDs<br>Human conflict review',1080,270,340,140)
box(t,'server','<b>QDRANT SERVER</b><br>Shared vector knowledge<br><font style="font-size:14px">Local Docker in this demo</font>',1080,535,340,115,'#EAD1BA','#B28158')
edge(t,'e6','policy','gateway','approved changes','#A56444','exitX=1;exitY=0.5;entryX=0;entryY=0.7;')
edge(t,'e7','gateway','server','real upserts + acknowledgements','#A56444')
edge(t,'e8','gateway','edge','shared updates → local index','#A56444','exitX=0;exitY=0.2;entryX=1;entryY=0.2;')
text(t,'caption','Search example: “decorated pottery” → related “painted ceramic fragment” records',60,435,900,50,18)
text(t,'honesty','40 synthetic demo records  •  Real local embeddings and Qdrant engines  •  Manual exchange  •  No generative archaeological claims',45,744,1420,60,16)

t=page('02 Why archaeology and impact')
text(t,'title','Why archaeology? Context turns a find into evidence.',40,35,1400,80,36)
text(t,'subtitle','Our chosen use case for Qdrant’s general edge-memory challenge',45,110,1380,50,20)
columns=[('problem','FIELD NEED','#E8E6D5'),('response','KHOJSETU RESPONSE','#E0E8D4'),('impact','PROPOSED VALUE','#F0E2CF')]
for i,(key,title,fill) in enumerate(columns):
    box(t,key,title,50+i*485,190,430,60,fill,size=21,extra='fontStyle=1;')
rows=[('Connectivity can be intermittent','Local model + Qdrant Edge','Continue recording and searching'),
      ('Related finds use different words','Semantic retrieval + layer filters','Locate relevant observations sooner'),
      ('Some records need restricted sharing','Approval and privacy policy','Control what leaves the field unit'),
      ('Team interpretations change','Version checks + conflict review','Preserve competing observations')]
for r,row in enumerate(rows):
    for c,value in enumerate(row):
        box(t,f'cell{r}{c}',value,50+c*485,275+r*105,430,80,size=19)
text(t,'business','Potential buyers: excavation programmes, research institutions and archaeological consultancies.',45,718,1400,45,18)
text(t,'validation','Next step: practitioner pilot. Measure retrieval time, offline task success and exchange integrity. No adoption or ROI claims yet.',45,769,1400,50,17)

ET.indent(mx)
target=root/'public/khojsetu-flow.drawio'
target.parent.mkdir(exist_ok=True)
ET.ElementTree(mx).write(target,encoding='utf-8',xml_declaration=True)
ET.parse(target)
print(f'Created {target}: 2 editable pages')
