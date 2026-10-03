import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {PresenceRoom} from '../../server/presence-room.mjs';
import {report} from './lib.mjs';
const vite=await createServer({server:{middlewareMode:true}});
try{
 const a=await vite.ssrLoadModule('/src/explorer-appearance.ts'),{freshSave,parseSave,GameState}=await vite.ssrLoadModule('/src/game.ts'),{PlayerEntity}=await vite.ssrLoadModule('/src/player-entity.ts');
 assert.deepEqual(Object.fromEntries(Object.entries(a.APPEARANCE_OPTIONS).map(([key,v])=>[key,v.length])),{skinId:10,faceId:8,hairId:18,hairColorId:12,outfitId:13,accentColorId:10,accessoryId:8,backpackId:8,eyeId:12,eyebrowId:8,mouthId:10,cheekId:8,headAccessoryId:12,faceAccessoryId:8,neckAccessoryId:6});
 const oldAppearance={skinId:'skin-2',faceId:'face-3',hairId:'hair-7',hairColorId:'haircolor-1',outfitId:'outfit-3',accentColorId:'accent-4',accessoryId:'accessory-6',backpackId:'backpack-3'};
 const migrated=a.normalizeAppearance(oldAppearance);for(const [key,value]of Object.entries(oldAppearance))assert.equal(migrated[key],value);
 assert.equal(migrated.eyeId,'eye-6');assert.equal(migrated.faceAccessoryId,'facewear-1');assert.deepEqual(a.normalizeAppearance(migrated),migrated);
 assert.equal(a.appearanceOptions('backpackId',1).length,4);assert.equal(a.appearanceOptions('backpackId',17).length,8);assert.ok(a.appearanceOptions('backpackId',1,'backpack-3').some(o=>o.id==='backpack-3'));
 assert.equal(a.explorerNameError('박주영12'),'');assert.ok(a.explorerNameError('a'));assert.ok(a.explorerNameError('a'.repeat(13)));assert.ok(a.explorerNameError('시발'));assert.ok(a.explorerNameError('<script>'));
 for(let i=0;i<100;i++)assert.equal(a.explorerNameError(a.randomExplorerName()),'');
 const save=freshSave(Date.now());save.playerName='기존탐험가';save.appearance=2;save.dust=123456;
 const legacy=parseSave(JSON.stringify(save),Date.now());assert.equal(legacy.dust,save.dust);assert.equal(legacy.explorerAppearance.accentColorId,'accent-2');assert.ok(legacy.explorerCreatedAt);
 save.explorerAppearance=a.randomAppearance();save.explorerCreatedAt=123456;const restored=parseSave(JSON.stringify(save),Date.now());assert.deepEqual(restored.explorerAppearance,save.explorerAppearance);assert.equal(restored.explorerCreatedAt,123456);
 const actor=new PlayerEntity('human','human',new GameState(restored,Date.now)),pose=actor.pose(),room=new PresenceRoom();room.join('human',pose);room.join('friend',{name:'기존탐험가'});assert.deepEqual(room.players.get('human').explorerAppearance,save.explorerAppearance);
 const old=room.players.get('human'),next=room.update('human',{x:1,z:2});const delta=Object.fromEntries(Object.entries(next).filter(([key,value])=>JSON.stringify(old[key])!==JSON.stringify(value)));assert.equal('explorerAppearance' in delta,false);
 const changed={...save.explorerAppearance,hairId:'hair-11'};assert.deepEqual(room.update('human',{explorerAppearance:changed}).explorerAppearance,changed);assert.throws(()=>room.update('human',{explorerAppearance:{...changed,hairId:'hair-999'}}),/INVALID_APPEARANCE/);
 room.join('legacy',{explorerAppearance:oldAppearance});assert.deepEqual(room.players.get('legacy').explorerAppearance,oldAppearance);
 for(const key of ['eyeId','eyebrowId','mouthId','cheekId','headAccessoryId','faceAccessoryId','neckAccessoryId'])assert.throws(()=>room.update('human',{explorerAppearance:{...changed,[key]:'invalid'}}),/INVALID_APPEARANCE/);
 const {WARDROBE}=await vite.ssrLoadModule('/src/wardrobe.ts');const g=new GameState(restored,Date.now);g.x=WARDROBE.x-1.3;g.z=WARDROBE.z;assert.equal(g.nearWardrobe,true);assert.equal(g.action,'탐험가 꾸미기');g.x=0;assert.equal(g.nearWardrobe,false);
 await report('explorer-profile',{catalogs:true,nameValidation:true,legacyMigration:true,persistence:true,sharedPose:true,relayValidation:true,unchangedAppearanceOmitted:true});console.log('PASS explorer catalogs, names, legacy migration, save, shared appearance and relay deltas');
}finally{await vite.close();}
