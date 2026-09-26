"""Document-driven voxel sculptures. Shapes are assembled parts, not per-cell objects."""
import argparse,json,math
from pathlib import Path
from rework_stage_pets import Grid,export,body
ROOT=Path(__file__).resolve().parents[1]
FORMS=[
'seed rabbit bird mouse turtle bird bear lion butterfly deer',
'bear bird horse elephant cat penguin rabbit snake swan dog',
'seal crab clam seahorse ray turtle jelly dolphin octopus dragon',
'bird lizard turtle bat ram snail scorpion boar mole peacock',
'ghost mouse hedgehog octopus turtle swan cat owl bat deer',
'rabbit mouse raccoon lizard cat owl fish snake ray cat',
'fox camel hedgehog mole beetle cobra cat scorpion bird lion',
'raptor triceratops stego raptor armadillo plesio bat spino giraffe raptor',
'rabbit bird bee raccoon bear bat ghost frog cat fox',
'turtle ram boar owl dog otter lion bird griffin horse',
'slime lizard octopus snail frog rabbit jelly otter frog mantis',
'mouse dog elephant bird turtle fox whale boar giraffe owl',
'seal penguin fish rabbit crab whale ram elephant fox owl',
'dog elephant seahorse jelly cat fish giraffe swan hedgehog ram',
'mouse frog raccoon snail lizard crab butterfly boar deer cat',
'bee beetle mantis beetle mantis ant butterfly beetle butterfly beetle',
'mouse dog octopus beetle gorilla rabbit turtle jelly mole fox',
'mouse squirrel turtle owl cat bird deer octopus whale lion',
'cat turtle rabbit ray fox ghost octopus deer whale dog',
'seed rabbit bird bear otter deer turtle butterfly lion whale',
]
MOTIFS=[
'leaves clover petals strawberry acorn windmill honey mane rainbow seasons',
'button key rocking block bead boat jackbox stripes music balloon',
'drop spiral pearl ribbon wave coral star sunset helmet coralhorn',
'ember flame furnace ash horns spiral gem crater anvil fan',
'chalk eraser pencils ink backpack paper crescent bell curtain antlers',
'antenna battery parcel skateboard headphones signal hologram plug ducts neon',
'bead bottle cactus sand lapis jar bandage gems sundial sphinx',
'eggshell fern petals feathers pebbles stone fruit trumpet moss fossil',
'mortar pouch lantern sandals wood patchwork club coin moon nine',
'olive cloud grapes scroll sandals jar laurel lightning marble wings',
'antenna threeeyes saucer crystal pads tentacle capsule flask gravity flower',
'key goggles teapot propeller compass gears basket locomotive telescope clock',
'snowflake scarf glass frost ice tusk bell mammoth aurora snowflake',
'pillow balloon crescent umbrella cup stripes cloud mirror candy stars',
'leaves barrel mask mushroom twin flower fluorescence battery greenhouse twinhead',
'flower dew leaf acorn grass mushroom seed amber silk crown',
'bolt tin magnets wheels piston spring solar bulb bucket radar',
'bottle comet craters telescope orbit feathers constellation nebula galaxy eclipse',
'seam hole fragmented cutout fragments bell cloud antlers blackhole boundary',
'leaves dawn paint clay drop wind bark seasons daynight world',
]
COLORS={
'짙은 청록':'#235b60','밝은 청록':'#72cebd','옅은 청록':'#a5dacf','청록':'#449b98',
'짙은 남색':'#243450','깊은 남색':'#223550','남색':'#344a70','검푸른':'#283851','검정':'#30303c','검은':'#303039','차콜':'#39363f','흑철':'#393c45',
'짙은 보라':'#513b68','짙은 자주':'#59364f','남보라':'#464360','연보라':'#b6a2cf','옅은 보라':'#c4b5d7','보라':'#8566ad','가지색':'#513750',
'짙은 갈색':'#654736','따뜻한 갈색':'#9b7051','회갈색':'#958477','붉은 갈색':'#a16447','적갈색':'#974e40','밤갈색':'#76503b','황갈색':'#b78d53','갈색':'#9a7656','코코아':'#695045','나무색':'#876044',
'푸른 회색':'#8295aa','청회색':'#899cac','은회색':'#b1bac0','연회색':'#bec3c8','짙은 회색':'#545461','밝은 회색':'#c4c9cc','회색':'#9697a1','은백색':'#e3e4dc','은색':'#a9bac6',
'아이보리':'#eee7cf','크림색':'#f2e3bf','진주색':'#e8e3df','흰색':'#eae9df','흰 몸':'#eae9df','청백색':'#d3e8ef','흰':'#e9e8dc',
'연분홍':'#e8b6cb','진분홍':'#ce658d','분홍':'#d991af','살구색':'#e8b18f','산호색':'#e38379','진홍':'#b83b51','딸기색':'#d64b64','붉은 주황':'#db6544','주황':'#dc9851','노랑':'#ead378','노란':'#ead378','망고':'#edae54','호박색':'#bd802f',
'밝은 연두':'#b9d778','연두':'#a3c674','진초록':'#38614e','짙은 초록':'#365f49','초록':'#669858','올리브':'#828b60','민트':'#a1d4c4','청자':'#86b7a5','녹색':'#617c63',
'청금석':'#365a96','하늘색':'#93bfd8','청색':'#658fbd','파랑':'#527cad','붉은색':'#bd5360','빨강':'#cf5557','테라코타':'#b56d55','모래색':'#cbb88b','유황색':'#d9c46b','황동':'#b48b51','청동':'#9f8657','금색':'#d7b960','금빛':'#dfc782',
}
class Sculpt(Grid):
 def box(self,x0,x1,y0,y1,z0,z1,c=1,p='body'):
  for x in range(math.ceil(x0),math.floor(x1)+1):
   for y in range(math.ceil(y0),math.floor(y1)+1):
    for z in range(math.ceil(z0),math.floor(z1)+1):self.cells[x,y,z]=(c,p)
 def orb(self,x,y,z,rx,ry,rz,c=1,p='body'):
  for xx in range(math.floor(x-rx),math.ceil(x+rx)+1):
   for yy in range(math.floor(y-ry),math.ceil(y+ry)+1):
    for zz in range(math.floor(z-rz),math.ceil(z+rz)+1):
     if ((xx-x)/rx)**2+((yy-y)/ry)**2+((zz-z)/rz)**2<=1:self.cells[xx,yy,zz]=(c,p)
 def line(self,a,b,r=1,c=2,p='crown'):
  length=math.dist(a,b);n=max(1,math.ceil(length*2))
  for i in range(n+1):self.orb(*(a[k]+(b[k]-a[k])*i/n for k in range(3)),r,r,r,c,p)
 def curve(self,points,r=1,c=2,p='tail',taper=True):
  for i in range(len(points)-1):self.line(points[i],points[i+1],max(.65,r*(1-i/(len(points)+1))) if taper else r,c,p)
 def ring(self,x,y,z,rx,ry,c=2,p='float',gap=0):
  points=[(x+rx*math.cos(t*.12),y+ry*math.sin(t*.12),z) for t in range(int(gap/.12),int((math.tau-gap)/.12)+1)]
  self.curve(points,1,c,p,False)
