"""Produce append-only 701..720 models and voxel-derived SVG portraits."""
import json, math
from pathlib import Path

root=Path(__file__).resolve().parents[1]
source=(root/'src/secret-dragon-catalog.ts').read_text(encoding='utf-8')
rows=json.JSONDecoder().raw_decode(source[source.index('[',source.index('export const')):])[0]
for stage in range(1,21):
    original=300+next(i for i,p in enumerate(rows) if p['stageId']==stage)
    model=json.loads((root/f'public/models/pet-{original}.json').read_text(encoding='utf-8'))
    colors=model['colors']; colors.extend(['#fff4bf','#a8f2ff'])
    gold,light=len(colors)-1,len(colors)
    px,_,pz=model['pivot']; top=max(v[1] for v in model['voxels'])
    crest={}
    for j in range(40):
        a=j*math.pi/20; radius=7+(stage%3)
        x,z=round(px+math.cos(a)*radius),round(pz+math.sin(a)*radius)
        for dx in [0,1]:
            for dy in [0,1]: crest[(x+dx,top+2+dy,z)]=gold
    for arm in [-1,1]:
        for j in range(5):
            x=round(px+arm*(4+j*2)); y=top-5+j
            for dx in range(2):
                for dy in range(4):
                    for dz in range(3):crest[(x+dx,y+dy,round(pz)+dz)]=light if j%2 else gold
    extra=[[*xyz,c] for xyz,c in crest.items()]
    model['parts']['stellar_crest']={'pivot':model['pivot'],'parent':None,'voxels':extra}
    model['voxels']+=extra
    model['artMaterial']='polished'
    model['size']=[max(model['size'][i],max(v[i] for v in model['voxels'])+1) for i in range(3)]
    target=701+stage-1
    (root/f'public/models/pet-{target}.json').write_text(json.dumps(model,separators=(',',':')),encoding='utf-8')
    occupied={tuple(v[:3]) for v in model['voxels']}; faces=[]
    for x,y,z,c in sorted(model['voxels'],key=lambda v:(v[0]+v[2],v[1])):
        if all((x+dx,y+dy,z+dz) in occupied for dx,dy,dz in [(1,0,0),(0,1,0),(0,0,1)]):continue
        sx=(x-z)*2;sy=(x+z)-y*2.5
        faces.append((sx,sy,colors[c-1]))
    lo=min(x for x,y,c in faces)-3;hi=max(x for x,y,c in faces)+5
    top=min(y for x,y,c in faces)-3;bottom=max(y for x,y,c in faces)+5
    shapes=''.join(f'<path fill="{c}" d="M{x},{y}l2,-1 2,1 0,3 -2,1 -2,-1Z"/>' for x,y,c in faces)
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{lo} {top} {hi-lo} {bottom-top}" shape-rendering="crispEdges">{shapes}</svg>'
    (root/f'public/models/pet-{target}.svg').write_text(svg,encoding='utf-8')
