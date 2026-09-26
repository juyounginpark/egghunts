"""Repeatable source/identity audit and design index for the 2026-09 art pass."""
import json
import re
import subprocess
from pathlib import Path
from stage_pet_designs import LANGUAGES
from stage_pet_finish import PALETTES,MATERIALS

ROOT=Path(__file__).resolve().parents[1]
BASE='2f6c1fd'
OUT=ROOT/'artifacts/art-rework';OUT.mkdir(parents=True,exist_ok=True)
before=OUT/'before';before.mkdir(exist_ok=True)
def original(path):return subprocess.check_output(['git','show',f'{BASE}:{path}'],cwd=ROOT).decode('utf8')
for name in ['region-art','region-layout','world-art']:
 text=original(f'src/{name}.ts')
 for dependency in ['region-art','region-layout','world-art']:
  text=text.replace(f"'./{dependency}'",f"'/artifacts/art-rework/before/{dependency}.ts'")
 for dependency in ['stage-data','village-art']:
  text=text.replace(f"'./{dependency}'",f"'/src/{dependency}.ts'")
 (before/f'{name}.ts').write_text(text,encoding='utf8')
for id in [120,130,280,302,303,318]:
 (before/f'pet-{id}.json').write_text(original(f'public/models/pet-{id}.json'),encoding='utf8')
checks=[]
for path in ['src/data.ts','src/stage-data.ts','src/game.ts','src/progression.ts','src/stage-eggs.ts','src/online-state.ts','server/room-engine.ts']:
 assert original(path).replace('\r\n','\n')==(ROOT/path).read_text(encoding='utf8').replace('\r\n','\n'),path
 checks.append(f'{path}: unchanged gameplay/save/probability source')
for name in ['stage-pet','secret-dragon']:
 path=f'src/{name}-catalog.ts'
 def parse(s):return json.loads(s[s.index('['):s.rindex(']')+1])
 old,new=parse(original(path)),parse((ROOT/path).read_text(encoding='utf8'))
 assert len(old)==len(new)
 for a,b in zip(old,new):
  for key in a:
   if key not in ['description','color']:assert a[key]==b[key],(name,key,a,b)
 checks.append(f'{name}: {len(new)} stable rows, names, tiers, slots, stage links and abilities')
models=[]
for id in range(100,320):
 d=json.loads((ROOT/f'public/models/pet-{id}.json').read_text())
 assert sum(len(p['voxels']) for p in d['parts'].values())==len(d['voxels'])
 assert all(p['parent'] is None or p['parent'] in d['parts'] for p in d['parts'].values())
 assert all(0<=v[a]<d['size'][a] for v in d['voxels'] for a in range(3))
 for key in d['parts']:
  seen=set();p=key
  while p:
   assert p not in seen;seen.add(p);p=d['parts'][p]['parent']
 models.append({'id':id,'parts':len(d['parts']),'size':d['size'],'voxels':len(d['voxels'])})
(OUT/'identity-audit.json').write_text(json.dumps({'checks':checks,'models':models},indent=2),encoding='utf8')
rows=json.loads((ROOT/'docs/art/stage-pet-designs.json').read_text(encoding='utf8'))
landmarks=['씨앗 풍차와 갈라진 뿌리','왕관 역과 목제 아치','속이 열린 부채 조개 유적','비스듬한 현무암 분화구','휘어진 거대 해골 유적','펼친 책 지붕과 종탑','꼭대기가 갈라진 신호 첨탑','초승 태양과 계단 무덤','화석 갈비와 양치 캐노피','초승달과 들린 기와 처마','열린 박공과 석상 날개','부유 격리 고리와 착륙 다리','사선 삭구와 비행선 용골','기울어진 빙하 수정 회랑','닫히지 않은 시계와 구름 베개','뿌리가 뚫고 나온 격리 온실','휘어진 거대 풀잎과 벌집','사선 크레인과 열린 자석','기울어진 이중 궤도 천문대','끊긴 문 윤곽과 첫빛 뿌리']
emotions='안도 호기심 청량 긴장 경외 기묘함 속도감 장엄함 원시적경외 장난스러움 숭고함 낯섦 모험 고요 몽롱함 불안 거대함 재발견 신비 공허에서희망'.split()
lines=['# 전체 스테이지·수집 캐릭터 아트 리워크 (2026-09-26)','',
'Three.js 0.180 / 코드 생성 복셀 / 면 병합 메시 / 환경 인스턴싱. 기존 0~99번은 보존하며 100~299 일반 200종, 300~319 시크릿 20종을 교체한다. 총 보유 카탈로그는 320종이다. 선택 차원과 legacy region은 별개다. 알은 stage/tier의 기존 후보 풀을 사용하며 variant 외형이 특정 펫 획득을 보장하지 않는다.','',
'실행 데이터의 19단계는 은하수 천문대, 20단계는 공허와 창조주의 정원이다. 과거 roadmap의 19/20 이름으로 덮어쓰지 않는다.','',
'| 스테이지 | 핵심 감정 | 랜드마크 | 형태·재질 | 팔레트 | 환경 움직임 | 위험의 원인 | 일반 펫 10종 | 시크릿 드래곤 | 알·둥지 |','|---|---|---|---|---|---|---|---|---|---|']
for stage in range(1,21):
 pets=[r for r in rows if r['stage']==stage];language=LANGUAGES[stage-1]
 lines.append(f'| {stage}. {pets[0]["stageName"]} | {emotions[stage-1]} | {landmarks[stage-1]} | {language[1]}; {MATERIALS[stage-1][0]} | {" / ".join(PALETTES[stage-1])} | {language[5]} | {pets[0]["inspiration"]} | {", ".join(r["name"] for r in pets[:10])} | {pets[10]["name"]}; {pets[10]["body"]} | 동일 후보 팔레트·지역 모티프; 낮은 재질 받침 |')
