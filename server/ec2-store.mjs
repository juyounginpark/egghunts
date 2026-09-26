import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';

// Local journal is authoritative between cloud checkpoints. Keep this volume on deploy.
export class HostStore {
 constructor(path){
  mkdirSync(dirname(path),{recursive:true,mode:0o700});
  this.db=new DatabaseSync(path);
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
   CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS profiles(user TEXT PRIMARY KEY,state TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0,synced INTEGER NOT NULL DEFAULT 0);
   CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY,state TEXT NOT NULL,members TEXT NOT NULL);`);
  this.db.prepare('INSERT OR IGNORE INTO metadata VALUES (?,?)').run('owner',randomUUID());
  this.owner=this.db.prepare('SELECT value FROM metadata WHERE key=?').get('owner').value;
 }
 profile(user){const row=this.db.prepare('SELECT state,revision FROM profiles WHERE user=?').get(user);return row?JSON.parse(row.state):null;}
 metadata(key){return this.db.prepare('SELECT value FROM metadata WHERE key=?').get(key)?.value;}
 setMetadata(key,value){this.db.prepare('INSERT OR REPLACE INTO metadata VALUES(?,?)').run(key,String(value));}
 seed(user,state,revision=0){this.db.prepare('INSERT OR IGNORE INTO profiles(user,state,revision,synced) VALUES(?,?,?,?)').run(user,JSON.stringify(state),revision,revision);}
 rooms(){return this.db.prepare('SELECT * FROM rooms').all().map(r=>({id:r.id,state:JSON.parse(r.state),members:JSON.parse(r.members)}));}
 commit(room){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   for(const [id,p]of Object.entries(room.state?.players??{}))this.db.prepare(`INSERT INTO profiles(user,state,revision) VALUES(?,?,1)
    ON CONFLICT(user) DO UPDATE SET state=excluded.state,revision=profiles.revision+1`).run(id,JSON.stringify(p.runtime));
   // Empty rooms retain the current day's egg draw until their cycle expires.
   if(room.state)this.db.prepare('INSERT OR REPLACE INTO rooms VALUES(?,?,?)').run(room.id,JSON.stringify(room.state),JSON.stringify(room.members));
   else this.db.prepare('DELETE FROM rooms WHERE id=?').run(room.id);
   this.db.exec('COMMIT');
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 pending(){return this.db.prepare('SELECT user,state,revision FROM profiles WHERE revision>synced LIMIT 100').all().map(r=>({user_id:r.user,state:JSON.parse(r.state),revision:r.revision}));}
 acknowledge(rows){for(const r of rows)this.db.prepare('UPDATE profiles SET synced=max(synced,?) WHERE user=?').run(r.revision,r.user_id);}
 close(){this.db.close();}
}
