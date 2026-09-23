import {createServer} from 'node:http';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {BALANCE,EGGS} from '../src/data.ts';

// Local social-play server. Inventories remain private; no trade or shared egg claims.
export function multiplayerServer(clock=Date.now) {
  const sessions=new Map();
  const drops=new Map();
  return createServer(async(req,res)=>{
    const origin=req.headers.origin;
    const allowed=process.env.MULTIPLAYER_ORIGIN;
    if(origin && !(allowed ? origin===allowed : /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))){res.writeHead(403).end();return;}
    if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');res.setHeader('Cache-Control','no-store');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
    if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
    const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json'}).end(JSON.stringify(data));};
    const now=clock();
    for(const [token,s] of sessions)if(now-s.lastSeen>1800000)sessions.delete(token);
    if(req.method!=='POST'){send(405,{error:'POST required'});return;}
    try {
      let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>1024){send(413,{error:'Too large'});return;}}
      const data=JSON.parse(raw||'{}');
      if(req.url==='/login'){
        if(sessions.size>=BALANCE.multiplayerMaxPlayers){send(503,{error:'Room full'});return;}
        const token=randomBytes(32).toString('hex'),id=randomBytes(6).toString('hex');
        sessions.set(token,{id,name:`농장친구 ${id.slice(0,4)}`,x:0,z:0,rotation:0,appearance:0,lastSeen:now,lastUpdate:0,attackAt:0,downUntil:0,hit:null,carried:null});
        send(200,{token,id,serverTime:now});return;
      }
      const token=req.headers.authorization?.replace(/^Bearer /,'');const self=sessions.get(token);
      if(!self){send(401,{error:'Sign in again'});return;}
      if(req.url==='/logout'){sessions.delete(token);send(200,{});return;}
      if(req.url==='/attack'){
        if(now-self.attackAt<BALANCE.batCooldown||now<self.downUntil){send(429,{error:'Cooldown'});return;}
        self.attackAt=now;let hits=0;
        for(const target of sessions.values()){
          const dx=target.x-self.x,dz=target.z-self.z,d=Math.hypot(dx,dz);
          if(target===self||now-target.lastSeen>5000||now<target.downUntil||d>BALANCE.batRange||(d>.01&&(dx*Math.sin(self.rotation)+dz*Math.cos(self.rotation))/d<.15))continue;
          if(target.carried!==null){const id=`net-${randomBytes(8).toString('hex')}`;drops.set(id,{id,type:target.carried,x:target.x,z:target.z,at:now});target.carried=null;}
          const nx=d>.01?dx/d:Math.sin(self.rotation),nz=d>.01?dz/d:Math.cos(self.rotation);
          target.x=Math.max(-BALANCE.mapX,Math.min(BALANCE.mapX,target.x+nx*BALANCE.knockback));
          target.z=Math.max(BALANCE.mapFarZ,Math.min(BALANCE.mapNearZ,target.z+nz*BALANCE.knockback));
          target.downUntil=now+BALANCE.knockdownMs;target.hit={id:randomBytes(6).toString('hex'),x:target.x,z:target.z,until:target.downUntil};hits++;
        }
        send(200,{hits});return;
      }
      if(req.url==='/claim'){
        const egg=drops.get(data.id);
        if(!egg||self.carried!==null||now<self.downUntil||Math.hypot(egg.x-self.x,egg.z-self.z)>BALANCE.interaction){send(409,{error:'Unavailable egg'});return;}
        drops.delete(data.id);self.carried=egg.type;send(200,egg);return;
      }
      if(req.url!=='/state'){send(404,{});return;}
      if(now-self.lastUpdate<40){send(429,{error:'Too frequent'});return;}
      if(![data.x,data.z,data.rotation].every(Number.isFinite)||Math.abs(data.x)>BALANCE.mapX||data.z<BALANCE.mapFarZ||data.z>BALANCE.mapNearZ||![0,1,2].includes(data.appearance)){send(400,{error:'Invalid position'});return;}
      if(data.carried!==undefined&&data.carried!==null&&(!Number.isInteger(data.carried)||!EGGS[data.carried])){send(400,{error:'Invalid egg'});return;}
      if(now>=self.downUntil)Object.assign(self,{x:data.x,z:data.z,carried:data.carried??null});
      Object.assign(self,{rotation:data.rotation,appearance:data.appearance,lastSeen:now,lastUpdate:now});
      for(const [id,egg] of drops)if(now-egg.at>BALANCE.nightInterval)drops.delete(id);
      send(200,{serverTime:now,hit:self.hit,drops:[...drops.values()],players:[...sessions.values()].filter(s=>s.id!==self.id&&now-s.lastSeen<5000).map(({id,name,x,z,rotation,appearance,downUntil,attackAt,carried})=>({id,name,x,z,rotation,appearance,downUntil,attackAt,carried}))});
    }catch{send(400,{error:'Invalid request'});}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const port=Number(process.env.PORT??4330),host=process.env.HOST??'127.0.0.1';
  multiplayerServer().listen(port,host,()=>console.log(`Local multiplayer: http://${host}:${port}`));
}
