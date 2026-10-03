export interface ExplorerAppearance {
 skinId:string;faceId:string;hairId:string;hairColorId:string;outfitId:string;accentColorId:string;accessoryId:string;backpackId:string;
}
export type AppearanceKey=keyof ExplorerAppearance;
export type AppearanceOption={id:string;label:string;color?:string};
const colors=(prefix:string,values:string[]):AppearanceOption[]=>values.map((color,i)=>({id:`${prefix}-${i}`,label:`색상 ${i+1}`,color}));
const options=(prefix:string,labels:string[]):AppearanceOption[]=>labels.map((label,i)=>({id:`${prefix}-${i}`,label}));
export const APPEARANCE_OPTIONS:Record<AppearanceKey,AppearanceOption[]>={
 skinId:colors('skin',['#ffe6c5','#f2cfaa','#ddb18c','#c89470','#a67152','#86563e','#613e30','#432d27']),
 faceId:options('face',['기본','무표정','활발','졸림','장난','씩씩','미소','반짝']),
 hairId:options('hair',['짧은 머리','덮은 머리','가르마','곱슬','단발','긴 머리','양갈래','묶은 머리','단정한 머리','뾰족 머리','옆 가르마','올림 머리']),
 hairColorId:colors('haircolor',['#302b29','#64422f','#a66f40','#e9c573','#919493','#f1e9d7','#ac4543','#497ca7','#60815a','#cd8daa']),
 outfitId:options('outfit',['신입 탐험가','숲 탐험가','캠핑 탐험가','농장 작업복','캐주얼 후드','등산복','우비','우주 탐험복']),
 accentColorId:colors('accent',['#728f53','#d48052','#558dac','#c98c9e','#d8bb63','#8a76a0','#434b4c','#eee3cc']),
 accessoryId:options('accessory',['없음','캡모자','버킷햇','고글','헤드폰','스카프','안경','동물 귀']),
 backpackId:options('backpack',['탐험 가방','캠핑 백팩','알 수집 가방','우주 가방']),
};
export function normalizeAppearance(value:unknown,legacy=0):ExplorerAppearance{
 const source=value&&typeof value==='object'?value as Partial<ExplorerAppearance>:{};
 const result={} as ExplorerAppearance;
 for(const key of Object.keys(APPEARANCE_OPTIONS) as AppearanceKey[])result[key]=APPEARANCE_OPTIONS[key].some(o=>o.id===source[key])?source[key]!:APPEARANCE_OPTIONS[key][0].id;
 if(!value){result.accessoryId='accessory-1';result.accentColorId=`accent-${Math.max(0,Math.min(2,legacy))}`;}
 return result;
}
export const appearanceIndex=(a:ExplorerAppearance,key:AppearanceKey)=>APPEARANCE_OPTIONS[key].findIndex(o=>o.id===a[key]);
export function randomAppearance(random=()=>Math.random(),aggression=0):ExplorerAppearance{
 const result={} as ExplorerAppearance;
 for(const key of Object.keys(APPEARANCE_OPTIONS) as AppearanceKey[]){const pool=APPEARANCE_OPTIONS[key];result[key]=pool[Math.floor(random()*pool.length)].id;}
 if(random()<aggression*.25){result.accessoryId='accessory-3';result.outfitId='outfit-4';}
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
