"""Six hand-authored 24³ pets. Integer solids, no procedural surface noise.

The cell dictionary is the single source for static geometry and exact rig partitions.
Source front is -Z, paired anatomy mirrors x -> 23-x.
"""
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/models'
BRIEFS = [
 dict(name='새싹콩', concept='햇빛을 따라 두 잎을 기울이는 어린 콩 정령', body='낮고 납작한 씨앗과 작은 뿌리 발', feature='몸보다 높이 솟은 두 장의 두꺼운 잎', face='넓게 뜬 눈으로 위를 살핌', idle='두 잎을 번갈아 까딱하고 고개를 올림', colors=['#94bd59','#477b4a','#e5ecad','#28372f','#fff8df'], angle=32),
 dict(name='달토리', concept='달빛을 귀에 모으는 수줍은 풀숲 토끼', body='좁고 긴 몸과 모아 든 앞발, 큰 뒷발', feature='몸 높이만큼 긴 한 쌍의 귀', face='작은 입과 멀찍이 벌어진 눈, 움츠린 목', idle='귀를 움찔한 뒤 몸을 살짝 웅크림', colors=['#b5a5cc','#e5bed1','#eee5ed','#34354c','#fff9ee'], angle=26),
 dict(name='별꼬리', concept='밤에 모은 빛을 별 꼬리에 저장하는 장난꾸러기 들쥐', body='작은 둥근 몸 앞에 짧은 발, 뒤로 큰 별 부채', feature='몸의 두 배 너비로 펼친 입체 별 꼬리', face='살짝 치켜든 눈과 뒤를 돌아보는 머리', idle='별을 흔들고 고개를 뒤로 돌림', colors=['#626ca3','#e9b84e','#f8df86','#272b45','#fff3d5'], angle=-32),
 dict(name='여우콩', concept='풀숲에 납작 엎드려 바람을 읽는 여우', body='낮고 긴 네 발 몸과 넓은 볼', feature='등 뒤에서 커다랗게 꺾여 올라오는 붓 꼬리', face='가늘게 뜬 눈과 앞으로 나온 작은 코', idle='고개를 좌우로 살피며 꼬리를 천천히 움직임', colors=['#d98a4e','#a95638','#f5dfb4','#39343a','#fff7e3'], angle=40),
 dict(name='고양콩', concept='이슬을 건드리려다 멈춘 당당한 고양이', body='몸보다 넓은 머리와 단단한 앉은 몸', feature='큰 삼각 귀와 머리 옆까지 치켜든 갈고리 꼬리', face='곧게 선 눈동자와 한쪽으로 돌린 고개', idle='고개를 돌리고 꼬리 끝을 들어 올림', colors=['#e6d8b6','#8c999a','#f7ecd4','#343b3e','#afbb87'], angle=-30),
 dict(name='곰구리', concept='따뜻한 흙을 앞발로 다독이는 졸음 많은 곰', body='폭넓은 몸과 아주 짧은 뒷다리, 묵직한 앞발', feature='넓적한 얼굴 아래 두 개의 큰 앞발', face='처진 눈꺼풀과 넓은 크림색 주둥이', idle='천천히 졸다가 고개를 들고 다시 편안해짐', colors=['#94725e','#624d45','#dec4a0','#302d32','#fff0d7'], angle=28),
]

