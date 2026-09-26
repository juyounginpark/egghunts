import * as T from 'three';

export type DioramaUniforms = ReturnType<typeof dioramaUniforms>;
export function dioramaUniforms(){
 return {uDioramaAO:{value:.12},uDioramaRim:{value:.025},uDioramaRimColor:{value:new T.Color(0xffedce)},uDioramaSaturation:{value:1}};
}

/** Keep native lighting, instancing, shadows and fog; add no render pass. */
export function dioramaMaterial(parameters:T.MeshLambertMaterialParameters={},character=false){
 const material=new T.MeshLambertMaterial(parameters),uniforms=dioramaUniforms(),neutral=dioramaUniforms();
 material.onBeforeRender=(_renderer,scene)=>{
  const state=(scene.userData.diorama as DioramaUniforms|undefined)??neutral;
  uniforms.uDioramaAO.value=state.uDioramaAO.value;
  uniforms.uDioramaRim.value=character?state.uDioramaRim.value:0;
  uniforms.uDioramaRimColor.value.copy(state.uDioramaRimColor.value);
  uniforms.uDioramaSaturation.value=state.uDioramaSaturation.value;
 };
 material.customProgramCacheKey=()=>`diorama-1-${character}`;
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float vDioramaHeight;\nvarying float vDioramaUp;')
   .replace('#include <project_vertex>',`#include <project_vertex>
    vec4 dioramaPosition = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
     dioramaPosition = instanceMatrix * dioramaPosition;
    #endif
    vDioramaHeight = (modelMatrix * dioramaPosition).y;
    vDioramaUp = inverseTransformDirection(transformedNormal, viewMatrix).y;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying float vDioramaHeight;
   varying float vDioramaUp;
   uniform float uDioramaAO;
   uniform float uDioramaRim;
   uniform vec3 uDioramaRimColor;
   uniform float uDioramaSaturation;`)
   .replace('#include <lights_lambert_pars_fragment>',T.ShaderChunk.lights_lambert_pars_fragment.replace('float dotNL = saturate( dot( geometryNormal, directLight.direction ) );',`float halfLight = dot(geometryNormal, directLight.direction) * 0.5 + 0.5;
    float dotNL = 0.3 * smoothstep(0.15, 0.35, halfLight) + 0.4 * smoothstep(0.4, 0.7, halfLight) + 0.3 * smoothstep(0.7, 0.95, halfLight);`))
   .replace('#include <opaque_fragment>',`float baseContact = (1.0 - smoothstep(0.03, 0.6, vDioramaHeight)) * (1.0 - abs(vDioramaUp));
    outgoingLight *= (1.0 + 0.05 * vDioramaUp) * (1.0 - uDioramaAO * baseContact);
    float rim = pow(1.0 - saturate(dot(normal, geometryViewDir)), 3.0);
    outgoingLight += uDioramaRimColor * uDioramaRim * (rim + 0.8) * diffuseColor.rgb;
    outgoingLight = mix(vec3(dot(outgoingLight, vec3(0.2126,0.7152,0.0722))), outgoingLight, uDioramaSaturation);
    #include <opaque_fragment>`);
 };
 return material;
}
