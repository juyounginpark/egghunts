# 알콩 원정대

앱인토스용 세로 모바일 복셀 탐험 게임. 제품 규칙은 `alkong-expedition-game-spec.md`의 최신 추가 결정이 우선합니다.

최신 개정: 20차원 환경 회피, 체력·경험치·레벨·특성. 필드 자연 회복과 공격 버튼은 없으며 HP0에서 자동 귀환합니다. 체력은 피해를 받은 동안만 플레이어 머리 위 바로 표시합니다. 세부 구현/미완료 연출과 실기기 검증 범위는 `docs/qa/final-report.md` 맨 위를 확인하세요.

## 실행과 검증

```powershell
npm install
npm run dev -- --port 4317
npm run server:multiplayer
npm run qa:fast
npm run verify
npm run build:toss
```

개발 브라우저는 터치 조이스틱 또는 WASD/방향키, E/Space 상황 행동을 지원합니다. 멀티플레이 서버는 기본 `127.0.0.1:4330`이며 설정의 게스트 연결로 접속합니다. 서버 설정과 한계는 `docs/qa/multiplayer.md`, 환경 변수는 `.env.example`을 참고하세요.

## 현재 게임

- 농장 → 알 탐험·운반 → 귀환 보관 → 수동/자동 부화 → 펫·강화의 반복 구조입니다. 제한시간 없이 스피드를 강화하며 먼 지역으로 나아갑니다.
- 1~20지역이 이어진 맵과 지역별 5개씩 총 100가지 알 외형을 사용합니다. 기존 35알·100펫 보상 카탈로그와 저장은 보존합니다. 스테이지 선택 메뉴는 없습니다.
- 등급 확률은 C/B/A/S/SS/SSS/SECRET 순서로 45/28/15/7/3.5/1.3/0.2%입니다. 알 크기는 5~100, 펫 제작 격자는 10³~100³입니다.
- 공통 UTC 시각 기준 180초마다 45초간 밤입니다. 조명과 달·별, 낮밤 표시가 바뀌며 밤에도 탐험을 계속합니다.
- 수호자는 잠들어 있다가 도난 시 추격합니다. 공격 예고 후 명중하면 알을 떨어뜨리고 고정+최대 HP 비례 피해를 받습니다. 필드에서는 회복하지 않으며 농장 귀환 시 전량 회복합니다.
- HP0에서는 자동 귀환하고 원정 XP의 70%를 받습니다. 광고 부활은 없습니다.
- 운동기구는 영구 스피드를 올립니다. 운동 내리기 전 이동이 잠기고 달리는 연출과 카메라 확대를 적용합니다. 트레일 배율이 반영된 실제 초당 증가량을 HUD와 숫자 이펙트로 표시합니다.
- 스피드는 m/s 없이 표시합니다. 큰 숫자는 10^7=1A, 10^14=1B, …, 10^182=1Z, 10^189=1AA 순서로 축약합니다.
- 펫은 클릭·오토·스피드 배율을 제공합니다. 최대 3종 착용하며 이동 경로를 한 줄로 따라갑니다. 미착용 보유 펫도 농장에서 놀며 한 번에 12종을 순환 표시합니다.
- 보관함은 부화실, 착용 관리는 펫 메뉴, 도감은 펫 메뉴 안에 있습니다. 미발견은 ???로 표시하며 발견·지역·전체 보상은 한 번만 지급합니다.
- 농장 판매 스토어에서 알/펫을 확인 후 판매합니다. 마지막 펫을 팔아도 도감 발견 이력은 남습니다.
- 상점의 가상 광고는 10초 후 닫기 버튼을 열고 별가루를 한 번 지급합니다. 실제 광고 SDK나 매출 기능은 아닙니다.
- 로컬 멀티플레이는 외형·위치·배트 공격·밀침·넘어짐·공유 낙하 알의 단일 선점을 지원합니다. 경제 전체는 아직 서버 권위가 아닙니다.

## QA

`qa:lint`, `qa:typecheck`, `qa:unit`, `qa:e2e`, `qa:visual`, `qa:performance`, `qa:fast`, `qa:full`, `verify`를 제공합니다. `verify`는 전체 QA, 빌드, 프로덕션 스모크를 수행합니다. QA 전용 입력을 사용하는 핵심 A~D 플레이는 개발 빌드에서 검증합니다.

개발 URL `?qa=true&seed=1001&scene=training`으로 고정 장면을 확인할 수 있습니다. QA 저장은 일반 저장과 분리되며 프로덕션에서 QA hook은 제거됩니다. 시각 검사는 6개 화면 크기 × 26개 상태입니다. `node scripts/qa/visual.mjs --capture`로 캡처하고 직접 검토한 다음에만 `--update`로 기준을 갱신하세요. 결과는 `artifacts/`에 저장됩니다. Windows에서는 Edge, CI에서는 설치한 Chromium을 사용합니다.

## 복셀 제작

`npm run models`는 `C:/Users/0620f/OneDrive/Desktop/AIvoxel/voxel.py`를 사용합니다. 다른 위치는 `AIVOXEL_PATH`로 지정합니다. 외부 AIvoxel 저장소는 수정하지 않습니다. `public/models/manifest.json`이 격자·복셀 수의 기준입니다. 디자인 JSON, VOX, 런타임 JSON과 PNG 아이콘을 제공합니다. 100³ 모델은 최대 50³ 부분 모델을 합성합니다.

내부 면 제거와 greedy meshing, 공유 geometry/material, InstancedMesh 입자를 사용하며 복셀마다 Mesh를 만들지 않습니다. 일반 화질은 2배, 저사양은 3배 정수 픽셀 확대이고 보간과 안티앨리어싱은 끕니다. 텍스트는 읽기 쉬운 브라우저 글꼴을 사용합니다. 아이콘 재생성은 개발 서버 실행 후 `node scripts/render-model-icons.mjs`입니다.

## 앱인토스 출시 전

SDK 3.5.0, `apps-in-toss.config.ts`, 산출물 `alkong-expedition.ait`를 사용합니다. 콘솔의 실제 appName·브랜드 설정과 일치시켜야 합니다. 네이티브 식별·저장·Safe Area·서버 시각·행동 로그·리더보드 호출은 `src/platform.ts`에 격리합니다.

실제 토스 앱 로그인/순위 반영/안전영역, 공개 HTTPS 멀티플레이 호스팅, 서버 권위 경제·클라우드 저장, 실기기 장시간 FPS는 별도 검증·구축이 필요합니다. 브라우저나 SDK mock 성공을 실기기 출시 승인으로 간주하지 않습니다. 자세한 결과는 `docs/qa/final-report.md`를 확인하세요.

## GitHub Pages

플레이 주소: https://juyounginpark.github.io/egghunts/

`main`에 푸시하면 `Deploy GitHub Pages` Actions가 검사 → `/egghunts/` 전용 빌드 → 프로덕션 브라우저 검사 → Pages 배포를 수행합니다. Actions 화면에서 수동 실행도 가능합니다. 저장소 Settings → Pages의 Source는 **GitHub Actions**입니다.

로컬 Pages 경로 검증:

```powershell
npm run build:pages
$env:QA_BASE_PATH='/egghunts/'
node scripts/qa/e2e.mjs --production
Remove-Item Env:QA_BASE_PATH
```

일반 `npm run build`와 `npm run build:toss`는 기존 루트 경로 빌드를 유지합니다. Pages는 정적 웹 게임이며 공개 멀티플레이 서버를 포함하지 않습니다.
