"""New-only sculptures. Never writes a model or catalog with an ID below 321.

Run --stages 1 ... for art direction, then without arguments for the full batch.
The original document is the provenance for every independently registered pet.
"""
import argparse, hashlib, json, math, re
from collections import Counter
from pathlib import Path
from document_models import Sculpt, palette, COLORS
from expansion_recipes import FORMS, MOTIFS
from expansion_details import details
from expansion_references import references
from expansion_reworks import sculpt as rework

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/models'
TAU=math.tau

def new_palette(prompt):
 colors={**COLORS,'밤색':'#76503b','연갈색':'#b58d6c','짙은 청색':'#314d79','회청색':'#899cac','구리색':'#b97853','파란':'#527cad','노란':'#ead378','붉은':'#bd5360','흑요석':'#343443','석회색':'#b6b6aa'}
 pattern='|'.join(map(re.escape,sorted(colors,key=len,reverse=True)))
 hits=list(re.finditer(pattern,prompt));primary=None
 for bodyword in re.finditer(r'몸|등껍질|흉곽',prompt):
  before=[m for m in hits if 0<=bodyword.start()-m.end()<13]
  if before:primary=colors[before[-1][0]];break
 found=[]
 for m in hits:
  if re.match(r'색?\s*(점눈|코|눈|부리)',prompt[m.end():]):continue
  color=colors[m[0]]
  if color not in found:found.append(color)
 primary=primary or (found or palette(prompt))[0]
 accents=[c for c in found if c!=primary]
 return [primary,*(accents+['#d2b876','#e9dfc7','#567f85'])[:3],'#252934','#f1e8d3']

class Pet(Sculpt):
 def __init__(self):
  super().__init__();self.parts={};self.face=(10,-7);self.head_width=5
  self.part('body',(0,5,0),None)
 def orb(self,x,y,z,rx,ry,rz,c=1,p='body'):
  # Broad planes with clipped corners, rather than densely stepped spheres.
  # Retain the original voxel unit: only the authored silhouette changes.
  rx,ry,rz=[max(.75,v) for v in (rx,ry,rz)]
  for xx in range(math.ceil(x-rx),math.floor(x+rx)+1):
   for yy in range(math.ceil(y-ry),math.floor(y+ry)+1):
    for zz in range(math.ceil(z-rz),math.floor(z+rz)+1):
     axes=[abs(xx-x)/rx,abs(yy-y)/ry,abs(zz-z)/rz]
     if sum(axes)<=2.45 and max(axes[0]+axes[1],axes[0]+axes[2],axes[1]+axes[2])<=1.8:self.cells[xx,yy,zz]=(c,p)
 def part(self,name,pivot,parent='body',rotation=None):
  self.parts[name]={'pivot':list(pivot),'parent':parent}
  if rotation:self.parts[name]['rotation']=rotation
 def pair(self,x0,x1,y0,y1,z0,z1,c=1,p='body'):
  self.box(x0,x1,y0,y1,z0,z1,c,p);self.box(-x1,-x0,y0,y1,z0,z1,c,p.replace('left_','right_'))
 def head(self,x=0,y=11,z=-6,w=5,h=4,d=4):
  self.orb(x,y,z,w,h,d,1,'head');self.part('head',(x,y-2,z+2));self.face=(y,z-d);self.head_width=w
 def legs(self,length=4,wide=4,quad=True):
  for side,sign in [('left',-1),('right',1)]:
   for n,z in enumerate([-4,5] if quad else [-1]):
    part=f'{side}_leg'+('_back' if n else '')
    self.line((sign*wide,length+.5,z),(sign*(wide+.4),1.4,z-1),1.4,1,part)
    self.orb(sign*(wide+.4),1.2,z-1.5,1.9,1.2,2.2,2,part);self.part(part,(sign*wide,length,z))
 def ears(self,long=False,round=False):
  y,z=self.face
  for sign,side in [(-1,'left'),(1,'right')]:
   p=side+'_ear';x=sign*(self.head_width-1)
   self.orb(x,y+4+(3 if long else 0),z+3,2 if round else 1.5,5 if long else 2,1.3,1,p)
   self.orb(x,y+4+(3 if long else 0),z+1.7,1,3 if long else 1,0.7,2,p)
   self.part(p,(x,y+2,z+3),'head',[.12,0,sign*.18])
 def tail(self,points=None,r=1.4):
  points=points or [(0,6,7),(2,7,13),(5,5,17),(7,6,19)]
  for i in range(len(points)-1):
   p='tail' if i==0 else f'tail_{i}'
   self.line(points[i],points[i+1],r*(1-i/(len(points)+1)),1 if i==0 else 2,p)
   self.part(p,points[i],'body' if i==0 else 'tail' if i==1 else f'tail_{i-1}')
 def wings(self,kind='feather',four=False,span=12):
  for sign,side in [(-1,'left'),(1,'right')]:
   for k in range(2 if four else 1):
    p=side+('_arm' if k==0 else '_tip');root=(sign*3,10-k*3,1+k*5)
    self.part(p,root,rotation=[.1,sign*.13,sign*.15])
    for j in range(4):
     end=(sign*(span-j*.9 if k==0 else span*.72-j*.8),15-j*3-k*4,3+j*2+k*4)
     self.line(root,end,2.1 if kind=='feather' else 2.7,2 if j<2 else 3,p)
 def eyes(self,form):
  y,z=self.face;gap=max(1.3,self.head_width*.48)
  for x in [-gap,gap]:
   self.box(round(x),round(x),round(y),round(y)+1,math.ceil(z)-1,math.ceil(z),5,'eyes')
  self.part('eyes',(0,y,z),'head')
  if form not in BIRDS:self.orb(0,y-1.5,z-.7,1,.7,.7,5,'head')

BIRDS={'bird','sparrow','swallow','quail','chick','duck','pigeon','parrot','owl','crane','ibis','goose','ostrich','swan','peacock','roc','phoenix','penguin','bat'}
INSECTS={'ant','beetle','weevil','strider','stickbug','aphid','millipede','cricket','spider','firefly','longhorn','shieldbug','moth','mantis','bee','grasshopper','butterfly','centipede','queen','cicada','dragonfly','scorpion'}
QUADS={'fox','raccoon','dog','cat','wolf','lynx','leopard','lion','goat','ram','bull','bison','rhino','hippo','elephant','horse','unicorn','deer','giraffe','sauropod','tapir','capybara','crocodile','lizard','salamander','weasel','otter','sabertooth','sloth','griffin','chimera','centaur','twohead','chameleon'}