def palette(prompt):
 found=[];pattern='|'.join(map(__import__('re').escape,sorted(COLORS,key=len,reverse=True)))
 for m in __import__('re').finditer(pattern,prompt):
  c=COLORS[m[0]]
  if c not in found:found.append(c)
 found=(found+['#d2b876','#e9dfc7','#567f85','#d98691'])[:4]
 return [found[0],found[1],found[2],found[3],'#252934','#f1e8d3']
def clear(g,*parts):g.cells={xyz:v for xyz,v in g.cells.items() if v[1] not in parts}
def face(g,form,third=False):
 y,z=g.face
 # Small eyes on the head's own front face; no universal cream facial slab.
 gap=3 if form in ['mouse','bird','seed','rabbit'] else 4
 for x in [11-gap,12+gap]:g.box(x,x,y,y+1,z,z,5,'eyes');g.box(x,x,y,y+1,z+1,z+1,1,'head')
 g.box(11,12,y-2,y-2,z,z,5,'head')
 if third:g.box(11,12,y+3,y+3,z,z,5,'eyes')
 g.parts['eyes']={'parent':'head'}
def wings(g,kind='membrane',four=False):
 clear(g,'left_arm','right_arm','left_tip','right_tip')
 for side,sign in [('left',-1),('right',1)]:
  for layer in range(2 if four else 1):
   part=side+'_arm' if layer==0 else side+'_tip';root=(11.5+sign*3,12 if layer==0 else 8,13+layer*2)
   g.orb(root[0]+sign*(7 if layer==0 else 5),root[1]+(6 if layer==0 else -1),root[2],8 if layer==0 else 6,8 if layer==0 else 4,1.4,2 if layer==0 else 4,part)
   g.line(root,(root[0]+sign*12,root[1]+(9 if layer==0 else -2),root[2]),1,3,part)
   g.parts[part]={'parent':'body','pivot':list(root),'rotation':[.12+layer*.15,sign*.25,-sign*(.18+layer*.12)]}
def curved_tail(g,r=2,length=22,curl=1):
 clear(g,'tail');previous='body'
 for i in range(5):
  p='tail' if i==0 else f'tail_{i}';z=17+i*length/5
  g.orb(11.5,6,z+length/10,max(.8,r-i*.35),max(.8,r-i*.35),length/5,1 if i<3 else 2,p)
  g.parts[p]={'parent':previous,'pivot':[11.5,6,z],'rotation':[.04*i,-curl*.12,0]};previous=p
