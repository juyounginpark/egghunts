"""Resolve the user's 760 art references against permanent, existing IDs."""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def source_rows():
 text=(ROOT/'src/stage-pet-catalog.ts').read_text(encoding='utf8')
 return json.loads(text[text.index('['):text.rindex(']')+1])

def references():
 source=source_rows();result={}
 text=(ROOT/'docs/art/expansion-style-prompt.md').read_text(encoding='utf8')
 for line in text.splitlines():
  match=re.match(r'\| (\d\d)-N(\d\d) \|',line)
  if not match:continue
  stage,index=map(int,match.groups());refs=re.findall(r'R(\d\d)-(\d\d)',line)
  assert len(refs)==2,(stage,index,refs)
  pair=[]
  for s,slot in refs:
   assert int(s)==stage
   matches=[(100+i,p) for i,p in enumerate(source) if p['stageId']==stage and p['slot']==int(slot)-1]
   assert len(matches)==1,(stage,slot)
   id,p=matches[0];path=f'public/models/pet-{id}.json';model=json.loads((ROOT/path).read_text())
   eye=model['parts'].get('eyes',{}).get('voxels',[])
   eye_y=sorted({v[1] for v in eye})
   pair.append({'reference':f'R{s}-{slot}','id':id,'name':p['name'],'path':path,'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),'unit':model.get('unit',model['size'][1]*.9),'eyeHeightVoxels':max(eye_y)-min(eye_y)+1 if eye_y else None,'parts':len(model['parts']),'material':model.get('artMaterial','matte')})
  result[321+(stage-1)*19+index-1]={'form':pair[0],'material':pair[1]}
 assert len(result)==380
 return result

def main():
 refs=references()
 (ROOT/'docs/art/expansion-style-references.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 unique={r['reference']:r for pair in refs.values() for r in pair.values()}
 lines=['# 공식 아트 레퍼런스 색인','',
 '사용자가 지정한 [공식 스타일](STYLE_GUIDE.md) → 같은 스테이지 기준 → [신규별 760개 연결](expansion-style-references.json) → [개별 제작 지시](expansion-style-prompt.md) 순서로 읽는다. R 번호는 문서 번호이며 아래 실제 ID로 변환한다.','',
 '## 자료와 역할','',
 '| 상태 | 실제 경로 | 종류·역할 | 지정 근거 / 계승 범위 |','| --- | --- | --- | --- |',
 '| 공식 | [STYLE_GUIDE.md](STYLE_GUIDE.md) | 공통 스타일 문서 | 이번 사용자 지정. 조형·점눈·색면·큰 파츠 |',
 '| 공식 | [voxel-art-rework-220-characters.md](voxel-art-rework-220-characters.md) | 원본 설계 문서 | 기존 사용자 지정 기록 document-rework-report.md. 과거 전체 리워크 명령은 재실행하지 않음 |',
 '| 공식 | [expansion-style-prompt.md](expansion-style-prompt.md) | 380종 참조·설계 문서 | 이번 사용자 지정. ID·이름·수치를 유지하며 시각 표현 수정 |',
 '| 구현 기준 | ../../src/voxel.ts / ../../src/diorama-material.ts | 메시 병합·재질 | 현재 실행 코드. 전역 변경 없이 신규 모델에서 계승 |',
 '| 비교 조건 | ../../scripts/qa/expansion-art.html | 중립 카메라·조명·배경 | Orthographic, hemisphere 2.5, directional 2.6, 256px. 자체 검수 조건이며 실제 UI 해상도와 구분 |',
 '| 후보/이력 | stage-gallery.html 및 과거 artifacts 이미지 | 이전 제작 결과 | 현재 공식 기준으로 자동 편입하지 않음 |','',
 '## 확인된 원본 모델','',
 '아래 모델은 현재 카탈로그의 stageId/slot과 기존 document-id-map.md를 교차 연결한 구현 기준이다. 형태 참조에서는 큰 면·눈·연결 두께만, 소재 참조에서는 명도 분리·광택 범위만 계승하고 생물·소품·팔레트는 복사하지 않는다. 모델 파일의 SHA-256, 측정 단위, 눈 높이, 파트 수는 JSON에 기록한다. 변경 기준 커밋: 338d48d.','',
 '| 문서 참조 | 실제 ID | 현재 이름 | 모델 경로 | 단위 |','| --- | ---: | --- | --- | ---: |']
 for key,r in sorted(unique.items()):lines.append(f"| {key} | {r['id']} | {r['name']} | [{r['path']}](../../{r['path']}) | {r['unit']} |")
 (ROOT/'docs/art/REFERENCE_INDEX.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
 print(f'{len(refs)*2} resolved references; {len(unique)} original models')
if __name__=='__main__':main()
