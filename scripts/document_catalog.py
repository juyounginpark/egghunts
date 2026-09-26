"""Parse the user's complete art brief; stable array positions remain runtime IDs."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/art/voxel-art-rework-220-characters.md'
# Correct bijection: old6..19 shift one position; old5 becomes void19.
OLD_TO_NEW=[0,1,2,3,4,19,*range(5,19),20]
def load(path):
 s=(ROOT/path).read_text(encoding='utf8');return json.loads(s[s.index('['):s.rindex(']')+1])
def document():
 text=SOURCE.read_text(encoding='utf8');out=[]
 meadow=text.split('## 6. 몽글 초원')[1].split('## 7.')[0]
 for line in meadow.splitlines():
  if not line.startswith('| ') or '캐릭터 |' in line or line.startswith('| ---'):continue
  fields=[v.strip() for v in line.strip('|').split('|')]
  if len(fields)==3:out.append(dict(stage=1,slot=len(out),name=fields[0].removeprefix('SECRET '),prompt=' '.join(fields[1:])))
 for m in re.finditer(r'^### (\d{2})-(\d{2})\. (.+)\n([^#]+)',text,re.M):
  out.append(dict(stage=int(m[1]),slot=int(m[2])-1,name=m[3].removeprefix('SECRET '),prompt=m[4].strip()))
 assert len(out)==220 and len({r['name'] for r in out})==220
 return out
def main():
 specs={(r['stage'],r['slot']):r for r in document()};mapping=[]
 previous_path=ROOT/'docs/art/document-id-map.json';previous={r['id']:r['previousName'] for r in json.loads(previous_path.read_text(encoding='utf8'))} if previous_path.exists() else {}
 stage_names={int(m[1]):m[2] for m in re.finditer(r'^## (\d{2})\. (.+)$',SOURCE.read_text(encoding='utf8'),re.M)};stage_names[1]='몽글 초원'
 for file,var,base in [('src/stage-pet-catalog.ts','STAGE_PET_ROWS',100),('src/secret-dragon-catalog.ts','SECRET_DRAGON_ROWS',300)]:
  rows=load(file)
  for i,row in enumerate(rows):
   old=(i//10+1) if base==100 else i+1;stage=OLD_TO_NEW[old];slot=i%10 if base==100 else 10;spec=specs[stage,slot]
   aliases=row.pop('aliases',[previous.get(base+i,row['name'])]);row.pop('description',None);row.update(name=spec['name'],stageId=stage)
   if base==300:row['eggName']=spec['name']+'의 봉인'
   mapping.append(dict(id=base+i,oldStage=old,stage=stage,slot=slot,previousName=aliases[0],name=spec['name'],tier=row['tier'],prompt=spec['prompt']))
  (ROOT/file).write_text('// Array index is the permanent save ID. Never sort by stage.\nexport const '+var+' = '+json.dumps(rows,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
 (ROOT/'docs/art/document-id-map.json').write_text(json.dumps(mapping,ensure_ascii=False,indent=2),encoding='utf8')
 lines=['# 문서 디자인 번호 / 영구 ID 대응','', '| ID | 이전 단계 | 새 단계 | 슬롯 | 이전 표시 이름 | 새 표시 이름 |','|---|---|---|---|---|---|']
 lines += [f"|{r['id']}|{r['oldStage']}|{r['stage']}|{r['slot']+1}|{r['previousName']}|{r['name']}|" for r in mapping]
 (ROOT/'docs/art/document-id-map.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
if __name__=='__main__':main()