class Pet:
 def __init__(self):
  self.cells = {}
  self.rig = {'body':([11.5,5,11.5],None), 'head':([11.5,10,8],'body'), 'eyes':([11.5,12,4],'head'), 'left_ear':([7,15,8],'head'), 'right_ear':([16,15,8],'head'), 'tail':([11.5,6,15],'body'), 'left_leg':([7,4,10],'body'), 'right_leg':([16,4,10],'body')}
 def box(self,x0,x1,y0,y1,z0,z1,c=1,part='body'):
  for x in range(x0,x1+1):
   for y in range(y0,y1+1):
    for z in range(z0,z1+1):
     assert 0<=x<24 and 0<=y<24 and 0<=z<24
     self.cells[x,y,z]=(c,part)
 def pair(self,x0,x1,y0,y1,z0,z1,c=1,part='body'):
  self.box(x0,x1,y0,y1,z0,z1,c,part)
  self.box(23-x1,23-x0,y0,y1,z0,z1,c,part.replace('left_','right_'))
 def eyes(self,x0,y0,z0,h=3):
  self.pair(x0,x0+1,y0,y0+h-1,z0,z0,4,'eyes')
 def shape(self,x0,x1,y0,y1,z0,z1,c=1,part='body'):
  # One-cell bevel only at the four vertical corners: large clean planar surfaces.
  self.box(x0+1,x1-1,y0,y1,z0,z1,c,part)
  self.box(x0,x1,y0,y1,z0+1,z1-1,c,part)

def sculpt(i):
 p=Pet(); b=p.box; q=p.pair; s=p.shape
 if i==0:
  s(5,18,3,10,6,16);s(6,17,10,12,7,15,1,'head')
  q(7,9,1,2,7,11,2,'left_leg');p.rig['head']=([11.5,9,11],'body')
  q(7,9,12,15,10,12,2,'left_ear');q(3,8,15,20,9,12,2,'left_ear');q(2,6,18,22,9,11,1,'left_ear')
  p.rig['left_ear']=([8,12,11],'head');p.rig['right_ear']=([15,12,11],'head')
  p.eyes(7,8,5);b(11,12,6,6,5,5,4,'head')
 elif i==1:
  s(8,15,3,11,9,15);s(7,16,10,15,6,12,1,'head');b(9,14,4,9,8,8,3)
  q(5,9,1,3,7,14,3,'left_leg');q(8,9,6,8,6,8,1)
  q(6,9,15,22,8,11,1,'left_ear');q(7,8,17,21,7,7,2,'left_ear')
  p.rig['left_ear']=([8,15,9],'head');p.rig['right_ear']=([15,15,9],'head')
  p.eyes(8,11,5);b(11,12,10,10,5,5,2,'head');s(10,13,5,8,15,18,3,'tail')
 elif i==2:
  s(8,15,3,10,5,12);s(7,16,8,13,3,9,1,'head');q(7,9,12,15,6,8,1,'left_ear')
  q(8,10,1,2,4,8,1,'left_leg');p.eyes(8,9,2);b(11,12,7,7,2,3,2,'head')
  b(10,13,5,8,11,18,1,'tail')
  # Broad five-point star, extruded three cells; stepped contour is intentional.
  poly=[(11.5,22),(14,16),(21,16),(16,11),(18,4),(11.5,8),(5,4),(7,11),(2,16),(9,16)]
  def inside(x,y):
   hit=False
   for a,c in zip(poly,poly[1:]+poly[:1]):
    if (a[1]>y)!=(c[1]>y) and x<(c[0]-a[0])*(y-a[1])/(c[1]-a[1])+a[0]:hit=not hit
   return hit
  for x in range(2,12):
   for y in range(4,23):
    if inside(x,y):q(x,x,y,y,17,20,2,'tail')
  s(9,14,11,15,16,16,3,'tail');p.rig['tail']=([11.5,7,15],'body')
 elif i==3:
  s(7,16,4,9,7,17);s(4,19,7,12,3,9,1,'head');q(4,8,7,10,2,4,3,'head')
  q(5,8,12,15,5,8,1,'left_ear');q(6,7,15,17,6,7,1,'left_ear')
  q(7,9,1,4,5,8,2,'left_leg');q(7,9,1,4,14,17,2,'left_leg')
  s(9,14,6,9,1,4,3,'head');b(10,13,8,9,0,0,4,'head');p.eyes(6,10,2,1)
  s(8,15,6,10,15,20,1,'tail');s(6,17,10,15,17,22,1,'tail');s(7,16,15,18,18,22,3,'tail')
  p.rig['head']=([11.5,8,7],'body')
 elif i==4:
  s(8,15,2,9,8,15);q(8,10,1,5,5,8,1,'left_leg');s(4,19,9,16,4,13,1,'head')
  q(4,8,16,18,5,10,1,'left_ear');q(5,7,19,21,6,9,1,'left_ear');q(6,7,17,19,4,4,2,'left_ear')
  q(7,9,11,13,3,3,5,'head');p.eyes(8,11,2);b(11,12,10,10,3,3,2,'head')
  # A single raised hook is purposeful asymmetric anatomy, not a mirrored pair.
  b(15,18,3,6,14,17,2,'tail');b(18,20,6,17,16,18,2,'tail');b(16,19,17,19,16,18,2,'tail')
  p.rig['tail']=([16,5,14],'body');p.rig['head']=([11.5,10,8],'body')
 else:
  s(4,19,3,11,8,18);s(3,20,9,16,4,13,1,'head');q(3,7,16,19,7,11,1,'left_ear')
  q(4,8,1,3,13,17,2,'left_leg');q(3,8,1,7,3,8,1,'left_leg');q(4,7,1,2,2,3,2,'left_leg')
  s(7,16,8,12,2,4,3,'head');b(10,13,10,11,1,1,4,'head');p.eyes(6,13,3,1)
  s(10,13,5,8,18,20,2,'tail');p.rig['head']=([11.5,10,9],'body')
 return p

