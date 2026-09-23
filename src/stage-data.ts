export type Shape='ellipse'|'line'|'cone'|'ring';
export type Targeting='predict'|'fixed'|'track'|'sweep';
export type Effect='hit'|'wind'|'ink'|'pull'|'stone'|'grab'|'delay'|'dot'|'ice'|'dust'|'web';
export type HazardDefinition={id:string;displayName:string;stageId:number;damage:number;damagePercent:number;telegraphDuration:number;activeDuration:number;cooldown:number;knockback:number;slowMultiplier:number;slowDuration:number;shape:Shape;targetingType:Targeting;carryTelegraphBonus:number;radius:number;width:number;length:number;blockable:boolean;effect:Effect;count:number;freezeBefore:number;visual:string;minTelegraph:number};
export const HAZARD_BALANCE={environmentSection:32,environmentX:2.8,environmentStart:21,environmentSpacing:8,movingRadius:1.1,crossingSeconds:4,laneHalfWidth:6,step:1/60,maxActive:2,recovery:.4,spawnDelay:.8,spawnGap:1.1,trackFreeze:.3,prediction:.3,windSpeed:1.5,pullSpeed:1.4,metalPull:1.6,centerRadius:.65,dotInterval:1,stoneSeconds:1.5,stoneDuration:1.5,grabDuration:1,escapeInputBonus:2,inputDelay:.5,inkDuration:1.2,iceCarryRate:1.4,dustDrop:5,projectileSpeed:2.2,finalSecretCooldown:.9,phaseDistances:[35,80],waveGap:.8,coverRadius:.85,coverX:3.5,coverSpacing:12};
type StageRow=[string,number,number,string,string,number,number];
const rows:StageRow[]=[
 ['몽글 초원',0xc9dda0,0xf2d482,'꽃밭 · 풍차 · 건초','hay',1,10],
 ['장난감 왕국',0xddb28c,0x78bdcd,'블록 성 · 태엽길 · 기차','train',1,10],
 ['얕은 산호 바다',0x8ed8cd,0xf5a5ab,'산호 · 물결 · 문어','coral',1,10],
 ['화산 입구',0x625e63,0xff9758,'현무암 · 붉은 틈 · 증기','steam',1,10],
 ['크라켄 심해',0x355979,0x87f3cc,'발광 산호 · 촉수 · 해저 유적','tentacle',11,22],
 ['유령 학교',0x827786,0xc4efba,'책상 · 사물함 · 긴 복도','book',11,22],
 ['네온 사이버시티',0x354569,0xe781e6,'전자 도로 · 드론 · 홀로그램','laser',11,22],
 ['황금 사막왕국',0xd9b16d,0x81b9ce,'피라미드 · 모래 · 황금 신전','scorpion',11,22],
 ['태초의 공룡섬',0x759379,0xe3cbaa,'양치식물 · 화석 절벽 · 늪','dinosaur',23,34],
 ['도깨비 달마을',0x574765,0xffac87,'기와집 · 붉은 달 · 도깨비불','flame',23,34],
 ['올림포스 신전',0xd9ddec,0xf4d474,'대리석 · 구름다리 · 번개','lightning',23,34],
 ['외계인 51구역',0x5f6589,0xa3f6b9,'UFO · 연구소 · 형광 액체','ufo',23,34],
 ['스팀펑크 공중도시',0xb28d69,0x9bd7d0,'톱니 · 증기기관 · 비행선','gear',35,46],
 ['영원의 빙하',0xb1dbe8,0xecdfff,'빙산 · 오로라 · 수정 동굴','ice',35,46],
 ['뒤죽박죽 꿈나라',0xd4bbdc,0xffe5aa,'공중 침대 · 거꾸로 시계','hand',35,46],
 ['방사능 폐허',0x6d8058,0xc2f872,'녹색 안개 · 폐허 · 변이 식물','vine',35,46],
 ['곤충 소인국',0x91ad63,0xe9c88f,'거대한 풀잎 · 이슬 · 버섯','mantis',47,57],
 ['고철 로봇행성',0x7c8088,0xefbd71,'자석 크레인 · 고철산','magnet',47,57],
 ['은하수 천문대',0x565380,0xb8daff,'작은 행성 · 별자리 · 우주열차','meteor',47,57],
 ['공허와 창조주의 정원',0x393145,0xf9da87,'공허의 길 → 기억의 정원 → 창조자의 문','creation',60,60],
];
export const STAGES=rows.map(([name,color,accent,description,kit,minLevel,maxLevel],i)=>({id:i+1,name,color,accent,description,kit,minLevel,maxLevel,safe:i<4}));
export const STAGE_DIFFICULTY={minimumDamage:40,damagePerStage:20,recommendedSpeedMultiplier:2};
export const STAGE_STEPS=[{damage:1,cooldown:1,density:1,tint:1.08},{damage:1.25,cooldown:.85,density:1.2,tint:1},{damage:1.5,cooldown:.7,density:1.4,tint:.88}];
export const FINAL_GUARDIAN={stage:20,scale:3,bossEndOffset:12,eggEndOffset:23,minimumEggTier:4};
export function stageDamage(stage:number,step=1){return Math.round((STAGE_DIFFICULTY.minimumDamage+(stage-1)*STAGE_DIFFICULTY.damagePerStage)*STAGE_STEPS[step-1].damage);}
export function routeStep(z:number,offset:number,length:number){return Math.min(3,Math.max(1,Math.floor((-z-offset-ROUTE.entrance)/(length/3))+1));}
function attack(stageId:number,id:string,displayName:string,damage:number,telegraphDuration:number,shape:Shape,extra:Partial<HazardDefinition>={}):HazardDefinition{
 const definition:HazardDefinition={id,displayName,stageId,damage,damagePercent:stageId>=13?.08:stageId>=9?.05:stageId>=5?.03:0,telegraphDuration,activeDuration:.35,cooldown:6,knockback:.5,slowMultiplier:.8,slowDuration:.5,shape,targetingType:'predict',carryTelegraphBonus:.2,radius:1.2,width:.55,length:10,blockable:false,effect:'hit',count:1,freezeBefore:.3,visual:STAGES[stageId-1].kit,minTelegraph:shape==='line'?1:1.2,...extra};
 if(definition.damage>0||definition.damagePercent>0)definition.damage=Math.max(definition.damage,stageDamage(stageId));
 return definition;
}
export const HAZARDS:HazardDefinition[]=[
 attack(1,'hay','굴러오는 건초',10,1.5,'ellipse',{targetingType:'sweep',knockback:.35,damagePercent:0,visual:'hay'}),
 attack(2,'train','태엽 기차',10,1.5,'line',{targetingType:'sweep',knockback:.6,damagePercent:0,visual:'train'}),
 attack(3,'wave','얕은 파도',0,2,'line',{effect:'wind',activeDuration:2,damagePercent:0}),
 attack(3,'ink','문어 먹물',10,1.5,'ellipse',{effect:'ink',damagePercent:0,visual:'ink'}),
 attack(4,'safe-steam','붉은 증기',0,1.2,'ellipse',{knockback:.65,damagePercent:0,visual:'steam'}),
 attack(4,'lava-breath','화산 수호자 불숨',12,1.5,'cone',{radius:3,visual:'steam'}),
 attack(5,'tentacle','촉수 내려찍기',25,1.5,'ellipse',{visual:'tentacle',radius:1.3}),
 attack(5,'sweep','촉수 가로 휩쓸기',20,2,'line',{targetingType:'fixed',blockable:true,visual:'sweep'}),
 attack(6,'locker','사물함 습격',20,1.2,'cone',{targetingType:'fixed',radius:3,visual:'hand'}),
 attack(6,'book','날아오는 책',20,1,'line',{blockable:true,targetingType:'fixed',visual:'book'}),
 attack(7,'laser','보안 레이저',18,1,'line',{targetingType:'fixed',count:3,visual:'laser'}),
 attack(7,'drone','추적 드론',25,1.5,'ellipse',{targetingType:'track',minTelegraph:1.5,visual:'drone'}),
 attack(8,'scorpion','전갈 꼬리',25,1.3,'ellipse',{slowMultiplier:.9,slowDuration:2,visual:'scorpion'}),
 attack(8,'sandstorm','모래폭풍',0,2,'line',{damagePercent:0,effect:'wind',activeDuration:2,visual:'sand'}),
 attack(9,'stomp','공룡 발구르기',35,2,'ellipse',{radius:2,minTelegraph:2,visual:'dinosaur'}),
 attack(9,'raptor','랩터 돌진',30,1,'line',{blockable:true,targetingType:'fixed',visual:'raptor'}),
 attack(10,'wisps','도깨비불',10,1.5,'ellipse',{targetingType:'track',activeDuration:2,count:3,blockable:true,minTelegraph:1.5,visual:'flame'}),
 attack(10,'club','방망이 그림자',30,1.5,'line',{effect:'dust',visual:'club'}),
 attack(11,'lightning','제우스의 번개',30,1.4,'ellipse',{visual:'lightning'}),
 attack(11,'medusa','메두사 시선',0,1.5,'cone',{targetingType:'fixed',radius:4,damagePercent:0,effect:'stone',activeDuration:3,visual:'statue'}),
 attack(12,'ufo','UFO 견인 광선',20,1.5,'ellipse',{targetingType:'fixed',radius:2.2,effect:'pull',activeDuration:3,visual:'ufo'}),
 attack(12,'turret','외계 포탑',25,1,'line',{targetingType:'fixed',effect:'hit',activeDuration:2,blockable:true,visual:'orb'}),
 attack(13,'steam','증기 배출구',20,1.2,'line',{targetingType:'fixed',knockback:1.2,visual:'steam'}),
 attack(13,'gear','회전 톱니바퀴',15,1.2,'ellipse',{targetingType:'sweep',activeDuration:2,visual:'gear'}),
 attack(14,'icicle','낙하 고드름',25,1.3,'ellipse',{visual:'icicle'}),
 attack(14,'thin-ice','깨지는 얼음',20,2,'ellipse',{targetingType:'fixed',effect:'ice',activeDuration:1,visual:'ice'}),
 attack(15,'nightmare','침대 밑 악몽손',20,1.5,'ellipse',{effect:'grab',minTelegraph:1.3,visual:'hand'}),
 attack(15,'clock','거꾸로 시계',0,1.5,'ellipse',{targetingType:'fixed',damagePercent:0,effect:'delay',radius:1.3,activeDuration:2,visual:'clock'}),
 attack(16,'vine','돌연변이 덩굴',20,1.2,'line',{visual:'vine'}),
 attack(16,'puddle','방사능 웅덩이',5,1.2,'ellipse',{targetingType:'fixed',damagePercent:0,effect:'dot',activeDuration:4,knockback:0,slowMultiplier:1,slowDuration:0,visual:'puddle'}),
 attack(17,'mantis','사마귀 낫',30,1.4,'cone',{targetingType:'fixed',radius:3,visual:'mantis'}),
 attack(17,'web','거미줄',0,1.2,'line',{damagePercent:0,effect:'web',slowMultiplier:.6,slowDuration:2,visual:'web'}),
 attack(18,'magnet','자석 크레인',20,1.5,'ellipse',{targetingType:'fixed',effect:'pull',radius:2.3,activeDuration:3,visual:'magnet'}),
 attack(18,'crusher','폐기물 압축기',35,2,'line',{targetingType:'fixed',width:1.4,minTelegraph:2,visual:'crusher'}),
 attack(19,'meteors','유성우',15,2,'ellipse',{count:3,minTelegraph:2,visual:'meteor'}),
 attack(19,'solar','태양풍',0,2,'line',{damagePercent:0,effect:'wind',blockable:true,activeDuration:2,visual:'solar'}),
 attack(20,'void-hand','공허 손',25,1.5,'ellipse',{effect:'ice',visual:'void'}),
 attack(20,'memory-tentacle','기억의 촉수',25,1.5,'ellipse',{visual:'tentacle'}),
 attack(20,'memory-lightning','기억의 번개',30,1.4,'ellipse',{visual:'lightning'}),
 attack(20,'memory-ufo','기억의 견인',20,1.5,'ellipse',{targetingType:'fixed',effect:'pull',radius:2.2,activeDuration:3,visual:'ufo'}),
 attack(20,'memory-meteor','기억의 유성',15,2,'ellipse',{count:3,minTelegraph:2,visual:'meteor'}),
 attack(20,'creation-wave','창조의 황금 파동',0,2,'ring',{damagePercent:.2,targetingType:'fixed',activeDuration:3,radius:4,minTelegraph:2,visual:'creation'}),
 attack(9,'tar-pool','공룡섬 타르 늪',40,1.5,'ellipse',{effect:'dot',activeDuration:3,visual:'puddle'}),
 attack(10,'moon-bell','달마을 종의 충격',40,1.4,'ring',{visual:'clock',radius:2}),
 attack(11,'fallen-column','무너지는 대리석 기둥',50,1.6,'ellipse',{visual:'crusher'}),
 attack(12,'alien-acid','외계 배양액 분출',40,1.4,'ellipse',{effect:'dot',activeDuration:3,visual:'puddle'}),
 attack(13,'pressure-piston','증기 피스톤',50,1.5,'ellipse',{visual:'crusher'}),
 attack(13,'boiler-coil','과열 보일러 코일',40,1.2,'ellipse',{visual:'lightning'}),
 attack(14,'blizzard-vent','빙하 눈보라 틈',0,1.5,'ellipse',{damagePercent:0,effect:'wind',activeDuration:3,visual:'steam'}),
 attack(14,'ice-boulder','굴러오는 얼음 바위',50,1.8,'ellipse',{visual:'orb'}),
 attack(15,'dream-spindle','꿈실 물레',40,1.2,'ellipse',{visual:'gear'}),
 attack(15,'falling-bed','떨어지는 꿈 침대',50,1.8,'ellipse',{visual:'crusher'}),
 attack(16,'spore-burst','변이 포자 분출',40,1.3,'ellipse',{effect:'dot',activeDuration:3,visual:'steam'}),
 attack(16,'toxic-drum','굴러오는 폐기물 통',50,1.6,'ellipse',{visual:'orb'}),
 attack(17,'wasp-patrol','말벌 순찰길',40,1.2,'ellipse',{visual:'drone'}),
 attack(17,'falling-dew','떨어지는 거대 이슬',40,1.7,'ellipse',{effect:'ice',visual:'icicle'}),
 attack(17,'thorn-snap','가시풀 덫',50,1.1,'ellipse',{effect:'grab',visual:'vine'}),
 attack(18,'scrap-gear','고철 절단 톱니',50,1.3,'ellipse',{visual:'gear'}),
 attack(18,'scrap-cart','폐부품 운반차',40,1.6,'ellipse',{visual:'train'}),
 attack(18,'arc-coil','방전 코일',40,1.2,'ellipse',{visual:'lightning'}),
 attack(19,'gravity-well','중력 우물',40,1.6,'ellipse',{effect:'pull',visual:'ufo'}),
 attack(19,'comet-crossing','혜성 횡단로',50,1.5,'ellipse',{visual:'orb'}),
 attack(19,'constellation-ray','별자리 광선',40,1.4,'line',{visual:'laser'}),
];
export const STAGE_ENVIRONMENT_IDS=[
 ['hay'],['train'],['ink'],['lava-breath'],
 ['tentacle','sweep'],['locker','book'],['laser','drone'],['scorpion','sandstorm'],
 ['stomp','raptor','tar-pool'],['wisps','club','moon-bell'],['lightning','medusa','fallen-column'],['ufo','turret','alien-acid'],
 ['steam','gear','pressure-piston','boiler-coil'],['icicle','thin-ice','blizzard-vent','ice-boulder'],['nightmare','clock','dream-spindle','falling-bed'],['vine','puddle','spore-burst','toxic-drum'],
 ['mantis','web','wasp-patrol','falling-dew','thorn-snap'],['magnet','crusher','scrap-gear','scrap-cart','arc-coil'],['meteors','solar','gravity-well','comet-crossing','constellation-ray'],['void-hand','memory-tentacle','memory-lightning','memory-meteor','creation-wave'],
];
export function stagePatterns(stage:number,_z=0){return STAGE_ENVIRONMENT_IDS[stage-1].map(id=>HAZARDS.find(d=>d.stageId===stage&&d.id===id)!);}
export function environmentPlacement(stage:number,lane:number,offset=0){
 const count=STAGE_ENVIRONMENT_IDS[stage-1].length,length=stage===20?ROUTE.finalLength:ROUTE.length;
 return {x:lane%3===2?0:(lane%2?-1:1)*HAZARD_BALANCE.environmentX,z:-offset-ROUTE.entrance-length*(lane+1)/(count+1)};
}
export type Cover={x:number;z:number;radius:number};
export const STAGE_COVERS:Cover[]=Array.from({length:12},(_,i)=>({x:(i%2?1:-1)*HAZARD_BALANCE.coverX,z:-12-i*HAZARD_BALANCE.coverSpacing,radius:HAZARD_BALANCE.coverRadius}));

