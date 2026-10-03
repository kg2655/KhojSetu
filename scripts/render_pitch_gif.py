"""Render a small conceptual workflow animation for the GitHub README."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = Path('C:/Windows/Fonts/segoeui.ttf')
SERIF = Path('C:/Windows/Fonts/georgia.ttf')


def font(size, serif=False):
    path = SERIF if serif else FONT
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default(size=size)


stages = [
    ('Record a discovery', 'Notes, grid and excavation layer become a field record.'),
    ('Represent its meaning locally', 'MiniLM turns field text into a 384-dimensional embedding.'),
    ('Retrieve without internet', 'Qdrant Edge finds related observations with semantic and lexical search.'),
    ('Decide what can be shared', 'Approval, sensitivity, visibility and priority control the exchange queue.'),
    ('Exchange approved knowledge', 'A version-aware gateway writes actual vectors to Qdrant Server.'),
    ('Review changes together', 'Shared updates return to local memory; competing edits need human review.')
]
nodes = [(45,180,285,330,'Field notebook','Observation + context'),
         (350,180,590,330,'Local MiniLM','Text embeddings'),
         (655,180,895,330,'Qdrant Edge','Offline vector memory'),
         (655,425,895,555,'Sharing policy','Approve / retain / defer'),
         (960,180,1200,330,'Qdrant Server','Shared vector memory'),
         (960,425,1200,555,'Team changes','Version + conflict review')]
paths = [[(285,255),(350,255)],[(590,255),(655,255)],
         [(775,330),(775,375),(165,375),(165,330)],
         [(775,330),(775,425)],[(895,490),(925,490),(925,255),(960,255)],
         [(1080,330),(1080,425)]]
frames = []
for stage in range(6):
    for tick in range(4):
        im = Image.new('RGB',(1250,760),'#f3f0e6')
        d = ImageDraw.Draw(im)
        d.rectangle((0,0,1250,110),fill='#2b3c30')
        d.text((40,20),'KhojSetu',font=font(36,True),fill='#f6f0de')
        d.text((40,70),'DISCOVER. REMEMBER. CONNECT.  /  CONCEPTUAL WORKFLOW',font=font(14),fill='#bdccb0')
        d.text((48,135),'ON THE FIELD LAPTOP',font=font(14),fill='#5c704d')
        d.text((962,135),'SHARED ARCHIVE',font=font(14),fill='#a3653f')
        for j,path in enumerate(paths):
            color = '#a45734' if j==stage else '#b9c2aa'
            d.line(path,fill=color,width=4 if j==stage else 2)
            x,y=path[-1];px,py=path[-2]
            polygon=[(x,y),(x-10,y-5),(x-10,y+5)] if x>px else ([(x,y),(x-5,y-10),(x+5,y-10)] if y>py else [(x,y),(x-5,y+10),(x+5,y+10)])
            d.polygon(polygon,fill=color)
            if j==stage:
                a,b=path[0],path[1];t=(tick+1)/5
                x,y=a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t
                d.ellipse((x-5,y-5,x+5,y+5),fill=color)
        for j,(x,y,x2,y2,title,sub) in enumerate(nodes):
            fill = ('#e0e9d1' if j<4 else '#efd9c1') if j==stage else '#fcfaf2'
            d.rounded_rectangle((x,y,x2,y2),radius=9,fill=fill,outline='#728b58' if j==stage else '#ccd0bc',width=3 if j==stage else 1)
            d.text((x+18,y+17),f'0{j+1}',font=font(15),fill='#8c967c')
            d.text((x+18,y+51),title,font=font(25,True),fill='#35452b')
            d.text((x+18,y+93),sub,font=font(16),fill='#7e826e')
        d.rounded_rectangle((45,425,590,555),radius=9,fill='#e6e9dc',outline='#ccd0bc')
        d.text((66,445),'SQLite keeps records, versions and queue state.',font=font(20),fill='#5b6b48')
        d.text((66,485),'Sensitive / unapproved records remain local.',font=font(19),fill='#946b49')
        d.text((66,520),'Shared Server runs in local Docker for this demo.',font=font(15),fill='#81846e')
        d.rounded_rectangle((40,595,1210,720),radius=9,fill='#dfe6d1')
        d.text((64,614),f'0{stage+1}  {stages[stage][0]}',font=font(30,True),fill='#3a4d2e')
        d.text((65,664),stages[stage][1],font=font(20),fill='#61734d')
        d.text((43,732),'Synthetic sample records | Real Qdrant engines | Manual exchange | No generative archaeological claims',font=font(13),fill='#868972')
        frames.append(im)
out = ROOT/'docs/media'
out.mkdir(parents=True,exist_ok=True)
frames[0].save(out/'khojsetu-flow.png')
frames[0].save(out/'khojsetu-flow.gif',save_all=True,append_images=frames[1:],duration=600,loop=0,optimize=True)
print(f'Created {out / "khojsetu-flow.gif"}')
