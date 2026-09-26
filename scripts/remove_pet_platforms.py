"""Apply the explicit no-platform art revision without regenerating old pets."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD={'rocking','boat','skateboard','sandals','wheels'}
NEW={'lily','carousel','hotspa','hoverboard','sandring','cloudcushion','skates','skis','sled'}
def main():
 changed=[];manifestpath=ROOT/'public/models/manifest.json';manifest=json.loads(manifestpath.read_text())
 for id in range(701):
  path=ROOT/f'public/models/pet-{id}.json';model=json.loads(path.read_text())
  motion=model.get('artMotion');old=id<321 and motion in OLD;new=id>=321 and motion in NEW
  if not(old or new):continue
  if model.get('platformRemoved'):continue
  part=model['parts']['body' if old else 'prop']
  removed={tuple(v[:3]) for v in part['voxels'] if not old or (2<=v[0]<=21 and 1<=v[1]<=2 and 5<=v[2]<=20)}
  part['voxels']=[v for v in part['voxels'] if tuple(v[:3]) not in removed]
  # Platforms were stamped over the feet. Reconnect only the same foot columns.
  for name,p in model['parts'].items():
   if 'leg' not in name:continue
   for v in list(p['voxels']):
    if v[1]!=3:continue
    for y in [1,2]:
     if (v[0],y,v[2]) in removed:p['voxels'].append([v[0],y,v[2],v[3]])
  model['voxels']=sorted([v for p in model['parts'].values() for v in p['voxels']])
  model['pivot'][1]=min(v[1] for v in model['voxels'])-.5
  model['platformRemoved']=True
  path.write_text(json.dumps(model,separators=(',',':')),encoding='utf8')
  designpath=ROOT/f'public/models/pet-{id}.design.json'
  if designpath.exists():
   design=json.loads(designpath.read_text(encoding='utf8'));design['userRevision']='2026-09-27: remove ground platform; preserve body, ID and stats'
   designpath.write_text(json.dumps(design,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  entry=next(r for r in manifest['models'] if r['name']==f'pet-{id}')
  entry['voxelCount']=len(model['voxels']);entry['bounds']=[[min(v[a] for v in model['voxels']),max(v[a] for v in model['voxels'])] for a in range(3)]
  changed.append(id)
 manifestpath.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
 print('Removed platforms:',','.join(map(str,changed)))
if __name__=='__main__':main()
