export interface ExplorerAppearance {
 skinId:string;faceId:string;hairId:string;hairColorId:string;outfitId:string;accentColorId:string;accessoryId:string;backpackId:string;
 eyeId:string;eyebrowId:string;mouthId:string;cheekId:string;
 headAccessoryId:string;faceAccessoryId:string;neckAccessoryId:string;
}
// Reserved for future cosmetic collections, never an inventory/combat item.
export type ExplorerPreviewProp='map'|'compass'|'bottle'|'torch'|'lantern'|'camera'|'binoculars';
export type AppearanceKey=keyof ExplorerAppearance;
export type AppearanceOption={id:string;label:string;color?:string;unlockStage?:number};
const colors=(prefix:string,values:string[]):AppearanceOption[]=>values.map((color,i)=>({id:`${prefix}-${i}`,label:`색상 ${i+1}`,color}));
const options=(prefix:string,labels:string[]):AppearanceOption[]=>labels.map((label,i)=>({id:`${prefix}-${i}`,label}));
export const APPEARANCE_OPTIONS:Record<AppearanceKey,AppearanceOption[]>={
 skinId:colors('skin',['#ffe6c5','#f2cfaa','#ddb18c','#c89470','#a67152','#86563e','#613e30','#432d27','#b59179','#795e51']),
 faceId:options('face',['기본','무표정','활발','졸림','장난','씩씩','미소','반짝']),
 hairId:options('hair',['짧은 머리','덮은 머리','가르마','짧은 곱슬','단발','긴 생머리','양갈래','낮은 포니테일','단정한 머리','삐죽 머리','옆 가르마','높은 포니테일','스포츠컷','둥근 단발','뻗친 단발','앞머리 중간 머리','긴 웨이브','반묶음']),
 hairColorId:colors('haircolor',['#302b29','#64422f','#a66f40','#e9c573','#919493','#f1e9d7','#ac4543','#497ca7','#60815a','#cd8daa','#c38251','#88729c']),
 outfitId:options('outfit',['신입 탐험가','숲 탐험가','캠핑 탐험가','농장 작업복','캐주얼 후드','등산복','레인 탐험가','우주 탐험가','바다 탐험가','설원 탐험가','사막 탐험가','도시 탐험가','복고 탐험가']),
 accentColorId:colors('accent',['#728f53','#d48052','#558dac','#c98c9e','#d8bb63','#8a76a0','#434b4c','#eee3cc','#b95350','#78aaa0']),
 accessoryId:options('accessory',['없음','캡모자','버킷햇','고글','헤드폰','스카프','안경','동물 귀']),
 backpackId:options('backpack',['탐험 가방','캠핑 백팩','알 수집 가방','우주 가방','숲 가방','바다 가방','동물 가방','미니 가방']).map((p,i)=>({...p,unlockStage:[1,1,1,17,5,9,13,1][i]})),
 eyeId:options('eye',['동그란 눈','큰 동그란 눈','반달 눈','처진 눈','올라간 눈','작은 눈','졸린 눈','초롱 눈','집중한 눈','장난꾸러기 눈','무표정 눈','만화 눈']),
 eyebrowId:options('brow',['일자','부드러운 곡선','짧은 눈썹','두꺼운 눈썹','올라간 눈썹','처진 눈썹','씩씩한 눈썹','둥근 눈썹']),
 mouthId:options('mouth',['작은 미소','일자','활짝 웃음','작은 동그라미','열린 입','장난 미소','작은 브이','곡선 미소','무표정','작은 점']),
 cheekId:options('cheek',['없음','둥근 볼터치','작은 볼터치','주근깨','양쪽 점','작은 밴드','별 스티커','흙먼지']),
 headAccessoryId:options('headwear',['없음','캡모자','뒤집은 캡','버킷햇','탐험가 모자','비니','밀짚모자','헤드폰','고글','작은 왕관','동물 귀','우주 헬멧']),
 faceAccessoryId:options('facewear',['없음','둥근 안경','사각 안경','선글라스','작은 고글','코 밴드','볼 밴드','작은 마스크']),
 neckAccessoryId:options('neckwear',['없음','빨간 스카프','파란 스카프','탐험가 손수건','작은 목도리','메달']),
};
export function normalizeAppearance(value:unknown,legacy=0):ExplorerAppearance{
 const source=value&&typeof value==='object'?value as Partial<ExplorerAppearance>:{};
 const result={} as ExplorerAppearance;
 for(const key of Object.keys(APPEARANCE_OPTIONS) as AppearanceKey[])result[key]=APPEARANCE_OPTIONS[key].some(o=>o.id===source[key])?source[key]!:APPEARANCE_OPTIONS[key][0].id;
 if(!value){result.accessoryId='accessory-1';result.accentColorId=`accent-${Math.max(0,Math.min(2,legacy))}`;}
 // Keep legacy IDs intact; derive new independent slots only when absent.
 const f=Number(result.faceId.split('-')[1]);
 const faces=[[0,0,0,0],[10,2,1,0],[1,1,2,1],[6,5,8,0],[9,4,5,0],[8,6,0,0],[2,1,7,2],[7,7,3,0]][f];
 (['eyeId','eyebrowId','mouthId','cheekId'] as const).forEach((key,i)=>{if(!source[key])result[key]=APPEARANCE_OPTIONS[key][faces[i]].id;});
 const old=Number(result.accessoryId.split('-')[1]);
 if(!source.headAccessoryId)result.headAccessoryId=`headwear-${[0,1,3,8,7,0,0,10][old]}`;
 if(!source.faceAccessoryId)result.faceAccessoryId=old===6?'facewear-1':'facewear-0';
 if(!source.neckAccessoryId)result.neckAccessoryId=old===5?'neckwear-3':'neckwear-0';
 return result;
}
export const appearanceIndex=(a:ExplorerAppearance,key:AppearanceKey)=>APPEARANCE_OPTIONS[key].findIndex(o=>o.id===a[key]);
export function appearanceOptions(key:AppearanceKey,stage=1,current?:string){return APPEARANCE_OPTIONS[key].filter(o=>(o.unlockStage??1)<=stage||o.id===current);}
export function randomAppearance(random=()=>Math.random(),aggression=0,stage=1):ExplorerAppearance{
 const result=normalizeAppearance({});
 const pick=(key:AppearanceKey,ids?:string[])=>{const pool=appearanceOptions(key,stage).filter(o=>!ids||ids.includes(o.id));return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))].id;};
 for(const key of Object.keys(APPEARANCE_OPTIONS) as AppearanceKey[])if(key!=='faceId'&&key!=='accessoryId')result[key]=pick(key);
 if(random()<.7)result.hairColorId=pick('hairColorId',['haircolor-0','haircolor-1','haircolor-2','haircolor-3','haircolor-4','haircolor-5']);
 if(random()<.65)result.hairId=pick('hairId',['hair-0','hair-1','hair-2','hair-4','hair-7','hair-12']);
 if(random()<.65)result.outfitId=pick('outfitId',['outfit-0','outfit-1','outfit-2','outfit-3','outfit-4']);
 if(random()<.65)result.headAccessoryId='headwear-0';
 if(random()<.75)result.faceAccessoryId='facewear-0';
 if(random()<.5)result.neckAccessoryId='neckwear-0';
 if(random()<.6)result.cheekId=pick('cheekId',['cheek-0','cheek-1','cheek-2']);
 if(random()<.6)result.accentColorId=['accent-0','accent-4','accent-1','accent-2','accent-7','accent-6','accent-4','accent-2','accent-2','accent-7','accent-1','accent-6','accent-3'][appearanceIndex(result,'outfitId')];
 if(random()<aggression*.25){result.headAccessoryId='headwear-8';result.outfitId='outfit-4';}
 return result;
}
export const EXPLORER_PRESETS=[
 {name:'활발한 탐험가',appearance:{faceId:'face-2',hairId:'hair-0',accentColorId:'accent-1',outfitId:'outfit-4'}},
 {name:'느긋한 탐험가',appearance:{faceId:'face-3',hairId:'hair-4',accentColorId:'accent-0',outfitId:'outfit-2'}},
 {name:'든든한 탐험가',appearance:{faceId:'face-5',hairId:'hair-8',accentColorId:'accent-2',outfitId:'outfit-5'}},
 {name:'귀여운 탐험가',appearance:{faceId:'face-6',hairId:'hair-6',accentColorId:'accent-3',outfitId:'outfit-0'}},
];
export function explorerNameError(value:string){
 const name=value.normalize('NFC').trim();
 if(!/^[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9]{2,12}$/u.test(name))return '한글·영문·숫자로 2~12자를 입력해 주세요.';
 const plain=name.toLowerCase();
 if(['시발','씨발','씨bal','시bal','병신','개새끼','좆','fuck','shit','bitch','nigger'].some(word=>plain.includes(word)))return '다른 이름을 사용해 주세요.';
 return '';
}
export const randomExplorerName=()=>['도토리','구름','모찌','감자','바람','콩콩','새싹','햇살'][Math.floor(Math.random()*8)]+['탐험가','산책','모험','대장'][Math.floor(Math.random()*4)]+Math.floor(Math.random()*100);
