import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
const [database,output]=process.argv.slice(2);
if(!database||!output)throw Error('Usage: node scripts/export-legacy-profiles.mjs <SQLite path> <private output.json>');
const db=new DatabaseSync(database,{readOnly:true});
try{
 const profiles=db.prepare('SELECT user,state,revision,synced FROM profiles').all().map(row=>({...row,state:JSON.parse(row.state)}));
 writeFileSync(output,JSON.stringify({exportedAt:Date.now(),profiles}),{mode:0o600,flag:'wx'});
 console.log(`Exported ${profiles.length} profiles; source SQLite unchanged. Treat output as private user data.`);
}finally{db.close();}