def author():
 concepts=json.loads((ROOT/'docs/art/character-concepts.json').read_text(encoding='utf8'))
 manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf8'))
 for i,brief in enumerate(BRIEFS):
  p=sculpt(i);voxels=[[*v,c] for v,(c,_) in sorted(p.cells.items())]
  parts={k:dict(pivot=pivot,parent=parent,voxels=[[*v,c] for v,(c,part) in sorted(p.cells.items()) if part==k]) for k,(pivot,parent) in p.rig.items()}
  # Empty pivots may parent movable anatomy; keeping them makes the rig explicit.
  model=dict(size=[24]*3,front='-z',colors=brief['colors'],pivot=[11.5,.5,11.5],voxels=voxels,parts=parts)
  key=f'pet-{i}';(OUT/f'{key}.json').write_text(json.dumps(model,separators=(',',':')),encoding='utf8')
  (OUT/f'{key}.design.json').write_text(json.dumps(dict(schema='alkong-authored-24-v1',size=[24]*3,mirrorX=11.5,concept=brief,source='scripts/first_six_pets.py'),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
  def chunk(tag,body):return tag+struct.pack('<II',len(body),0)+body
  palette=b''.join(bytes.fromhex(c[1:])+b'\xff' for c in brief['colors'])+bytes(251*4)
  chunks=chunk(b'SIZE',struct.pack('<III',24,24,24))+chunk(b'XYZI',struct.pack('<I',len(voxels))+b''.join(bytes([x,z,y,c]) for x,y,z,c in voxels))+chunk(b'RGBA',palette)
  (OUT/f'{key}.vox').write_bytes(b'VOX '+struct.pack('<I',150)+b'MAIN'+struct.pack('<II',0,len(chunks))+chunks)
  row=next(r for r in concepts if r['key']==key)
  row.update(concept=brief['concept'],silhouette=[brief['body'],brief['feature']],personality=brief['face'],ecology=brief['idle'],colors=dict(primary=brief['colors'][0],accent=brief['colors'][1]),grid=24,symmetry='x ↔ 23-x; 고양콩의 갈고리 꼬리만 의도적 비대칭',idle=brief['idle'],previewAngle=brief['angle'])
  record=next(r for r in manifest['models'] if r['name']==key)
  record.update(grid=[24]*3,voxelCount=len(voxels),bounds=[[min(v[a] for v in voxels),max(v[a] for v in voxels)] for a in range(3)])
 (ROOT/'docs/art/character-concepts.json').write_text(json.dumps(concepts,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
 print('Authored pet-0 through pet-5: six distinct 24-cube rigs.')

if __name__=='__main__':author()
