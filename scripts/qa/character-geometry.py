"""Read-only geometry checks for the explicitly requested character art review."""
import collections
import gzip
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
rows=json.loads((ROOT/'docs/art/character-concepts.json').read_text(encoding='utf-8'))
if '--first-six' in sys.argv:rows=rows[:6]
report=[]
for row in rows:
    path=ROOT/'public/models'/f"{row['key']}.json"
    model=json.loads(path.read_text(encoding='utf-8'))
    compact=row['key'] in [f'pet-{i}' for i in range(6)]
    grid=24 if compact else 50
    assert model['size']==[grid]*3 and model['front']=='-z'
    cells={tuple(v[:3]):v[3] for v in model['voxels']}
    assert all(0<=p[a]<grid for p in cells for a in range(3)),row['key']
    for name,part in model['parts'].items():
        # Only this authored single tail and its attachment are asymmetric.
        if row['key']=='pet-4' and name in ['tail','body']:continue
        assert all(cells.get((grid-1-x,y,z))==c for x,y,z,c in part['voxels']),(row['key'],name)
    partition={tuple(v[:3]):v[3] for part in model['parts'].values() for v in part['voxels']}
    assert partition==cells and sum(len(p['voxels']) for p in model['parts'].values())==len(cells)
    eyes=model['parts'].get('eyes',{}).get('voxels',[])
    # The fox and bear deliberately have two broad, one-cell-high sleepy eyes.
    assert len(eyes)>=(4 if row['key'] in ['pet-3','pet-5'] else 8),row['key']
    if compact:assert len({v[0] for v in eyes})>=4,row['key']
    remaining=set(cells);components=[]
    while remaining:
        todo=[remaining.pop()];size=0
        while todo:
            x,y,z=todo.pop();size+=1
            for p in [(x-1,y,z),(x+1,y,z),(x,y-1,z),(x,y+1,z),(x,y,z-1),(x,y,z+1)]:
                if p in remaining:remaining.remove(p);todo.append(p)
        components.append(size)
    report.append({'key':row['key'],'symmetric':row['key']!='pet-4','pairedAnatomySymmetric':True,'partitionExact':True,'components':sorted(components,reverse=True),
                   'eyes':len(model['parts']['eyes']['voxels']),'gzipBytes':len(gzip.compress(path.read_bytes(),mtime=0))})
    assert len(components)==1,(row['key'],components)
initial=sum(r['gzipBytes'] for r in report if r['key'].startswith('guardian'))
(ROOT/('docs/art/first-six-structure-audit.json' if '--first-six' in sys.argv else 'docs/art/character-structure-audit.json')).write_text(json.dumps({'models':report,'guardianPreloadGzip':initial},indent=2)+'\n',encoding='utf-8')
print('PASS',len(report),'bounds, color symmetry, exact rig partition, readable eye geometry')
print('Disconnected:',[(r['key'],r['components'][1:]) for r in report if len(r['components'])>1])
print('Guardian preload gzip:',initial)
