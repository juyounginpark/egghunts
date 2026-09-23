export type GameSound='ui'|'swing'|'tap'|'pickup'|'drop'|'hit'|'hatch'|'night'|'return'|'death'|'revive'|'upgrade'|'stage'|'boss'|'heartbeat'|'water'|'fire'|'machine'|'magic';
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
 boss:[[75,.25,0,'sawtooth',130],[95,.3,.2,'triangle',55]],
 heartbeat:[[65,.08,0,'sine',45],[65,.08,.15,'sine',45]],
 water:[[480,.12,0,'sine',180],[700,.15,.1,'sine',260]],
 fire:[[90,.2,0,'sawtooth',45],[170,.13,.08,'triangle',70]],
 machine:[[180,.07,0,'square'],[270,.07,.09,'square'],[120,.12,.18,'triangle']],
 magic:[[880,.15,0,'sine',1100],[660,.2,.11,'triangle',880]],
};
/** Small synthesized cues: no downloaded audio, voices are bounded and disconnected. */
export class GameAudio{
 private context:AudioContext|undefined;
 private last=new Map<GameSound,number>();
 private voices=0;
 unlock(){try{this.context??=new AudioContext();void this.context.resume().catch(()=>{});}catch{/* Sound is optional. */}}
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
   oscillator.connect(gain).connect(ctx.destination);this.voices++;
   oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.voices--;};
   oscillator.start(at);oscillator.stop(at+duration+.02);
  }
 }
}
