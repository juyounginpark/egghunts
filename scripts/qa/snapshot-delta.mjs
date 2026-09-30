// Manual only: node scripts/qa/snapshot-delta.mjs (Node 24+). No production calls.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {HostStore} from '../../server/ec2-store.mjs';
const built=await build({entryPoints:['src/snapshot-stream.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {snapshotSections,restoreSnapshotSections,snapshotSectionsV2,restoreSnapshotSectionsV2}=await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const wire=value=>JSON.parse(JSON.stringify(value));
const initial={serverTime:1,runtime:{save:{lastSavedAt:1,dust:10,mongles:Array(721).fill(1),petLots:Array.from({length:100},(_,i)=>({key:`pet-${i}`,species:i,count:1,weightG:1000,standardWeightG:1000})),eggs:[],optional:'old'},fields:{x:0,z:0,hitAt:-Infinity,effects:{ink:0},result:null},hazards:{attacks:[]}},world:[{id:'egg-1'}],peers:[],events:[],errors:[]};
const sender=new Map(),receiver=new Map();
const first=snapshotSectionsV2(initial,sender);
assert.equal(first.reset,true);
assert.deepEqual(wire(restoreSnapshotSectionsV2(wire(first),receiver)),wire(initial));
const next=structuredClone(initial);next.serverTime=2;next.runtime.save.lastSavedAt=2;next.runtime.save.dust=11;next.runtime.fields.x=1;
const second=snapshotSectionsV2(next,sender);
assert.equal(second.reset,false);
assert.equal(Object.hasOwn(second.set,'runtime.save.mongles'),false);
assert.equal(Object.hasOwn(second.set,'runtime.save.petLots'),false);
assert.deepEqual(wire(restoreSnapshotSectionsV2(wire(second),receiver)),wire(next));
const legacy=new Map();snapshotSections(initial,legacy);
const oldBytes=Buffer.byteLength(JSON.stringify(snapshotSections(next,legacy))),newBytes=Buffer.byteLength(JSON.stringify(second));
assert.ok(newBytes<oldBytes,'clock and balance changes do not resend inventories');
delete next.runtime.save.optional;next.runtime.fields.result={species:2};next.world=[];next.peers=[{id:'peer'}];
assert.deepEqual(wire(restoreSnapshotSectionsV2(wire(snapshotSectionsV2(next,sender)),receiver)),wire(next));
next.runtime.fields.result=null;next.runtime.fields.temporary=undefined;next.runtime.save.petLots=[];next.peers=[];
assert.deepEqual(wire(restoreSnapshotSectionsV2(wire(snapshotSectionsV2(next,sender)),receiver)),wire(next));
assert.deepEqual(snapshotSectionsV2(next,sender).set,{});
// Reconnect/token baseline reset must remove stale fields in an existing receiver.
assert.deepEqual(wire(restoreSnapshotSectionsV2(wire(snapshotSectionsV2(initial,new Map())),receiver)),wire(initial));
assert.throws(()=>restoreSnapshotSectionsV2(second,new Map()),/baseline/);
assert.throws(()=>restoreSnapshotSectionsV2({reset:true,set:{'__proto__.polluted':true},remove:[]},new Map()),/Invalid/);
assert.equal({}.polluted,undefined);
assert.deepEqual(wire(restoreSnapshotSections(wire(snapshotSections(initial,new Map())),new Map())),wire(initial));
const store=new HostStore(':memory:');
try{
 const room={id:'room',members:[{user_id:'user',slot:0}],state:{players:{user:{runtime:wire(initial.runtime)}}}};
 store.commit(room);const revision=store.pending()[0].revision;
 store.acknowledge(store.pending());store.commit(room);
 assert.equal(store.pending().length,0,'identical profile does not need a cloud checkpoint');
 room.state.players.user.runtime.save.dust++;
 store.commit(room);assert.equal(store.pending()[0].revision,revision+1);
 assert.equal(store.profile('user').save.dust,11);
 assert.equal(store.rooms().length,1);
 store.commit({...room,state:null});assert.equal(store.rooms().length,0);
 assert.equal(store.profile('user').save.dust,11,'room removal preserves profile');
}finally{store.close();}
console.log(JSON.stringify({status:'passed',fixtureDeltaBytes:newBytes,fixtureLegacyBytes:oldBytes,note:'Synthetic fixture only; not a live capacity or bandwidth measurement.'}));
