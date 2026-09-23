import * as T from "three";
type Voxel = [number, number, number, number];
type Model = {
  colors: string[];
  size: number[];
  pivot: number[];
  voxels: Voxel[];
  parts: Record<
    string,
    { pivot: number[]; parent: string | null; voxels: Voxel[] }
  >;
};
const mat = new T.MeshLambertMaterial({ vertexColors: true });
const geometryCache = new Map<string, T.BufferGeometry>();
const dataCache = new Map<string, Model>();
const pending = new Map<string, Promise<void>>();
async function data(name: string) {
  if (!dataCache.has(name)) {
    const r = await fetch(`/models/${name}.json`);
    if (!r.ok) throw new Error(`모델을 불러오지 못했어요: ${name}`);
    dataCache.set(name, await r.json());
  }
  return dataCache.get(name)!;
}
function geometry(key: string, voxels: Voxel[], colors: string[], origin: number[], unit: number) {
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
  g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.computeBoundingSphere();geometryCache.set(key,g);return g;
}
export function voxelModel(name: string, rig = false) {
  const d = dataCache.get(name)! ,
    group = new T.Group();
  if (rig) {
    const groups: Record<string, T.Group> = {};
    for (const [n, p] of Object.entries(d.parts)) {
      const g = new T.Group();
      g.name = n;
      const mesh = new T.Mesh(
        geometry(`${name}:${n}`, p.voxels, d.colors, p.pivot, d.size[1]*.9),
        mat,
      );
      mesh.castShadow = true;
      g.add(mesh);
      groups[n] = g;
    }
    for (const [n, p] of Object.entries(d.parts)) {
      const parent = p.parent ? d.parts[p.parent].pivot : d.pivot;
      groups[n].position.set(
        (p.pivot[0] - parent[0]) / (d.size[1]*.9),
        (p.pivot[1] - parent[1]) / (d.size[1]*.9),
        (p.pivot[2] - parent[2]) / (d.size[1]*.9),
      );
      (p.parent ? groups[p.parent] : group).add(groups[n]);
    }
  } else {
    const mesh = new T.Mesh(
      geometry(name, d.voxels, d.colors, d.pivot, d.size[1]*.9),
      mat,
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

export async function loadVoxels(names: string[]) {
  await Promise.all(names.map(name => {
    if (dataCache.has(name)) return;
    if (!pending.has(name)) pending.set(name, data(name).then(() => {}).finally(() => pending.delete(name)));
    return pending.get(name)!;
  }));
}

export function proceduralVoxelModel(key:string,voxels:Voxel[],colors:string[]){
 const g=new T.Group(),mesh=new T.Mesh(geometry(key,voxels,colors,[9.5,0,9.5],18),mat);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return g;
}
