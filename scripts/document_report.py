import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'docs/art/document-id-map.json').read_text(encoding='utf8'))
text=(root/'docs/art/voxel-art-rework-220-characters.md').read_text(encoding='utf8')
names={int(m[1]):m[2] for m in re.finditer(r'^## (\d{2})\. (.+)$',text,re.M)};names[1]='몽글 초원'
worlds=[
('포근함','씨앗 풍차와 정원 뿌리','낮고 둥근 군집 / 나무·잎','풍차 회전·잎 흔들림','건초 바람'),
('장난스러움','열린 오르골 성','힌지·태엽 / 칠한 나무·황동','불연속 태엽 회전','장난감 기차'),
('고요한 신비','부채 산호 아치','갈라진 가지·조개 / 산호·진주','부유 물방울','먹물'),
('뜨거운 위압','용광로 모루','낮고 두꺼운 금속 / 흑철·용암','불씨 상승','불숨·분출'),
('조용한 긴장','종이 매달린 시계 교실','빈 층·문틀 / 낡은 목재','느린 부유','책·사물함'),
('빠른 도시','세 광고탑','직각 판·회로 / 금속','신호·회전','보안선·드론'),
('장엄함','열린 태양문','원반·기둥 / 사암·청금석','모래·빛','전갈'),
('원시의 규모','긴 목 화석 아치','굵은 줄기·늪 / 나무·이끼','잎 흔들림','랩터·타르'),
('낯익은 신비','느티나무와 굽은 다리','곡선 지붕·나무 / 기와·돌','도깨비불','불씨·달 종'),
('영웅의 장엄','구름 원형 신전','열주·원형 / 대리석','천천히 도는 상징','번개·메두사'),
('이질감','원반 격납고','낮은 원반·관 / 합금·배양액','견인 장치','UFO·산성액'),
('기계의 낭만','공중선 계류장','용골·톱니 / 황동·철','증기 상승','증기·톱니'),
('차가운 경외','빙정 관문','뾰족한 결정 / 얼음','낮은 속도의 결정','고드름'),
('엉뚱한 꿈','누운 초승달 시계','비대칭·빈 곡선 / 천·구름','느린 부유','시계·침대'),
('불안 속 생명','갈라진 냉각탑','폐관·틈의 잎 / 녹슨 철·식물','포자 상승','독 웅덩이'),
('작아진 시점','속 빈 도토리 마을','거대 줄기·잎 / 나무·키틴','잎·작은 날개','거미줄·말벌'),
('묵직한 힘','로봇 머리 공장','판금·관절 / 고철','기계 회전','자석·압착기'),
('우주의 경이','기울어진 천구의','궤도·점성 / 금속·별빛','궤도 회전','유성'),
('공백의 불안','일부가 사라진 고리','빠진 조각·관통 구멍 / 어두운 파편','느린 파편 부유','공허의 손·기억 공격'),
('탄생과 안도','최초의 나무','뿌리·갈라진 가지 / 나무·꽃','꽃가루·새싹','창조의 파동'),
]
lines=['# 문서 기준 20단계 재편 결과','',
'사용자의 명시적 선택에 따라 문서의 20단계를 적용했다. 문서 첫 요약표에 중복된 10/11번 제목 두 행은 스테이지로 추가하지 않고, 개별 제작안의 올림포스/외계인 항목을 사용했다.','',
'## 데이터 연결','',
'- 기존 0~99는 유지. 100~299와 300~319의 ID·등급·소유 수량·장착·발견 기록을 유지하고 표시 이름과 모델을 교체했다.',
'- 이전 1~4 → 동일 단계, 이전 5 → 공허 19, 이전 6~19 → 새 5~18, 이전 20 → 정원 20. 배열 정렬이나 ID 재생성은 하지 않았다.',
'- `stageOrderVersion: 2`로 한 번만 변환한다. 알의 단계·세계 좌표·보스·완료 기록과 시크릿 관찰 기록을 함께 옮긴다. 이전 20의 기억 공격 관찰은 공허로 분리하고 기존 수령 여부는 각 원래 ID에 유지한다.',
'- 전체 [ID 대응표](document-id-map.md), [입력 문서](voxel-art-rework-220-characters.md), [검수 갤러리](../../artifacts/document-art/index.html).','',
'## 세계별 구현','',
'중앙 이동 길은 비우고 대표 구조물을 측면에 배치했다. 주변 구조는 테마별 기존 군집을 재연결하고 공허/정원은 별도 지형과 움직임으로 나눴다. 아래 알의 소재는 해당 집단의 대표 재질을 예고하며 특정 일반 펫을 확정하지 않는다.','',
'| 단계 | 감정·랜드마크 | 형태·재질 | 환경 움직임·위험 | 일반 10종 | 시크릿·알 |',
'|---|---|---|---|---|---|']
for stage,(emotion,landmark,form,motion,hazard) in enumerate(worlds,1):
 pets=sorted([r for r in rows if r['stage']==stage],key=lambda r:r['slot'])
 lines.append(f"| {stage}. {names[stage]} | {emotion} / {landmark} | {form} | {motion} / {hazard} | {' · '.join(r['name'] for r in pets[:10])} | {pets[10]['name']} / {form.split(' / ')[-1]} 표면과 전용 외곽 문양 |")
