import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtime,quantiles,seeded} from './balance-runtime.mjs';
const {m}=await runtime();
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const baseline=await json('docs/balance-overhaul-baseline.json');
const simulation=await json('artifacts/balance-overhaul/simulation-10000.json');
const accounts=await json('artifacts/balance-overhaul/accounts-10000.json');
const chase=await json('artifacts/balance-overhaul/chase.json');
const normal=simulation.scenarios.normal,normalAccounts=accounts.filter(a=>a.scenario==='normal');
const f=(v,d=2)=>Number.isFinite(v)?Number(v.toFixed(d)):'미도달';
const days=v=>Number.isFinite(v)?f(v/86400):'미도달';
const table=(head,rows)=>[head,head.map(()=>'---'),...rows].map(r=>`| ${r.join(' | ')} |`).join('\n');
const qs=q=>['P10','P50','P90'].map(k=>days(q[k])).join(' / ');
const targets={5:'10~20분',8:'1~2시간',10:'4~8시간',13:'1~2일',15:'4~6일',17:'10~14일',18:'16~20일',19:'24~28일',20:'30~40일'};
const tests=[];
for(const name of ['invariants','server','ui','production-ui']){
 try{tests.push([name,(await json(`artifacts/balance-overhaul/${name}.json`)).passed.join('; ')]);}catch{tests.push([name,'결과 파일 없음 — 통과로 간주하지 않음']);}
}
const upgrades=Object.keys(m.UPGRADES).flatMap(kind=>Array.from({length:20},(_,level)=>{
 const q=quantiles(normalAccounts.map(a=>a.upgrades[`${kind}-${level+1}`]));
 return [kind,level+1,m.growthCost(kind,level),qs(q),`${q.reached}/${q.total}`];
}));
const odds=m.RARITIES.map(r=>r.chance/100*(1-m.BALANCE.secretDragonEggChance-m.ULTRA_SECRET.chance));
const rarityRows=[...m.RARITIES.map((r,i)=>[r.name,odds[i]]),['전용 드래곤',m.BALANCE.secretDragonEggChance],['울트라 시크릿',m.ULTRA_SECRET.chance]].map(([label,p])=>[label,f(p*100,8),f(1/p),Math.ceil(Math.log(.5)/Math.log1p(-p)),Math.ceil(Math.log(.1)/Math.log1p(-p))]);
// Expected collection time: coupon collector with actual per-pet probabilities.
// Poissonization gives independent first-arrival exponentials; expectation is exact,
// quantiles approximate the discrete spawn count. These are spawns, not recoveries.
const random=seeded(20260928),collections=[];
for(let stage=1;stage<=20;stage++){
 const pets=m.MONGLES.filter(p=>p.stageId===stage&&p.tier<=3),counts=Array.from({length:4},(_,t)=>pets.filter(p=>p.tier===t).length);
 const samples=Array.from({length:2000},()=>Math.max(...pets.map(p=>-Math.log(Math.max(Number.EPSILON,random()))/(odds[p.tier]/counts[p.tier]))));
 const q=quantiles(samples);collections.push([stage,pets.length,f(samples.reduce((a,b)=>a+b,0)/samples.length),f(q.P50),f(q.P90)]);
}
const baselineStrategy=baseline.strategies.map(r=>[r.strategy,r.productionMultiplier,r.income]);
const bestSpeedPet=m.MONGLES.reduce((best,p,i)=>p.speedMultiplier>m.MONGLES[best].speedMultiplier?i:best,0);
const maxLegal=m.progressionSpeedValue(m.upgradeBaseSpeed(20),1,3,m.equippedPetMultiplier([bestSpeedPet,bestSpeedPet,bestSpeedPet],'speedMultiplier'),100);
const stages=m.STAGES.map(s=>[s.id,s.name,m.STAGE_REQUIRED_SPEED[s.id-1],f(m.STAGE_REQUIRED_SPEED[s.id-1]*m.stableRecoveryRatio(s.id)),qs(normal.stages[s.id]),targets[s.id]??'—']);
const offlineRows=[8,24,48,168].map(hours=>[hours,m.offlineSeconds(hours*3600)/3600,...[1,10,20].map(s=>Math.floor(m.baselineIncome(s)*m.offlineSeconds(hours*3600)))]);
const expectedReturnXP=m.RARITIES.reduce((sum,r,i)=>sum+r.chance/100*m.PROGRESSION.returnXP[i],0);
const steadyXP=normal.recoveries.P50/90*expectedReturnXP;
const levelRows=[10,20,30,50,75,100].map(level=>[level,qs(normal.levels[level]),`${normal.levels[level].reached}/${normal.levels[level].total}`,f(Array.from({length:level-1},(_,i)=>m.requiredXP(i+1)).reduce((a,b)=>a+b,0)/steadyXP)]);
const chaseRows=m.STAGES.map(s=>[s.id,...['below','entry','stable','strong'].map(p=>f(chase.find(r=>r.stage===s.id&&r.preset===p).successRate*100,1))]);
const hatchRows=m.STAGES.map(s=>[s.id,...[0,4,6].flatMap(t=>{const hp=m.hatchHealth(s.id,t),auto=m.autoDamageValue(s.id-1,s.id-1);return [f(hp/(auto+m.tapDamageValue(s.id-1)*1.5)),f(hp/auto)];})]);
const scenarioRows=Object.entries(simulation.scenarios).map(([name,r])=>[name,r.accounts,qs(r.stages[20]),`${r.stages[20].reached}/${r.stages[20].total}`,qs(r.speedMax),qs(r.allMax),f(r.failureRate*100,1)]);
const contents=[
 '# 밸런스 개편 결과 및 남은 보정 항목',
 '이 보고서는 구현·검증 결과와 목표 충족 여부를 분리한다. **모든 목표를 달성한 최종 밸런스 인증은 아니다.** 성장·경제·저장 호환 코드는 반영했으며, 추격 성공률과 접속 모델의 차이는 아래에 공개한다. 기준 개편 전 커밋은 `1845e54`, 새싹 디자인 커밋 `c6c0ea3`은 별도다.',
 '## 근거와 재실행',
 '`node scripts/balance-chase.mjs --trials=30` → `node scripts/balance-simulate.mjs --accounts=10000` → `node scripts/qa/balance-overhaul.mjs` → 서버 빌드·검증 → UI/프로덕션 확인 → `node scripts/balance-report.mjs` → `node scripts/export-balance-reference.mjs` 순서. baseline-audit는 이미 보존한 결과를 덮어쓰지 않는다.',
 '실제 게임과 동일한 순수 함수를 번들에서 가져온다. 경제 어댑터와 실제 GameState의 속도·수입·터치·자동 피해·가격은 100개 시드 장비에서 대조했다. 추격은 실제 GameState 이동·물·풀숲·충돌·환경 피해·보스를 사용한다.',
 '## 변경 전후',
 table(['항목','이전','현재'],[
 ['강화 가격 역전','6/11/16단계','모든 트랙 1~20 양수·비감소'],
 ['보조 생산 배율','1.16^(보조 합−4×속도)','1+0.01×보조 합, 1~1.8'],
 ['최대 성장 스탯(훈련 제외)',f(baseline.maxWithoutTraining),m.upgradeBaseSpeed(20)],
 ['합법 최상위 구성 상한 예시','50K 도달 불가',f(maxLegal)],
 ['운동','무한 영구 누적','0~1 진행률, 기본 속도 +30%, 400~600초'],
 ['레벨 속도','최대 +60%','최대 +12%, 레벨 상한 추가 없음'],
 ['펫 최고 터치/자동/속도',`${baseline.pets.maxTap}/${baseline.pets.maxAuto}/${baseline.pets.maxSpeed}`,[Math.max(...m.MONGLES.map(p=>p.clickMultiplier)),Math.max(...m.MONGLES.map(p=>p.autoMultiplier)),Math.max(...m.MONGLES.map(p=>p.speedMultiplier))].map(v=>f(v,3)).join('/')],
 ['트레일','저가 성장 배수','이동 ×1.12/1.24/1.38, 성장 +1/2/3%'],
 ['탑승','성장과 이동 함께 증가','이동만 증가, 최대 +8%, 3KG 제한 유지'],
 ['운반 가속',baseline.carrying.ratio,'2배 제거, 모든 등급·강화에서 비운반보다 느림'],
 ['무료 쿠폰','후반 SS 가능','1스테이지 A 알, 기존 수령 기록 유지'],
 ['오프라인','48시간 동일 효율','첫 8시간 100%, 이후 50%, 48시간 상한'],
 ['도감','Secret까지 일반 완성 요구','C~S 일반 완성, SS~SSS/Secret 별도'],
 ['귀환 XP','20/20/50/120/300/600/1000',m.PROGRESSION.returnXP.join('/')],
 ]),
 '개편 전 생산 전략의 실제 값:',table(['전략','생산 배율','초당 수입'],baselineStrategy),
 '기존 재화·펫 721 ID·알·무게·개체 참조·발견·쿠폰 기록은 삭제하지 않는다. 운동 원값은 legacyTrainingSpeed에 보관하고 새 훈련 진행률로 이관한다. 기존 알 체력은 남은 비율을 보존한다. 기존 고레벨·고액 계정은 신규 한 달 진행 모델과 다르며 자산을 강제로 회수하지 않는다.',
 '## 20스테이지 성장',
 '시간은 계정 생성 이후 **달력 시간(일)** 이다. 아래 안정 스탯은 무강화 표준 C 알 설계 기준이며, UI는 실제 무게·운반 강화를 반영한다. 진입은 성장 스탯으로 제한하고 회수 권장 미달 알의 집기 입력 자체는 허용한다.',
 table(['단계','맵','진입 스탯','표준 안정 스탯','진입 P10/P50/P90 일','목표'],stages),
 `일반 플레이 중앙값: 20단계 ${days(normal.stages[20].P50)}일, 속도 20레벨 ${days(normal.speedMax.P50)}일, 호환용 time을 포함한 8트랙 전체 ${days(normal.allMax.P50)}일. 20단계 28일은 목표 하한 30일보다 약 6.7% 빠르며 제시된 ±20% 허용 범위 안이다.`,
 '## 강화 가격과 구매 시점',
 '가격은 장비와 독립인 기준 생산량을 사용한다. 구매 시간은 해당 레벨을 실제 산 누적 달력 시간이다. time은 이전 저장 호환용 숨김 트랙이다.',
 table(['트랙','레벨','가격','누적 구매 P10/P50/P90 일','도달 계정'],upgrades),
 '## 레벨 체크포인트',
 '50/75/100은 90일 관찰에서 미도달이다. 마지막 열은 귀환 XP만으로 일정한 일일 회수량을 유지한다고 가정한 장기 추정이며 시뮬레이션 관측값이 아니다. 최초 발견·부화 보너스, 장기 이탈·성공률 변화를 포함하지 않는다.',
 table(['레벨','관측 P10/P50/P90 일','도달','귀환 XP 고정률 추정 일'],levelRows),
 '## 확률과 도감',
 '스폰 1회에 한 번의 전용 추첨을 사용한다. [0, 0.001%)는 울트라, 그 다음 0.01%는 드래곤이며 두 판정은 겹치지 않는다. 나머지 99.989%에 일반 등급 표를 적용한다. 아래는 **특정 등급의 알 스폰**까지 횟수이며 실제 획득에는 선택·실패·부화가 추가된다.',
 table(['알','최종 확률 %','기대 스폰 횟수','P50 횟수','P90 횟수'],rarityRows),
 '아래 일반 도감은 등급 내 동일 확률, 선택 없이 모든 일반 알을 받아 부화하는 경우다. 2,000개 시드의 첫 도착 지수분포를 사용한 쿠폰 수집 근사값이다. 기대값은 포아송화와 같은 값이며 분위수는 연속 근사다. 실제 스폰 중 S 알을 골라 회수하면 필요한 성공 회수 수는 더 적다. 천장·미보유 가중치는 추가하지 않았다.',
 table(['단계','일반 종수','완성 기대 스폰','P50 스폰','P90 스폰'],collections),
 '## 부화 시간',
 '해당 스테이지−1 레벨의 터치·자동·빈도 강화, 동행 보너스 전. 혼합은 초당 터치 1.5회다. 범위 외 자동 시간은 아래 표 그대로 공개한다.',
 table(['단계','C 혼합 초','C 자동 초','SS 혼합 초','SS 자동 초','Secret 혼합 초','Secret 자동 초'],hatchRows),
 '## 추격 성공률',
 '스테이지·상태당 30개 시드. C 알의 실제 무게 추첨, 체력/운반 강화=스테이지−1, 트레일·탑승 없음. 아래 entry/stable/strong은 진입 기준의 1배/설계 안정 배수/안정 배수의 1.5배다. below는 진입 제한을 우회해 0.99배로 배치한 스트레스 테스트다. 정상 이동은 해당 스테이지에 들어갈 수 없다. 밤 전환은 이 표에서 제외했다.',
 table(['단계','미달 강제 배치 %','진입 %','안정 %','충분 성장 %'],chaseRows),
 '**성공률 목표는 전부 충족하지 못했다.** 초반은 3초 기상과 가까운 기지 때문에 진입 수준도 거의 전부 성공한다. 일부 후반 단계는 같은 안정 배수에서도 물·경로·은폐 위치 때문에 80% 미만이다. 실패 입력 즉사는 없으며 정상 보스 접촉·알 낙하로 실패한다. 미달 강제 배치에서 풀숲으로 빠져나갈 수 있어 2~5초 실패도 보장하지 않는다. 추가 수치 루프를 무한 반복하거나 결과를 성공으로 바꾸지 않았다.',
 '## 오프라인',
 table(['경과 시간','유효 생산 시간','1단계 기준 지급','10단계 기준 지급','20단계 기준 지급'],offlineRows),
 '마지막 정산 시점과 실제 접속 시점을 별도로 보존한다. 다른 방 사용자가 계속 조회해도 8시간 감산 시작점을 연장하지 못한다. 동일 시점 재정산과 분할 정산의 동일 지급을 검증했다. 초반 복귀 시 여러 저가 강화를 살 수 있어 “복귀당 최대 1~3개”를 하드 제한하지 않았다.',
 '## 10개 플레이어 시나리오',
 `독립 계정 ${simulation.count}개, 시드 ${simulation.seed}부터, 관찰 90일. 일반 계정 3,000개, 기타 행동 7종 각 1,000개다. lucky 150명/unlucky 300명은 일반 계정에서 실제 무수정 등급 추첨 결과의 상위 5%/하위 10%를 추출한 부분집합이므로 독립 계정 수에 중복 합산하지 않는다.`,
 table(['모델','계정','20단계 P10/P50/P90 일','20단계 도달','속도 만렙 일','전체 만렙 일','실패율 %'],scenarioRows),
 `일반 성공 회수 중앙값은 일평균 ${f(normal.recoveries.P50/90)}회, 실패율 ${f(normal.failureRate*100)}%다. 회수 목표 15~25회/일에 약간 못 미치고 실패 목표 10~20%를 초과한다.`,
 '## 모델 한계와 미달 원인',
 '- 12시간 간격의 하루 2회 접속 모델에서는 첫 세션 종료 후 1~2시간/4~8시간 도달 이벤트가 발생할 수 없다. 8·10단계 목표는 더 잦은 첫날 접속 또는 누적 접속 시간 목표로 별도 정의해야 한다. 이 보고서는 그 차이를 숨기지 않는다.\n- 경제 모델은 15초 단위다. 실제 GameState 50ms 첫 10분 테스트는 회수 42.6초, 부화 43.9초, 강화 7회였다. 경제 모델의 첫 회수 30초/부화 45초는 조작 검증값이 아니다.\n- 추격 성공률 보간은 C 알 기준이며 다른 등급·체력·탑승·트레일에 따른 성공 확률을 완전히 재현하지 않는다. 이동 시간에는 실제 트레일과 표준 무게 운반 계수를 넣었다. 서버 지연·다른 플레이어 배트·랜덤 밤 진입은 1만 경제 계정에 포함하지 않았다.\n- 가장 먼 미해금 단계를 반복 선택하는 생산 우선/균형 모델은 회수 실패가 많다. 이것은 최적 전략의 증명이나 실제 유저의 확정 도달일이 아니다. 세 전략 중 생산 우선이 진행을 25% 이상 단축하는 기존 폭주 경로는 재현되지 않았다.\n- 주간 7일차 알은 다음 세션 전 부화를 가정한다. 쿠폰도 첫 세션의 A 알 부화를 가정한다. 광고 구매는 기본 모델에 없다.\n- 보스 속도는 거리나 관전자에 따른 급가속을 없앤 스테이지 고정 속도다. 실제 시각적 부드러움·멀티 지연은 별도 실기기 측정이 필요하다.\n- 낮·밤 285/15초와 5초 사망 연출+5초 선택+10초 가상 광고는 유지했다. 귀환 예상 시간이 남은 낮보다 길면 HUD에서 경고하지만 자동 보호나 야간 회수 보장은 없다.',
 '## 튜닝 이력',
 table(['차수','변경 이유','관측'],[
 [1,'공통 로그 제거·생산 상한·신규 비용 초기화','소표본 정상 모델 속도 만렙 약 53일'],
 [2,'비용 전체 보정 하향','소표본 약 37.5일'],
 [3,'진입 기본값 표와 비용 보정 0.8 정리','1천 표본 20단계 진입 약 24.5일'],
 [4,'초반 첫 구매·후반 대기 배분 조정','1만 구모델 진입 약 29일, 속도 약 36일'],
 [5,'첫 속도 비용·귀환 XP, 15초 모델·실제 운 분위수·부화 시점 수정','최종 표 참조. 모델 변경이 있어 전 차수와 순수 A/B 비교 불가'],
 ]),
 '## 검증과 남은 확인',
 '통과: `npm run qa:unit`(게임 17, 단위 22, 진행 32, 실제 10분 밸런스, 로컬 멀티 11), `qa:lint`, 타입 검사 포함 `build:pages`, 공유 불변조건, 서버 명령, 1080×1920 전용 UI, EC2 번들의 5인 방·인증·스트림·재시작 보존. 로컬 배포 미리보기는 게스트 인증 이후 방 연결이 실패했다. 서버가 localhost:4321 출처의 사전 요청을 403으로 거절하는 것을 확인했으며 실제 허용 출처의 배포 확인과 구분한다. 기존 범용 `scripts/qa/e2e.mjs`는 옛 튜토리얼 좌표·문구에서 실패했고 전체 UI 묶음을 새 규칙으로 이관하지 않았다. 이를 전체 E2E 통과로 보고하지 않는다. 실제 토스 인증·광고 수익화·실기기 성능은 확인하지 않았다.',
 table(['검증 파일','통과 항목'],tests),
 '생성 JS 주요 세 청크 gzip 합 약 305.8 kB(약 298.6 KiB)이며 300 KiB 예산에 가깝다. 동적 펫 애니메이션·SDK와 모델을 포함한 실제 초기 전송량, draw calls, 모바일 FPS는 이 수치로 대체하지 않는다.',
 '출시 후 수집할 값: 스테이지 진입→첫 성공 시간, 실제 알 무게·운반 강화별 회수율, 풀숲 사용·물 체류, 야간 강제귀환 손실, 부화 시작→완료/탭 빈도, 강화 순서·구매 사이 대기, 체육시설 체류, 8/24/48시간 복귀 지급, P10/P50/P90 잔존 사용자 성장. 목표 미달 추격 구간은 이 자료와 별도 경로 테스트로 후속 보정해야 한다.',
];
await writeFile('docs/balance-overhaul-report.md',contents.join('\n\n')+'\n');
await mkdir('docs/balance-results',{recursive:true});
await writeFile('docs/balance-results/simulation.json',JSON.stringify(simulation,null,2)+'\n');
await writeFile('docs/balance-results/chase.json',JSON.stringify(chase,null,2)+'\n');
console.log('Wrote report, 10K aggregate results and chase evidence.');
