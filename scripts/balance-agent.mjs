// A light economic state for large simulations. Rules are imported from the game;
// only player decisions and login cadence belong to this adapter.
export function economicAgent(m,random){
 const save=m.freshSave(0),progression=m.newProgression();save.progression=progression;
 const discovered=new Set();
 let lastAt=0,pending=0,weeklyDay=-1,weeklyIndex=0;
 const g={save,progression,events:[],result:null,
  get level(){return progression.level;},
  get growthStage(){return save.highestStage??1;},
  get speed(){return m.progressionSpeedValue(m.upgradeBaseSpeed(save.upgrades.speed),save.trainingProgress??0,save.equippedTrail??0,m.equippedPetMultiplier(save.active,'speedMultiplier'),progression.level);},
  get progressionSpeed(){return this.speed;},
  petIncomeAmount(id){const p=m.MONGLES[id];return m.petIncomeValue(Math.max(1,p.stageId),p.tier)*m.productionUpgradeMultiplier(save.upgrades)*m.BALANCE.petIncomeSeconds;},
  get incomePerSecond(){return save.active.reduce((n,id)=>n+this.petIncomeAmount(id),0)/m.BALANCE.petIncomeSeconds;},
  get dps(){return m.autoDamageValue(save.upgrades.damage,save.upgrades.rate,m.equippedPetMultiplier(save.active,'autoMultiplier'));},
  get tapDamage(){return m.tapDamageValue(save.upgrades.tap,m.equippedPetMultiplier(save.active,'clickMultiplier'));},
  settleProduction(at){const seconds=Math.max(0,(at-lastAt)/1000);lastAt=at;pending+=this.incomePerSecond*m.offlineSeconds(seconds);const amount=Math.floor(pending);pending-=amount;save.dust+=amount;},
  gainXP(amount){m.awardXP(progression,amount);},
  cost(kind){return m.growthCost(kind,save.upgrades[kind]);},
  upgrade(kind){const cost=this.cost(kind);if(save.upgrades[kind]>=20||save.dust<cost)return false;save.dust-=cost;save.upgrades[kind]++;return true;},
  buyTrail(id){if(save.dust<m.TRAILS[id].cost)return false;save.dust-=m.TRAILS[id].cost;save.trails.push(id);save.equippedTrail=id;return true;},
  grantPet(id){save.mongles[id]++;save.active=[...save.active,id].sort((a,b)=>this.petIncomeAmount(b)-this.petIncomeAmount(a)).slice(0,3);},
  hatch(stage,tier,pool){const id=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];this.grantPet(id);save.dust+=m.stageReward(stage,m.OVERHAUL.rewardMinutes.egg,tier);if(!discovered.has(id)){discovered.add(id);save.dust+=m.stageReward(stage,m.OVERHAUL.rewardMinutes.discovery,tier);this.gainXP(m.PROGRESSION.hatchXP);}},
  claimWeekly(at){const day=Math.floor((at+9*3600000)/86400000);if(day===weeklyDay)return;weeklyDay=day;save.dust+=m.stageReward(this.growthStage,m.OVERHAUL.weeklyMinutes[weeklyIndex]);if(weeklyIndex===6){this.grantPet(m.WEEKLY_EVENT.petId);this.grantPet(m.WEEKLY_EVENT.petId);}weeklyIndex=(weeklyIndex+1)%7;},
 };
 return g;
}
