import * as T from "three";
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {MapCollider} from './map-collision';
type Voxel = [number, number, number, number];
type Model = {
  unit?:number;
  previewAngle?:number;
  front?: '-z';
  colors: string[];
  size: number[];
  pivot: number[];
  voxels: Voxel[];
  parts: Record<
    string,
    { pivot: number[]; parent: string | null; voxels: Voxel[]; rotation?:number[]; scale?:number[] }
  >;
};
const mat = new T.MeshLambertMaterial({ vertexColors: true });
const geometryCache = new Map<string, T.BufferGeometry>();
const dataCache = new Map<string, Model>();
const pending = new Map<string, Promise<void>>();
async function data(name: string) {
  if (!dataCache.has(name)) {
    const r = await fetch(`${import.meta.env.BASE_URL}models/${name}.json`);
    if (!r.ok) throw new Error(`모델을 불러오지 못했어요: ${name}`);
    dataCache.set(name, await r.json());
  }
  return dataCache.get(name)!;
}
function geometry(key: string, voxels: Voxel[], colors: string[], origin: number[], unit: number, front?: '-z') {
  if (geometryCache.has(key)) return geometryCache.get(key)!;
  const occupied = new Set(voxels.map(v => `${v[0]},${v[1]},${v[2]}`));
  const positions: number[] = [], normals: number[] = [], rgb: number[] = [];
  // Greedily merge coplanar, equally-colored exposed voxel faces into rectangles.
  for (let axis=0; axis<3; axis++) for (const sign of [-1,1]) {
    const u=(axis+1)%3,v=(axis+2)%3;
    const planes=new Map<number,Map<string,number>>();
    for (const cell of voxels) {
      const neighbor=cell.slice(0,3);neighbor[axis]+=sign;
      if(occupied.has(neighbor.join(','))) continue;
      const plane=cell[axis]+sign*.5;
      if(!planes.has(plane)) planes.set(plane,new Map());
      planes.get(plane)!.set(`${cell[u]},${cell[v]}`,cell[3]);
    }
    for(const [plane,mask] of planes) while(mask.size) {
      const [key,colorIndex]=mask.entries().next().value!;
      const [x,y]=key.split(',').map(Number);
      let w=1,h=1;
      while(mask.get(`${x+w},${y}`)===colorIndex) w++;
      outer: while(true) {
        for(let j=0;j<w;j++) if(mask.get(`${x+j},${y+h}`)!==colorIndex) break outer;
        h++;
      }
      for(let i=0;i<w;i++) for(let j=0;j<h;j++) mask.delete(`${x+i},${y+j}`);
      const color=new T.Color(colors[colorIndex-1]);
      const corners=[[x-.5,y-.5],[x+w-.5,y-.5],[x+w-.5,y+h-.5],[x-.5,y+h-.5]];
      for(const index of sign>0 ? [0,1,2,0,2,3] : [0,2,1,0,3,2]) {
        const pos=[0,0,0],normal=[0,0,0];pos[axis]=plane;pos[u]=corners[index][0];pos[v]=corners[index][1];normal[axis]=sign;
        positions.push(...pos.map((n,a)=>(n-origin[a])/unit));normals.push(...normal);rgb.push(color.r,color.g,color.b);
      }
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));
  if(front==='-z')g.rotateY(Math.PI);
  g.computeBoundingSphere();geometryCache.set(key,g);return g;
}
export function voxelModel(name: string, rig = false) {
  const d = dataCache.get(name)! ,
    group = new T.Group();
  if (rig || Object.values(d.parts).some(p=>p.rotation||p.scale)) {
    const groups: Record<string, T.Group> = {};
    for (const [n, p] of Object.entries(d.parts)) {
      const g = new T.Group();
      g.name = n;
      const mesh = new T.Mesh(
        geometry(`${name}:${n}`, p.voxels, d.colors, p.pivot, d.unit??d.size[1]*.9, d.front),
        mat,
      );
      mesh.castShadow = true;
      g.add(mesh);
      groups[n] = g;
    }
    for (const [n, p] of Object.entries(d.parts)) {
      const parent = p.parent ? d.parts[p.parent].pivot : d.pivot;
      groups[n].position.set(
        (p.pivot[0] - parent[0]) / (d.unit??d.size[1]*.9) * (d.front==='-z'?-1:1),
        (p.pivot[1] - parent[1]) / (d.unit??d.size[1]*.9),
        (p.pivot[2] - parent[2]) / (d.unit??d.size[1]*.9) * (d.front==='-z'?-1:1),
      );
      (p.parent ? groups[p.parent] : group).add(groups[n]);
      const rotation=p.rotation??[0,0,0],scale=p.scale??[1,1,1];
      groups[n].rotation.set(rotation[0],rotation[1],rotation[2]);
      groups[n].scale.set(scale[0],scale[1],scale[2]);
      groups[n].userData.restRotation=rotation;
      groups[n].userData.restScale=scale;
    }
    // Bake the same authored pose for static/farm rendering: one draw, identical silhouette.
    if(!rig){
      const key=`${name}:posed`;
      if(!geometryCache.has(key)){
        group.updateMatrixWorld(true);const pieces:T.BufferGeometry[]=[];
        group.traverse(o=>{if(o instanceof T.Mesh)pieces.push(o.geometry.clone().applyMatrix4(o.matrixWorld));});
        const merged=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());
        if(merged){merged.computeBoundingSphere();geometryCache.set(key,merged);}
      }
      group.clear();const mesh=new T.Mesh(geometryCache.get(key)!,mat);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
    }
  } else {
    const mesh = new T.Mesh(
      geometry(name, d.voxels, d.colors, d.pivot, d.size[1]*.9, d.front),
      mat,
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData.previewAngle=d.previewAngle;
  return group;
}

export async function loadVoxels(names: string[]) {
  await Promise.all(names.map(name => {
    if (dataCache.has(name)) return;
    if (!pending.has(name)) pending.set(name, data(name).then(() => {}).finally(() => pending.delete(name)));
    return pending.get(name)!;
  }));
}

/** Merge occupied body-height voxel columns into footprint strips, leaving doorways open. */
export function voxelColliders(name:string,x:number,z:number,scale:number,rotation:number):MapCollider[]{
 const d=dataCache.get(name)!,unit=d.size[1]*.9,rows=new Map<number,Set<number>>();
 for(const [vx,vy,vz] of d.voxels){
  const y=(vy-d.pivot[1])*scale/unit;
  if(y<.3||y>1.1)continue;
  if(!rows.has(vz))rows.set(vz,new Set());rows.get(vz)!.add(vx);
 }
 const boxes:MapCollider[]=[],cs=Math.cos(rotation),sn=Math.sin(rotation);
 for(const [vz,row] of rows)for(const vx of [...row].sort((a,b)=>a-b)){
  if(!row.has(vx))continue;let end=vx;while(row.has(end+1))end++;
  for(let k=vx;k<=end;k++)row.delete(k);
  const corners=[vx-.5,end+.5].flatMap(xx=>[vz-.5,vz+.5].map(zz=>{
   const px=(xx-d.pivot[0])*scale/unit,pz=(zz-d.pivot[2])*scale/unit;
   return {x:x+px*cs+pz*sn,z:z-px*sn+pz*cs};
  }));
  boxes.push({minX:Math.min(...corners.map(p=>p.x)),maxX:Math.max(...corners.map(p=>p.x)),minZ:Math.min(...corners.map(p=>p.z)),maxZ:Math.max(...corners.map(p=>p.z))});
 }
 return boxes;
}

export function proceduralVoxelModel(key:string,voxels:Voxel[],colors:string[]){
 const g=new T.Group(),mesh=new T.Mesh(geometry(key,voxels,colors,[9.5,0,9.5],18),mat);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return g;
}