def sculpt_base(g,form,stage,slot):
 alias={'cat':'fox','raccoon':'mouse','snake':'eel','swan':'seahorse','seal':'whale','dolphin':'fish','mole':'bear','peacock':'bird','raptor':'lizard','stego':'armadillo','plesio':'seahorse','otter':'lizard','ant':'caterpillar','gorilla':'bear'}
 body(g,alias.get(form,form),stage,slot)
 if form in ['cat','raccoon','mole']:clear(g,'tail');curved_tail(g,1.4,18,.8)
 if form in ['butterfly','bee','mantis']:
  clear(g,'head','body','left_leg','right_leg','tail');g.orb(11.5,10,12,2,5,3);g.head(6,15,5,4)
  g.pair(8,8,17,21,7,7,3,'left_ear');wings(g,four=form=='butterfly')
 if form=='swan':g.orb(11.5,6,15,7,4,8);g.curve([(12,8,9),(10,13,7),(11,18,5),(12,18,3)],2,1,'head');g.head(7,18,1,4);wings(g)
 if form in ['seal','dolphin']:clear(g,'left_leg','right_leg');g.orb(11.5,8,13,7 if form=='seal' else 5,5,10)
 if form=='snake':clear(g,'body','left_leg','right_leg');g.curve([(7,3,20),(15,4,18),(18,7,13),(13,11,11),(11,15,9)],2.8,1,'body')
 if form in ['octopus','jelly','ant']:
  clear(g,'left_leg','right_leg','left_arm','right_arm')
  count=8 if form=='octopus' else 4 if form=='jelly' else 6
  for i in range(count):
   a=i*math.tau/count;g.curve([(11.5+3*math.cos(a),7,12+3*math.sin(a)),(11.5+8*math.cos(a),3,12+8*math.sin(a)),(11.5+10*math.cos(a+.3),4,12+10*math.sin(a+.3))],1.7,1,'left_leg' if i<count/2 else 'right_leg')
 if form=='clam':
  g.cells={};g.orb(11.5,4,13,10,2,9,2,'body');g.orb(11.5,7,10,4,4,4,4,'head');g.face=(8,6)
  g.orb(11.5,17,15,10,2,8,2,'crown');g.parts['crown']={'pivot':[11.5,8,20],'rotation':[-.45,0,0]}
 if form in ['whale','dragon','lizard','dolphin','giraffe','deer','dog']:curved_tail(g,3 if form=='dragon' else 1.7,28 if form=='dragon' else 17,.65)
 if form=='peacock':
  for i in range(7):
   a=.2+i*.45;g.line((11.5,7,17),(11.5+13*math.cos(a),8+14*math.sin(a),20),2.5,2 if i%2 else 4,'tail')
 if form=='gorilla':g.pair(1,6,1,13,4,10,3,'left_arm')
 if form=='raptor':g.cells={xyz:v for xyz,v in g.cells.items() if not(v[1].endswith('leg') and xyz[2]<12)};g.pair(5,8,1,7,15,20,1,'left_leg')
 for side,sign in [('left',1),('right',-1)]:g.parts[side+'_ear']={'rotation':[.08,0,sign*.22]}