// Connected expedition: selected stage is the entrance, not a repeated full map.
export const ROUTE={entrance:6,length:96,finalLength:450,bossKnockback:2.4,bossKnockbackPerSpeed:2.4,bossKnockbackSeconds:.28,bossReach:2,bossAngryScale:1.5,bossWindup:.65,bossWakeSeconds:5,bossDamage:STAGE_DIFFICULTY.minimumDamage,bossDamagePerStage:STAGE_DIFFICULTY.damagePerStage,bannerSeconds:3,recommendedCarryRatio:.65,targetTravelSeconds:20,baseRecommendedSpeed:1.5};
export function routeSegments(start=1){return STAGES.slice(start-1).map(s=>{const offset=(s.id-start)*ROUTE.length;return {stage:s.id,offset,start:ROUTE.entrance+offset,end:ROUTE.entrance+offset+(s.id===20?ROUTE.finalLength:ROUTE.length),home:30+offset};});}
export function routeStage(start:number,z:number){return Math.min(20,start+Math.max(0,Math.floor((-z-ROUTE.entrance)/ROUTE.length)));}
export const ROUTE_FAR_Z=-(ROUTE.entrance+19*ROUTE.length+ROUTE.finalLength-3);

// Early guardians leave room to escape with an egg before movement upgrades.
const EARLY_GUARDIAN_SPEEDS=[1.5,.95,1.15,1.4,1.7,2.1,2.6,3.1,3.7];
export function guardianSpeed(stage:number){return (EARLY_GUARDIAN_SPEEDS[stage-1]??(2.3+stage*.2))*(stage===1?1:1.5);}
export function recommendedRouteSpeed(_depth:number,stage:number){return ROUTE.baseRecommendedSpeed*STAGE_DIFFICULTY.recommendedSpeedMultiplier**(stage-1);}
export const GUARDIAN_ATTACKS=new Set(['hay','train','ink','lava-breath','tentacle','sweep','locker','book','drone','scorpion','stomp','raptor','wisps','club','lightning','medusa','ufo','nightmare','vine','mantis','magnet','void-hand','memory-tentacle','memory-lightning','memory-ufo','memory-meteor','creation-wave']);

