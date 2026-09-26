import * as T from 'three';
import type {GameState} from './game';
import {ROAD_WIDTH_SCALE} from './stage-data';

/** Three recycled banks; procedural soft edges need no texture or real-time lights. */
export class UnvisitedFog {
 group=new T.Group();
 private geometry=new T.PlaneGeometry(1,1);
 private banks=Array.from({length:3},()=>{
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
   uniforms:{clock:{value:0},strength:{value:1},tint:{value:new T.Color(0xe9f0d8)}},
   vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:`varying vec2 vUv; uniform float clock; uniform float strength; uniform vec3 tint;
    void main(){
     float edge=smoothstep(0.,.10,vUv.x)*smoothstep(0.,.10,1.-vUv.x)*smoothstep(0.,.06,vUv.y)*smoothstep(0.,.06,1.-vUv.y);
     float wave=.82+.10*sin(vUv.x*23.+vUv.y*17.+clock*.22)+.08*sin(vUv.y*43.-clock*.16);
     gl_FragColor=vec4(tint*(.8+.2*wave),edge*wave*strength*.66);
     #include <colorspace_fragment>
    }`});
  material.onBeforeRender=(_renderer,scene)=>{if(scene.fog)material.uniforms.tint.value.copy(scene.fog.color);};
  const group=new T.Group();
  for(let i=0;i<3;i++){const mesh=new T.Mesh(this.geometry,material);mesh.rotation.x=-Math.PI/2;mesh.position.y=.8+i*1.9;mesh.renderOrder=2;group.add(mesh);}
  this.group.add(group);return {group,material,stage:0,alpha:1};
 });
 private last=0;
 render(game:GameState,time:number){
  const dt=Math.min(.1,Math.max(0,time-this.last));this.last=time;
  for(const bank of this.banks)bank.group.visible=false;
  for(const r of game.route.filter(r=>Math.abs(r.stage-game.stage.id)<=1)){
   const bank=this.banks[r.stage%3],visited=game.save.visitedStages?.includes(r.stage)||(!game.isAtBase&&game.stage.id===r.stage);
   if(bank.stage!==r.stage){bank.stage=r.stage;bank.alpha=visited?0:1;}
   bank.alpha=T.MathUtils.clamp(bank.alpha+(visited?-dt/1.1:dt),0,1);
   bank.group.visible=bank.alpha>.001;
   bank.group.position.z=-(r.start+r.end)/2;
   bank.group.scale.set(22*ROAD_WIDTH_SCALE,1,r.end-r.start);
   bank.material.uniforms.strength.value=bank.alpha;
   bank.material.uniforms.clock.value=time;
  }
 }
 dispose(){this.geometry.dispose();for(const b of this.banks)b.material.dispose();this.group.removeFromParent();}
}