def motif(g,m,stage,slot):
 b=g.box;o=g.orb;line=g.line;ring=g.ring
 # Attachment is semantic: held, grown, worn, hollow or orbiting, rather than a hat on every pet.
 if m in ['leaves','clover','flower','fern','olive','laurel','seasons','wind','grass','leaf']:
  center=(11.5,20,9) if m in ['leaves','fern','laurel'] else (11.5,8,2)
  line((center[0],center[1]-4,center[2]),center,1,2,'crown' if center[1]>10 else 'float')
  for i in range(4 if m=='clover' else 2):
   a=i*math.tau/(4 if m=='clover' else 2)+.6;o(center[0]+math.cos(a)*3,center[1]+math.sin(a)*2,center[2],3,2,1.5,2,'crown' if center[1]>10 else 'float')
 elif m in ['honey','jar','bottle','cup','flask','barrel','clay','pouch','parcel','backpack','basket']:
  z=1 if m not in ['backpack','parcel','basket'] else 17
  o(11.5,6,z,4,4,3,2,'float');ring(11.5,9,z,3,1,3,'float');b(8,15,6,7,z-3,z-3,4,'float')
  if m=='honey':b(12,13,6,9,z-4,z-3,4,'float')
 elif m in ['windmill','propeller','key','gears','clock','compass','sundial','music']:
  z=19 if m in ['windmill','key','propeller'] else 2
  ring(11.5,12,z,4,4,3,'crown');b(11,12,10,14,z-1,z+1,3,'crown')
  for a in [0,math.pi/2,math.pi,math.pi*1.5]:line((11.5,12,z),(11.5+7*math.cos(a),12+7*math.sin(a),z),1.2,2,'crown')
  g.parts['crown']={'pivot':[11.5,12,z],'rotation':[0,0,.2]}
 elif m in ['spiral','spring']:
  clear(g,'crown');pts=[]
  for i in range(76):a=i*.14;r=1+i*.085;pts.append((11.5+math.cos(a)*r,13+math.sin(a)*r,16))
  g.curve(pts,1.4,2,'crown',False)
 elif m in ['coral','coralhorn','antlers','constellation','bark','moss','greenhouse','world']:
  for side in [-1,1]:
   x=11.5+side*4;line((x,13,15),(x+side*2,23,16),1.1,2)
   for j in range(3):line((x+side*j*.6,16+j*2,16),(x+side*(3+j),19+j*2,16),.8,4)
  if m in ['world','moss','greenhouse']:o(11.5,13,15,6,2,5,3,'crown')
 elif m in ['mane','petals','rainbow','fan','wings','feathers','paper','curtain','patchwork','fluorescence','seed','amber','silk','aurora','mirror','paint','daynight']:
  if m in ['mane','petals']:
   y,z=g.face
   for i in range(8):a=i*math.tau/8;o(11.5+7*math.cos(a),y+7*math.sin(a),z+3,2.6,2.6,1.5,2 if i%2 else 4,'head')
  else:
   wings(g,four=m in ['rainbow','seed','fluorescence','silk'])
   for xyz,(c,p) in list(g.cells.items()):
    if p.endswith(('arm','tip')):g.cells[xyz]=(2 if xyz[1]>12 else 3 if xyz[0]<11.5 else 4,p)
 elif m in ['orbit','eclipse','gravity','boundary','crescent','moon','blackhole']:
  ring(11.5,12,16,15 if m=='orbit' else 10,9,3,'float',.5 if m in ['crescent','boundary'] else 0)
  g.parts['float']={'pivot':[11.5,12,16],'rotation':[.15,.25,.3]}
 elif m in ['hole','cutout','seam','fragments','fragmented']:
  if m=='hole':
   for xyz in list(g.cells):
    x,y,z=xyz
    if (x-11.5)**2+(z-14)**2<13 and y>4:del g.cells[xyz]
  elif m=='cutout':
   for xyz in list(g.cells):
    x,y,z=xyz
    if 5<abs(x-11.5)<9 and 9<z<14:del g.cells[xyz]
  else:
   for xyz,(c,p) in list(g.cells.items()):
    if p=='tail' and xyz[2]%6==0:del g.cells[xyz]
   b(18,18,6,10,9,14,4,'body')
 elif m in ['strawberry','stripes','bandage','neon','nebula','galaxy','sunset','tin','glass','lapis','marble','eraser','stars','chalk','fossil','dawn']:
  if m=='strawberry':
   clear(g,'body','left_ear','right_ear')
   g.orb(11.5,8,12,6,6,5,1,'body');g.orb(6,17,7,2.6,2.6,2,1,'left_ear');g.orb(17,17,7,2.6,2.6,2,1,'right_ear')
  for xyz,(c,p) in list(g.cells.items()):
   x,y,z=xyz
   if p in ['body','head'] and ((m=='strawberry' and (x*3+y*5+z)%29==0) or (m!='strawberry' and (y in [5,6,11,12]))):g.cells[xyz]=(4 if m=='strawberry' else 2,p)
  if m=='strawberry':motif(g,'leaves',stage,slot)
 elif m in ['acorn','eggshell','pillow','cloud','mushroom','pebbles','craters','crater','furnace','anvil','solar','sphinx','helmet','balloon','umbrella','cactus']:
  if m in ['crater','furnace','craters']:
   o(11.5,13,15,7,4,6,2,'crown');g.cut(8,15,13,18,12,17,{'crown'});b(8,15,12,12,12,17,4,'crown')
  elif m=='anvil':b(5,18,11,13,11,19,2,'crown');b(8,15,8,12,13,17,2,'crown');line((4,5,4),(4,12,4),1,3,'left_arm');b(1,7,11,14,3,5,2,'left_arm')
  elif m=='solar':b(3,20,12,13,8,19,2,'crown');b(11,12,13,13,8,19,5,'crown');b(3,20,13,13,13,14,5,'crown')
  elif m=='umbrella':g.orb(11.5,17,12,11,3,9,2,'crown');g.curve([(12,15,12),(12,5,12),(15,3,12),(17,5,12)],1,3,'tail')
  else:
   for j in range(3):o(7.5+j*4,13+(j%2)*2,15,4,3,5,2,'crown')
   if m=='acorn':b(4,19,12,14,9,19,3,'crown');b(11,12,16,19,14,15,3,'crown')
 elif m in ['drop','dew','bead','stone','fruit','gem','gems','coin','candy','grapes','snowflake','ice','crystal','pearl','star']:
  o(11.5,7,1,3,3 if m not in ['coin','stone'] else 1,2,4,'float')
  if m in ['snowflake','candy']:line((7,7,1),(16,7,1),1,4,'float');line((11.5,3,1),(11.5,11,1),1,4,'float')
 elif m in ['nine','twin','comet','tusk','horns','mammoth','tentacle','ribbon','trumpet','wave']:
  n=9 if m=='nine' else 2 if m in ['twin','horns','mammoth','tentacle'] else 1
  for j in range(n):
   a=(j-(n-1)/2)*.32;g.curve([(11.5,7,18),(11.5+math.sin(a)*10,11,25),(11.5+math.sin(a)*15,19,30)],1.8,2,'tail' if m in ['nine','twin','comet'] else 'crown')
 elif m=='twinhead':
  clear(g,'head','eyes','left_ear','right_ear');g.orb(7,13,5,4,4,4,1,'head');g.orb(16,13,5,4,4,4,2,'head')
 elif m in ['bell','bulb','lantern','capsule','ink']:
  o(11.5,8,2,4,4,3,2,'float');b(8,15,4,5,0,4,3,'float');ring(11.5,13,2,2,2,3,'float')
 elif m=='threeeyes':pass
 else:
  # Recognisable mechanical/held articles use their actual construction.
  if m in ['headphones','radar','goggles','ducts']:
   for x in [3,20]:ring(x,13,6,3,3,2,'left_ear' if x<10 else 'right_ear')
  elif m in ['wheels','skateboard','rocking','boat','sandals']:
   b(2,21,1,2,5,20,2,'body')
   for x in [3,20]:o(x,2,9,2,2,2,3,'left_leg' if x<10 else 'right_leg')
  elif m in ['pencils','crown','antenna']:
   for j in range(3 if m=='pencils' else 2):line((6+j*5,15,14),(4+j*7,23,17),1.1,2+j%2,'crown')
  elif m in ['telescope','teapot']:g.curve([(12,10,5),(12,9,0),(12,12,-3)],2,3,'float')
  elif m in ['battery','signal','bolt','piston','plug','magnets','bucket','mask','scroll','mortar','wood','club','scarf','lightning','sand','pads','hologram','ash','ember','flame','jackbox','button','saucer','leaf','frost','block','locomotive']:
   if m in ['flame','ember','lightning']:g.curve([(12,9,20),(9,13,23),(14,16,24),(12,20,26)],2,4,'tail')
   elif m=='magnets':
    for x in [2,21]:g.ring(x,5,4,3,3,2,'left_arm' if x<10 else 'right_arm',.8)
   elif m=='scroll':b(5,18,5,11,0,1,6,'float');g.line((5,5,0),(5,11,0),1,3,'float');g.line((18,5,0),(18,11,0),1,3,'float')
   elif m=='button':ring(11.5,7,5,3,3,2,'float');b(10,10,6,8,4,4,5,'float');b(13,13,6,8,4,4,5,'float')
   else:
    b(7,16,4,10,1,3,2,'float');b(8,15,7,8,0,0,4,'float')
  else:raise ValueError(m)
 # Individual construction differences required by the document. These alter
 # large forms (not hidden hash noise) when two species share the same base rig.
 if m=='key':
  clear(g,'crown');b(11,12,8,15,19,20,3,'crown');ring(8,16,20,3,2,3,'crown');ring(15,16,20,3,2,3,'crown')
 if m=='propeller':
  clear(g,'crown');b(-2,25,15,16,17,19,2,'crown');o(11.5,15.5,18,2,2,2,3,'crown')
 if m=='cloud':
  clear(g,'crown')
  for j in range(3):o(6+j*5,16+(j%2)*3,13,4.5,4,5,2,'crown')
 if m=='constellation':
  for x,y in [(3,23),(8,25),(15,25),(20,23)]:o(x,y,16,1.4,1.4,1.4,4,'float')
 if m=='antlers' and stage==19:
  clear(g,'crown');g.curve([(5,17,10),(2,23,12),(4,26,14)],1.2,2,'crown');g.curve([(18,17,10),(21,23,12),(19,26,14)],1.2,2,'crown')
  for x in [4,19]:o(x,29,14,1.5,1.5,1.5,4,'float')
 if m=='battery' and stage==15:
  clear(g,'float');
  for x in [5,18]:o(x,12,16,3,5,3,2,'crown');b(x-1,x+1,17,19,15,17,3,'crown')
 if m=='bandage':
  for y in [5,9,13]:b(5,18,y,y+1,8,17,2,'body')
 if m=='gems':
  for x in [2,21]:o(x,12,5,2,2,2,4,'left_arm' if x<10 else 'right_arm')
 if m=='mortar':
  clear(g,'float');g.orb(11.5,4,0,5,3,4,3,'float');g.cut(8,15,4,8,-2,2,{'float'});line((3,8,0),(12,11,0),1,2,'left_arm');b(9,15,9,12,-1,1,2,'left_arm')
 if m=='jackbox':
  b(4,19,1,7,7,19,2,'body');g.cut(7,16,5,7,10,16,{'body'});b(8,15,4,5,6,6,4,'body')
 if m=='frost':
  clear(g,'float');g.pair(5,8,19,22,7,10,4,'left_ear')
 if m=='curtain':
  for side,sign in [('left',-1),('right',1)]:
   for j in range(3):b(11.5+sign*(7+j*3)-1,11.5+sign*(7+j*3)+1,1+j,16,12+j,13+j,2,side+'_arm')
 if m=='ember':
  clear(g,'tail','float');g.curve([(12,17,9),(12,21,9),(14,23,9)],1.3,4,'crown')
 if m=='flask':
  clear(g,'float');o(11.5,5,0,4,3,3,2,'float');b(10,13,6,12,-1,1,2,'float');b(9,14,12,13,-2,2,3,'float')
 if m=='pillow':
  clear(g,'body','crown');g.solid(2,21,3,8,7,22,2,'body');b(3,20,4,5,6,6,4,'body')
 if m=='stripes' and stage==14:
  clear(g,'tail');ring(11.5,10,24,5,4,2,'tail')
 if m=='mirror':
  clear(g,'left_arm','right_arm');g.pair(-1,5,8,18,12,13,2,'left_arm')
 if m=='fluorescence':
  for side,sign in [('left',-1),('right',1)]:o(11.5+sign*10,10,13,7,7,1.5,2,side+'_arm')
 if m=='seed':
  clear(g,'left_arm','right_arm','left_tip','right_tip')
  for sign in [-1,1]:
   for j in [0,1]:g.line((11.5+sign*2,12,10+j*7),(11.5+sign*18,15,7+j*10),1,2,'left_arm' if sign<0 else 'right_arm');o(11.5+sign*16,15,7+j*10,5,2,3,2,'left_tip' if sign<0 else 'right_tip')
 if m=='silk':
  for side,sign in [('left',-1),('right',1)]:o(11.5+sign*10,12,12,9,8,2,2,side+'_arm')
  o(11.5,7,3,3,2,2,6,'float')
 if m=='bolt':
  clear(g,'float');b(10,13,3,11,0,2,3,'float');ring(11.5,12,1,3,2,2,'float')
 if m=='bulb':
  clear(g,'crown','float');o(11.5,14,12,8,8,7,2,'crown');b(7,16,5,8,8,16,3,'body');line((8,12,11),(11,17,11),1,4,'crown');line((11,17,11),(15,12,11),1,4,'crown')
 if m=='bucket':
  clear(g,'left_arm','right_arm','float');g.pair(0,6,2,7,0,6,3,'left_arm');g.cut(1,5,5,8,0,4);g.cut(18,22,5,8,0,4)
 if m=='craters':
  clear(g,'crown');o(11.5,12,15,8,5,7,2,'crown')
  for x,z,r in [(8,12,2),(15,17,2),(9,18,1)]:
   for xyz in list(g.cells):
    if (xyz[0]-x)**2+(xyz[2]-z)**2<r*r and xyz[1]>12 and g.cells[xyz][1]=='crown':del g.cells[xyz]
 if m=='paint':
  clear(g,'tail');g.box(3,20,5,7,16,23,4,'tail');g.box(3,8,7,8,21,23,2,'tail')
 if m=='wind':
  clear(g,'float');g.curve([(7,14,6),(4,10,10),(5,8,17)],1.5,2,'crown');g.curve([(16,14,6),(19,10,10),(18,8,17)],1.5,2,'crown')
 if m=='bark':
  clear(g,'crown');
  for j in range(3):g.solid(3,20,8,13,8+j*4,10+j*4,2,'crown')
  line((11.5,13,15),(11.5,19,15),1,3,'crown');o(9,19,15,3,2,1.5,4,'crown')
 if stage==16 and slot in [0,2,4]:
  if slot==0:o(11.5,7,19,4,3,5,2,'tail')
  if slot==2:clear(g,'left_arm','right_arm');o(11.5,10,14,7,1.5,10,2,'body')
  if slot==4:g.pair(0,3,3,14,13,15,2,'left_leg')