def anatomy(g,form,n):
 # Size differences follow anatomy; none are squeezed into a fixed voxel box.
 if form in BIRDS:
  long=form in {'crane','ibis','ostrich','swan','goose'}
  g.orb(0,7,2,5 if not long else 6,5,7,1)
  g.legs(5 if not long else 9,2.5,False)
  if long:g.curve([(0,9,-2),(-1,15,-4),(0,21,-6)],1.8,1,'neck');g.part('neck',(0,9,-2))
  g.head(y=21 if long else 12,z=-5,w=3 if long else (5.5 if form=='owl' else 4),h=3,d=3)
  if long:g.parts['head']['parent']='neck'
  y,z=g.face
  if form!='bat':g.line((0,y-1,z),(0,y-1,z-(5 if form in {'ibis','crane','parrot'} else 2)),1 if form!='duck' else 2,3,'head')
  else:g.ears(True)
  g.wings(span=17 if form in {'roc','phoenix'} else 10 if form in {'swan','peacock'} else 7)
  g.tail([(0,6,7),(0,5,12),(0,6,17)],1.8)
  if form=='peacock':fan(g,'tail',0,10,9,14,5)
  if form=='phoenix':
   for x in [-4,0,4]:g.curve([(x*.3,7,7),(x,5,15),(x*1.7,3,25),(x*2,6,32)],2,2,'tail')
 elif form in QUADS:
  slim=form in {'fox','deer','giraffe','horse','unicorn','wolf','lynx','leopard','goat','weasel'}
  reptile=form in {'crocodile','lizard','salamander','otter','weasel'}
  huge=form in {'elephant','hippo','bison','rhino','bull','sauropod','tapir'}
  h=3 if reptile else 5 if slim else 6;length=10 if reptile else 8
  g.orb(0,h+3,1,4 if slim else 7 if huge else 5.5,h,length,1)
  g.legs(3 if reptile else 7 if slim else 5,3.5 if slim else 5.5)
  neck=form in {'giraffe','sauropod','horse','unicorn','deer','centaur'}
  head_y=23 if form in {'giraffe','sauropod'} else 16 if neck else 7 if reptile else 11
  if neck:g.curve([(0,8,-4),(0,(head_y+8)/2,-5),(0,head_y,-7)],2.2 if slim else 3.1,1,'neck');g.part('neck',(0,8,-4))
  g.head(y=head_y,z=-7,w=4 if slim else 6 if huge else 5,h=3 if reptile else 4,d=5 if form in {'crocodile','hippo','horse','tapir'} else 3.8)
  if neck:g.parts['head']['parent']='neck'
  if not reptile:g.ears(round=form in {'hippo','sloth','lion','tapir','elephant'})
  g.tail(r=2.1 if reptile else 1)
  if form in {'fox','raccoon'}:g.orb(4,8,14,4,5,7,2,'tail')
  if form in {'elephant','tapir'}:
   g.curve([(0,head_y,-10),(0,head_y-4,-13),(0,head_y-6,-16),(0,head_y-4,-18)],2 if form=='elephant' else 1.2,1,'trunk');g.part('trunk',(0,head_y,-10),'head')
   if form=='elephant':
    for sign,side in [(-1,'left'),(1,'right')]:g.orb(sign*7,head_y,-7,4,6,1.3,2,side+'_ear')
  if form in {'ram','goat','bull','bison','chimera'}:
   for sign in [-1,1]:g.curve([(sign*4,head_y+3,-5),(sign*8,head_y+6,-4),(sign*9,head_y+3,-6),(sign*7,head_y+2,-7)],1.5,3,'horns')
   g.part('horns',(0,head_y,-5),'head')
  if form in {'deer','giraffe'}:
   for sign in [-1,1]:
    g.curve([(sign*3,head_y+3,-5),(sign*4,head_y+8,-3),(sign*7,head_y+10,-1)],1,3,'horns')
    if form=='deer':g.line((sign*4,head_y+7,-3),(sign*8,head_y+8,-5),1,3,'horns')
   g.part('horns',(0,head_y,-5),'head')
  if form in {'rhino','unicorn'}:g.curve([(0,head_y+1,-10),(0,head_y+5,-11),(0,head_y+8,-12)],1.6,3,'head')
  if form in {'lion','chimera','griffin'}:
   for j in range(9):a=j*TAU/9;g.orb(math.cos(a)*6,head_y+math.sin(a)*5,-5,2.8,3,2,2,'mane')
   g.part('mane',(0,head_y,-5),'head')
  if form=='griffin':g.wings(span=17)
  if form=='centaur':g.orb(0,head_y-3,-5,4,5,3,2);g.pair(4,6,head_y-6,head_y-1,-7,-4,1,'left_arm')
  if form=='twohead':
   g.cells={p:v for p,v in g.cells.items() if v[1] not in {'head','left_ear','right_ear'}}
   for sign in [-1,1]:
    part='head' if sign<0 else 'second_head';g.orb(sign*3.5,11,-7,3,3,3,1,part);g.part(part,(sign*3.5,9,-5))
    for dx in [-1,1]:g.box(round(sign*3.5+dx),round(sign*3.5+dx),11,12,-10,-10,5,part)
   g.face=(11,-10);g.head_width=6
 elif form in INSECTS:
  segments=7 if form=='centipede' else 5 if form=='millipede' else 3
  long=form in {'stickbug','dragonfly','longhorn','mantis','centipede','millipede'}
  for i in range(segments):g.orb(0,5,(-3+i*5),2.5 if long else 4+i,3 if long else 4,4,1,'body' if i==0 else f'abdomen_{i}')
  for i in range(1,segments):g.part(f'abdomen_{i}',(0,5,-5+i*5),'body' if i==1 else f'abdomen_{i-1}')
  g.head(y=7,z=-8,w=2.8,h=2.8,d=2.5)
  legs=8 if form in {'spider','scorpion'} else segments*2 if form in {'centipede','millipede'} else 6
  for j in range(legs//2):
   for sign,side in [(-1,'left'),(1,'right')]:
    p=f'{side}_leg_{j}';z=-3+j*(3 if legs<=8 else 2.5)
    end=12 if form in {'strider','spider'} else 7
    g.curve([(sign*2,5,z),(sign*end,6,z+2),(sign*(end+1),.5,z+4)],.9,3,p);g.part(p,(sign*2,5,z))
  for sign in [-1,1]:g.curve([(sign,9,-8),(sign*3,12,-10),(sign*5,13,-9)],.7,3,'antennae')
  g.part('antennae',(0,9,-8),'head')
  if form in {'bee','butterfly','moth','cicada','dragonfly','firefly','queen'}:g.wings('membrane',form in {'butterfly','moth','dragonfly','queen'},15 if form=='queen' else 12)
  if form in {'mantis','grasshopper','cricket'}:
   for sign,side in [(-1,'left'),(1,'right')]:g.curve([(sign*3,7,-3),(sign*8,13,-6),(sign*5,8,-9)],1.5,2,side+'_arm');g.part(side+'_arm',(sign*3,7,-3))
  if form=='scorpion':g.tail([(0,5,9),(0,12,16),(0,20,12),(0,20,3)],2.1);claws(g)
 elif form in {'frog','toad'}:
  g.orb(0,4,2,7,3.5,7,1);g.head(y=6,z=-5,w=7,h=3,d=4)
  g.legs(3,5)
  for sign in [-1,1]:g.orb(sign*7,3,6,3,3,4,2,'left_leg_back' if sign<0 else 'right_leg_back')
 elif form in {'mouse','squirrel','hamster','rabbit','mole','bear','panda','beaver','monkey','gorilla','giant','yeti','kangaroo'}:
  wide=form in {'bear','panda','gorilla','giant','yeti'}
  g.orb(0,7,1,7 if wide else 4.5,6,4.5,1);g.legs(3,4 if wide else 2.5,False)
  g.head(y=13 if not wide else 14,z=-3,w=6 if form in {'hamster','panda'} else 4.5,h=4,d=4)
  g.ears(form=='rabbit',form in {'mouse','squirrel','hamster','bear','panda','monkey'})
  for sign,side in [(-1,'left'),(1,'right')]:
   x=sign*(8 if wide else 5);g.line((x,11,0),(x*.9,3 if wide else 7,-4),2 if wide else 1.3,1,side+'_arm');g.part(side+'_arm',(x,11,0))
  if form=='squirrel':g.tail([(0,5,4),(0,5,12),(0,15,15),(0,19,9),(0,16,6)],3.7)
  elif form=='beaver':g.orb(0,2,11,4,1,6,2,'tail');g.part('tail',(0,3,5))
  elif form in {'mouse','monkey','kangaroo'}:g.tail(r=2 if form=='kangaroo' else .9)
  if form=='mole':g.pair(4,8,2,5,-8,-3,2,'left_arm')
  if form in {'panda','hamster'}:
   for sign in [-1,1]:g.orb(sign*3,12,-5,2.4,2,2,2,'head')
 elif form in {'snail','ammonite','turtle','hedgehog','horseshoe'}:
  g.orb(0,3,2,6,2.7,9,1);g.head(y=4,z=-7,w=3.5,h=2.8,d=3)
  if form not in {'snail','ammonite'}:g.legs(2,6)
  if form in {'snail','ammonite'}:
   shell(g);g.part('shell',(0,5,3))
   for sign in [-1,1]:g.line((sign*2,5,-8),(sign*3,9,-8),.8,1,'head')
  else:g.orb(0,7,3,8,5,9,2,'shell');g.part('shell',(0,4,3))
  if form=='hedgehog':
   for i in range(5):g.line((-6+i*3,7,3),(-7+i*3.5,14,8),1.5,3,'spines');g.part('spines',(0,7,3))
  if form=='horseshoe':g.tail([(0,3,9),(0,2,17),(0,1,25)],1)
 elif form in {'fish','puffer','pipefish','angler','whale','shark','orca','seal','walrus','ray','eel','snake','seahorse','shrimp','lobster','crab'}:
  if form in {'snake','eel'}:
   g.curve([(-6,3,12),(5,3,12),(8,4,5),(0,5,0),(-3,7,-5)],2.5,1);g.head(y=8,z=-6,w=3,h=2.5,d=3);g.tail([(0,3,12),(-7,3,13),(-11,4,17)],1.5)
  elif form=='seahorse':
   g.curve([(0,4,8),(0,2,3),(0,6,0),(0,13,1),(0,20,-2)],2.4,1);g.head(y=21,z=-3,w=3,h=3,d=3);g.tail([(0,4,8),(4,3,9),(5,5,5),(2,6,4)],1.6)
  else:
   wide=form in {'whale','orca','ray','walrus','crab'}
   g.orb(0,6,1,8 if wide else 4 if form in {'pipefish','shrimp'} else 6,2 if form=='ray' else 5,12 if form in {'whale','shark','pipefish'} else 8,1)
   g.head(y=6,z=-7,w=6 if wide else 4,h=3,d=3)
   for sign,side in [(-1,'left'),(1,'right')]:
    g.orb(sign*8,4,1,9 if form=='ray' else 4,1.2,5,2,side+'_arm');g.part(side+'_arm',(sign*4,5,0),rotation=[.1,0,sign*.17])
   g.tail([(0,5,7),(0,4,13),(3,5,18)],2)
   if form in {'fish','whale','orca','shark'}:g.pair(1,7,4,5,15,19,2,'tail_1')
   if form in {'shark','orca'}:g.line((0,9,3),(0,16,5),2,2,'fin');g.part('fin',(0,9,3))
   if form=='puffer':g.orb(0,7,0,8,7,8,1)
   if form=='walrus':
    for sign in [-1,1]:g.curve([(sign*3,6,-9),(sign*3,1,-10),(sign*4,1,-12)],1,3,'head')
   if form in {'crab','lobster','shrimp'}:
    for sign in [-1,1]:
     for i in range(3):g.line((sign*4,4,i*3),(sign*10,1,i*3+2),1,3,'legs')
    g.part('legs',(0,4,0));claws(g) if form!='shrimp' else None
 elif form in {'octopus','jelly','anemone','starfish','urchin','tunicate','clam','slime','cloud','seed','worm','cucumber','caterpillar'}:
  if form in {'worm','caterpillar','cucumber'}:
   for i in range(4):g.orb(0,4,-3+i*5,4,3.5,4,1 if i%2==0 else 2,'body' if i==0 else f'abdomen_{i}');g.part(f'abdomen_{i}',(0,4,-3+i*5)) if i else None
   g.head(y=6,z=-7,w=4,h=3,d=3)
  elif form=='clam':
   g.orb(0,2,1,10,2,8,2);g.orb(0,12,5,10,1.7,8,2,'shell');g.part('shell',(0,4,8),rotation=[-.35,0,0]);g.head(y=5,z=-3,w=3,h=3,d=3)
  else:
   g.orb(0,6,0,7 if form in {'cloud','slime'} else 5,3 if form in {'cloud','slime'} else 5,5,1);g.head(y=7,z=-3,w=4,h=3,d=3)
   if form in {'octopus','jelly','anemone','starfish','urchin'}:
    count=8 if form=='octopus' else 6 if form=='anemone' else 5 if form in {'starfish','urchin'} else 4
    for i in range(count):
     a=i*TAU/count;p=f'arm_{i}';g.curve([(math.cos(a)*3,5,math.sin(a)*3),(math.cos(a)*9,2,math.sin(a)*9),(math.cos(a+.2)*12,4,math.sin(a+.2)*12)],1.6,2,p);g.part(p,(math.cos(a)*3,5,math.sin(a)*3))
   else:g.legs(2,3,False)
 elif form in {'raptor','pachy','pterosaur'}:
  g.orb(0,8,2,4,6,6,1);g.legs(6,4,False);g.head(y=15,z=-5,w=4,h=3,d=5);g.tail([(0,6,6),(0,5,13),(0,7,22)],2)
  if form=='pterosaur':g.wings('membrane',span=20)
  else:g.pair(4,5,9,11,-5,-2,2,'left_arm');g.part('left_arm',(-4,10,-2));g.part('right_arm',(4,10,-2))
 else:raise ValueError('Unimplemented anatomy '+form)

def shell(g):
 pts=[]
 for i in range(75):a=i*.13;r=1+i*.085;pts.append((math.cos(a)*r,10+math.sin(a)*r,4))
 g.curve(pts,1.8,2,'shell',False)

def claws(g):
 for sign,side in [(-1,'left'),(1,'right')]:
  p=side+'_arm';g.line((sign*4,5,-3),(sign*8,6,-8),1.5,1,p)
  g.orb(sign*9,6,-10,3,2,4,2,p);g.cut(sign*9-1,sign*9+1,4,9,-15,-10,{p});g.part(p,(sign*4,5,-3))

def fan(g,p,x,y,z,r,count):
 for i in range(count):
  a=.2+i*(math.pi-.4)/max(1,count-1);g.line((x,y,z),(x+math.cos(a)*r,y+math.sin(a)*r,z+3),2.1,2+i%2,p)
 g.part(p,(x,y,z))

def flower(g,x,y,z,r=4,p='prop',count=5):
 for i in range(count):a=i*TAU/count;g.orb(x+math.cos(a)*r*.7,y+math.sin(a)*r*.7,z,2,2,1.2,2,p)
 g.orb(x,y,z,1.8,1.8,1.5,3,p)

def wheel(g,x,y,z,r=4,p='prop'):
 g.ring(x,y,z,r,r,3,p)
 for i in range(4):a=i*math.pi/2;g.line((x,y,z),(x+math.cos(a)*r,y+math.sin(a)*r,z),.65,2,p)

def attachment(g,m,form,index):
 # Motifs get their own pivot hierarchy, so actions never rotate the whole pet.
 m={'magnets':'magnet','buttoneyes':'button'}.get(m,m)
 g.part('prop',(0,6,-9));g.part('crest',(0,10,3));g.part('token',(0,8,-10),'prop')
 b,o,l,c=g.box,g.orb,g.line,g.curve
 # Structural families have independently authored placement and contours.
 if m in {'puzzle','spinningtop','papercup','blockneck','rubberball','drum','kaleidoscope','beadarms','puppet','coin','persimmon','ricecake','gourd'}:
  if m=='puzzle':b(-3,3,8,10,0,5,3,'crest');o(4,9,2,2,1,1.5,3,'crest')
  elif m in {'papercup','spinningtop'}:
   g.cells={pos:v for pos,v in g.cells.items() if v[1]!='body'}
   for y in range(2,11):
    r=3+(10-y)*.35 if m=='papercup' else 1+y*.55;o(0,y,1,r,1,r,2 if y!=7 else 3)
  elif m=='blockneck':
   g.cells={pos:v for pos,v in g.cells.items() if v[1]!='neck'}
   for i in range(3):b(-2,2,10+i*4,12+i*4,-7,-3,2+i%2,'neck')
  elif m=='rubberball':o(0,12,-10,4,4,4,2,'prop');g.ring(0,12,-10,4,4,3,'prop')
  elif m=='drum':
   o(0,5,-10,5,3,4,2,'prop');o(0,8,-10,5,1,4,3,'prop')
   for sign,side in [(-1,'left'),(1,'right')]:l((sign*5,8,-6),(sign*3,10,-11),.8,3,side+'_arm');o(sign*3,10,-11,1.5,1.5,1.5,3,side+'_arm')
  elif m=='kaleidoscope':fan(g,'tail',0,6,8,15,6)
  elif m=='beadarms':
   for i in range(8):a=i*TAU/8;o(math.cos(a+.2)*12,4,math.sin(a+.2)*12,2+i%2,2+i%2,2+i%2,2+i%2,f'arm_{i}')
  elif m=='puppet':
   for x in [-7,7]:b(x-1,x+1,9,18,3,4,2,'crest')
   b(-7,7,18,19,3,4,2,'crest');o(0,7,-10,1.5,2,1.5,3,'token');o(0,10,-10,1.5,1.5,1.5,3,'token')
  elif m=='coin':g.frame(-5,5,1,11,-11,-9,3,'prop',3)
  elif m=='persimmon':l((0,15,1),(5,18,4),.8,2,'crest');o(5,17,4,2.5,2.5,2.5,3,'crest')
  elif m=='ricecake':
   for z in [2,7]:o(0,13,z,5,2,3,2,'crest')
  else:o(6,4,17,3,3,3,2,'tail');o(6,8,17,2,2,2,2,'tail')
 elif m in {'pebble','chestnut','carrot','date','seed','stone','bread','icebean','moonrock','lightshard','pomegranate','ruby','sandcastle','orb','snowcrystal'}:
  if m in {'carrot','lightshard','ruby','snowcrystal'}:
   for i in range(7):r=max(1,4-i*.5);o(0,3+i,-10,r,1.2,r*.7,2,'prop')
   if m=='carrot':
    for sign in [-1,1]:l((0,10,-10),(sign*4,14,-10),1,3,'prop')
   if m=='snowcrystal':
    for i in range(6):a=i*TAU/6;l((0,7,-10),(5*math.cos(a),7+5*math.sin(a),-10),.7,3,'prop')
  elif m=='bread':b(-5,5,2,9,-13,-8,2,'prop');b(-4,4,3,8,-14,-14,3,'prop')
  elif m=='sandcastle':
   for x,h in [(-3,5),(0,8),(3,5)]:b(x-1,x+1,1,h,-12,-9,2,'prop')
  else:
   o(0,5,-10,4,3.5,3,2,'prop')
   if m=='pomegranate':
    for x in [-2,2]:
     for y in [4,6]:o(x,y,-13,1,1,1,3,'prop')
   if m=='moonrock':g.cut(-2,0,6,8,-14,-10,{'prop'});g.cut(2,3,3,4,-14,-10,{'prop'})
  if m in {'chestnut','seed','date'}:l((-2,7,-12),(2,7,-12),.7,3,'prop')
 elif m in {'eargrain','laurelleaf','stylus','flute','rulers','crayon','nails','screws','needle','fangs'}:
  if m in {'rulers','nails'}:
   for i in range(3):l((-4+i*4,9,0),(-4+i*4,17,8),1.1,2,'crest')
  elif m in {'fangs','screws'}:
   y,z=g.face
   for sign in [-1,1]:l((sign*3,y+(3 if m=='screws' else -1),z+1),(sign*3,y+(10 if m=='screws' else -6),z-1),1.1,3,'head')
  else:
   l((-5,5,-10),(5,10,-10),1,2,'prop')
   for i in range(4):o(-3+i*2,6+i,-11,1,.7,.7,3,'prop')
 elif m in {'pea','checker','mud','circuit','pixel','chip','starmap','map','exam','woodgrain','leafvein','rivets','sticker','blankmask','copper','sunflowerseed','talisman','tracksuit','pajamas'}:
  if m=='pea':
   g.orb(0,1,3,6,1.5,14,3,'prop')
  for i in range(3):
   z=-1+i*4;b(-4,4,10,10,z,z+1,2,'crest')
   if m in {'map','starmap','circuit','leafvein'}:l((-3,10,z),(3,10,z+3),.7,3,'crest')
   elif m in {'checker','pixel','chip','rivets'}:b(-3+i*2,-2+i*2,11,11,z,z+1,3,'crest')
  if m=='woodgrain':
   for i in range(3):g.ring(0,4,14,2+i,1+i,3,'tail')
 elif m in {'nest','cart','flowercart','castle','terrace','skyline','bookshelves','mountains','icebergs','flightdeck','roothouse','palace'}:
  x,y,z=(0,4,-12) if m=='cart' else (0,11,3)
  b(-7,7,y,y+1,z-5,z+6,2,'crest')
  if m=='nest':
   for dz in [-5,5]:b(-7,7,y+1,y+3,z+dz,z+dz+1,3,'crest')
   for dx in [-6,6]:b(dx,dx+1,y+1,y+3,z-5,z+5,3,'crest')
  elif m in {'mountains','icebergs'}:
   for x,h in [(-5,7),(0,13),(5,9)]:
    for k in range(h):r=max(.7,4-k*.3);b(x-r,x+r,y+k,y+k,z-r,z+r,2 if k<h-3 else 3,'crest')
  elif m=='bookshelves':
   for side in [-1,1]:
    for k in range(3):b(side*6-1,side*6+1,5,10,k*3,k*3+1,2+k%2,'crest')
  else:
   for i in range(3):
    x=-5+i*5;h=[4,8,5][i];b(x-2,x+2,y+1,y+h,z-3,z+3,2,'crest');b(x-1,x,y+2,y+4,z-4,z-4,3,'crest')
    if m in {'castle','roothouse','palace'}:g.orb(x,y+h+1,z,3,2,4,3,'crest')
   if m in {'cart','flowercart'}:
    for x in [-6,6]:wheel(g,x,y-2,z,2,'crest')
   if m=='flowercart':
    for x in [-5,0,5]:flower(g,x,y+6,z-2,3,'crest')
   if m=='flightdeck':g.wings(span=20)
 elif m in {'daisy','mushroom','mushrooms','lily','sunflower','umbrella','parasol','candyumbrella','palm','cycads','moss','laurel','flower','fruitbranch','clay','ironflower','metalseed','seedlight'}:
  if m in {'umbrella','parasol','candyumbrella','palm'}:
   c([(5,4,-4),(7,12,-3),(5,23,-1)],1,3,'prop')
   if m=='palm':
    for i in range(5):a=i*TAU/5;c([(5,23,-1),(5+7*math.cos(a),24,7*math.sin(a)),(5+10*math.cos(a),21,10*math.sin(a))],1.8,2,'prop')
   else:
    for i in range(6):a=i*TAU/6;l((5,24,-1),(5+8*math.cos(a),21,-1+8*math.sin(a)),2.6,2 if i%2 else 3,'prop')
  elif m in {'mushroom','mushrooms'}:
   for x,h in ([(-5,5),(0,9),(5,6)] if m=='mushrooms' else [(0,7)]):l((x,9,4),(x,9+h,4),1.4,3,'crest');o(x,9+h,4,6 if m=='mushroom' else 3,2,5 if m=='mushroom' else 3,2,'crest')
  elif m=='lily':flower(g,0,6,-10,4,'token')
  elif m in {'cycads','laurel','moss'}:
   for sign in [-1,1]:c([(0,10,1),(sign*4,13,4),(sign*8,12,9)],2,2,'crest')
  elif m=='fruitbranch':
   for sign in [-1,1]:c([(0,10,2),(sign*4,15,3),(sign*7,17,6)],1,2,'crest')
   for x,y in [(-6,16),(0,14),(6,16)]:o(x,y,6,2,2,2,3,'crest')
  elif m=='sunflower':flower(g,0,g.face[0]+2,-3,7,'crest',8)
  else:flower(g,0,6,-10,4,'prop');l((0,3,-10),(0,7,-10),.8,3,'prop')
 elif m in {'petaltail','glassfan','paperfan','featherfan','sunfan','dancheong','antennafan','meteorfan','laserfan','framefan','seasonfan','invertedfan','wheat','paper','folded','bookwing','bookmane','newspapertail','brushtail','comettail','wavetail','cloudtail','eargrain'}:
  p='mane' if m=='bookmane' else 'tail';y=22 if m=='invertedfan' else 7
  g.cells={pos:v for pos,v in g.cells.items() if v[1]!=p}
  fan(g,p,0,y,8,17 if 'fan' in m else 12,5 if m not in {'petaltail','comettail'} else 3)
  if m=='framefan':
   g.cells={pos:v for pos,v in g.cells.items() if v[1]!=p}
   for i in range(5):x=(i-2)*6;g.frame(x-2,x+2,10,20,9,10,2,p,1)
  if m in {'bookwing','folded','paper','wheat'}:g.wings(span=14)
  if m=='invertedfan':
   for x in [-7,0,7]:l((x,25,9),(x,19,9),.7,3,p);o(x,18,9,2,1.5,2,3,p)
 elif m in {'raindrops','rocks','coal','meteorrocks','pearls','spines','equalizer','iceplates','shells','shellplates','pinecone','chestnutplates','radiator','ironplates','dunes','eraser','fleece','snowmane','rubymane','starmane','mushroommane'}:
  for i in range(5 if m in {'equalizer','radiator','pinecone','iceplates'} else 3):
   x=(i-1)*4 if m in {'equalizer','radiator','iceplates'} else 0;z=1+i*3
   h=5 if m not in {'equalizer','radiator','iceplates'} else 7+i%2*3;p=f'plate_{i}';g.part(p,(x,9,z))
   if m in {'raindrops','rocks','meteorrocks','pearls'}:o(x,10+i*.5,z,3,3 if m!='raindrops' else 5,3,2+i%2,p)
   else:b(x-6,x+6,8,8+h,z,z+1,2+i%2,p)
  if m in {'fleece','snowmane','rubymane','starmane','mushroommane','eraser'}:
   y=g.face[0]
   for i in range(5):a=.1+i*(math.pi-.2)/4;o(math.cos(a)*7,y+math.sin(a)*6,-4,3,3,2,2,'mane')
   g.part('mane',(0,y,-4),'head')
 elif m in {'vane','vortex','hourglass','globe','armillary','orbit','planet','planets','galaxy','starsea','starclock','clock','barometer','gauge','pendulum','piano','keys','strings','lyre','harp','paddlewheel','millstone','saw'}:
  if m in {'piano','keys','strings'}:
   for i in range(6):b(-4,4,10,11,i*2-3,i*2-2,2 if i%2==0 else 3,'crest')
  elif m in {'lyre','harp'}:
   g.frame(-5,5,2,12,-11,-10,3,'prop',2)
   for x in [-2,0,2]:l((x,3,-11),(x,11,-11),.5,2,'prop')
  elif m=='hourglass':
   for y in range(10):r=1+abs(y-4.5)*.65;o(0,6+y,4,r,.8,r,2,'shell')
   for y in [5,16]:o(0,y,4,5,1,5,3,'shell')
  elif m in {'paddlewheel','millstone','saw'}:
   if m=='paddlewheel':
    for x in [-8,8]:wheel(g,x,7,0,5,'prop')
   elif m=='millstone':
    for y in [11,14]:o(0,y,3,7,1,7,2,'crest')
   else:wheel(g,0,9,11,7,'tail')
  else:
   x,y,z=(0,14,4) if m in {'globe','armillary','planet','orbit','vortex'} else (0,7,-10)
   if m in {'globe','planet','galaxy'}:o(x,y,z,6,6,6,2,'prop')
   g.ring(x,y,z,8 if m in {'armillary','orbit','vortex','planet'} else 5,7 if m in {'armillary','orbit','vortex','planet'} else 5,3,'prop')
   if m in {'clock','starclock','barometer','gauge','vane','pendulum'}:l((x,y,z-1),(x+3,y+2,z-1),.8,2,'token')
   if m=='planets':
    for i in range(3):o(6,12+i*5,-4,1.5+i*.5,1.5+i*.5,1.5+i*.5,2+i%2,'crest')
 elif m in {'pouch','bag','honey','jar','bowl','pottery','spices','teacup','mail','pocket','pollenbag','recycle','toolbox','dreambundle','vase','moonjar','incense'}:
  back=m in {'spices','dreambundle','vase'};y,z=(12,4) if back else (5,-10);p='crest' if back else 'prop'
  o(0,y,z,6 if back else 4,5 if back else 3,4,2,p);g.cut(-2,2,y+1,y+6,z-1,z+1,{p})
  g.ring(0,y+3,z,3,1,3,p)
  if m in {'mail','recycle','toolbox'}:b(-4,4,y-2,y+3,z-3,z+2,2,p);b(-3,3,y+2,y+3,z-4,z-3,3,p)
  if m=='vase':flower(g,0,y+10,z,4,p);l((0,y,z),(0,y+10,z),1,3,p)
 elif m in {'button','memory','socket','speaker','display','billboard','printer','train','tablet','notebook','tray','card','blocks','envelope','mirrorcity','fuse','conveyor','coils','tanks','filters','purifier','glasscore','window','culture','seedgarden'}:
  back=m in {'train','printer','billboard','fuse','conveyor','coils','tanks','purifier','seedgarden'};y,z=(10,3) if back else (6,-8);p='crest' if back else 'prop'
  if m in {'button','speaker','glasscore','window','culture','mirrorcity'}:
   o(0,y,z,4,4,1.5,2,p);g.ring(0,y,z-1,4,4,3,p);o(0,y,z-2,1.5,1.5,1,3,'token')
  elif m in {'coils','tanks','filters','purifier','seedgarden'}:
   for x in [-5,5]:
    o(x,y,z,3,5,4,2,p)
    for k in range(3):g.ring(x,y-2+k*2,z-4,2.5,1,3,p)
  else:
   b(-5,5,y-3,y+3,z-1,z+1,2,p);b(-4,4,y-2,y+2,z-2,z-2,3,p)
   for i in range(3):b(-3+i*3,-2+i*3,y-1,y,z-3,z-3,4,p)
   if m in {'printer','envelope','notebook'}:b(-3,3,y-1,y+1,z+2,z+8,3,p)
 elif m in {'paperhat','thumbtack','workhat','helmet','snowhat','lid','graduation','acorn','beakwindup','beacon','icelamp','lantern','warning','candle','hotspa','pumice','dome','nosehorn','twincrest'}:
  y,z=g.face;y+=5;z+=3;g.part('crest',(0,y-2,z),'head')
  if m in {'lantern','icelamp','beacon','warning'}:
   y,z=14,3;g.part('crest',(0,9,3));g.frame(-4,4,y-4,y+3,z-2,z+2,2,'crest',1);o(0,y,z,2,2,2,3,'token')
  elif m in {'nosehorn','twincrest'}:
   for x in ([0] if m=='nosehorn' else [-3,3]):l((x,y-4,z-5),(x*1.4,y+3,z-7),1.5,2,'crest')
  elif m=='hotspa':o(0,y,z,2.5,2.5,2.5,3,'crest')
  else:
   b(-6,6,y-1,y,z-5,z+4,2,'crest');o(0,y+1,z,4,2,3,3,'crest')
   if m=='candle':c([(0,y+1,z),(0,y+5,z),(2,y+7,z)],1.5,3,'crest')
 elif m in {'yarn','ribbon','kite','bookmark','seasons','collar','flowerbow','platter','laurelleaf','wishes','tape','balloon','mobile','airship','carousel','balloonfeet','cloudshoes','cloudwheels','hoverboard','skis','skates','sled','fishing','cloudcushion'}:
  if m in {'skis','skates','hoverboard','sled','carousel','cloudcushion'}:
   pass # Ground platforms removed by the user's latest art revision.
  elif m in {'balloonfeet','cloudshoes','cloudwheels'}:
   for x in [-4,4]:
    for z in [-4,5]:o(x,1,z,3,2,3,2,'prop')
  elif m in {'airship','balloon'}:
   for x in ([-8,8] if m=='airship' else [0]):o(x,17,3,5,6,10,2,'crest');l((x,10,3),(x,6,3),.7,3,'crest')
  elif m=='fishing':c([(4,5,-4),(6,14,-8),(3,15,-16)],.7,2,'prop');l((3,15,-16),(3,1,-16),.5,3,'token')
  elif m=='mobile':
   for x in [-10,10]:
    for z in [0,5]:l((x,7,z),(x,1,z),.5,3,'prop');flower(g,x,1,z,2,'token')
  else:
   g.ring(0,6,-9,4,3,2,'prop');c([(-4,6,-9),(-6,4,-10),(-7,2,-9)],1,3,'prop');c([(4,6,-9),(6,4,-10),(7,2,-9)],1,3,'prop')
   if m in {'kite','bookmark','tape'}:b(-5,5,7,12,11,12,2,'tail')
   if m=='wishes':
    for x in [-6,0,6]:b(x,x+2,18,22,-3,-3,3,'crest')
 elif m in {'magnet','tongs','hammer','spanners','excavator','compressor','shovel','gloves','mittens','brushes'}:
  if m in {'tongs','spanners','magnet'}:
   claws(g)
   for sign,side in [(-1,'left'),(1,'right')]:g.frame(sign*9-3,sign*9+3,3,10,-13,-10,3,side+'_arm',2);g.cut(sign*9-2,sign*9+2,8,11,-14,-9,{side+'_arm'})
  elif m in {'gloves','mittens','shovel','brushes'}:
   for sign,side in [(-1,'left'),(1,'right')]:o(sign*6,5,-6,3,2,3,2,side+'_arm')
  elif m=='compressor':
   for x in [-8,8]:b(x-1,x+1,3,12,-5,5,3,'prop')
  elif m=='excavator':wheel(g,0,21,2,5,'token')
  else:l((4,3,-10),(5,12,-10),1,3,'prop');b(1,9,11,14,-12,-8,2,'prop');b(-4,3,1,3,-12,-7,3,'token')
 elif m in {'hollowleaves','pocketvoid','split','broken','hollowspiral','shadow','lightwell','halfwool','hollowwings','segmented','hollowstar','seals','shadowless','emptywings','ribcage','hole','hollowlog','logarch','hollowstar'}:
  if m in {'hollowwings','emptywings'}:
   g.wings('membrane',True,16)
   for sign,side in [(-1,'left'),(1,'right')]:g.cut(sign*10-3,sign*10+3,7,15,0,14,{side+'_arm',side+'_tip'})
  elif m in {'lightwell','pocketvoid','ribcage','halfwool','hollowstar'}:
   g.cut(-3,3,3,9,-7,9,{'body'})
   if m=='ribcage':
    for y in [4,7,10]:g.frame(-7,7,y,y+2,-4,5,2,'prop',1)
   else:g.ring(0,6,-5,4,4,2,'prop')
  elif m=='hollowspiral':g.cut(-1,1,9,15,0,7,{'shell'})
  elif m=='broken':g.cut(-2,6,0,10,12,14,{'tail','tail_1'})
  elif m=='segmented':
   for y in [12,16,20]:g.cut(-4,4,y,y,-10,0,{'neck'})
  elif m in {'hollowlog','logarch'}:g.frame(-6,6,10,17,0,10,2,'crest',2)
  elif m=='hollowleaves':
   for x in [-5,5]:g.frame(x-2,x+2,13,19,2,3,2,'crest',1)
  elif m=='seals':
   for y in [6,10]:g.ring(0,y,0,9,3,2,'prop');g.cut(-2,2,y-4,y+4,-5,5,{'prop'})
  elif m=='split':g.cut(-10,10,7,8,-10,10,{'shell'})
  else:fan(g,'prop',0,.6,1,10,5)
 elif m in {'tentacles','eyeorbs','cupears','footpads','antenna','antennae','suction','lenses','sixeyes','eyespots','starclaws','dish','satellites','saucer','pipes','chimney','faucet','gramophone','trumpet','bell','thimble','conch'}:
  if m in {'dish','satellites','saucer'}:
   for x in ([-6,6] if m=='satellites' else [0]):
    o(x,18,4,6,1,6,2,'crest');o(x,19,4,4,.8,4,3,'crest');l((x,18,4),(x,23,4),.7,3,'crest')
  elif m in {'eyeorbs','lenses','cupears','sixeyes','eyespots'}:
   y,z=g.face
   for x in [-4,4]:
    g.ring(x,y,z-1,2.5,2.5,2,'head')
    if m=='eyeorbs':l((x,y,z),(x,y+5,z),.8,2,'head');o(x,y+5,z,2,2,2,3,'head')
   if m=='sixeyes':
    for x in [-3,0,3]:
     for yy in [y-1,y+2]:o(x,yy,z-1,.7,.7,.7,5,'head')
  elif m in {'pipes','chimney','faucet','gramophone','trumpet'}:
   for x in ([-5,5] if m=='pipes' else [0]):
    c([(x,9,3),(x,15,5),(x+3,18,5)],1.5,2,'crest');g.ring(x+3,18,5,3,3,3,'crest')
  elif m in {'bell','thimble','conch'}:
   o(0,6,-10,4,4,3,2,'prop');g.cut(-2,2,1,4,-12,-8,{'prop'});o(0,3,-10,1,1,1,3,'token')
  elif m in {'footpads','suction'}:
   for z in [-4,0,4]:o(0,.5,z,5,1,2,2,'prop')
  elif m=='starclaws':
   for x in [-9,9]:flower(g,x,6,-10,4,'prop')
  else:
   for sign in [-1,1]:c([(sign*3,12,1),(sign*6,19,2),(sign*9,18,5)],1.1,2,'crest')
 elif m in {'glue','cone','sand','tile','carpet','mask','shoes','grapes','frost','donut','blanket','stairs','tire','lilypads','leaf'}:
  if m in {'glue','cone'}:
   g.cells={pos:v for pos,v in g.cells.items() if v[1]!='shell'}
   for y in range(5,20):
    r=5 if m=='glue' else max(1,7-(y-5)*.4);o(0,y,3,r,.8,r,2 if y%6<3 else 3,'shell')
   if m=='glue':o(0,20,3,5,1,5,3,'shell')
  elif m in {'donut','tire','blanket'}:
   p='body' if m=='donut' else 'shell';g.cells={pos:v for pos,v in g.cells.items() if v[1]!=p}
   for z in range(0,7):g.ring(0,9,z,7,7,2 if m!='blanket' or z<3 else 3,p)
   g.part(p,(0,4,3),None if p=='body' else 'body')
   if m=='tire':flower(g,0,10,-1,3,'crest')
  elif m=='grapes':
   g.cells={pos:v for pos,v in g.cells.items() if v[1]!='shell'}
   for x,y,z in [(-3,12,2),(3,12,2),(0,16,4),(-2,8,4),(2,8,4)]:o(x,y,z,3.5,3.5,3.5,2,'shell')
  elif m=='stairs':
   for sign,side in [(-1,'left'),(1,'right')]:
    for i in range(3):x=sign*(5+i*3);b(x-2,x+2,8+i*3,10+i*3,0,6,2+i%2,side+'_arm')
  elif m in {'carpet','frost','tile'}:
   for sign,side in [(-1,'left'),(1,'right')]:b(sign*6-3,sign*6+3,10,11,0,5,2,side+'_arm')
   if m=='carpet':
    for x in range(-12,13,3):l((x,4,7),(x,3,10),.7,3,'prop')
  elif m=='mask':
   o(7,8,-10,3,4,1,2,'prop')
   for x in [6,8]:b(x,x,8,8,-12,-11,5,'prop')
  elif m in {'shoes','lilypads'}:
   for x in [-5,5]:
    for z in [-4,4]:o(x,.5,z,3,1,3,2,'prop')
  elif m=='leaf':
   for x in [-3,3]:o(x,11,3,3,1,5,2,'crest')
  else:o(0,1,-11,5,2,4,2,'prop')
 else:
  # Remaining authored surface/fin motifs; explicit non-fallback allowlist.
  known={'pumpkin','tambourine','yo-yo','coloredfins','coins','leafins','bubble','sail','nacre','hammock','coral','crystalfin','charcoal','bellows','lava','flamewings','zippers','zipper','portrait','compass','keyboard','crystalhorn','crystalwings','canal','sandring','ammonite','feathers','amber','waterfall','fossil','moonwing','moonfeathers','marble','wavemane','snakehead','dawnwings','eggcase','glasshorn','spiral','resonators','throne','crystals','antlers','icefin','cloudbeak','starpillow','teapot','petalshield','dewcups','orchid','jade','leaves','silk','cable','hinges','meteor','stardust','moonclaws','nebula','dawnstar','sculptcloud','dewthread','pollen','rainbow','river','sunrise','sunwheel','sporehorn','wiretail','rebar','greenhouse','seedantenna','petalshield','snowball','tin','rooftile','sculptcloud','seasons'}
  if m not in known:raise ValueError('Missing motif '+m)
  if m in {'zipper','keyboard','canal','river','waterfall','rooftile','bellows','tin','rebar'}:
   for i in range(5):b(-4,4,10+(i%2 if m!='waterfall' else i),11+i%2,i*3-4,i*3-3,2 if i%2 else 3,'crest')
   if m in {'canal','river','waterfall'}:b(-1,1,12,12,-4,10,4,'crest')
  elif m in {'pumpkin','snowball','eggcase','teapot'}:
   o(0,10,3,8,7,7,2,'shell');g.part('shell',(0,4,3))
   if m=='pumpkin':
    for x in [-5,0,5]:c([(x,5,-2),(x,11,-4),(x,16,1)],.7,3,'shell')
   if m=='teapot':g.ring(0,11,12,5,5,3,'tail')
  elif m in {'tambourine','yo-yo','coins','bubble','stardust','starpillow'}:
   g.ring(0,6,-10,5,5,2,'prop');o(0,6,-10,3,3,1,3,'prop')
   if m=='coins':
    for z in [-1,3,7]:o(0,11,z,3,1,3,3,'crest')
  elif m in {'coral','antlers','crystalhorn','glasshorn','sporehorn'}:
   y,z=g.face
   for sign in [-1,1]:
    c([(sign*3,y+2,z+3),(sign*6,y+8,z+5),(sign*9,y+11,z+8)],1.4,2,'crest')
    l((sign*6,y+8,z+5),(sign*10,y+9,z+3),1,3,'crest')
  elif m in {'ammonite','spiral','meteor','charcoal','wiretail','cable','snakehead'}:
   if m in {'spiral','ammonite'}:shell(g)
   else:
    g.tail([(0,5,7),(4,7,13),(-3,9,17),(3,8,22)],2)
    if m=='meteor':o(0,11,4,6,5,6,2,'shell')
  elif m in {'hammock','portrait','compass','greenhouse','dewthread','sculptcloud'}:
   g.frame(-7,7,2,13,-10,-9,2,'prop',2)
   if m=='compass':l((-6,1,-10),(0,14,-10),1,3,'prop');l((6,1,-10),(0,14,-10),1,3,'prop')
   elif m=='sculptcloud':o(0,6,-10,5,3,3,3,'token')
   else:l((-5,5,-10),(5,5,-10),.6,3,'prop')
  elif m in {'sail','icefin'}:
   for i in range(4):l((0,9,i*3),(0,18-i*2,i*3),1.8,2 if i%2 else 3,'crest')
  elif m in {'fossil','pollen','jade'}:o(0,6,-10,4,3,2,3,'prop');g.ring(0,6,-12,3,2,2,'prop')
  elif m in {'coloredfins','leafins','crystalfin','flamewings','crystalwings','feathers','amber','moonwing','moonfeathers','dawnwings','resonators','throne','crystals','petalshield','dewcups','orchid','silk','hinges','nebula','sunrise'}:
   g.wings('membrane',form in {'butterfly','moth','queen','dragonfly'},16 if index==18 else 11)
   for sign,side in [(-1,'left'),(1,'right')]:
    p=side+'_arm';l((sign*4,11,2),(sign*13,16,4),.7,3,p)
    if m in {'dewcups','resonators','seedantenna'}:o(sign*12,10,5,2,2,2,4,p)
   if m in {'dawnwings','moonfeathers','sunrise'}:g.tail([(0,6,7),(0,4,18),(3,6,28)],2)
  elif m=='sunwheel':
   g.cells={pos:v for pos,v in g.cells.items() if v[1]!='shell'};wheel(g,0,12,4,7,'shell')
   for i in range(5):a=i*TAU/5;l((6*math.cos(a),12+6*math.sin(a),4),(10*math.cos(a),12+10*math.sin(a),4),1.4,3,'shell')
  elif m in {'leaves','seedantenna','marble','cloudbeak','dawnstar','nacre','rainbow'}:
   if m=='leaves':
    for i in range(3):o(0,12+i*3,1+i*3,4,1,3,2,'crest')
   elif m=='seedantenna':
    for sign in [-1,1]:c([(sign*2,9,-5),(sign*6,15,-6),(sign*9,14,-3)],.8,2,'crest');o(sign*9,14,-3,1.5,1.5,2,3,'crest')
   elif m=='cloudbeak':o(0,g.face[0]-1,g.face[1]-4,3,3,6,3,'head');o(0,g.face[0]+2,g.face[1]-9,3,1.5,2,2,'token')
   elif m=='dawnstar':flower(g,0,g.face[0]-1,g.face[1]-2,2,'prop')
   elif m=='marble':
    for y in [7,10,13]:b(-3,3,y,y,-3,-3,2,'body')
   else:
    for x in [-5,0,5]:b(x-1,x+1,12,13,1,7,2+(x+5)//5%3,'shell')
  elif m=='lava':
   for xyz,(color,p) in list(g.cells.items()):
    if p.startswith('arm_') and xyz[1]<4:g.cells[xyz]=(3,p)
  elif m=='sandring':pass
  elif m=='wavemane':
   for i in range(3):c([(0,15-i*3,-3),(0,16-i*3,2),(0,13-i*3,7)],2,2+i%2,'mane')
   g.part('mane',(0,13,-3))
  elif m=='moonclaws':
   for sign,side in [(-1,'left'),(1,'right')]:g.ring(sign*9,6,-10,4,4,3,side+'_arm',1.2)
  else:raise ValueError('Unimplemented detailed motif '+m)

def export_model(g,row,colors):
 # Explicit separate parts and authored pivots are compatible with the production renderer.
 parts={};all_names=set(g.parts)|{v[1] for v in g.cells.values()}
 for name in sorted(all_names):
  spec=g.parts.get(name,{'pivot':[0,5,0],'parent':'body'})
  parts[name]={'rotation':[0,0,0],**spec,'voxels':[[*xyz,c] for xyz,(c,p) in sorted(g.cells.items()) if p==name]}
  if parts[name]['parent'] not in all_names:parts[name]['parent']='body'
  if name=='body':parts[name]['parent']=None
 # Ground authored feet without altering the head/prop proportions.
 min_y=min(xyz[1] for xyz in g.cells)
 voxels=[[*xyz,c] for xyz,(c,_) in sorted(g.cells.items())]
 refs=row['references']
 model={'size':[max(p[a] for p in g.cells)-min(p[a] for p in g.cells)+1 for a in range(3)],'unit':refs['form']['unit'],'front':'-z','pivot':[0,min_y-.5,0],'previewAngle':35,'colors':colors,'voxels':voxels,'parts':parts,'artForm':row['form'],'artMotion':row['motif'],'artStage':row['stageId'],'artMaterial':refs['material']['material'],'expansion':True,'styleVersion':2,'styleReferences':{k:v['id'] for k,v in refs.items()}}
 if row['motif'] in {'glassfan','bubble','glasscore','hourglass','glasshorn','window','culture','seedgarden','crystalwings','icebean','icefin','amber','fuse','helmet'}:
  glass_parts={'glassfan':['tail'],'glasshorn':['crest'],'crystalwings':['left_arm','right_arm','left_tip','right_tip'],'icefin':['crest'],'amber':['left_arm','right_arm'],'icebean':['prop'],'helmet':['crest'],'bubble':['prop'],'hourglass':['shell'],'glasscore':['body'],'window':['prop'],'culture':['prop'],'seedgarden':['crest'],'fuse':['crest']}
  # Faces and principal bodies remain opaque even for glass-inspired species.
  model['partOpacity']={p:.78 for p in glass_parts[row['motif']] if p in parts and p not in {'body','head','eyes'}}
 if row['motif']=='shadowless':model['castShadow']=False
 path=OUT/f"pet-{row['id']}.json";path.write_text(json.dumps(model,separators=(',',':')),encoding='utf8')
 (OUT/f"pet-{row['id']}.design.json").write_text(json.dumps({'source':'scripts/expansion_models.py','brief':row,'assembly':{n:{k:v for k,v in p.items() if k!='voxels'} for n,p in parts.items()}},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 return {'name':f"pet-{row['id']}",'grid':model['size'],'paletteCount':len(colors),'voxelCount':len(voxels),'bounds':[[min(p[a] for p in g.cells),max(p[a] for p in g.cells)] for a in range(3)],'anatomy':row['form']}

def catalog(file):
 s=(ROOT/file).read_text(encoding='utf8');return json.loads(s[s.index('['):s.rindex(']')+1])

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--stages',nargs='+',type=int);parser.add_argument('--ids',nargs='+',type=int);args=parser.parse_args()
 existing=catalog('src/stage-pet-catalog.ts')+catalog('src/secret-dragon-catalog.ts')
 names={p['name'] for p in existing};rows=[]
 allocations={}
 for stage in range(1,21):
  current=[p for p in existing if p['stageId']==stage];n=max(0,30-len(current))
  deficit=[max(0,target-sum(p['tier']==tier for p in current)) for tier,target in enumerate([8,7,5,4,3,2])]
  quotas=[n*d/sum(deficit) for d in deficit];counts=[math.floor(q) for q in quotas]
  for tier in sorted(range(6),key=lambda t:(-(quotas[t]-counts[t]),t))[:n-sum(counts)]:counts[tier]+=1
  allocations[stage]=[tier for tier,count in enumerate(counts) for _ in range(count)]
  if len(allocations[stage])!=19:raise ValueError(f'Stage {stage}: review changed existing count before assigning permanent IDs')
 text=(ROOT/'docs/art/add-380-characters-prompt.md').read_text(encoding='utf8')
 for match in re.finditer(r'^\| (\d\d)-N(\d\d) \| ([A-Z]+) \| ([^|]+) \| ([^|]+) \|',text,re.M):
  stage,index=int(match[1]),int(match[2])-1;name,prompt=match[4].strip(),match[5].strip()
  if name in names:name+=' 친구'
  names.add(name)
  # Hamilton allocation preserves both pre-existing SECRET entries per stage.
  tier=allocations[stage][index]
  rows.append({'id':321+(stage-1)*19+index,'key':match[1]+'-N'+match[2],'name':name,'sourceName':match[4].strip(),'stageId':stage,'tier':tier,'slot':11+index,'form':FORMS[stage-1].split()[index],'motif':MOTIFS[stage-1].split()[index],'prompt':prompt})
 if len(rows)!=380:raise ValueError(f'Expected 380 briefs, got {len(rows)}')
 refs=references()
 # These IDs already exist. Art revisions never regenerate gameplay registration.
 registered=json.loads((ROOT/'docs/art/expansion-id-map.json').read_text(encoding='utf8'))
 for row,old in zip(rows,registered):
  assert all(row[k]==old[k] for k in ['id','key','name','stageId','tier','slot'])
  row['references']=refs[row['id']]
 records=[]
 for row in rows:
  if args.stages and row['stageId'] not in args.stages:continue
  if args.ids and row['id'] not in args.ids:continue
  g=Pet();colors=rework(g,row['id'])
  if colors is None:
   anatomy(g,row['form'],row['slot']);attachment(g,row['motif'],row['form'],row['slot']-11);details(g,row);g.eyes(row['form'])
   colors=new_palette(row['prompt'])
  else:row['artRevision']='2026-09-27-selected-rework'
  dark=['#'+''.join(f'{round(int(c[i:i+2],16)*.85):02x}' for i in [1,3,5]) for c in colors]
  for xyz,(c,p) in list(g.cells.items()):
   # Local material direction only; no universal dark stripe on every body.
   if c!=5 and (p.startswith('tail') or p in {'shell','crest','mane'}) and xyz[2]>8:g.cells[xyz]=(c+6,p)
  row['color']=colors[0];records.append(export_model(g,row,colors+dark))
  print(row['key'],row['id'],flush=True)
 if not args.stages:
  manifestpath=OUT/'manifest.json';manifest=json.loads(manifestpath.read_text(encoding='utf8'));replacements={r['name']:r for r in records}
  known={r['name'] for r in manifest['models']}
  manifest['models']=[replacements.get(r['name'],r) for r in manifest['models']]+[r for r in records if r['name'] not in known]
  manifestpath.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
  auditpath=ROOT/'docs/art/expansion-models-audit.json'
  audit=json.loads(auditpath.read_text(encoding='utf8')) if args.ids else records
  if args.ids:audit=[replacements.get(r['name'],r) for r in audit]
  auditpath.write_text(json.dumps(audit,indent=2)+'\n',encoding='utf8')

if __name__=='__main__':main()
