import {writeFile} from 'node:fs/promises';
import {runtime} from './balance-runtime.mjs';
const {m:d}=await runtime();
const n=v=>Number.isInteger(v)?String(v):String(Number(v.toPrecision(7)));
const table=(head,rows)=>[head,head.map(()=> '---'),...rows].map(row=>`| ${row.map(v=>String(v).replaceAll('|','/').replaceAll('\n',' ')).join(' | ')} |`).join('\n');
const save=(name,sections)=>writeFile(`docs/${name}.md`,sections.join('\n\n')+'\n','utf8');
const generated='`node scripts/export-balance-reference.mjs`가 실제 게임 상수와 공유 계산 함수에서 생성한다. 실험 결과와 미달 항목은 [개편 보고서](balance-overhaul-report.md)에 기록한다.';
const prices=table(['구매 레벨',...Object.keys(d.UPGRADES)],Array.from({length:20},(_,level)=>[level+1,...Object.keys(d.UPGRADES).map(k=>d.growthCost(k,level))]));
const stageRows=d.STAGES.map(s=>[s.id,s.name,d.STAGE_REQUIRED_SPEED[s.id-1],n(d.STAGE_REQUIRED_SPEED[s.id-1]*d.stableRecoveryRatio(s.id)),n(d.baselineIncome(s.id)),n(d.guardianSpeed(s.id)),d.stageDamage(s.id)]);
const petRows=d.MONGLES.map((p,id)=>[id,p.name,p.stageId?p.stageId:id===320?'스페셜':'이전 도감',d.RARITIES[p.tier].name,n(p.clickMultiplier),n(p.autoMultiplier),n(p.speedMultiplier),n(Math.min(d.OVERHAUL.mountBonusCap,(p.speedMultiplier-1)*d.OVERHAUL.mountBonusRate)*100),n(d.petIncomeValue(Math.max(1,p.stageId),p.tier)),d.stageReward(Math.max(1,p.stageId),d.OVERHAUL.rewardMinutes.salePet,p.tier),d.stageReward(Math.max(1,p.stageId),d.OVERHAUL.rewardMinutes.discovery,p.tier),n(p.scale)]);
const petHeaders=['ID','펫','스테이지','등급','터치 배율','자동 배율','성장 속도 배율','탑승 이동 증가 %','기본 생산 /초','판매 별가루','최초 발견 별가루','원본 크기'];
await writeFile('docs/balance-pets.csv','\uFEFF'+[petHeaders,...petRows].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n')+'\r\n');
await save('balance-reference',[
 '# 상점·재화·펫 전체 수치표',generated,
 '## 실제 강화 가격',`20레벨 유지. 고정 기준 팀 수입 × 목표 대기시간 × 상품 비율 × 비용 보정 ${d.OVERHAUL.costScale}. 현재 장착 펫과 무관하다. time은 이전 저장 호환용이며 UI에서 숨긴다. UPGRADES.cost/growth는 실제 결제에 쓰이지 않는 이전 정의다.`,prices,
 '## 강화 효과',table(['상품','설명'],Object.values(d.UPGRADES).map(u=>[u.name,u.description])),
 '## 기본 성장 속도',table(['강화 레벨','기본 성장 속도'],d.OVERHAUL.speedBases.map((v,i)=>[i,v])),
 '## 트레일',table(['ID','상품','가격','이동 배율','성장 배율'],d.TRAILS.map((t,i)=>[i,t.name,t.cost,t.multiplier,d.OVERHAUL.trailProgression[i]])),
 '## 스테이지',table(['단계','맵','진입 스탯','표준 C 알 안정 기준','기준 팀 생산 /초','보스 보행 속도','고정 피해'],stageRows),
 '안정 회수 UI는 실제 알 무게와 운반 강화를 추가 적용한다. 위 표는 무강화 표준 C 알 기준이며 성공을 보장하지 않는다. 물·경로·피격이 영향을 준다.',
 '## 등급·무게·생산',table(['등급','일반 알 %','기준 무게 G','기본 감속 %','최저 감속 %','생산 계수'],d.RARITIES.map((r,i)=>[r.name,r.chance,d.WEIGHT_BALANCE.standardGrams[i],n(d.OVERHAUL.carrySlow[i]*100),n(d.OVERHAUL.minimumCarrySlow[i]*100),d.OVERHAUL.tierIncome[i]])),
 '99%는 ±0~30%, 1%는 ±40~50% 무게 편차. 펫은 알의 실제·표준 무게를 상속하며 다른 무게는 별도 개체다. 일반 알 표는 드래곤 0.01%와 울트라 시크릿 0.001% 전용 알 추첨 이후에 적용된다.',
 '## 알 체력·부화',table(['단계','등급','체력','자동만 초','수동 1.5회/초 혼합 초'],d.STAGES.flatMap(s=>d.RARITIES.map((r,tier)=>{const hp=d.hatchHealth(s.id,tier),auto=d.autoDamageValue(s.id-1,s.id-1),manual=d.tapDamageValue(s.id-1)*1.5;return [s.id,r.name,hp,n(hp/auto),n(hp/(auto+manual))];}))),
 '동행 보너스 전, 해당 단계-1의 터치·자동·빈도 강화 기준. 기존 알은 남은 HP 비율을 유지해 신규 체력으로 이관한다.',
 '## 지급 보상',table(['단계','C 알 부화','C 알 판매','C 펫 판매','C 최초 발견','일반 도감','가상 광고'],d.STAGES.map(s=>[s.id,...['egg','saleEgg','salePet','discovery','stage','ad'].map(k=>d.stageReward(s.id,d.OVERHAUL.rewardMinutes[k]))])),
 `보상 등급 계수는 생산 계수와 같다. 가상 광고는 실제 수익화가 아니며 하루 ${d.OVERHAUL.adDailyLimit}회다. 주간 별가루는 최고 방문 스테이지 고정 수입 × ${d.OVERHAUL.weeklyMinutes.join('/')}분. 7일차 전용 S 알·펫 유지. FREEPET는 1회 한정 1스테이지 A 알이며 기존 사용 기록을 유지한다.`,
 '## 펫 721종','[CSV](balance-pets.csv)',table(petHeaders,petRows),
]);
const lengths=d.STAGES.map(s=>d.mainPath(s.id).slice(1).reduce((sum,p,i)=>{const q=d.mainPath(s.id)[i];return sum+Math.hypot(p.x-q.x,p.z-q.z);},0));
await save('balance-tempo-map',[
 '# 낮·밤·게임 템포와 맵 길이',generated,
 '## 시간',table(['항목','초'],[['낮',(d.BALANCE.nightInterval-d.BALANCE.nightDuration-d.BALANCE.normalNightDuration)/1000],['일반 밤',d.BALANCE.normalNightDuration/1000],['초기화 밤',d.BALANCE.nightDuration/1000],['전체 주기',d.BALANCE.nightInterval/1000],['밤 예고',d.BALANCE.warningSeconds],['보스 기상',d.ROUTE.bossWakeSeconds],['사망 연출',d.BALANCE.deathChoiceDelay/1000],['사망 선택',d.BALANCE.deathChoiceDuration/1000],['가상 광고',d.BALANCE.virtualAdDuration/1000],['생산 정산',d.BALANCE.petIncomeSeconds],['기본 운동 완료',d.OVERHAUL.trainingSeconds],['최대 운동 강화 완료',n(d.OVERHAUL.trainingSeconds/(1+20*d.OVERHAUL.trainingRatePerLevel))],['배트 재사용',d.BALANCE.batCooldown/1000],['부활 무적',d.BALANCE.reviveImmunity],['터치 최소 간격',d.BALANCE.tapInterval/1000],['스테이지 알림',d.ROUTE.bannerSeconds],['기본 동기화',d.BALANCE.roomSyncMs/1000]]),
 '서버 절대 시각 기준으로 낮 6분 → 일반 밤 3분(이동속도 30% 감소, 탐험 가능) → 초기화 밤 15초(귀환·입구 차단·필드 갱신). 보관한 알은 유지한다. time 강화는 밤 주기를 연장하지 않는다. 운동은 화면에서 진행하며 완료 후 추가 보너스가 없다. 부화 완료 이후 연출은 2.7초이며 HP를 깎는 시간과 별개다.',
 '## 오프라인',table(['경과 시간','유효 생산 시간'],[8,24,48,168].map(h=>[h,d.offlineSeconds(h*3600)/3600])),
 '첫 8시간 100%, 이후 50%, 최대 48시간분 정산. 생산 watermark를 저장해 같은 기간을 두 번 지급하지 않는다. 오프라인 생산은 XP를 주지 않는다.',
 '## 맵 길이',table(['단계','맵','시작 z','끝 z','종방향','굴곡 중심선'],d.routeSegments(1).map((s,i)=>[s.stage,d.STAGES[i].name,-s.start,-s.end,s.end-s.start,n(lengths[i])])),
 `종방향 합 ${19*d.ROUTE.length+d.ROUTE.finalLength}, 중심선 합 ${n(lengths.reduce((a,b)=>a+b,0))}. 탐험 x ±${d.BALANCE.mapX}, 기지 ±${d.BALANCE.baseMapX}, 마지막 이동 z=${d.BALANCE.mapFarZ}. 알·발판·주요 동선 좌표는 변경하지 않았다.`,
 '## 실제 이동',
 '`min(22, 3 + 1.1×log2(1+성장 속도)) × 트레일 이동 배율 × 탑승 배율 × 상태 배율 × 운반 배율`. 기지 기본 보행은 별도 유지. 물에서는 추가 0.5배. 운반 2배 가속은 제거했다. 진입은 성장 스탯만 사용하고 디버프는 진입 자격을 빼앗지 않는다.',
 '보스는 스테이지 고정 속도로 추격하며 네트워크 거리나 관전자 속도에 따라 가속하지 않는다. 요구 미달은 기상 후 빠른 추격으로 처리하고 알 획득 입력에서 즉사시키지 않는다. 풀숲 은폐 시 천천히 복귀, 기지 보관 성공 시 즉시 홈 복귀.',
]);
await save('balance-guide',[
 '# 밸런스 조정 가이드',generated,
 '## 원본 위치',
 '- `src/balance.ts`: 공유 성장·경제·부화·운반·오프라인 계산과 설정.\n- `src/data.ts`: ID·상품·721종 카탈로그와 계산 진입점.\n- `src/stage-data.ts`: 요구량·추격·맵 공격·길이.\n- `src/game.ts`: 실제 구매·지급·수집·운동·회수 판정.\n- `src/balance-migration.ts`: 자산을 유지하는 v2 이관.\n- `scripts/balance-chase.mjs`: 실제 경로 추격.\n- `scripts/balance-simulate.mjs`: 10개 행동 시나리오 고정 시드 경제 실험.',
 '## 계산 분리',
 `성장 = 강화 기본값 × (1+운동 진행률×${d.OVERHAUL.trainingCap}) × 트레일 성장 배율 × 동행 성장 배율 × 레벨 배율. 운동 0~1, 레벨 배율 최대 ${d.OVERHAUL.levelSpeedCap}. 탑승·피격·알 감속은 제외한다.`,
 '이동은 로그 환산, 수입과 피해는 각각 별도 선형 함수다. 서로 다른 단위를 공통 로그 완화에 넣던 방식을 제거했으며 수입·피해에는 현재 추가 로그 완화가 없다.',
 `펫 생산 = ${d.OVERHAUL.petIncomeBase} × ${d.OVERHAUL.stageIncomeGrowth}^(스테이지-1) × 등급 계수. 세 자리 합산. 생산 보조 강화 총합 레벨당 +${d.OVERHAUL.productionPerLevel*100}%p, 최대 ${d.OVERHAUL.productionCap}배. 중복 동행도 각 자리에서 생산한다.`,
 '## 가격',prices,
 '기준 팀 수입은 실제 장비와 독립이다. 좋은 펫을 얻어도 상점 가격이 오르지 않는다. 설계 대기시간과 실제 접속·획득·실패·보조 구매를 반영한 결과를 구분한다.',
 '## 저장과 수집',
 '재화·알·펫·무게·도감·쿠폰 기록을 삭제하거나 재추첨하지 않는다. 운동 원값은 legacyTrainingSpeed에 보존하고 새 진행률로 한 번만 이관한다. 일반 도감 완성은 C~S이며 SS~SSS와 Secret은 별도 수집 구역. 3000G 미만 탑승 금지와 무게별 개체·공통 표시 크기는 유지한다.',
 '## 경험치',
 `다음 레벨 XP=round(${d.PROGRESSION.xpBase}×level^${d.PROGRESSION.xpExponent}), 최대 레벨 없음. 귀환 XP 등급별 ${d.PROGRESSION.returnXP.join('/')}, 처음 부화한 종 ${d.PROGRESSION.hatchXP}, 알 종류 최초 발견 ${d.PROGRESSION.discoveryXP}, 신기록 ${d.PROGRESSION.distanceStep}거리마다 ${d.PROGRESSION.distanceXP}. 실패는 미정산 XP ${d.PROGRESSION.failureKeep*100}% 유지. 집기·내려놓기로 반복 XP를 주지 않는다.`,
 '## 재생성',
 '`node scripts/qa/balance-overhaul.mjs`, `node scripts/balance-chase.mjs`, `node scripts/balance-simulate.mjs --accounts=10000`, 빌드·브라우저 QA 이후 이 생성기를 실행한다. 가정과 미달 항목을 숨기지 않고 생성 숫자 표만 수동 수정하지 않는다.',
]);
console.log(`Exported ${d.MONGLES.length} pets, ${d.STAGES.length} stages, 20 upgrade levels and tempo/map documentation.`);