lines+=['','## 수정 우선순위와 구현','',
'1. 초기 `1c7d20f`의 작은 눈 비율을 기준으로 공통 흰 눈판·볼터치를 제거했다. 졸린 눈과 기계 센서는 해당 표현에만 남긴다.',
'2. 24는 몸체 단위이며 최대 공간이 아니다. 꼬리 4마디, 날개 어깨/끝, 귀/뿔, 머리는 로컬 pivot·rotation·scale을 사용한다. 정적 모델은 같은 자세를 한 메시로 병합한다. `.vox`는 회전 전 조립 원본이고 JSON이 런타임 기준이다.',
'3. 산호 분지·나선·패각·초승달·궤도를 실제 빈 공간과 곡선으로 조형했다. 일반 펫의 기존 종별 몸체를 유지하면서 20 드래곤의 날개 생태·기본 자세·꼬리 굽힘을 구분했다.',
'4. 모든 지역 랜드마크에 기울어진 부재와 열린 구조를 추가했다. 바닥 세부는 군집 주변에 모으고 플레이 경로와 충돌은 보존했다.',
'5. 전조는 끊어진 얇은 경계, 공격은 이어진 경계, 회복은 성긴 잔여 경계다. source 기관은 지역 소재색으로 충전한다. 공격 피해·시간·판정은 변경하지 않았다.',
'6. 알·펫은 동일 지역의 효과 계열을 쓴다. 입자는 얼굴 밖에서 서로 다른 속도·높이로 이동한다. 추가 실시간 광원·후처리 블룸은 사용하지 않는다.',
'','## 검수 산출물','',
'- `artifacts/art-rework/identity-audit.json`: 기존 게임/저장 소스와 ID/슬롯/등급/능력 비교, 220종 파츠 계층·범위 검사.',
'- `docs/art/previews/stages/stage-N.png`: 스테이지별 10종 + 드래곤, 컬러·실루엣.',
'- `public/models/stage-previews/`: 종별 정면·측면·후면·회색·대기·획득 동작.',
'- 실제 실행 결과와 미해결 사항은 아래 최종 검수 기록에 별도로 기입한다.','',
'## 레퍼런스','',
'사용자가 제공한 [Shadow Dragon](https://www.playadopt.me/discover/pets/shadow-dragon), [Frost Dragon](https://www.playadopt.me/discover/pets/frost-dragon), [Strawberry Shortcake Bat Dragon](https://www.playadopt.me/discover/pets/strawberry-shortcake-bat-dragon), [Void RNG](https://www.biggames.io/post/pet-simulator-99-update-78), [Kaiju](https://www.biggames.io/post/pet-simulator-99-update-52), [Aura](https://www.biggames.io/post/pets-go-update-34)를 확인했다. 외형 에셋을 복사하지 않고 몸·소재·외곽 효과의 분리 원칙을 참고했다.']
(ROOT/'docs/art/world-rework-2026-09.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
print('PASS stable identity and gameplay source, 220 valid assemblies; wrote 20-stage design index')
