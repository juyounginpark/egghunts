export type GameSound='ui'|'swing'|'tap'|'pickup'|'drop'|'hit'|'hatch'|'night'|'return'|'death'|'revive'|'upgrade'|'stage'|'boss'|'boss-step'|'heartbeat'|'water'|'fire'|'machine'|'magic';
type Note=[number,number,number,OscillatorType,number?];
const sounds:Record<GameSound,Note[]>={
 ui:[[720,.07,0,'sine',540]],
 swing:[[420,.16,0,'sawtooth',65]],
 tap:[[1000,.06,0,'triangle',380]],
 pickup:[[540,.1,0,'sine'],[810,.14,.08,'sine']],
 drop:[[330,.1,0,'triangle',150],[100,.12,.1,'sine',55]],
 hit:[[120,.16,0,'square',40]],
 hatch:[[523,.16,0,'sine'],[659,.16,.12,'sine'],[784,.18,.24,'sine'],[1047,.35,.38,'triangle']],
 night:[[440,.3,0,'sine'],[330,.35,.24,'sine'],[220,.45,.5,'sine']],
 return:[[660,.14,0,'triangle'],[440,.14,.12,'triangle'],[330,.22,.25,'sine']],
 death:[[330,.2,0,'triangle',220],[220,.25,.16,'triangle',110],[110,.4,.36,'sine',55]],
 revive:[[262,.17,0,'sine'],[392,.17,.13,'sine'],[523,.2,.26,'sine'],[784,.4,.4,'triangle']],
 upgrade:[[600,.08,0,'triangle'],[750,.08,.08,'triangle'],[900,.17,.16,'sine']],
 stage:[[392,.13,0,'sine'],[523,.23,.13,'sine']],
 boss:[[48,.55,0,'sine',28],[82,.65,0,'sawtooth',42],[123,.45,.08,'triangle',62],[185,.35,.18,'sawtooth',65]],
 'boss-step':[[70,.14,0,'sine',32],[110,.06,.02,'triangle',45]],
 heartbeat:[[65,.08,0,'sine',45],[65,.08,.15,'sine',45]],
 water:[[480,.12,0,'sine',180],[700,.15,.1,'sine',260]],
 fire:[[90,.2,0,'sawtooth',45],[170,.13,.08,'triangle',70]],
 machine:[[180,.07,0,'square'],[270,.07,.09,'square'],[120,.12,.18,'triangle']],
 magic:[[880,.15,0,'sine',1100],[660,.2,.11,'triangle',880]],
};
/** Small synthesized cues: no downloaded audio, voices are bounded and disconnected. */
export class GameAudio{
 private context:AudioContext|undefined;
 private master:GainNode|undefined;
 private volume=1;
 setVolume(value:number,muted=false){
  this.volume=muted?0:Math.max(0,Math.min(1,Number.isFinite(value)?value:1));
  if(this.master&&this.context){
   this.master.gain.cancelScheduledValues(this.context.currentTime);
   this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.015);
  }
 }
 private last=new Map<GameSound,number>();
 private voices=0;
 private musicMode:'calm'|'chase'|'silent'='silent';
 private musicBus:GainNode|undefined;
 private beat=0;
 private nextBeat=0;
 music(mode:'calm'|'chase'|'silent',pressure=0){
  const ctx=this.context;if(!ctx||ctx.state!=='running')return;
  if(!this.musicBus){this.musicBus=ctx.createGain();this.musicBus.gain.value=0;this.musicBus.connect(this.master!);}
  if(mode!==this.musicMode){
   this.musicMode=mode;this.beat=0;this.nextBeat=ctx.currentTime+.04;
   this.musicBus.gain.cancelScheduledValues(ctx.currentTime);
   this.musicBus.gain.setTargetAtTime(mode==='silent'?0:.3,ctx.currentTime,.15);
  }
  if(mode==='silent')return;
  if(this.nextBeat<ctx.currentTime-.3)this.nextBeat=ctx.currentTime+.02;
  const urgent=mode==='chase',intensity=Math.max(0,Math.min(1,pressure)),interval=urgent?.18-intensity*.045:.32;
  const melody=urgent?[0,7,0,8,0,7,3,2,0,7,0,10,8,7,3,2]:[0,4,7,12,7,4,2,7,4,7,11,14,11,7,4,2];
  while(this.nextBeat<ctx.currentTime+.12){
   const beat=this.beat++,at=this.nextBeat;this.nextBeat+=interval;
   const root=urgent?146.83:261.63,degree=melody[beat%melody.length];
   this.musicNote(root*2**(degree/12),at,interval*.85,urgent?'triangle':'sine',.055);
   if(beat%4===0)this.musicNote(root/2*2**(([0,0,urgent?8:5,7][Math.floor(beat/8)%4])/12),at,interval*3,'triangle',.065);
   if(urgent&&beat%2===0){this.musicNote(55,at,.09,'sine',.12+intensity*.04);if(intensity>.6)this.musicNote(110,at+interval*.55,.05,'triangle',.035);}
  }
 }
 private musicNote(frequency:number,at:number,duration:number,wave:OscillatorType,volume:number){
  const ctx=this.context!,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=wave;osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,at);
  gain.gain.exponentialRampToValueAtTime(volume,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(gain).connect(this.musicBus!);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+duration+.02);
 }
 unlock(){try{
  this.context??=new AudioContext();
  if(!this.master){this.master=this.context.createGain();this.master.gain.value=this.volume;this.master.connect(this.context.destination);}
  void this.context.resume().catch(()=>{});
 }catch{/* Sound is optional. */}}
 suspend(){return this.context?.suspend().catch(()=>{});}
 play(sound:GameSound,stage=1){
  const ctx=this.context;if(!ctx||ctx.state!=='running'||this.voices>18)return;
  const now=ctx.currentTime;if(now-(this.last.get(sound)??-Infinity)<.09)return;this.last.set(sound,now);
  const pitch=['water','fire','machine','magic','boss'].includes(sound)?2**(((stage-1)%7)/12):1;
  for(const [frequency,duration,delay,wave,end] of sounds[sound]){
   const oscillator=ctx.createOscillator(),gain=ctx.createGain(),at=now+delay;
   oscillator.type=wave;oscillator.frequency.setValueAtTime(frequency*pitch,at);
   if(end)oscillator.frequency.exponentialRampToValueAtTime(end*pitch,at+duration);
   gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(wave==='sine'?.045:.018,at+.008);
   gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
   oscillator.connect(gain).connect(this.master!);this.voices++;
   oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.voices--;};
   oscillator.start(at);oscillator.stop(at+duration+.02);
  }
 }
}
