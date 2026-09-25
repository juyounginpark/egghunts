// Run on the target host with --env-file=/etc/egghunts.env, after HTTPS is ready.
import {DatabaseSync} from 'node:sqlite';
const db=new DatabaseSync('/var/lib/egghunts/game.sqlite',{readOnly:true});
const owner=db.prepare("SELECT value FROM metadata WHERE key='owner'").get().value;db.close();
const headers={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'};
const endpoint=`${process.env.SUPABASE_URL}/rest/v1/game_backend?id=eq.true`;
const response=await fetch(endpoint,{method:'PATCH',headers,body:JSON.stringify({mode:'ec2',owner}),signal:AbortSignal.timeout(10000)});
if(!response.ok)throw Error(`Cutover failed: HTTP ${response.status}`);
console.log('EC2 is now the sole profile writer:',owner);
