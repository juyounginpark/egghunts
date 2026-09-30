import type {GameState} from './game';

export class SpeedVignette{
 private element=document.createElement('div');
 private wave=document.createElement('i');
 private reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 private previous=1;
 private pulse?:Animation;
 constructor(parent:HTMLElement){
  this.element.id='speed-vignette';this.element.setAttribute('aria-hidden','true');
  this.element.append(this.wave);parent.append(this.element);
 }
 update(game:GameState,visible:boolean){
  const multiplier=visible&&!game.death&&!game.returnReward
   ?game.effects.grab>0||game.effects.stone>0?0:game.movementEffectMultiplier:1;
  const value=Math.round(multiplier*1000)/1000;
  if(value===this.previous)return;
  this.previous=value;
  const strength=Math.min(1,Math.abs(value-1));
  this.element.style.setProperty('--speed-color',value<1?'222 66 69':'64 193 119');
  this.element.style.setProperty('--speed-blur',`${(strength*24).toFixed(2)}vmin`);
  this.element.style.setProperty('--speed-spread',`${(strength*5).toFixed(2)}vmin`);
  this.element.style.setProperty('--speed-alpha',String(strength*.48));
  this.element.style.opacity=strength?'1':'0';
  this.pulse?.cancel();
  if(strength&&!this.reducedMotion.matches){
   this.pulse=this.wave.animate([
    {opacity:0,transform:'scale(1.06)'},
    {opacity:strength*.65,transform:'scale(1)',offset:.3},
    {opacity:0,transform:'scale(.97)'},
   ],{duration:750,easing:'ease-out'});
  }
 }
}
