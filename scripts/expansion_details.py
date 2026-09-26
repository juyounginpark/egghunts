"""Sculpted secondary anatomy and bespoke structures for closely related species."""
import math

def details(g,row):
 f,m,id=row['form'],row['motif'],row['id'];o,b,c,l=g.orb,g.box,g.curve,g.line
 def clear(*parts):g.cells={xyz:v for xyz,v in g.cells.items() if v[1] not in parts}
 if m=='rooftile':
  clear('crest')
  for z in [1,6]:
   b(-7,7,10,11,z-2,z+2,2,'crest')
   for sign in [-1,1]:c([(sign*5,11,z),(sign*8,12,z),(sign*9,14,z)],1.2,2,'crest')
  o(7,7,7,1.4,2,1.4,3,'token')
 elif m=='starmap':
  clear('crest');b(-7,7,10,11,-3,9,2,'crest')
  c([(-5,12,-1),(2,12,2),(-3,12,7)],.8,3,'crest',False)
  b(7,10,11,12,3,5,3,'token')
 elif m=='rivets':
  for sign,side in [(-1,'left'),(1,'right')]:
   clear(side+'_arm');o(sign*7,10,3,4,1.5,6,2,side+'_arm')
   for z in [-1,3,7]:o(sign*8,12,z,1,1,1,3,side+'_arm')
  y,z=g.face;l((0,y-1,z),(0,y-1,z-4),.8,3,'head')
 elif m=='icebean':
  clear('prop');o(-1,5,-10,4,5,2.5,2,'prop');o(2,8,-10,3,3,2.5,2,'prop');o(0,6,-10,1.5,2,1.5,3,'token')
 if id==323:
  # Chestnut fur and a warm tail tip, not a cream slab. The nut sits in both paws.
  for xyz,(color,part) in list(g.cells.items()):
   if part.startswith('tail'):g.cells[xyz]=(3 if part=='tail_3' else 1,part)
   elif part=='prop':g.cells[xyz]=(3,part)
  for sign,side in [(-1,'left'),(1,'right')]:
   c([(sign*5,11,0),(sign*4,8,-6),(sign*2,6,-9)],1.3,1,side+'_arm')
  for x,y in [(-3,6),(0,8),(3,6)]:o(x,y,-12,1,1,1,1,'prop')
  g.parts['prop']['pivot']=[0,6,-9]
 if id==370:
  clear('shell','prop','token')
  # A thick ivory spiral around a blue face; two broad nacre patches only.
  pts=[]
  for i in range(17):
   a=i*.5;r=1+i*.38;pts.append((math.cos(a)*r,10+math.sin(a)*r,4))
  c(pts,1.8,1,'shell',False);g.part('shell',(0,6,4))
  for xyz,(color,part) in list(g.cells.items()):
   if part=='head' and color!=5:g.cells[xyz]=(2,part)
   if part=='shell' and xyz[0]>3 and xyz[1]>11:g.cells[xyz]=(3,part)
   elif part=='shell' and xyz[0]<-3 and xyz[1]<10:g.cells[xyz]=(4,part)
  y,z=g.face
  for sign,side in [(-1,'left'),(1,'right')]:
   p=side+'_arm';c([(sign*2,y-2,z+1),(sign*4,y-3,z-2),(sign*2,y-3,z-4)],1,2,p);g.part(p,(sign*2,y-2,z+1))
  o(0,y-3,z-4,1.5,1,1.5,1,'prop');g.parts['prop']['pivot']=[0,y-3,z-4]
 if f=='penguin':
  clear('body','left_arm','right_arm','tail','tail_1')
  o(0,7,1,5,7,4,1);o(0,7,-2,4,5,2,2)
  for sign,side in [(-1,'left'),(1,'right')]:
   c([(sign*4,11,0),(sign*7,7,1),(sign*6,4,2)],1.3,1,side+'_arm')
 elif f=='quail':o(0,7,4,6,5,7,1);c([(0,15,-3),(0,20,0),(2,19,4)],.8,2,'crest')
 elif f=='chick':
  clear('tail','tail_1');o(0,6,2,5,5,5,1)
 elif f=='bat':
  for sign,side in [(-1,'left'),(1,'right')]:
   clear(side+'_arm');root=(sign*3,9,0)
   for j in range(4):l(root,(sign*(14-j*2),16-j*4,2+j*2),1.8,2,side+'_arm')
 elif f=='cicada':
  clear('left_arm','right_arm');o(0,5,10,3,2,9,1)
  for sign,side in [(-1,'left'),(1,'right')]:o(sign*4,7,8,3,1.2,11,2,side+'_arm')
 elif f=='firefly':o(0,5,10,5,5,6,3,'abdomen_2')
 elif f=='ant':
  clear('body','abdomen_1','abdomen_2');o(0,5,-2,2.4,2.5,3,1);o(0,5,4,1.8,1.8,3,1,'abdomen_1');o(0,6,10,5,4,5,2,'abdomen_2')
 elif f=='weevil':c([(0,7,-9),(0,5,-13),(0,3,-16)],1.3,3,'head')
 elif f=='bison':o(0,10,-1,7,8,7,1);o(0,7,-7,6,5,3,2,'head')
 elif f=='butterfly':
  for sign,side in [(-1,'left'),(1,'right')]:
   clear(side+'_tip');c([(sign*3,7,5),(sign*10,5,10),(sign*8,1,16)],2.2,3,side+'_tip')
 elif f=='moth':
  for sign,side in [(-1,'left'),(1,'right')]:o(sign*10,9,5,5,5,1.1,2,side+'_arm')
 elif f=='salamander':
  for sign in [-1,1]:
   for j in range(3):l((sign*4,7,-5),(sign*7,8+j,-5+j*2),.7,2,'head')
 elif f=='chameleon':
  for sign in [-1,1]:o(sign*4,11,-8,2,2,2,1,'head')

 if m=='incense':
  clear('prop');o(0,5,-10,4,2,3,2,'prop');b(-3,3,7,7,-12,-8,3,'prop')
  for x in [-2,0,2]:g.cut(x,x,7,7,-10,-10,{'prop'})
  c([(0,8,-10),(1,10,-10),(-1,12,-10),(0,14,-10)],.65,4,'token')
 elif m=='sunfan':
  for i in range(5):
   a=.2+i*(math.pi-.4)/4;x,y=math.cos(a)*12,7+math.sin(a)*12
   g.ring(x,y,12,2.4,2.4,3,'tail')
 elif m=='mud':
  clear('crest');o(-3,8,1,4,1.5,5,2,'crest');o(3,8,7,3,1.2,3,2,'crest')
 elif m=='laurelleaf':
  clear('prop');y,z=g.face;l((-4,y-1,z-2),(5,y+1,z-2),.7,3,'prop')
  for x in [-3,0,3]:o(x,y+1,z-2,1.4,1.8,.8,2,'prop')
 elif m=='dawnwings':
  clear('tail','tail_1','tail_2')
  for i,x in enumerate([-5,0,5]):c([(0,6,7),(x,4,14),(x*1.5,2,22),(x*2,4,32+i*3)],2.2,2+i%2,'tail')
 elif m=='frost':
  for sign,side in [(-1,'left'),(1,'right')]:
   for i in range(3):o(sign*(6+i),11-i,3+i*3,1.5,.7,2,3,side+'_arm')
 elif m=='icelamp':
  clear('crest');o(0,14,3,6,6,4,2,'crest');g.cut(-3,3,11,17,-2,5,{'crest'});o(0,13,3,2,3,2,3,'token')
 elif m=='iceplates':
  clear('spines',*[f'plate_{i}' for i in range(5)])
  for i in range(5):
   x=(i-2)*3;p=f'plate_{i}';l((x,8,3),(x*1.2,17-abs(i-2)*2,8),1.8,2,p);o(x*1.2,17-abs(i-2)*2,8,1,2,1,3,p)
 elif m=='crystals':
  for sign,side in [(-1,'left'),(1,'right')]:
   for j in range(3):g.frame(sign*(7+j*3)-1,sign*(7+j*3)+1,9,18-j*2,2+j,3+j,3,side+'_arm',1)
 elif m=='antlers':
  for sign in [-1,1]:
   for i in range(3):l((sign*(5+i),17+i*3,-3),(sign*(10+i),20+i*3,-3),1,2,'crest');o(sign*(10+i),20+i*3,-3,1.3,2,1.3,3,'crest')
 elif m=='pajamas':
  c([(0,12,-4),(0,16,0),(2,13,8),(3,9,11)],2,3,'crest');o(3,9,11,1.8,1.8,1.8,4,'token')
 elif m=='recycle':
  l((0,10,4),(0,15,5),.8,3,'crest');o(-2,15,5,3,1,2,3,'crest');o(2,15,5,3,1,2,3,'crest')
 elif m=='sporehorn':
  clear('crest','horns')
  for sign in [-1,1]:
   c([(sign*3,14,-5),(sign*6,19,-2),(sign*9,17,2)],1.5,2,'crest')
   for i in range(3):o(sign*(4+i*2),17+i,0+i,3,1,3,2+i%2,'crest')
 elif m=='rebar':
  clear('crest')
  for z in [-1,4,9]:c([(-5,8,z),(-5,14,z),(5,14,z),(5,8,z)],1,2,'crest')
  c([(-6,8,-2),(-3,16,3),(3,12,7),(6,9,11)],.8,3,'crest')
 elif m=='dewcups':
  for sign,side in [(-1,'left'),(1,'right')]:
   p=side+'_tip';o(sign*9,5,10,4,2,4,2,p);g.cut(sign*9-2,sign*9+2,5,7,8,12,{p});o(sign*9,7,10,2,3,2,4,p)
 elif m=='silk':
  for sign,side in [(-1,'left'),(1,'right')]:c([(sign*8,7,5),(sign*12,3,10),(sign*10,1,21)],2.2,3,side+'_tip')
 elif m=='spanners':
  for sign,side in [(-1,'left'),(1,'right')]:
   p=side+'_arm';clear(p);l((sign*4,5,-3),(sign*8,5,-10),1.4,2,p);g.frame(sign*8-3,sign*8+3,3,7,-14,-9,3,p,2);g.cut(sign*8-1,sign*8+1,2,8,-15,-11,{p})
 elif m=='beacon':
  clear('crest');o(0,12,3,5,5,5,2,'crest');o(0,7,3,6,1,6,3,'crest');g.cut(-2,2,10,15,-3,3,{'crest'});b(-2,2,10,14,1,2,3,'token')
 elif m=='laserfan':
  clear('tail')
  for i in range(5):
   a=.2+i*(math.pi-.4)/4;p=f'feather_{i}';x,y=14*math.cos(a),8+14*math.sin(a)
   l((0,8,8),(x,y,11),2.7,2,p);l((0,8,7),(x,y,10),.7,3,p);g.part(p,(0,8,8))
 elif m=='coils':
  clear('crest')
  for x in [-5,5]:
   for i in range(6):g.ring(x,8+i*1.5,3,3,1,2 if i%2 else 3,'crest')
   l((x,7,3),(x,17,3),1.3,3,'crest')
 elif m=='meteorrocks':
  for i in range(3):g.cut(-1,1,10+i*.5,14+i*.5,1+i*3,2+i*3,{f'plate_{i}'})
 elif m=='helmet':
  clear('crest');y,z=g.face
  for dz in [-2,0,2,4]:g.ring(0,y,z+dz,7,7,2,'crest')
  o(0,y+8,z+2,1,1,1,3,'crest')
 elif m=='starclock':
  for x,y in [(0,13),(6,7),(0,1),(-6,7)]:
   for dx,dy in [(-1,0),(1,0),(0,-1),(0,1)]:l((x,y,-11),(x+dx*2,y+dy*2,-11),.6,3,'prop')
 elif m=='lenses':
  y,z=g.face;l((-6,y+1,z),(6,y+1,z),.6,3,'head')
  for x in [-4,4]:g.ring(x,y,z-3,2,2,3,'head')
 elif m=='nebula':
  for sign,side in [(-1,'left'),(1,'right')]:c([(sign*4,10,1),(sign*8,15,1),(sign*13,15,2),(sign*15,10,5)],1.3,3,side+'_arm')
 elif m=='starmane':
  clear('mane',*[f'plate_{i}' for i in range(3)])
  for i in range(3):b(-5+i,-3+i,9+i*2,16+i,0,5,2,'mane')
  y,z=g.face
  for dx,dy in [(-1,0),(1,0),(0,-1),(0,1)]:l((0,y+3,z),(dx*2,y+3+dy*2,z),.6,3,'head')
 elif m=='meteorfan':
  clear('tail')
  for i in range(5):x=(i-2)*5;c([(0,6,7),(x,16,10),(x,19,16),(x*.8,10,25)],2,2,'tail');l((x,17,11),(x*.8,11,24),.65,3,'tail')
 elif m=='blankmask':
  y,z=g.face;o(0,y,z+1,6,4,1,2,'head');o(0,y,z+4,6,4,1,3,'crest')
 elif m=='wavetail':
  clear('tail')
  for sign in [-1,1]:c([(0,6,7),(sign*5,9,12),(sign*9,7,16),(sign*8,5,19)],2,2,'tail')
 elif m=='rainbow':
  clear('shell');o(0,13,4,10,1.8,8,2,'shell')
  for x in [-6,0,6]:o(x,12,3,3,1,6,2+(x+6)//6,'shell')
 elif m=='river':
  clear('crest');b(-6,6,9,10,-4,11,2,'crest')
  c([(-3,11,-4),(2,11,0),(-2,11,6),(3,11,11)],1.2,3,'crest',False)
 elif m=='seasonfan':
  clear('tail')
  for i in range(4):
   a=.3+i*(math.pi-.6)/3;x,y=14*math.cos(a),8+14*math.sin(a);p=f'feather_{i}'
   l((0,8,8),(x,y,11),2.7,2+i%3,p);g.part(p,(0,8,8))
   if i==0:
    for j in range(5):t=j*math.tau/5;o(x+2*math.cos(t),y+2*math.sin(t),10,1.5,1.5,1,3,p)
   elif i==1:o(x,y,10,2,4,1,3,p)
   elif i==2:c([(x-2,y-3,10),(x,y+3,10),(x+2,y-3,10)],1.2,3,p)
   else:
    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:l((x,y,10),(x+3*dx,y+3*dy,10),.7,4,p)
