import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {PresenceRoom} from '../../server/presence-room.mjs';
import {report} from './lib.mjs';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const a=await vite.ssrLoadModule('/src/explorer-appearance.ts'),{freshSave,parseSave,GameState}=await vite.ssrLoadModule('/src/game.ts'),{PlayerEntity}=await vite.ssrLoadModule('/src/player-entity.ts');
 assert.deepEqual(Object.values(a.APPEARANCE_OPTIONS).map(v=>v.length),[8,8,12,10,8,8,8,4]);
 assert.equal(a.explorerNameError('박주영12'),'');assert.ok(a.explorerNameError('a'));assert.ok(a.explorerNameError('a'.repeat(13)));assert.ok(a.explorerNameError('시발'));assert.ok(a.explorerNameError('<script>'));
 for(let i=0;i<100;i++)assert.equal(a.explorerNameError(a.randomExplorerName()),'');
 const save=freshSave(Date.now());save.playerName='기존탐험가';save.appearance=2;save.dust=123456;
 const legacy=parseSave(JSON.stringify(save),Date.now());assert.equal(legacy.dust,save.dust);assert.equal(legacy.explorerAppearance.accentColorId,'accent-2');assert.ok(legacy.explorerCreatedAt);
 save.explorerAppearance=a.randomAppearance();save.explorerCreatedAt=123456;const restored=parseSave(JSON.stringify(save),Date.now());assert.deepEqual(restored.explorerAppearance,save.explorerAppearance);assert.equal(restored.explorerCreatedAt,123456);
 const actor=new PlayerEntity('human','human',new GameState(restored,Date.now)),pose=actor.pose(),room=new PresenceRoom();room.join('human',pose);room.join('friend',{name:'기존탐험가'});assert.deepEqual(room.players.get('human').explorerAppearance,save.explorerAppearance);
 const old=room.players.get('human'),next=room.update('human',{x:1,z:2});const delta=Object.fromEntries(Object.entries(next).filter(([key,value])=>JSON.stringify(old[key])!==JSON.stringify(value)));assert.equal('explorerAppearance' in delta,false);
 const changed={...save.explorerAppearance,hairId:'hair-11'};assert.deepEqual(room.update('human',{explorerAppearance:changed}).explorerAppearance,changed);assert.throws(()=>room.update('human',{explorerAppearance:{...changed,hairId:'hair-999'}}),/INVALID_APPEARANCE/);
 await report('explorer-profile',{catalogs:true,nameValidation:true,legacyMigration:true,persistence:true,sharedPose:true,relayValidation:true,unchangedAppearanceOmitted:true});console.log('PASS explorer catalogs, names, legacy migration, save, shared appearance and relay deltas');
}finally{await vite.close();}
