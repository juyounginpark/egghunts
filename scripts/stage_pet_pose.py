"""Authored assembly in voxel units; rotations are runtime radians, never per cell.

The 24-unit body sets scale, not a clipping box. Appendages may extend beyond it.
"""
import math
from stage_pet_finish import RECIPES

LONG = {'lizard','dragon','deer','horse','giraffe','camel','lion','fox','eel','seahorse','whale','fish','spino','scorpion'}
FLYING = {'bird','windbird','bat','phoenix','butterfly','bee','dragon','griffin','ray'}
# Each dragon's neck pitch, wing sweep, span, tail curl and tip elevation.
DRAGONS = [
 (-.08,.22,1.12,.16,.08),(.02,.12,1.05,-.12,0),(-.14,.32,1.3,.24,.12),
 (.12,.18,1.18,-.18,.04),(-.18,.36,1.25,.28,.16),(.08,.12,1.08,.13,.04),
 (0,.28,1.2,-.12,.02),(.04,.2,1.1,.22,0),(-.12,.14,1.18,.12,.12),
 (-.06,.3,1.24,-.25,.08),(-.18,.26,1.32,.18,.15),(.02,.38,1.42,-.2,.04),
 (.06,.2,1.22,.12,0),(-.12,.32,1.35,.2,.1),(.15,.18,1.16,-.28,.12),
 (.08,.14,1.12,.2,.02),(-.04,.36,1.38,-.15,.08),(.02,.16,1.08,.1,0),
 (-.16,.42,1.4,.3,.18),(-.12,.28,1.3,-.24,.16),
]

