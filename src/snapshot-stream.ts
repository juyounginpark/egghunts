/** A connection-local snapshot baseline. HTTP and old clients still use full snapshots. */
export function snapshotSections(snapshot:Record<string,unknown>,previous:Map<string,string>){
 const sections:Record<string,unknown>={};
 for(const [key,value]of Object.entries(snapshot)){
  const entries=key==='runtime'?Object.entries(value as Record<string,unknown>).map(([k,v])=>[`runtime.${k}`,v] as const):[[key,value] as const];
  for(const [name,part]of entries){
   const serialized=JSON.stringify(part);
   if(previous.get(name)!==serialized){sections[name]=part;previous.set(name,serialized);}
  }
 }
 return sections;
}

export function restoreSnapshotSections(sections:Record<string,unknown>,baseline:Map<string,unknown>){
 for(const [key,value]of Object.entries(sections))baseline.set(key,value);
 const snapshot:Record<string,unknown>={},runtime:Record<string,unknown>={};
 for(const [key,value]of baseline){
  if(key.startsWith('runtime.'))runtime[key.slice(8)]=value;else snapshot[key]=value;
 }
 if(!runtime.save||!runtime.fields||!runtime.hazards)throw Error('Missing stream baseline');
 snapshot.runtime=runtime;
 return snapshot;
}

export type SnapshotDelta={reset:boolean;set:Record<string,unknown>;remove:string[]};
/** V2 separates frequently changing clocks/balances from large inventory arrays. */
export function snapshotSectionsV2(snapshot:Record<string,unknown>,previous:Map<string,string>):SnapshotDelta{
 const delta:SnapshotDelta={reset:previous.size===0,set:{},remove:[]},present=new Set<string>();
 const put=(key:string,value:unknown)=>{
  const serialized=JSON.stringify(value);
  if(serialized===undefined)return;
  present.add(key);
  if(previous.get(key)!==serialized){delta.set[key]=value;previous.set(key,serialized);}
 };
 for(const [key,value]of Object.entries(snapshot)){
  if(key!=='runtime'){put(key,value);continue;}
  for(const [section,part]of Object.entries(value as Record<string,unknown>)){
   if(section==='save'||section==='fields'){
    for(const [field,item]of Object.entries(part as Record<string,unknown>))put(`runtime.${section}.${field}`,item);
   }else put(`runtime.${section}`,part);
  }
 }
 for(const key of previous.keys())if(!present.has(key)){delta.remove.push(key);previous.delete(key);}
 return delta;
}

export function restoreSnapshotSectionsV2(delta:SnapshotDelta,baseline:Map<string,unknown>){
 if(delta.reset)baseline.clear();
 else if(!baseline.size)throw Error('Missing stream baseline');
 for(const key of delta.remove)baseline.delete(key);
 for(const [key,value]of Object.entries(delta.set))baseline.set(key,value);
 const snapshot:Record<string,unknown>=Object.create(null);
 for(const [key,value]of baseline){
  const path=key.split('.');
  if(path.some(part=>!part||['__proto__','constructor','prototype'].includes(part))||path.length>3)throw Error('Invalid stream section');
  let target=snapshot;
  for(const part of path.slice(0,-1)){
   target[part]??=Object.create(null);
   target=target[part] as Record<string,unknown>;
  }
  target[path[path.length-1]]=value;
 }
 const runtime=snapshot.runtime as Record<string,unknown>|undefined;
 if(!runtime?.save||!runtime.fields||!runtime.hazards)throw Error('Missing stream baseline');
 return snapshot;
}
