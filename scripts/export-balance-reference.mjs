import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';

// Documentation generation only: use the game's actual tables and formulas.
const bundle=await build({stdin:{contents:`export * from './src/data.ts'; export {STAGES,STAGE_REQUIRED_SPEED,ROUTE,routeSegments,BOSS_MOVEMENT,WATER_TERRAIN} from './src/stage-data.ts'; export {mainPath} from './src/exploration-route.ts'; export {WEIGHT_BALANCE} from './src/weight.ts';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env.BASE_URL':'"/"'}});
const d=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const number=n=>Number.isInteger(n)?String(n):String(Number(n.toPrecision(10)));
const table=(headers,rows)=>[headers,headers.map(()=> '---'),...rows].map(row=>`| ${row.map(v=>String(v).replaceAll('|','/').replaceAll('\n',' ')).join(' | ')} |`).join('\n');
const stageName=p=>p.stageId?`${p.stageId}. ${d.STAGES[p.stageId-1].name}`:p.id==='mongle-320'?'스페셜':`이전 도감 · ${d.REGIONS[p.region].name}`;
const petRows=d.MONGLES.map((p,id)=>[id,p.name,stageName(p),d.RARITIES[p.tier].name,number(p.clickMultiplier),number(p.autoMultiplier),number(p.speedMultiplier),number((p.speedMultiplier-1)*d.BALANCE.mountSpeedBonusRate*100),d.BALANCE.petSellPrices[p.tier]*(p.region+1),d.BALANCE.discoveryRewards[p.tier]*(p.region+1),number(p.scale),p.sourceEggHp??'']);
const petHeaders=['ID','펫','소속','등급','터치 ×','자동 ×','속도 ×','탑승 속도 +%','판매 별가루','최초 발견 별가루','종별 원본 크기','능력 산정 알 HP'];
await writeFile('docs/balance-pets.csv','\uFEFF'+[petHeaders,...petRows].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n')+'\r\n','utf8');
const sections=[
'# 상점·재화·펫 전체 수치표',
'이 파일은 `node scripts/export-balance-reference.mjs`로 현재 코드에서 생성한다. 자동 테스트나 밸런스 시뮬레이션 결과가 아니다. 조정 위치와 공식은 [밸런스 가이드](balance-guide.md)를 참고한다. 소수 표시는 유효숫자 10자리이며 정수 가격은 그대로 표시한다. [펫 CSV](balance-pets.csv)는 스프레드시트에서 열 수 있다.',
'## 트레일 상점',
'영구 소유, 한 종류 장착. 아래 가격은 별가루이며 이미 보유한 트레일 재장착은 무료다.',
table(['ID','상품','가격','이동 배율'],d.TRAILS.map((t,i)=>[i,t.name,t.cost,t.multiplier])),
'## 업그레이드 상품',
'최대 레벨은 '+d.BALANCE.maxUpgrade+'이다. `UPGRADES.cost/growth`는 남아 있는 정의값이며 실제 결제 가격은 `GameState.cost → growthCost`의 아래 레벨별 표를 따른다. 시간 상품은 현재 UI에서 숨겨져 있지만 기존 저장·명령 정의는 남아 있다.',
table(['키','상품','효과 설명','UI 표시','정의 cost (미사용)','정의 growth (미사용)'],Object.entries(d.UPGRADES).map(([key,u])=>[key,u.name,u.description,key==='time'?'숨김':'표시',u.cost,u.growth])),
'### 실제 업그레이드 결제 가격',
'행은 구매 전 레벨→구매 후 레벨이다. 속도 외 업그레이드는 모두 같은 `middleCostShare`를 사용하므로 비용이 동일하다. 각 업그레이드는 자신의 현재 레벨로 비용을 계산한다.',
table(['레벨',...Object.entries(d.UPGRADES).map(([k,u])=>`${u.name} (${k})`)],Array.from({length:d.BALANCE.maxUpgrade},(_,level)=>[`${level} → ${level+1}`,...Object.keys(d.UPGRADES).map(k=>d.growthCost(k,level))])),
'## 등급별 기본 수치',
table(['등급','일반 알 확률 %','기준 무게 G','기본 감속 %','생산 계수','판매 기준','발견 보상 기준'],d.RARITIES.map((r,i)=>[r.name,r.chance,d.WEIGHT_BALANCE.standardGrams[i],d.BALANCE.carrySlowByTier[i]*100,d.ECONOMY.tierProduction[i],d.BALANCE.petSellPrices[i],d.BALANCE.discoveryRewards[i]])),
'일반 확률은 전용 시크릿 추첨 후 일반 알에 적용된다. 기존 시크릿 0.01%, 신규 시크릿 0.001%는 별도 전용 알이다. 판매·발견 보상은 펫의 기존 카탈로그 region+1을 추가로 곱한다. 재편된 스테이지 순서와 region은 별도이므로 실제 펫별 값은 아래 표를 사용한다.',
'## 스테이지 목표·수익·알 체력',
'목표 팀 수익은 `recommendedIncome` 원값이며 실제 지급액이 아니다. 실제 수익에는 보유 펫, 동행 장착, 업그레이드와 성장 완화가 적용된다. 단계 시간도 실제 완료 시간 보장이 아닌 비용 산정 계수다.',
table(['단계','맵','기본 권장속도','목표 팀 수익 원값/초','비용 산정 초','비용 계수','도감 완성 보상',...d.RARITIES.map(r=>`${r.name} 알 HP`)],d.STAGES.map((s,i)=>[s.id,s.name,d.STAGE_REQUIRED_SPEED[i],number(d.recommendedIncome(s.id)),d.ECONOMY.stageSeconds[i],d.ECONOMY.stageCostFactors[i],d.STAGE_COLLECTION_REWARDS[i],...d.RARITIES.map((_,tier)=>d.eggMaxHp({type:tier*5+Math.floor(i/4),stageId:s.id}))])),
'## 저장 알 타입별 부화·판매 보상',
'월드 외형 30종과 별개인 저장 type ID 표다. 월드 알 체력은 위 스테이지×등급 표로 계산한다. 같은 type이어도 무게·외형·스테이지가 달라질 수 있다. `weight`는 과거 이름의 기본 운반 배율이며 질량 G가 아니다.',
table(['type','기존 이름','등급','region','부화 별가루','판매 별가루','기본 운반 배율'],d.EGGS.map((e,i)=>[i,e.name,e.rarity,e.region,e.reward,Math.floor(e.reward*d.BALANCE.eggSellRatio),number(e.weight)])),
'## 고정 보상',
table(['항목','수치'],[['주간 1~7일 별가루',d.WEEKLY_EVENT.rewards.join(' / ')],['7일차 추가',`펫 ${d.WEEKLY_EVENT.petId} + 알 type ${d.WEEKLY_EVENT.eggType}`],['가상 광고 별가루',d.BALANCE.virtualAdReward],['가상 광고 시간 ms',d.BALANCE.virtualAdDuration],['이전 지역 도감 완성',d.BALANCE.regionCollectionRewards.join(' / ')],['전체 도감 완성',d.BALANCE.fullCollectionReward],['쿠폰 FREEPET','SS급 랜덤 알 1개, 계정당 1회'],['생산 정산 간격 초',d.BALANCE.petIncomeSeconds],['오프라인 최대 초',d.BALANCE.offlineCap],['알 보관 칸',d.BALANCE.inventory],['동행 자리',d.BALANCE.maxCompanions]]),
'## 펫 전체 능력치 ('+d.MONGLES.length+'종)',
'×1은 해당 능력의 추가 보너스가 없다는 뜻이다. 동행 효과는 배율끼리 곱하지 않고 `1 + Σ(개별 배율 − 1)`로 더한다. 탑승은 속도 전용 보너스를 적용하며 개체 질량 3000G 이상이어야 한다. 원본 크기는 최종 표시 크기가 아니다. 실제 표시는 원본×무게비^0.5×0.6, 모델 긴 변 최소 0.65이며 농장·동행·탑승에 동일 적용한다. 개체 무게는 저장 데이터이므로 종별 표의 고정 능력치와 분리된다.',
table(petHeaders,petRows),
'## 원본 상수 묶음',
'편집 대상은 각 코드 파일이다. 아래는 참고용 스냅샷이며 이 JSON을 바꿔도 게임에 적용되지 않는다. `farmPetMaxSize`, 일부 과거 성장 상수와 상품의 cost/growth처럼 호환용 정의가 남아 있을 수 있으므로 실행 공식과 위 설명을 우선한다.',
'```json\n'+JSON.stringify(Object.fromEntries(['BALANCE','ECONOMY','PROGRESSION','PET_ABILITIES','PET_DEFENSE','EGG_HEALTH','WEIGHT_BALANCE','COUPONS','WEEKLY_EVENT'].map(k=>[k,d[k]])),null,2)+'\n```',
];
await writeFile('docs/balance-reference.md',sections.join('\n\n')+'\n','utf8');
const lengths=d.STAGES.map(s=>{const points=d.mainPath(s.id);return points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.z-points[i].z),0);});
const round=n=>Number(n.toFixed(2));
const tempo=[
'# 낮·밤, 게임 템포와 맵 길이',
'현재 코드에서 추출한 설정값이다. 월드 거리 단위는 실제 미터로 환산하지 않는다. 이동 시간은 거리÷일정 속도의 산술 참고값이며 실기기 측정 또는 실제 클리어 시간 예측이 아니다.',
'## 낮·밤',
table(['항목','값','조정 위치'],[['한 주기',`${d.BALANCE.nightInterval/1000}초`, 'BALANCE.nightInterval'],['밤 지속',`${d.BALANCE.nightDuration/1000}초`,'BALANCE.nightDuration'],['낮 지속',`${(d.BALANCE.nightInterval-d.BALANCE.nightDuration)/1000}초`,'nightInterval − nightDuration'],['밤 예고',`${d.BALANCE.warningSeconds}초 전`,'BALANCE.warningSeconds'],['밤 예고 토스트','곧 밤이 와요! / 약 3.5초 표시','src/main.ts'],['밤 처리','강제 기지 귀환·입구 차단·필드 알과 보스 새 주기','GameState.updateNight / server room cycle']]),
'주기는 접속 시점부터 새로 세지 않고 절대 시간에 맞춘다. 300초 경계부터 15초는 밤, 나머지 285초는 낮이다. 늦게 접속하면 남은 낮 시간이 짧을 수 있다. 밤에는 필드가 갱신되며 보관 완료한 알·펫은 유지된다. `duration=45`, 시간 강화당 +5초와 deadline 필드는 남아 있지만 현재 강제 귀환의 실제 타이머는 밤 주기이며 45초 만료로 자동 귀환시키는 분기는 없다.',
'## 조작·추격·회복·성장 템포',
table(['항목','현재 값','비고'],[
 ['알 꺼내기 C/B/A/S/SS/SSS/SECRET',d.BALANCE.rareEggPickupSeconds.join(' / ')+'초','이동·피격·거리 이탈 시 준비 취소'],
 ['보스 기상',d.ROUTE.bossWakeSeconds+'초','권장 미달 도난 즉사는 기상 대기 예외'],
 ['정상 추격 속도',`${d.ROUTE.baseRecommendedSpeed}~${d.BOSS_MOVEMENT.qualifiedChaseMaxSpeed}, 가속 상한 ${d.BOSS_MOVEMENT.maxSpeed}`,'단계·거리·목표 도주속도 반영'],
 ['숨은 뒤 보스 복귀',d.BOSS_MOVEMENT.returnSpeed+' 거리/초','플레이어가 알 보관에 성공한 경우는 즉시 홈 이동'],
 ['스테이지 진입 알림',d.ROUTE.bannerSeconds+'초','탐험마다 단계당 한 번'],
 ['배트 재사용',d.BALANCE.batCooldown/1000+'초','배트 쿨다운'],
 ['배트 비행 / 넘어짐',`${d.BALANCE.batFlightSeconds} / ${d.BALANCE.knockdownMs/1000}초`,'피격 연출'],
 ['사망 연출 / 선택 창',`${d.BALANCE.deathChoiceDelay/1000} / ${d.BALANCE.deathChoiceDuration/1000}초`,'선택하지 않으면 귀환'],
 ['가상 광고 부활',d.BALANCE.virtualAdDuration/1000+'초','실제 광고 수익화가 아닌 가상 광고'],
 ['부활 무적',d.BALANCE.reviveImmunity+'초','기존 부활 규칙'],
 ['터치 최소 간격',d.BALANCE.tapInterval/1000+'초','최대 접수율 '+round(1000/d.BALANCE.tapInterval)+'/초, 실제 수동 연타와 별개'],
 ['기본 터치 피해 / 기본 자동 DPS',`${d.BALANCE.baseTap} / ${d.BALANCE.baseAutoDamage*d.BALANCE.baseAutoRate}`,'강화·동행 보너스 이전'],
 ['부화 연출','1.05초에 탄생, 2.7초에 연출 종료','src/world.ts, 알 HP를 깎는 시간과 별개'],
 ['운동 원값 획득/초',`${d.BALANCE.trainingPerSecond} + ${d.BALANCE.trainingPerLevel} × 운동 레벨`,'운동 중 연속 누적, 표시 스탯은 별도 배율·완화 적용'],
 ['생산 지급 간격',d.BALANCE.petIncomeSeconds+'초','소수 잔여액은 누적'],
 ['오프라인 생산 상한',d.BALANCE.offlineCap/3600+'시간','부화 자동 진행에도 오프라인 정산 적용'],
 ['주간 수령 경계','한국 시간 매일 00:00','7회 수령 주기, 미접속 시 일차 자동 진행 아님'],
 ['이동 시뮬레이션 분할',round(d.PROGRESSION.simulationStep*1000)+'ms','1/60초, 렌더 FPS 보장 아님'],
 ['클라이언트 기본 동기화',d.BALANCE.roomSyncMs+'ms','응답 지연은 별도'],
 ['물 이동 배율',d.WATER_TERRAIN.speedMultiplier,'물 안에서 50% 속도'],
]),
'부화 시간은 고정 대기시간이 아니다. 자동만 사용할 때의 이론상 시간은 남은 HP / 현재 DPS이며, 수동 입력을 섞으면 `남은 HP / (DPS + 초당 유효 터치 수 × 터치 피해)`로 근사한다. 예: 초기 C 알 12HP, 기본 자동 DPS 1이면 약 12초이며 기본 터치 피해 3만으로는 4회다. 획득 버튼과 2.7초 연출은 별도다.',
'## 맵 크기',
table(['항목','거리 단위','원본'],[['1~19단계 각각의 종방향 길이',d.ROUTE.length,'ROUTE.length / exploration-route.routeLength'],['20단계 길이',d.ROUTE.finalLength,'ROUTE.finalLength / exploration-route.routeLength'],['스테이지 전체 종방향 합',19*d.ROUTE.length+d.ROUTE.finalLength,'19×48+225'],['원점에서 입구까지',d.ROUTE.entrance,'ROUTE.entrance'],['원점에서 설계 끝까지',d.ROUTE.entrance+19*d.ROUTE.length+d.ROUTE.finalLength,'최종 설계 z=-1143'],['이동 가능한 최외곽 z',d.BALANCE.mapFarZ,'설계 끝보다 3 안쪽'],['탐험 영역 x 범위',`${-d.BALANCE.mapX} ~ ${d.BALANCE.mapX} (전체 ${d.BALANCE.mapX*2})`,'BALANCE.mapX'],['기지 x 범위',`${-d.BALANCE.baseMapX} ~ ${d.BALANCE.baseMapX} (전체 ${d.BALANCE.baseMapX*2})`,'BALANCE.baseMapX'],['기지 판정 z / 하단 z',`${d.BALANCE.baseMinZ} / ${d.BALANCE.mapNearZ}`,'건물·울타리 실제 이동 공간과 별개'],['메인 길 중심선 전체',round(lengths.reduce((a,b)=>a+b,0)),'좌우 굴곡 포함, 입구 이전 6 제외']]),
'아래 중심선 길이는 `mainPath`의 꺾인 선분 길이를 합한 값이다. x 전체 범위는 맵 이동 경계이며 메인 길의 유효 폭이 아니다. 실제 이동은 지형·단차·물·기지 충돌·조작과 선택 경로에 따라 달라진다. 최대 기본 보행 10, 알 운반 배율 2일 때의 기준 20으로 각각 계산했다. 탑승 보너스·낮은 성장 스탯·알 무게 감속은 이 참고 시간에 넣지 않았다.',
table(['단계','맵','시작 z','설계 끝 z','종방향 길이','굴곡 중심선 길이','중심선 편도 @10 초','중심선 편도 @20 초'],d.routeSegments(1).map((s,i)=>[s.stage,d.STAGES[i].name,-s.start,-s.end,s.end-s.start,round(lengths[i]),round(lengths[i]/10),round(lengths[i]/20)])),
`모든 스테이지 중심선을 끝까지 걷는 거리의 합은 약 ${round(lengths.reduce((a,b)=>a+b,0))}이다. 속도 10으로 편도 약 ${round(lengths.reduce((a,b)=>a+b,0)/10)}초다. 실제 알 위치는 설계 끝보다 앞이며 최종 3단위는 이동 경계 밖이므로 실제 알 회수 왕복 시간과 동일하지 않다.`,
'## 조정할 때 함께 볼 값',
'낮 시간을 줄이면 왕복 이동·알 꺼내기·보스 기상 시간을 함께 고려한다. 맵 길이는 `src/stage-data.ts`의 ROUTE만 바꾸지 말고 `src/exploration-route.ts`의 routeLength와 기존 위치 저장 마이그레이션도 맞춰야 한다. 현재 두 파일에 48/225가 각각 들어 있다. `ROUTE.targetTravelSeconds=20`은 현재 맵 길이 또는 전체 탐험 시간을 자동으로 결정하는 값이 아니다.',
];
await writeFile('docs/balance-tempo-map.md',tempo.join('\n\n')+'\n','utf8');
console.log(`Exported ${d.MONGLES.length} pets, ${d.EGGS.length} egg types, ${d.STAGES.length} stages and ${d.BALANCE.maxUpgrade} upgrade price rows.`);
