export function playerName(value:unknown){
 if(typeof value!=='string')throw Error('INVALID_NAME');
 const name=value.normalize('NFC');
 if(!/^[A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ]{1,10}$/u.test(name))throw Error('INVALID_NAME');
 return name;
}
export const playerLabel=(name:string,guest=false,level=1)=>`${guest?'[GUEST] ':''}${name} · LV.${level}`;