lines+=['','## 제작·확인 범위','',
'Three.js 파츠 계층과 병합 메시를 사용한다. 220종의 JSON·VOX·설계 메타데이터·도감 PNG를 생성했으며, 작은 점눈과 짧은 얼굴을 기준으로 신체·대표 소재를 분리했다. 꼬리는 5개 연결 파츠, 날개와 뿔은 의미 있는 부위 단위로 회전한다. 무광/금속/광택 재질을 공유하고 추가 실시간 광원은 만들지 않았다.',
'시크릿 비교에서 반복되던 둥근 날개를 발견해 기계 판·해룡 지느러미·빙정·깃·나뭇가지로 재제작했다. 청룡과 천룡은 긴 무족 몸, 외계룡은 낮은 원반, 고철룡은 큰 다리와 판금 몸으로 구분한다.',
'- 220종 도감: 정면·측면·회색·실루엣·대기·인사 렌더. 20종 시크릿과 20개 알 대응, 밝고 어두운 배경 비교.',
'- 실제 20개 지역 화면과 3/4/19단계 모바일 크기 화면에서 동행 펫 3마리, 환경, 공격을 함께 확인.',
'- ID/저장/부화/발견/서버의 위조 요청 거부/220종 구조 검사 11개 그룹 통과. 짧은 구형 경로, 공유 객체, 일부 지역만 저장한 기록, 관찰 기록 분리도 포함한다.',
'- 지역 20개 전환 후 GPU geometry/texture 수 동일. 상세 수치는 `artifacts/document-art/visual-audit.json` 및 지역 QA 보고서.',
'','## 남은 제한','',
'실제 토스 앱과 물리 모바일 기기의 FPS·안전영역은 미확인이다. 전후 비교의 왼쪽은 최초 아트 리워크 이전 2f6c1fd 기준이며, 이름/단계 재편 이전의 동일 ID 모델이다. 이전 ID의 테마가 바뀐 경우 같은 생물의 디테일 비교로 해석하지 않는다. 이전 깊은 바다의 독립 스테이지는 제거되며 촉수 동작은 공허의 기억 공격에 남는다. 피해량·전조 시간과 기존 확률 수치는 바꾸지 않았다.',
'별도로 요청한 경제 리워크는 후속 작업이며, 그 수치 변경·검증 결과는 별도 경제 보고서에서 구분한다.']
budgetpath=root/'artifacts/document-art/final-budget.json'
if budgetpath.exists():
 budget=json.loads(budgetpath.read_text());lines += ['',f"최종 출시 빌드 JS gzip 합계 {budget['jsGzipBytes']:,} bytes / 예산 307,200 bytes. 모바일 크기 3펫 장면 draw calls {budget['mobileCalls']}, 최대 triangles {max(budget['mobileTriangles']):,}. 20지역 전환의 geometry/texture는 {budget['before']} → {budget['after']}로 동일하다. 초기 전송 4 MiB 목표는 실제 로그인까지 포함한 출시 흐름에서 확인하지 못했으므로 통과로 보고하지 않는다. 전체 수치는 [예산 원자료](../../artifacts/document-art/final-budget.json)를 참고한다."]
(root/'docs/art/document-rework-report.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
designpath=root/'docs/art/stage-pet-designs.json';designs=json.loads(designpath.read_text(encoding='utf8'))
brief=['# 문서 기준 220종 제작 명세','','[20개 세계 구현·검수 보고](document-rework-report.md) / [기존 ID 대응](document-id-map.md)','']
for d in sorted(designs,key=lambda d:(d['stage'],d['slot'])):
 d['stageName']=names[d['stage']];d['body']=d['prompt'].split('.')[0];d['personality']='작은 점눈과 종별 머리 비율';d['concept']=d['prompt']
 brief += [f"## {d['key']} · {d['name']} · {d['stageName']}",d['prompt'],f"실제 조립: {d['anatomy']} / {d['feature']}. 기존 등급 {d['tier']}와 ID 유지.",'']
designpath.write_text(json.dumps(designs,ensure_ascii=False,indent=2),encoding='utf8')
(root/'docs/art/stage-pet-designs.md').write_text('\n'.join(brief),encoding='utf8')
conceptpath=root/'docs/art/character-concepts.json';concepts=json.loads(conceptpath.read_text(encoding='utf8'));repl={d['key']:d for d in designs};conceptpath.write_text(json.dumps([repl.get(d['key'],d) for d in concepts],ensure_ascii=False,indent=2),encoding='utf8')
records=json.loads((root/'docs/art/document-models-audit.json').read_text());p=root/'public/models/manifest.json';manifest=json.loads(p.read_text());repl={r['name']:r for r in records};manifest['models']=[repl.get(r['name'],r) for r in manifest['models']];p.write_text(json.dumps(manifest,indent=2),encoding='utf8')
