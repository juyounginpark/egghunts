"""220 authored stage pets, 24³. --stages 1 12 20 is the pilot, no ID migration."""
import argparse
import json
import math
import re
import struct
from pathlib import Path
from stage_pet_designs import LANGUAGES,FORMS,ROLES,ROLE_SLOTS,BODY_NOTES,FEATURES,EXPRESSIONS,IDLES,REACTIONS,DRAGON_STRUCTURES
from stage_pet_finish import OBJECTS,RECIPES,PLACEMENT,MATERIALS,PALETTES,FACE_DESCRIPTIONS,mount_object,expressive_face,finish_colors,connect_anatomy,material_colors

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/models';ART=ROOT/'docs/art'
def catalog(path):
 s=(ROOT/path).read_text(encoding='utf8');return json.loads(s[s.index('['):s.rindex(']')+1])

class Grid:
 def __init__(self):self.cells={};self.face=(11,3);self.parts={}
 def box(self,x0,x1,y0,y1,z0,z1,c=1,p='body'):
  for x in range(max(0,int(x0)),min(23,int(x1))+1):
   for y in range(max(0,int(y0)),min(23,int(y1))+1):
    for z in range(max(0,int(z0)),min(23,int(z1))+1):self.cells[x,y,z]=(c,p)
 def pair(self,x0,x1,y0,y1,z0,z1,c=1,p='body'):
  self.box(x0,x1,y0,y1,z0,z1,c,p);self.box(23-x1,23-x0,y0,y1,z0,z1,c,p.replace('left_','right_'))
 def solid(self,x0,x1,y0,y1,z0,z1,c=1,p='body'):
  self.box(x0+1,x1-1,y0,y1,z0,z1,c,p);self.box(x0,x1,y0,y1,z0+1,z1-1,c,p)
 def cut(self,x0,x1,y0,y1,z0,z1,parts=None):
  for pos in list(self.cells):
   x,y,z=pos
   if x0<=x<=x1 and y0<=y<=y1 and z0<=z<=z1 and (parts is None or self.cells[pos][1] in parts):del self.cells[pos]
 def frame(self,x0,x1,y0,y1,z0,z1,c=2,p='crown',gap=2):
  self.box(x0,x1,y0,y1,z0,z1,c,p);self.cut(x0+gap,x1-gap,y0+gap,y1-gap,z0,z1,{p})
 def head(self,width=10,y=11,z=3,height=6):
  x0=(24-width)//2;self.solid(x0,23-x0,y-2,y+height-3,z,z+6,1,'head');self.face=(y,z-1)
 def feet(self,wide=False,quad=False):
  self.pair(4 if wide else 7,8 if wide else 9,1,4,6,10,3,'left_leg')
  if quad:self.pair(5,8,1,4,15,19,3,'left_leg')
 def face_features(self,expression):
  y,z=self.face;h=1 if expression in [2,5] else 3
  x=7 if expression not in [1,4] else 6
  # Face support remains a head solid, so expressions never float in empty space.
  self.pair(x,x+1,y,y+h-1,z+1,z+2,1,'head')
  self.pair(x,x+1,y,y+h-1,z,z,5,'eyes')
  if expression in [3,7]:self.pair(x-1,x+1,y+3,y+3,z,z,3,'head')
  self.box(11,12,y-2,y-2,z,z,5,'head')
 def ear(self,kind='long'):
  if kind=='long':self.pair(5,8,15,22,7,10,2,'left_ear')
  else:self.pair(4,7,15,18,7,10,1,'left_ear')

