// Run as root with the legacy environment after stopping the legacy writer.
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync,existsSync} from 'node:fs';
const directory=process.argv[2];
if(!directory)throw Error('Backup directory required');
const db=new DatabaseSync('/var/lib/egghunts/game.sqlite',{readOnly:true});
const rows=db.prepare('SELECT user,state,revision FROM profiles').all();
const metadata=Object.fromEntries(db.prepare('SELECT key,value FROM metadata').all().map(r=>[r.key,r.value]));
db.exec(`VACUUM INTO '${directory.replaceAll("'","''")}/game.sqlite'`);db.close();
const headers={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'};
async function cloud(path,body,prefer){
 const response=await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{...headers,...(prefer?{Prefer:prefer}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Migration request ${path.split('?')[0]}: HTTP ${response.status}`);
 const text=await response.text();return text?JSON.parse(text):null;
}
for(const table of ['game_profiles','game_local_profiles']){
 const all=[];for(let offset=0;;offset+=1000){const page=await cloud(`${table}?select=*&limit=1000&offset=${offset}&order=user_id`);all.push(...page);if(page.length<1000)break;}
 writeFileSync(`${directory}/${table}.json`,JSON.stringify(all),{mode:0o600});
}
const users=new Set();
for(let page=1;;page++){
 const response=await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`,{headers,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Auth inventory: HTTP ${response.status}`);
 const data=await response.json();for(const user of data.users)users.add(user.id);if(data.users.length<1000)break;
}
// Deleted test/guest accounts may still have historical SQLite rows. Preserve
// them in the backup rather than violating the cloud's auth.users foreign key.
const active=rows.filter(r=>users.has(r.user));
for(let start=0;start<active.length;start+=100){
 const batch=active.slice(start,start+100);
 await cloud('rpc/game_ec2_checkpoint',{p_owner:metadata.owner,p_profiles:batch.map(r=>({user_id:r.user,state:JSON.parse(r.state),revision:r.revision}))});
 await cloud('game_local_profiles?on_conflict=user_id',batch.map(r=>({user_id:r.user,profile:JSON.parse(r.state),revision:1})),'resolution=ignore-duplicates,return=minimal');
}
const meter='/var/lib/egghunts/presence-transfer.json';
if(!existsSync(meter))writeFileSync(meter,JSON.stringify({month:metadata.transferMonth??'',bytes:Number(metadata.transferBytes??0)}),{mode:0o600});
const imported=await cloud('game_local_profiles?select=user_id');
if(active.some(r=>!imported.some(p=>p.user_id===r.user)))throw Error('Missing imported profile');
console.log(JSON.stringify({sqliteProfiles:rows.length,activeProfiles:active.length,deletedAccountsBackedUp:rows.length-active.length,cloudProfiles:imported.length,backup:directory}));