def assemble(g,row):
 stage,slot,form=row['stage'],row['slot'],row['anatomy']
 secret=slot==10
 sculpt(g,stage,slot,form)
 pitch,sweep,span,curl,lift=DRAGONS[stage-1] if secret else (0,.15,1.12,.18,.04)
 g.parts['head']={'rotation':[pitch if secret else (.035 if slot%2 else -.035),0,0]}
 for side,sign in [('left',1),('right',-1)]:
  g.parts[side+'_ear']={'rotation':[.06,0,sign*.12]}
 # Longer continuous tail, with overlapping roots. Each child inherits its parent's pose.
 # Shells and object-bearing tails keep their authored structure.
 if secret or form in LONG and slot not in [3,6]:
  for xyz,(_,part) in list(g.cells.items()):
   if part=='tail':del g.cells[xyz]
  start=18;cy=7 if secret else 6
  for i in range(4):
   name='tail' if i==0 else f'tail_{i}'
   radius=max(1,3-i*.65) if secret else max(.6,2-i*.45)
   z=start+i*4
   for zz in range(z-1,z+5):
    for yy in range(math.ceil(cy-radius),math.floor(cy+radius)+1):
     for xx in range(math.ceil(11.5-radius),math.floor(11.5+radius)+1):
      if ((xx-11.5)/radius)**2+((yy-cy)/radius)**2<=1.5:
       g.cells[xx,yy,zz]=(2 if i<2 else 4,name)
   g.parts[name]={'pivot':[11.5,cy,z], 'parent':'body' if i==0 else 'tail' if i==1 else f'tail_{i-1}', 'rotation':[lift,-curl,0]}
 # Split fan wings at the elbow, spread them as anatomical surfaces rather than cubes.
 if secret or form in FLYING:
  for side,sign in [('left',1),('right',-1)]:
   arm=side+'_arm';tip=side+'_tip'
   g.parts[arm]={'pivot':[6 if sign==1 else 17,11,12], 'rotation':[0,sign*sweep,sign*.1],'scale':[span,1,1]}
   moved=[]
   for xyz,(color,part) in list(g.cells.items()):
    if part==arm and (xyz[0]<=3 if sign==1 else xyz[0]>=20):moved.append((xyz,color))
   if moved:
    for xyz,color in moved:g.cells[xyz]=(color,tip)
    g.parts[tip]={'pivot':[3 if sign==1 else 20,11,12],'parent':arm,'rotation':[0,sign*.12,-sign*.08]}
 # Curved horn tips retain the broad, connected original root.
 if secret:
  for side,sign in [('left',1),('right',-1)]:
   root=6 if sign==1 else 17
   for i in range(3):
    x=root-sign*(i//2);z=6+i
    g.cells[x,22+i,z]=(3 if i<2 else 4,side+'_ear')
 return g

def sculpt(g,stage,slot,form):
 """Carve negative space and branch recognizable organs, keeping faces untouched."""
 def clear(part):
  for pos,(_,p) in list(g.cells.items()):
   if p==part:del g.cells[pos]
 def ball(x,y,z,r,c,p):
  for xx in range(math.floor(x-r),math.ceil(x+r)+1):
   for yy in range(max(0,math.floor(y-r)),math.ceil(y+r)+1):
    for zz in range(max(0,math.floor(z-r)),math.ceil(z+r)+1):
     if (xx-x)**2+(yy-y)**2+(zz-z)**2<=r*r:g.cells[xx,yy,zz]=(c,p)
 def stem(a,b,r,c,p):
  n=max(1,math.ceil(math.dist(a,b)*2))
  for i in range(n+1):
   t=i/n;ball(*(a[j]*(1-t)+b[j]*t for j in range(3)),r,c,p)
 def arc(center,r,start,end,c,p,plane='xy',thickness=1):
  for i in range(65):
   a=start+(end-start)*i/64;x,y,z=center
   if plane=='xy':x+=math.cos(a)*r;y+=math.sin(a)*r
   else:y+=math.cos(a)*r;z+=math.sin(a)*r
   ball(x,y,z,thickness,c,p)
 # Organic heads lose only their upper/rear corners; the face and eye plane
 # remain intact. Mechanisms, book creatures and intentionally hollow bodies stay angular.
 if stage not in [2,6,7,12,18,20] and form not in ['furnace','pot','dice','clock']:
  cells=[pos for pos,(_,p) in g.cells.items() if p=='head']
  if cells:
   lo=[min(v[a] for v in cells) for a in range(3)];hi=[max(v[a] for v in cells) for a in range(3)]
   for pos in cells:
    x,y,z=pos
    if z>g.face[1]+2 and y>g.face[0]+1:
     edge=sum(min(pos[a]-lo[a],hi[a]-pos[a])<1 for a in range(3))
     if edge>=2:del g.cells[pos]
 recipe=RECIPES[stage-1].split()[slot] if slot<10 else ''
 if recipe in ['moon','crescent','spiral','sandstone','ammonite','obsidian','cave']:
  clear('crown')
  if recipe in ['moon','crescent']:
   stem((11.5,8,15),(11.5,15,15),1,3,'crown')
   arc((11.5,17,15),5,.55,5.5,2,'crown',thickness=1.25)
  elif recipe=='cave':
   # Glacier snail shelters an open crystal nave, unlike the volcano's spiral.
   arc((11.5,11,15),5.5,0,math.pi,2,'crown',plane='yz',thickness=1.5)
   for i in range(4):stem((11.5,16-i*.5,12+i*2),(11.5,13-i*.5,12+i*2),.85,4,'crown')
   stem((11.5,6,14),(11.5,10,15),1.6,3,'crown')
  else:
   for i in range(95):
    a=i/94*math.pi*3.5;r=5.5*(1-i/110)
    ball(11.5,13+math.sin(a)*r,15+math.cos(a)*r,1.6,2 if i<60 else 4,'crown')
   stem((11.5,6,14),(11.5,10,15),1.6,3,'crown')
 elif recipe in ['coral','seacrown','tree','antler','fern','rebar','memorytree']:
  clear('crown')
  for sign in [-1,1]:
   stem((11.5,7,15),(11.5+sign*3,16,15),1.3,2,'crown')
   for i in range(3):
    start=(11.5+sign*(1.3+i*.6),10+i*2.3,15)
    end=(11.5+sign*(4+i),13+i*3,15+(i%2)*2)
    stem(start,end,1.1 if i<2 else .85,2,'crown');ball(*end,1.15,4,'crown')
 elif recipe in ['pearl','empty','eggnest']:
  clear('crown')
  for sign in [-1,1]:
   for i in range(6):
    t=i/5;stem((11.5,7,14),(11.5+sign*(2+t*5),11+math.sin(t*math.pi)*5,16+t*2),1.15,2 if i%2 else 4,'crown')
  if recipe!='empty':ball(11.5,10,15,2,6,'crown')
 elif recipe in ['planet','constellation','observatory','transmitter','mothership','galaxy'] or slot==10 and stage in [7,12,19,20]:
  clear('crown')
  if stage==20:
   arc((11.5,16,15),6,.2,2.6,4,'crown');arc((11.5,16,15),6,3.4,5.6,2,'crown')
  else:
   arc((11.5,16,15),6,0,math.tau,2,'crown',thickness=.9)
   if stage==19:arc((11.5,16,15),4.5,0,math.tau,4,'crown',plane='yz',thickness=.85)
  stem((11.5,7,15),(11.5,10,15),1,3,'crown')
 # Dragon membranes/fins/feathers use bent leading edges with graduated fans.
 # Six wing ecologies, with stage-specific shoulder span and tail posture above.
 if slot==10 and stage not in [2,7,12,18,20]:
  for side,sign in [('left',-1),('right',1)]:
   part=side+'_arm';clear(part)
   root=(11.5+sign*5,11,12)
   elbow=(11.5+sign*9,15+(stage%3),14)
   stem(root,elbow,1.4,3,part)
   for finger in range(5):
    if stage in [3,5,14]:tip=(11.5+sign*(10+finger*.8),17-finger*1.9,15+finger*.7)
    elif stage in [1,9,17]:tip=(11.5+sign*(8+finger),19-finger*1.6,15+finger*.5)
    elif stage in [10,11,15,19]:tip=(11.5+sign*(11+finger*.9),19-finger*1.7,14+finger*.45)
    else:tip=(11.5+sign*(12-finger*.5),18-finger*2.1,15+finger*.85)
    stem(elbow,tip,1.2 if stage in [10,11,15,19] else 1.5,2 if finger<3 else 4,part)
