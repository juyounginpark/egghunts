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