def body(g,form,stage,slot):
 b,q,s=g.box,g.pair,g.solid;h=g.head
 # Ten plans choose different mass distributions. Dimensions vary within species
 # (not a common upright base with a different hat).
 wide=slot in [2,5,9];yy=10+(stage+slot)%3
 if form in ['seed','sprout','slime','bubble','ice','ember']:
  if form=='sprout':q(7,10,4,12,8,13);s(6,17,1,4,7,16,3)
  elif form=='slime':s(3,20,1,5,6,19);s(6,17,5,10,7,16)
  elif form=='ice':q(4,8,2,12,7,16,2);b(9,14,2,18,9,15,1)
  elif form=='ember':g.frame(5,18,3,14,6,16,1,'body',3)
  else:s(4 if wide else 6,19 if wide else 17,3,yy,7,17)
  h(12,yy-1,4,5);g.feet()
 elif form in ['rabbit','mouse','squirrel','bear','owl','penguin','goblin']:
  width=14 if form=='bear' else 8 if form=='rabbit' else 10
  s((24-width)//2,(22+width)//2,3,11,8,16);h(16 if form in ['bear','owl'] else 12,12,3,6);g.feet(form=='bear')
  if form=='rabbit':g.ear()
  elif form in ['mouse','bear','squirrel']:g.ear('short')
  if form=='bear':q(3,7,2,8,3,8,1,'left_arm')
  elif form=='penguin':q(3,5,6,12,9,13,2,'left_arm');b(8,15,4,10,6,7,4)
  elif form=='owl':q(3,6,6,12,9,15,2,'left_arm')
  else:q(7,9,6,9,4,6,1,'left_arm')
  if form=='squirrel':g.frame(3,20,8,21,18,21,2,'tail',3)
 elif form in ['dog','fox','lion','boar','horse','ram','deer','giraffe','camel','lizard','dragon','griffin','triceratops','elephant','frog']:
  s(6,17,4,10,6,19);g.feet(form=='lion',True)
  if form in ['deer','horse','giraffe']:q(6,8,2,7,7,10,3,'left_leg');b(9,14,9,16 if form=='giraffe' else 13,6,11);h(10,16 if form=='giraffe' else 13,3,5)
  else:h(14 if form in ['fox','lion','triceratops'] else 10,9,2,5)
  if form in ['dog','boar']:s(8,15,6,9,0,3,3,'head')
  if form in ['lion','triceratops']:q(2,5,6,15,5,9,2,'head');b(5,18,14,16,5,9,2,'head')
  elif form=='ram':q(2,5,11,17,6,11,2,'left_ear');q(3,6,9,11,4,7,2,'left_ear')
  else:q(5,8,13,17,5,8,2,'left_ear')
  if form=='fox':s(6,17,9,18,17,22,2,'tail');s(8,15,18,20,18,22,4,'tail')
  elif form=='camel':s(7,16,10,16,13,18,2)
  else:b(9,14,5,8,18,22,2,'tail')
  if form in ['dragon','griffin']:q(1,5,10,16,10,16,2,'left_arm')
  if form=='elephant':q(1,5,8,16,5,9,2,'left_ear');b(10,13,2,9,0,2,1,'head')
  if form=='frog':q(2,6,2,8,13,19,2,'left_leg');q(4,7,12,15,3,6,1,'head')
 elif form in ['turtle','dice','snail','ammonite','hedgehog','armadillo','furnace','pot','mushroom']:
  s(4,19,3,8,7,19);g.feet(True,True);h(10,7,2,5)
  if form in ['snail','ammonite']:
   g.frame(5,18,7,21,11,19,2,'crown',3);b(9,14,11,16,10,11,3,'crown')
  elif form=='mushroom':s(2,21,13,17,5,20,2,'crown');b(8,15,6,13,9,14)
  elif form=='pot':s(5,18,7,16,8,18);b(4,19,16,18,7,19,2,'crown')
  elif form=='furnace':g.frame(4,19,5,16,6,17,2,'crown',3)
  elif form=='hedgehog':
   for z in [9,14,19]:b(4,19,8,12+(z-9)//2,z,z+2,2,'crown')
  elif form=='armadillo':
   for z in [9,13,17]:s(3,20,6,14,z,z+2,2,'crown')
  else:s(3,20,7,15 if form=='dice' else 12,8,19,2,'crown')
 elif form in ['bird','windbird','bat','phoenix','butterfly','bee']:
  s(8,15,4,13,7,14);h(10,12,3,6);g.feet()
  b(10,13,10,11,0,3,3,'head')
  if form in ['butterfly','bat']:q(1,7,10,19,9,12,2,'left_arm');q(3,7,4,8,10,13,3,'left_arm')
  elif form in ['phoenix','windbird']:q(1,7,9,14,9,13,2,'left_arm');q(2,4,14,18,10,13,2,'left_arm')
  else:q(3,7,7,12,9,14,2,'left_arm')
  if form=='bee':s(7,16,4,10,13,20,3,'tail')
  elif form=='phoenix':q(6,9,2,5,14,22,3,'tail')
  else:s(8,15,4,6,14,19,2,'tail')
 elif form in ['fish','whale','ray','angler','seahorse','eel','cobra']:
  if form in ['eel','seahorse','cobra']:
   b(9,14,2,5,8,20);b(12,16,5,12,13,17);b(8,14,11,16,9,14);h(10,16,4,5)
   if form=='cobra':q(3,7,10,19,9,12,2,'left_ear')
  else:
   s(4 if form=='whale' else 6,19 if form=='whale' else 17,6,13,4,18);h(14 if form=='whale' else 10,10,2,5)
   q(1,5,5,7,9,16,2,'left_arm');b(10,13,8,11,17,21,2,'tail');q(4,10,8,11,20,22,3,'tail')
   if form=='ray':q(1,7,7,9,5,19,2,'left_arm')
   if form=='angler':b(10,13,14,22,10,12,3,'crown');b(10,13,20,22,4,12,3,'crown');s(9,14,17,20,2,6,4,'crown')
 elif form in ['crab','scorpion','octopus','jelly','squid','spider']:
  s(5,18,7,14,7,17);h(12,11,3,5)
  for z in [7,13,18]:q(2,6,2,5,z,z+2,2,'left_leg');q(1,3,4,7,z,z+2,2,'left_leg')
  if form in ['crab','scorpion']:g.frame(0,5,8,14,3,7,2,'left_arm',2);g.frame(18,23,8,14,3,7,2,'right_arm',2)
  if form=='scorpion':b(10,13,7,20,18,21,2,'tail');b(10,13,18,21,11,20,2,'tail')
  if form=='jelly':s(2,21,13,17,5,20,2,'crown')
  if form=='squid':s(7,16,14,21,8,16,2,'crown');q(7,9,1,7,4,7,3,'left_arm')
 elif form in ['beetle','mantis','caterpillar','spino','tank']:
  if form=='caterpillar':
   for n,z in enumerate([5,11,17]):s(6-n,17+n,3,10+n,z,z+5,1 if n%2 else 2)
  else:s(5,18,4,11,7,19)
  h(10,9 if form!='spino' else 13,2,5);g.feet(True,True)
  if form=='beetle':q(4,10,10,15,9,20,2,'left_arm');b(10,13,12,20,4,6,3,'crown')
  elif form=='mantis':q(2,5,7,16,5,8,2,'left_arm');q(3,7,5,8,2,5,2,'left_arm')
  elif form=='spino':b(10,13,10,22,10,18,2,'crown');b(10,13,5,8,18,23,2,'tail')
  elif form=='tank':q(1,5,1,6,5,21,3,'left_leg')
 elif form in ['clam','clock','robot','locker','ink','tripod','dancer','airship','angel','ghost']:
  if form in ['clam','airship']:s(3,20,5,12,6,20)
  elif form in ['ghost','clock','angel']:g.frame(5,18,4,16,8,16,1,'body',3)
  else:s(7,16,3,14,7,17)
  h(12,13,3,6);g.feet()
  if form=='clam':s(2,21,3,5,4,20,2,'left_arm');s(3,20,17,19,7,20,2,'right_arm')
  elif form=='locker':g.frame(4,19,4,21,13,17,2,'crown',2)
  elif form=='ink':b(7,16,18,21,6,15,3,'crown')
  elif form=='clock':b(10,13,1,7,9,12,3,'tail')
  elif form=='tripod':b(9,14,1,4,18,22,3,'tail');q(1,6,1,4,4,9,2,'left_leg')
  elif form=='dancer':s(2,21,3,6,5,20,2,'tail');q(2,6,11,14,8,12,3,'left_arm')
  elif form=='airship':s(1,22,14,20,7,19,2,'crown')
  elif form=='angel':
   for y in [5,11,17]:q(0,5,y,y+3,11,15,2,'left_arm')
  else:q(2,6,8,12,8,12,2,'left_arm')
 else:raise ValueError(form)

def adapt_habitat(g,stage,slot):
 # Environmental adaptation changes load-bearing masses before the landmark organ.
 # All mirrored coordinates are transformed identically around X=11.5.
 if stage==3:
  for xyz,(_,part) in list(g.cells.items()):
   if part.endswith('_leg'):del g.cells[xyz]
  g.pair(1,6,3,5,7,18,3,'left_arm')
  if slot==0:
   g.cells={};g.solid(2,21,5,12,4,19,1);g.head(14,9,2,5)
   g.pair(0,4,5,7,8,19,3,'left_arm');g.box(8,15,4,6,19,23,2,'tail')
 elif stage==8:
  # Broad sand pads and lateral cooling ears, not a rabbit with a yellow hat.
  for xyz,(_,part) in list(g.cells.items()):
   if part.endswith('_ear'):del g.cells[xyz]
  g.pair(0,5,12,15,7,12,2,'left_ear');g.pair(2,9,1,3,5,17,3,'left_leg')
  if slot==0:g.solid(7,16,4,8,15,22,1,'tail')
 elif stage==9:
  g.pair(2,7,2,6,13,21,3,'left_leg');g.box(9,14,5,8,17,23,2,'tail')
  if slot==0:
   for xyz,(_,part) in list(g.cells.items()):
    if part.endswith('_ear'):del g.cells[xyz]
   g.pair(4,8,14,16,9,13,4,'left_ear')
 elif stage==15 and slot==0:
  # A curled sleeper: a wide low pillow body with folded ears along its back.
  g.cells={};g.solid(3,20,3,9,5,20,1);g.head(14,9,2,5)
  g.pair(4,8,11,14,9,21,2,'left_ear');g.pair(5,9,1,3,7,13,3,'left_leg')

def organ(g,stage,slot,dragon=False):
 # These organs change the outer contour. They attach to four different zones,
 # and also change the body's structure (hollow cores, feet, hoods, shells).
 b,q,s=g.box,g.pair,g.solid
 zone=slot%4;y=[16,12,9,6][zone];z=[12,17,13,19][zone];part=['crown','tail','left_arm','tail'][zone]
 x0=3 if zone==2 else 6; x1=8 if zone==2 else 10
 if stage not in [12,20]:
  if zone==0:b(10,13,9,y+2,z,z+2,3,part)
  elif zone==1:b(9,14,7,y+1,14,z+2,3,part)
  elif zone==2:b(6,17,8,11,12,15,3,'body')
  else:b(9,14,5,8,14,z+2,3,part)
 if stage==1:q(x0,x1,y,y+5,z,z+3,2,part);q(x0-2,x1-2,y+3,y+7,z,z+2,3,part)
 elif stage==2:
  g.frame(5,18,y,y+6,z,z+2,2,part,2);b(10,13,y-2,y+8,z,z+2,3,part);q(3,6,2,5,12,17,2,'left_leg')
 elif stage==3:
  # Coral grows sideways in three broad terraces rather than two upright leaves.
  for n in range(3):q(max(0,x0-2*n),max(2,x0+2-2*n),y+n*2,y+n*2+2,z+n*2,z+n*2+3,2,part)
  q(2,5,4,6,9,17,3,'left_arm')
 elif stage==4:
  q(3,8,y,y+5,z,z+4,3,part);q(4,9,y+5,y+7,z+1,z+4,2,part);b(10,13,4,7,10,18,2)
 elif stage==5:
  q(3,6,y-4,y+3,z,z+3,2,part);q(4,8,y-5,y-3,z-2,z+3,4,part);b(10,13,y+2,y+7,z,z+2,2,part)
 elif stage==6:
  q(2,8,y,y+6,z,z+2,2,part);q(6,10,y-1,y+4,z+3,z+5,4,part);b(10,13,2,4,10,15,3,'tail')
 elif stage==7:
  g.frame(2,21,y-2,y+6,z,z+2,2,part,3);q(1,4,2,4,8,17,3,'left_leg');g.cut(9,14,5,8,10,15,{'body'})
 elif stage==8:
  for n in range(3):b(3+n*3,20-n*3,y+n*2,y+n*2+1,z,z+4,2 if n!=1 else 3,part)
  q(3,8,1,3,7,17,3,'left_leg')
 elif stage==9:
  for zz in [z-3,z+1,z+5]:g.frame(4,19,y-3,y+5,zz,zz+1,4,part,2)
  b(10,13,7,11,18,22,2,'tail')
 elif stage==10:
  b(3,20,y,y+2,z,z+5,3,part);q(1,4,y+2,y+4,z,z+5,2,part);b(7,16,y+3,y+4,z+1,z+4,2,part)
 elif stage==11:
  q(3,6,y-2,y+5,z,z+3,4,part);b(3,20,y+5,y+7,z,z+3,2,part);q(4,9,1,3,5,15,4,'left_leg')
 elif stage==12:
  s(2,21,y+2,y+4,z-2,z+4,2,'float');b(8,15,y+6,y+7,z,z+2,3,'float');q(2,8,1,3,5,17,3,'left_leg')
 elif stage==13:
  q(1,7,y-1,y+2,z,z+2,2,part);q(3,5,y-4,y+6,z,z+2,3,part);b(10,13,y,y+7,z+1,z+3,2,part)
 elif stage==14:
  for n in range(3):q(2+n*3,4+n*3,y-n,y+6-n,z+n,z+n+3,4 if n==1 else 2,part)
  q(4,8,1,2,5,20,3,'left_leg')
 elif stage==15:
  s(2,21,y,y+3,z-1,z+4,2,part);q(3,7,y+3,y+5,z,z+3,4,part);b(10,13,y-4,y-1,z,z+2,3,'float')
 elif stage==16:
  q(3,6,y-3,y+6,z,z+3,3,part);b(3,20,y+4,y+6,z,z+3,2,part);q(6,9,2,4,15,21,2,'left_leg')
 elif stage==17:
  for n in range(3):q(2+n,5+n,y-2+n*3,y+n*3,z+n,z+n+3,2 if n%2 else 3,part)
  q(1,4,3,5,10,18,3,'left_leg')
 elif stage==18:
  q(2,5,y-2,y+6,z,z+3,3,part);b(2,21,y-2,y,z,z+3,2,part);q(2,6,y+4,y+6,z-1,z+3,2,part)
 elif stage==19:
  # Stepped diagonal orbit, no thin wire geometry.
  for n in range(5):q(2+n*2,3+n*2,y+n-3,y+n-1,z+n,z+n+2,3,part)
  q(4,8,y+4,y+6,z+2,z+4,2,part)
 elif stage==20:
  q(2,5,y-3,y+5,z,z+3,3,part);q(3,9,y+5,y+7,z,z+3,2,'float');g.cut(9,14,5,8,8,18,{'body'})
  q(6,8,1,2,11,14,4,'float')
 if dragon:return
 # Non-random material layout follows load-bearing surfaces, not voxel noise.
 if slot in [1,4,8]:
  for xyz,(c,p) in list(g.cells.items()):
   if p in ['body','head'] and c==1:g.cells[xyz]=(4 if slot==1 else 3,p)

def dragon(stage):
 g=Grid();b,q,s=g.box,g.pair,g.solid
 if stage in [1,3,8,10,11,14]:
  s(6,17,4,10,6,18);g.feet(True,True);g.head(12,12,1,6);b(9,14,5,8,18,23,2,'tail')
 elif stage in [2,13,18]:
  s(5,18,5,12,4,21);g.head(10,14,1,5)
  if stage==18:q(0,4,1,6,4,22,3,'left_leg')
  elif stage==2:
   for z in [5,12,19]:q(1,5,1,5,z,z+3,3,'left_leg')
  else:s(7,16,2,5,9,18,3);q(1,4,7,18,12,14,2,'left_arm')
 elif stage in [5,6,16,17]:
  s(6,17,7,16,8,18);g.head(12,15,2,5)
  for z in [6,15]:q(2,6,1,10,z,z+3,2,'left_leg')
  if stage==17:body(g,'mantis',stage,10)
 elif stage in [9,19]:
  b(8,15,2,5,8,23);b(12,17,5,12,14,19);b(9,14,11,18,8,14);g.head(12,18,1,5);q(3,7,2,5,9,13,3,'left_leg')
 elif stage in [7,20]:
  g.frame(4,19,4,17,8,17,1,'body',4);g.head(12,18,2,5);g.feet(True);q(2,6,1,4,17,21,3,'tail')
 elif stage==12:s(1,22,5,9,5,21);g.head(12,13,2,6);q(1,6,1,3,8,17,3,'left_leg')
 elif stage==15:s(3,20,5,14,6,20);g.head(10,15,2,5);q(3,7,1,4,12,18,3,'left_leg')
 else:s(4,19,3,12,6,20);g.head(12,13,1,6);g.feet(True,True)
 # Two chunky dragon horns and a projecting dragon muzzle remain readable on all adults.
 q(5,7,19,22,5,8,3,'left_ear');b(9,14,g.face[0]-2,g.face[0],0,3,4,'head')
 if stage==1:
  q(0,5,11,19,10,14,2,'left_arm');q(3,8,16,21,14,17,2,'left_arm');b(7,16,6,9,18,22,3,'tail')
 elif stage==2:q(1,5,11,17,10,16,2,'left_arm');q(1,3,18,20,11,15,3,'left_arm');b(8,15,15,18,16,20,2,'crown')
 elif stage==3:
  for n in range(3):q(n,4+n,8+n*3,11+n*3,10+n*2,13+n*2,2 if n%2 else 4,'left_arm')
  q(2,4,17,23,6,8,2,'left_ear')
 elif stage==4:g.frame(4,19,11,19,10,20,3,'crown',4);q(0,4,7,16,10,18,2,'left_arm');q(1,5,17,21,13,18,3,'left_arm')
 elif stage==5:q(0,4,8,17,11,15,2,'left_arm');b(10,13,18,23,11,13,3,'crown');b(10,13,21,23,4,12,3,'crown');s(9,14,18,21,2,5,2,'crown')
 elif stage==6:q(0,5,8,20,10,13,2,'left_arm');q(0,5,9,18,14,16,4,'left_arm');b(8,15,2,5,17,22,3,'tail')
 elif stage==7:g.frame(0,5,9,21,11,14,2,'left_arm',2);g.frame(18,23,9,21,11,14,2,'right_arm',2);b(9,14,5,9,19,23,3,'tail')
 elif stage==8:
  for n in range(4):b(4+n*2,19-n*2,10+n*2,11+n*2,12,21,2 if n%2 else 3,'crown')
  q(0,4,8,16,8,12,3,'left_arm')
 elif stage==9:
  for y in [7,12,17]:g.frame(5,18,y,y+3,12,15,4,'crown',2)
  q(0,5,12,18,10,13,2,'left_arm');b(9,14,5,13,20,22,2,'tail')
 elif stage==10:b(0,23,14,16,10,20,3,'crown');q(0,3,16,19,10,20,2,'left_arm');b(7,16,17,19,12,19,3,'crown')
 elif stage==11:q(1,5,1,10,4,10,4,'left_leg');q(0,4,12,14,12,18,2,'left_arm');q(2,6,15,18,13,17,2,'left_arm');q(0,3,19,21,14,17,4,'float')
 elif stage==12:q(0,4,13,16,10,18,2,'float');q(3,7,18,20,12,16,3,'float');b(8,15,5,7,21,23,2,'tail')
 elif stage==13:q(0,4,12,15,7,21,2,'left_arm');q(1,3,7,21,13,15,3,'left_arm');s(7,16,14,20,11,22,2,'crown')
 elif stage==14:
  for n in range(3):q(n*2,2+n*2,9+n*3,13+n*3,11+n,16+n,4 if n==1 else 2,'left_arm')
  b(6,17,2,4,14,23,3,'tail')
 elif stage==15:s(0,6,11,16,10,18,2,'left_arm');s(17,23,11,16,10,18,2,'right_arm');q(2,5,4,9,13,16,3,'float');s(7,16,6,10,19,23,4,'tail')
 elif stage==16:g.frame(3,20,8,21,12,20,3,'crown',3);q(0,4,11,18,9,14,2,'left_arm');q(3,7,1,4,17,22,2,'left_leg')
 elif stage==17:q(0,6,11,19,12,19,2,'left_arm');q(1,4,7,13,3,6,3,'left_arm');b(8,15,4,7,18,23,3,'tail')
 elif stage==18:q(0,4,9,20,10,14,2,'left_arm');q(3,7,18,21,9,14,3,'left_arm');q(2,6,10,13,4,7,3,'head')
 elif stage==19:
  g.frame(0,7,9,21,12,14,3,'left_arm',2);g.frame(16,23,6,18,15,17,2,'right_arm',2);q(4,8,1,4,17,23,4,'tail')
 elif stage==20:
  for n in range(3):q(0,4,7+n*6,9+n*6,11,16,2 if n%2 else 4,'float')
  q(1,5,10,13,17,20,3,'left_arm');g.cut(9,14,5,12,7,18,{'body'})
 g.face_features((stage+2)%10)
 return g

def export(g,row,colors):
 key=row['key'];voxels=[[*p,c] for p,(c,_) in sorted(g.cells.items())];parts={}
 for part in sorted({p for _,p in g.cells.values()}|{'body','head'}):
  cells=[[*v,c] for v,(c,p) in sorted(g.cells.items()) if p==part]
  pivot=[11.5,7,12]
  if part=='head':pivot=[11.5,g.face[0]-1,7]
  if part=='eyes':pivot=[11.5,g.face[0]+1,g.face[1]]
  if part.startswith('left_'):pivot[0]=6
  if part.startswith('right_'):pivot[0]=17
  if part.endswith('ear'):pivot[1]=15
  if part=='tail':pivot=[11.5,6,17]
  if part=='float':pivot=[11.5,14,15]
  parent=None if part=='body' else 'head' if part in ['eyes','left_ear','right_ear'] else 'body'
  parts[part]=dict(pivot=pivot,parent=parent,voxels=cells)
 model=dict(size=[24]*3,front='-z',previewAngle=row['previewAngle'],colors=colors,pivot=[11.5,.5,11.5],voxels=voxels,parts=parts)
 (OUT/f'{key}.json').write_text(json.dumps(model,separators=(',',':')),encoding='utf8')
 (OUT/f'{key}.design.json').write_text(json.dumps(dict(schema='alkong-stage-24-v2',size=[24]*3,source='scripts/rework_stage_pets.py',concept=row),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 def chunk(tag,b):return tag+struct.pack('<II',len(b),0)+b
 palette=b''.join(bytes.fromhex(c[1:])+b'\xff' for c in colors)+bytes((256-len(colors))*4)
 chunks=chunk(b'SIZE',struct.pack('<III',24,24,24))+chunk(b'XYZI',struct.pack('<I',len(voxels))+b''.join(bytes([x,z,y,c]) for x,y,z,c in voxels))+chunk(b'RGBA',palette)
 (OUT/f'{key}.vox').write_bytes(b'VOX '+struct.pack('<I',150)+b'MAIN'+struct.pack('<II',0,len(chunks))+chunks)
 return dict(name=key,grid=[24]*3,paletteCount=len(colors),voxelCount=len(voxels),bounds=[[min(p[a] for p in voxels),max(p[a] for p in voxels)] for a in range(3)],anatomy=row['anatomy'])

def briefs():
 source=(ROOT/'src/stage-data.ts').read_text(encoding='utf8')
 stages=re.findall(r" \['([^']+)',0x[0-9a-f]+,0x[0-9a-f]+,'([^']+)','([^']+)',\d+,\d+\]",source)
 assert len(stages)==20
 pets=catalog('src/stage-pet-catalog.ts');dragons=catalog('src/secret-dragon-catalog.ts');rows=[]
 rules=re.findall(r"hint:'([^']+)',condition:'([^']+)'",(ROOT/'src/dragon-discovery.ts').read_text(encoding='utf8'));assert len(rules)==20
 for stage,(name,objects,kit) in enumerate(stages,1):
  concept,motif,anatomy,_,material,motion,ban=LANGUAGES[stage-1];palette=PALETTES[stage-1]
  for slot in range(11):
   secret=slot==10;id=299+stage if secret else 100+(stage-1)*10+slot;pet=dragons[stage-1] if secret else pets[id-100]
   form='secret-dragon' if secret else FORMS[stage-1].split()[slot]
   role='시크릿 상징' if secret else ROLES[ROLE_SLOTS.index(slot)]
   feature=DRAGON_STRUCTURES[stage-1][1] if secret else OBJECTS[stage-1].split('|')[slot]
   outline=DRAGON_STRUCTURES[stage-1][0] if secret else BODY_NOTES[form]
   row=dict(key=f'pet-{id}',id=id,name=pet['name'],stage=stage,stageName=name,slot=slot,boss=False,secretDragon=secret,grid=24,anatomy=form,role=role,
    tier=pet['tier'],rarity=['C','B','A','S','SS','SSS','SECRET'][pet['tier']],
    concept=f'{feature}을 이용해 {concept}에서 살아가는 {pet["name"]}.',inspiration=objects+' / '+kit,
    silhouette=[outline,feature],feature=feature,personality=FACE_DESCRIPTIONS[(slot+stage)%10],
    ecology=concept,material=MATERIALS[stage-1][0],body=outline,locomotion='느리게 체중 이동' if slot in [2,5,10] else '작은 발로 걷기 또는 부유 기관으로 균형 잡기',
    objectUse=f'{objects}에서 온 {feature}: 몸의 균형·이동·숨기·열 교환을 돕는 대표 기관',
    objectAttachment='지형을 본뜬 몸통과 양 날개' if secret else PLACEMENT[slot],gradient=MATERIALS[stage-1][1],
    colorPlacement=f'몸 {material_colors(stage,slot)[0]}; 대표 기관 {material_colors(stage,slot)[1]}; 발·연결부 {material_colors(stage,slot)[2]}; 얼굴 #fff1cf; 눈 #253143',
    colors=dict(primary=material_colors(stage,slot)[0],accent=material_colors(stage,slot)[1]),
    idle=motion+' / '+('양 날개와 꼬리를 서로 다른 박자로 편다' if secret else IDLES[slot]),
    reaction='스테이지 문양이 펼쳐지고 날개를 들어 인사한다' if secret else REACTIONS[slot],
    distinction=f'{role}: {outline}; '+('성체 전용 골격' if secret else PLACEMENT[slot])+'에 '+feature,
    previewAngle=-35 if form in ['fox','snail','squirrel','seahorse'] or stage in [12,19] else 35,
    symmetry='눈과 대칭 팔다리는 x ↔ 23-x; 3번 슬롯의 손에 든 오브제, 굽은 몸통과 19번 시크릿 궤도 날개는 의도적 비대칭')
   if secret:row.update(discoveryHint=rules[stage-1][0],acquisitionCondition=rules[stage-1][1],reveal='2.4초 동안 해당 스테이지 문양 여섯 개가 본체 바깥으로 펼쳐짐')
   rows.append(row)
 (ART/'stage-pet-designs.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 lines=['# 20개 스테이지 디자인 언어','', '실제 `src/stage-data.ts`와 `src/world-art.ts`의 지형·기믹을 기준으로 한다. 100~299 일반 펫, 300~319 전용 시크릿 드래곤을 동일 ID로 교체한다. 0~99는 유지한다.','', '| 단계 | 세계·핵심 콘셉트 | 대표 형태·신체 | 색 배분 | 재질·움직임 | 피할 요소 |','|---|---|---|---|---|---|']
 for stage,(name,objects,kit) in enumerate(stages,1):
  c,m,a,_,mat,mov,ban=LANGUAGES[stage-1];p=PALETTES[stage-1];lines.append(f'| {stage}. {name} | {c}; {objects} | {m}; {a} | {" / ".join(p)}; {MATERIALS[stage-1][1]} | {mat}; {mov} | {ban} |')
 lines+=['','## 220종 상세 설계','']
 for r in rows:
  lines += [f'### {r["key"]} · {r["name"]} ({r["stageName"]} / {r["role"]} / {r["rarity"]})',f'- 콘셉트: {r["concept"]}',f'- 출처: {r["inspiration"]}',f'- 실루엣·이동: {r["body"]}; {r["locomotion"]}',f'- 대표 특징: {r["feature"]}; {r["objectAttachment"]}',f'- 용도: {r["objectUse"]}',f'- 표정: {r["personality"]}',f'- 색 배분: {r["colorPlacement"]}',f'- 재질·색 변화: {r["material"]}; {r["gradient"]}',f'- 대기: {r["idle"]}',f'- 획득 반응: {r["reaction"]}',f'- 다른 펫과 차이: {r["distinction"]}','']
 lines+=['## 시크릿 발견 조건','','| 스테이지 | 힌트 | 서버 판정 조건 |','|---|---|---|']+[f'| {i+1} | {hint} | {condition} |' for i,(hint,condition) in enumerate(rules)]
 (ART/'stage-pet-designs.md').write_text('\n'.join(lines),encoding='utf8')
 return rows

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--stages',nargs='+',type=int);ap.add_argument('--ids',nargs='+',type=int);ap.add_argument('--briefs-only',action='store_true');ap.add_argument('--bosses',action='store_true');args=ap.parse_args();rows=briefs()
 if args.briefs_only:return
 selected=set(args.stages or range(1,21));records=[];old=json.loads((ART/'character-concepts.json').read_text(encoding='utf8'))
 pets=catalog('src/stage-pet-catalog.ts');dragons=catalog('src/secret-dragon-catalog.ts')
 for row in rows:
  stage,slot=row['stage'],row['slot']
  if stage not in selected:continue
  if args.ids and row['id'] not in args.ids:continue
  g=dragon(stage) if slot==10 else Grid()
  if slot!=10:body(g,row['anatomy'],stage,slot);adapt_habitat(g,stage,slot);mount_object(g,stage,slot,Grid)
  expressive_face(g,slot,stage);connect_anatomy(g,stage);colors=finish_colors(g,stage,slot)
  records.append(export(g,row,colors));old[next(i for i,r in enumerate(old) if r['key']==row['key'])]=row
  pet=dragons[stage-1] if slot==10 else pets[row['id']-100];pet.update(description=row['concept'],color=colors[0])
 if args.bosses:
  forms='turtle bear octopus lizard squid owl robot scorpion spino goblin lion jelly airship ram ghost sprout mantis tank angel angel'.split()
  for stage,form in enumerate(forms,1):
   row=next(r for r in old if r['key']==f'guardian-{stage}');g=Grid();body(g,form,stage,2);organ(g,stage,0)
   g.pair(2,6,3,9,5,11,3,'left_arm');g.head(16,11,2,7);g.face_features(2);g.pair(5,9,14,15,1,2,3,'head')
   row.update(grid=24,anatomy=form,previewAngle=35,concept=f'{LANGUAGES[stage-1][0]}의 둥지를 지키는 성체',silhouette=[BODY_NOTES[form],FEATURES[stage-1]],personality='넓은 어깨와 낮은 눈썹, 잠에서 천천히 일어나는 묵직한 자세')
   expressive_face(g,2,stage);connect_anatomy(g,stage);records.append(export(g,row,finish_colors(g,stage,2)))
  row=next(r for r in old if r['key']=='guardian-final');row.update(grid=24,anatomy='creation-gate',previewAngle=35);g=dragon(20);g.frame(4,19,17,23,15,18,2,'crown',3);expressive_face(g,10,20);connect_anatomy(g,20);records.append(export(g,row,finish_colors(g,20,10)))
 manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf8'));replacements={r['name']:r for r in records};manifest['models']=[replacements.get(r['name'],r) for r in manifest['models']]
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8');(ART/'character-concepts.json').write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 for path,name,data in [('src/stage-pet-catalog.ts','STAGE_PET_ROWS',pets),('src/secret-dragon-catalog.ts','SECRET_DRAGON_ROWS',dragons)]:
  (ROOT/path).write_text('// Stable IDs, names and tiers. Visuals: scripts/rework_stage_pets.py\nexport const '+name+' = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
 print('Authored',len(records),'stage models on 24-cube grids; all 320 identities preserved.')

if __name__=='__main__':main()