def dragon(g,stage):
 # Twenty authored proportions: chest width, height, neck reach, tail, wing count.
 profiles=[(8,9,12,32,2),(7,9,8,26,2),(9,8,16,38,2),(10,7,9,32,2),(5,12,17,35,2),(5,10,19,40,2),(8,10,16,34,0),(9,9,24,36,0),(4,8,20,44,0),(8,13,19,32,4),(10,8,7,27,2),(6,10,17,38,2),(5,11,21,40,2),(7,8,13,36,2),(10,7,10,30,2),(4,9,13,38,4),(10,13,9,30,2),(5,11,23,44,2),(11,7,11,38,2),(9,10,20,37,2)]
 w,h,n,tail,count=profiles[stage-1];g.orb(11.5,h,15,w,h-2,11)
 g.pair(3 if w>8 else 5,7,1,7,7,12,3,'left_leg');g.pair(4,8,1,6,19,24,3,'left_leg')
 g.curve([(11.5,h,10),(11.5,h+n*.45,7),(11.5,h+n*.8,2)],3,1,'neck')
 g.parts['neck']={'parent':'body','pivot':[11.5,h,10],'rotation':[-.13 if stage%2 else .1,0,0]}
 g.head(14 if stage in [4,11,17,19] else 10,int(h+n*.8),-2,6);g.parts['head']={'parent':'neck'}
 for side in [-1,1]:g.curve([(11.5+side*4,h+n*.8+2,3),(11.5+side*6,h+n*.8+6,6),(11.5+side*8,h+n*.8+8,10)],1.7,3,'head')
 curved_tail(g,4,tail,1 if stage%2 else -1)
 if count:wings(g,four=count==4)
 motif(g,['windmill','key','coral','furnace','bell','neon','sundial','world','moon','lightning','orbit','clock','aurora','stars','greenhouse','flower','piston','orbit','blackhole','world'][stage-1],stage,10)
 if stage==1:
  clear(g,'left_arm','right_arm','crown')
  for side,sign in [('left',-1),('right',1)]:
   p=side+'_arm';x=11.5+sign*12
   for i in range(4):
    a=.35+i*math.pi/2;g.line((x,19,17),(x+math.cos(a)*10,19+math.sin(a)*10,17),2,2,p)
   g.parts[p]={'parent':'body','pivot':[x,19,17],'rotation':[0,sign*.22,sign*.1]}
  for j in range(3):g.orb(11.5,15+j*.8,12+j*5,4,2,3,4,'crown')
  g.orb(11.5,6,17+tail,2,3,2,4,'tail_4')
 if stage==19:
  for xyz in list(g.cells):
   x,y,z=xyz
   if (x-11.5)**2+(y-h)**2<12 and 7<z<21:del g.cells[xyz]
 if stage==15:
  for xyz,(c,p) in list(g.cells.items()):
   if p=='right_arm':g.cells[xyz]=(4,p)
 # The secret silhouette is authored independently of the shared small-pet wings.
 if stage not in [1,7,8,9]:
  clear(g,'left_arm','right_arm','left_tip','right_tip')
  for sign,side in [(-1,'left'),(1,'right')]:
   p=side+'_arm';root=(11.5+sign*5,h+2,15)
   g.parts[p]={'parent':'body','pivot':list(root),'rotation':[.08,sign*.22,-sign*.08]}
   if stage in [2,4,6,12,17]:
    for j in range(3):
     end=(root[0]+sign*(14+j*3),root[1]+12-j*5,15+j*3)
     g.line(root,end,1.2,3,p)
     for t in range(5,17):g.orb(root[0]+sign*t,root[1]+(12-j*5)*t/(14+j*3),15+j*3*t/(14+j*3),1.7,2.5,1,2 if j%2 else 4,p)
    if stage==12:g.ring(root[0]+sign*14,root[1]+4,16,5,5,3,p)
   elif stage in [3,5,10,13,14,15,16,19]:
    for j in range(5 if stage!=16 else 4):
     dx=12+j*2;dy=15-j*5;dz=j*2
     if stage==13:dy=20-j*4;dx=10+j
     if stage==16:dy=[12,5,-5,-10][j];dx=[20,24,22,15][j]
     if stage==14 and sign==1:dx*=.7;dy+=4
     end=(root[0]+sign*dx,root[1]+dy,15+dz)
     g.line(root,end,1.1,3,p)
     width=2.2 if stage in [10,13,16] else 3.3
     for t in range(3,int(dx)+1):
      if stage==19 and 7<t<12 and j%2:continue
      g.orb(root[0]+sign*t,root[1]+dy*t/dx,15+dz*t/dx,width,width,1.2,2 if t<dx*.7 else 4,p)
    if stage==15 and sign==1:
     for xyz,(col,part) in list(g.cells.items()):
      if part==p:g.cells[xyz]=(4,part)
   elif stage==11:
    # A broad, low disc and small orbiting membranes replace upright bat wings.
    g.orb(root[0]+sign*5,h,15,12,2.5,10,2,p)
   elif stage==18:
    for j in range(4):
     end=(root[0]+sign*(8+j*4),h+15-j*3,15+j*3)
     g.line(root,end,.8,3,p);g.orb(*end,1.7,1.7,1.7,4,p)
   elif stage==20:
    g.curve([root,(root[0]+sign*7,h+12,17),(root[0]+sign*16,h+17,19)],1.7,3,p)
    for j in range(3):g.orb(root[0]+sign*(6+j*4),h+14+j*2,17+j,4.5,2.3,4,2 if j%2 else 4,p)
 if stage in [3,5,9,11,18]:
  clear(g,'left_leg','right_leg')
  if stage==3:
   for sign,side in [(-1,'left'),(1,'right')]:g.curve([(11.5+sign*5,6,11),(11.5+sign*12,3,18),(11.5+sign*15,4,23)],2,2,side+'_leg')
  elif stage in [5,9,18]:
   clear(g,'body');g.curve([(11.5,h+n*.3,8),(10,h,14),(7,5,21),(13,4,29),(17,7,35)],4 if stage==5 else 3.2,1,'body')
  elif stage==11:
   clear(g,'body');g.orb(11.5,h,15,13,4,12,1,'body')
 if stage==17:
  clear(g,'left_leg','right_leg');g.pair(1,7,0,11,10,18,3,'left_leg');g.box(7,16,10,17,3,5,4,'body')
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--ids',nargs='+',type=int);args=ap.parse_args()
 rows=json.loads((ROOT/'docs/art/document-id-map.json').read_text(encoding='utf8'));designs=[];records=[]
 for r in rows:
  if args.ids and r['id'] not in args.ids:continue
  stage,slot=r['stage'],r['slot'];form='secret-dragon' if slot==10 else FORMS[stage-1].split()[slot];m='dragon' if slot==10 else MOTIFS[stage-1].split()[slot]
  g=Sculpt()
  if slot==10:dragon(g,stage)
  else:sculpt_base(g,form,stage,slot);motif(g,m,stage,slot)
  face(g,form,third=m=='threeeyes')
  colors=palette(r['prompt'])
  if stage==1:
   colors=[['#a6c976','#477c49','#d8c58c','#f4e4bd'],['#ebe5cf','#4e9055','#e5a8bb','#35704b'],['#ead16c','#d69a39','#cc853c','#eee9db'],['#d84a64','#58834b','#ab394e','#f0d1a2'],['#87946b','#765039','#b38b58','#d7bb86'],['#eed38b','#8cbac9','#b17d45','#e19648'],['#694933','#bd843a','#e5bf63','#eadac1'],['#bd985a','#d8876f','#9a553f','#e8ae64'],['#b99ad5','#d68fac','#e2cb69','#69b5b5'],['#ba9571','#6c9667','#d9b8cc','#b56d44'],['#28595c','#e9dfc8','#a88250','#d994ac']][slot]+['#292b35','#f0e8d7']
  # Two large material tones, no stochastic speckling.
  dark=[]
  for c in colors:dark.append('#'+''.join(f'{round(int(c[i:i+2],16)*.82):02x}' for i in [1,3,5]))
  for xyz,(c,p) in list(g.cells.items()):
   if c!=5 and xyz[1]<7:g.cells[xyz]=(c+6,p)
  row=dict(**r,key=f"pet-{r['id']}",anatomy=form,feature=m,previewAngle=35,secretDragon=slot==10,stageName='',role=form,colors=dict(primary=colors[0]),idle=r['prompt'])
  records.append(export(g,row,colors+dark));designs.append(row)
  modelpath=ROOT/f"public/models/{row['key']}.json";model=json.loads(modelpath.read_text());model['artMotion']=m;model['artStage']=stage;model['artForm']=form
  model['artMaterial']='polished' if m in ['glass','crystal','ice','bead','honey','lapis'] else 'metal' if stage in [6,12,17] or m in ['furnace','anvil','barrel'] else 'matte'
  modelpath.write_text(json.dumps(model,separators=(',',':')))
  designpath=ROOT/f"public/models/{row['key']}.design.json";d=json.loads(designpath.read_text(encoding='utf8'));d['source']='scripts/document_models.py';designpath.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding='utf8')
 (ROOT/'docs/art/document-models-audit.json').write_text(json.dumps(records,indent=2),encoding='utf8')
 manifestpath=ROOT/'public/models/manifest.json';manifest=json.loads(manifestpath.read_text(encoding='utf8'));replacements={r['name']:r for r in records};manifest['models']=[replacements.get(r['name'],r) for r in manifest['models']];manifestpath.write_text(json.dumps(manifest,indent=2),encoding='utf8')
 if not args.ids:(ROOT/'docs/art/stage-pet-designs.json').write_text(json.dumps(designs,ensure_ascii=False,indent=2),encoding='utf8')
 if not args.ids:
  for file,var,base in [('src/stage-pet-catalog.ts','STAGE_PET_ROWS',100),('src/secret-dragon-catalog.ts','SECRET_DRAGON_ROWS',300)]:
   path=ROOT/file;s=path.read_text(encoding='utf8');catalog=json.loads(s[s.index('['):s.rindex(']')+1])
   for row in designs:
    if base<=row['id']<base+len(catalog):catalog[row['id']-base].update(color=row['colors']['primary'],shape=row['anatomy'])
   path.write_text('// Array index is the permanent save ID. Never sort by stage.\nexport const '+var+' = '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
 print(f'Generated {len(records)} document sculptures')
if __name__=='__main__':main()
