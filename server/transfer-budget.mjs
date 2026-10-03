import {readFileSync,writeFileSync,renameSync} from 'node:fs';

// Measures application WebSocket payloads, not total AWS-billed traffic.
export function transferBudget(path,limit){
 let record={month:new Date().toISOString().slice(0,7),bytes:0};
 try{record=JSON.parse(readFileSync(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 const available=(bytes=0)=>{const month=new Date().toISOString().slice(0,7);if(record.month!==month)record={month,bytes:0};return record.bytes+bytes<=limit;};
 const persist=()=>{writeFileSync(path+'.tmp',JSON.stringify(record),{mode:0o600});renameSync(path+'.tmp',path);};
 const timer=setInterval(persist,5000);timer.unref();
 return {available,charge:bytes=>{if(!available(bytes))return false;record.bytes+=bytes;return true;},close:()=>{clearInterval(timer);persist();}};
}
