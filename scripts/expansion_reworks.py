"""Authored replacements for pets requested on 2026-09-27.

Palette slots: body, secondary, accent, object, eyes, light.
Faces sit above held objects; all coordinates use the existing voxel unit.
"""
IDS={321,324,368,373,380,381,437,439,534,606,682}

def sculpt(g,id):
 if id not in IDS:return None
 o,b,l=g.orb,g.box,g.line
 def eyes(y,z,gap=3):
  for x in [-gap,gap]:b(x,x,y,y+1,z,z,5,'eyes')
  g.part('eyes',(0,y,z),'head')
 def limb(name,root,end,r=1.5,color=1):
  l(root,end,r,color,name);g.part(name,root)
 def head(y,z,w=5,h=4,d=3):g.head(y=y,z=z,w=w,h=h,d=d)
 if id==368:
  # Tapered sea squirt with two real siphons and a small inset glass belly.
  o(0,5,1,6,5,5,1);o(0,10,1,4,4,4,1)
  head(10,-1,4,3,3);eyes(11,-4,2)
  for i,(x,y,z) in enumerate([(-2,15,0),(3,12,2)]):
   p=f'plate_{i}';g.part(p,(x,y-3,z))
   o(x,y-1,z,2,3,2,2,p)
   for xx in range(x-1,x+2):
    for zz in range(z-1,z+2):
     for yy in range(y,y+3):g.cells.pop((xx,yy,zz),None)
   b(x-1,x+1,y-1,y-1,z-1,z+1,4,p)
  # Recess the amber core; only the thin front window is translucent.
  for xyz in list(g.cells):
   x,y,z=xyz
   if abs(x)<=2 and 3<=y<=7 and -4<=z<=-2:del g.cells[xyz]
  g.part('token',(0,5,-2));o(0,5,-2,1.5,1.5,1,3,'token')
  g.part('window',(0,5,-4));b(-2,2,3,7,-4,-4,2,'window')
  b(-2,-2,6,7,-5,-5,6,'window')
  return ['#91c9bb','#c4e4d8','#e7a054','#4b918b','#2b4147','#edf3df']
 if id==380:
  # Two broad copper wing cases, a visible face and six short charcoal legs.
  o(0,5,2,5,3,6,2)
  g.part('shell',(0,6,1))
  for sign in [-1,1]:o(sign*3,8,3,2.5,4,6,1,'shell')
  b(0,0,8,11,-1,8,2,'shell')
  o(-4,10,5,1,1,2,3,'shell')
  head(7,-5,4,3,3);eyes(8,-8,2)
  for sign,side in [(-1,'left'),(1,'right')]:
   for i,z in enumerate([-1,3,6]):
    limb(f'{side}_leg_{i}',(sign*4,4,z),(sign*7,1,z+1),1,2)
   p=side+'_ear';g.part(p,(sign*2,9,-5),'head')
   g.curve([(sign*2,9,-5),(sign*4,12,-5),(sign*5,12,-7)],.8,2,p)
   limb(side+'_arm',(sign*3,5,-4),(sign*3,3,-9),1,1)
  g.part('prop',(0,2,-10));o(0,2,-10,2,2,2,4,'prop')
  b(-1,-1,3,3,-12,-12,6,'prop')
  return ['#bc7954','#4e4542','#589e92','#99abb1','#252f33','#efd9b5']
 if id==381:
  # Long, lifted weasel torso, small round ears and a sweeping dark tail.
  o(0,4,4,3,3,7,1);o(0,8,-1,3,5,3,1)
  head(13,-3,4,3,3)
  o(0,11,-6,2,1,1,6,'head');b(0,0,12,12,-7,-7,5,'head')
  eyes(14,-6,2)
  for sign,side in [(-1,'left'),(1,'right')]:
   p=side+'_ear';g.part(p,(sign*3,15,-2),'head')
   o(sign*3,16,-2,1.5,2,1,2,p)
   limb(side+'_leg',(sign*2,3,6),(sign*3,1,5),1.2,2)
   limb(side+'_arm',(sign*3,8,-1),(sign*2,6,-5),1,1)
  pts=[(0,4,9),(2,3,13),(6,3,15),(9,5,14),(10,7,12)]
  for i in range(len(pts)-1):
   p='tail' if i==0 else f'tail_{i}'
   l(pts[i],pts[i+1],1.7-i*.25,4,p)
   g.part(p,pts[i],'body' if i==0 else 'tail' if i==1 else f'tail_{i-1}')
  g.part('prop',(0,6,-5));o(0,5,-5,2,2,1.5,3,'prop')
  b(-1,1,7,7,-6,-5,2,'prop')
  g.part('token',(0,8,-5),'prop');o(0,8,-5,1,1,1,6,'token')
  return ['#e9dec0','#927052','#b95744','#555967','#302d32','#efb568']
 if id in {321,534}:
  # A raised frog face and broad folded haunches, not a flat lid with a muzzle.
  o(0,6,2,6,4,5,1);head(9,-3,6 if id==321 else 5,3,3)
  if id==321:o(0,7,-6,4,1.5,1,6,'head')
  for sign,side in [(-1,'left'),(1,'right')]:
   o(sign*4,12,-4,2,2,2,1,'head')
   o(sign*6,4,4,3,3,3,1,side+'_leg');g.part(side+'_leg',(sign*4,5,3))
   o(sign*6,1,2,3,1,3,2,side+'_leg')
   limb(side+'_arm',(sign*4,7,-3),(sign*4,2,-7),1.3)
   o(sign*4,1,-7,2,1,2,1,side+'_arm')
  eyes(12,-6,4)
  b(-2,2,8,8,-7,-7,2,'head')
  g.part('prop',(0,2,-8))
  if id==321:
   o(0,2,-8,2,1.5,2,4,'prop');b(0,0,5,6,-3,-3,3)
   return ['#7cabb2','#547e85','#4f91c5','#a8b5af','#263640','#ece5cc']
  # Teacup emblem on the chest; a single brass loop attached to the back.
  b(-2,1,4,6,-6,-6,6);b(2,3,5,6,-6,-6,6)
  b(-1,1,3,3,-6,-6,3)
  g.part('crest',(0,8,5));g.ring(0,10,5,3,3,3,'crest')
  b(-1,1,1,3,-9,-7,6,'prop')
  return ['#819aa8','#5c7481','#b68a49','#eee5c9','#28313c','#f0e8d2']
 if id==324:
  # Three distinct peas nestled in two tapered leaves, with tiny visible feet.
  for i,(y,z,r) in enumerate([(7,-5,4),(6,2,3.5),(5,8,3)]):
   p='head' if i==0 else f'abdomen_{i}'
   o(0,y,z,r,r,3 if i<2 else 2.5,1 if i==0 else 2,p);g.part(p,(0,y-2,z))
   for sign,side in [(-1,'left'),(1,'right')]:
    o(sign*2,1,z,1,1,1,3,f'{side}_leg_{i}');g.part(f'{side}_leg_{i}',(sign*2,3,z))
  eyes(8,-9,2)
  g.part('shell',(0,2,2))
  for sign in [-1,1]:
   g.curve([(sign*2,2,-8),(sign*4,3,-4),(sign*4,3,3),(sign*3,3,9),(0,3,12)],1.2,3,'shell',False)
  g.part('crest',(0,10,-4),'head')
  l((0,10,-4),(1,13,-3),.8,3,'crest');o(2,13,-3,2,1,1,2,'crest')
  return ['#b4d87b','#8fbf63','#427650','#dec887','#26383b','#eee8d2']
 if id==373:
  o(0,6,4,6,5,8,1);o(0,9,-2,6,6,5,1)
  head(12,-5,5,4,3);eyes(13,-8,3)
  for sign,side in [(-1,'left'),(1,'right')]:
   o(sign*2,10,-8,2,1.5,1,2,'head')
   l((sign*3,10,-9),(sign*3,6,-9),.8,6,'head')
   limb(side+'_arm',(sign*5,6,-1),(sign*5,3,-7),1.8)
   o(sign*3,2,11,3,1,3,1,'tail');g.part('tail',(0,3,9))
   g.curve([(sign*6,5,0),(sign*6,7,3),(sign*5,5,7)],1,3,'body',False)
  b(0,0,10,11,-10,-10,5,'head')
  g.part('prop',(0,3,-8));o(0,2,-8,4,1,3,3,'prop')
  for x in [-3,0,3]:l((x,3,-10),(x,3,-7),.7,6,'prop')
  return ['#7e9eae','#b1c4c9','#72b6ac','#c1ded5','#26343d','#f0e5cd']
 if id==437:
  o(0,5,0,5,3,4,1);head(6,-3,4,2,2)
  for sign,side in [(-1,'left'),(1,'right')]:
   for i,z in enumerate([0,3,5]):
    p=f'{side}_leg_{i}';limb(p,(sign*4,4,z),(sign*8,1,z+1),1,1)
   l((sign*2,7,-4),(sign*2,10,-4),1,1,'head')
   limb(side+'_arm',(sign*4,5,-2),(sign*8,5,-6),1.1,3)
   p=side+'_arm';o(sign*8,5,-7,2,2,2,3,p)
   b(sign*8,sign*8,5,7,-9,-7,5,p)
  eyes(10,-5,2)
  # Hollow ivory jar: thick broken rim, dark opening and one turquoise band.
  g.part('shell',(0,6,2),rotation=[0,0,.12])
  o(0,10,3,4,4,4,6,'shell');o(0,14,3,3,1,3,6,'shell')
  for xyz,(_,p) in list(g.cells.items()):
   x,y,z=xyz
   if p=='shell' and y>=12 and abs(x)<=1 and abs(z-3)<=1:del g.cells[xyz]
  b(-1,1,11,11,2,4,2,'shell');b(-3,3,9,9,0,0,3,'shell')
  b(2,3,15,15,2,3,6,'shell')
  return ['#b86f50','#75604b','#669caf','#d0b883','#293944','#e4d9bc']
 if id==439:
  o(0,6,3,4,4,7,1,'shell');g.part('shell',(0,5,1))
  b(0,0,9,10,-1,8,2,'shell');o(0,5,-2,3,2,3,2)
  head(7,-6,4,3,3);eyes(8,-9,3)
  for sign,side in [(-1,'left'),(1,'right')]:
   for i,z in enumerate([-1,3,7]):limb(f'{side}_leg_{i}',(sign*3,4,z),(sign*6,1,z),.9,5)
   g.curve([(sign*2,9,-7),(sign*4,12,-7),(sign*5,12,-9)],.8,2,side+'_ear');g.part(side+'_ear',(sign*2,9,-7),'head')
   limb(side+'_arm',(sign*3,5,-5),(sign*3,3,-11),1,2)
  g.part('prop',(0,2,-12));o(0,3,-12,3,3,2,6,'prop')
  b(0,0,2,5,-14,-14,4,'prop')
  return ['#af6846','#704738','#d6ab5b','#c2a473','#303339','#eee0ba']
 if id==606:
  o(0,5,5,4,4,5,6,'abdomen_1');g.part('abdomen_1',(0,5,1))
  o(0,6,0,2,2,3,1);head(9,-4,4,3,3);eyes(10,-7,2)
  for sign,side in [(-1,'left'),(1,'right')]:
   for i,z in enumerate([0,3]):limb(f'{side}_leg_{i}',(sign*2,5,z),(sign*5,1,z+1),.9,1)
   g.curve([(sign*2,11,-4),(sign*4,14,-4),(sign*6,14,-6)],.8,1,side+'_ear');g.part(side+'_ear',(sign*2,11,-4),'head')
   limb(side+'_arm',(sign*2,6,-2),(sign*5,5,-9),1,1)
  # Low, wide bread slice leaves the head and antennae completely readable.
  g.part('prop',(0,4,-10));o(0,4,-10,6,3,2,3,'prop')
  o(0,5,-10,5,3,2,3,'prop');b(-4,4,2,6,-12,-12,4,'prop')
  for x,y in [(-2,4),(2,3),(1,6)]:b(x,x,y,y,-13,-13,3,'prop')
  return ['#98704e','#674c39','#be8745','#e3c17d','#302c30','#e9dfbd']
 if id==682:
  # Upright seed with a small inset face, asymmetric sprout and two real feet.
  o(0,7,1,5,6,4,1);head(9,-1,4,4,3)
  o(0,9,-4,3,2,1,6,'head');eyes(9,-5,2)
  b(0,0,7,7,-5,-5,2,'head')
  for sign,side in [(-1,'left'),(1,'right')]:
   o(sign*2,1,0,2,1,2,2,side+'_leg');g.part(side+'_leg',(sign*2,3,0))
   limb(side+'_arm',(sign*4,7,0),(sign*4,4,-3),1.2,1)
  g.part('crest',(0,12,0),'head')
  l((0,12,0),(0,16,0),1,3,'crest')
  o(-2,16,0,3,1,2,3,'crest');o(2,18,0,2,2,1,3,'crest')
  b(0,0,3,5,-3,-3,6);b(1,1,3,3,-3,-3,6)
  g.part('prop',(0,3,-4));o(0,3,-4,1,1,1,4,'prop')
  return ['#a57850','#76523d','#82b36a','#d9bb79','#332d30','#ecdfbf']
