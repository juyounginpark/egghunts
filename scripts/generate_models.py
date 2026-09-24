"""Original 20³ designs, validated/exported by the user's AIvoxel library."""
import json, sys, os, hashlib
from pathlib import Path
sys.dont_write_bytecode = True
source = Path(os.environ.get('AIVOXEL_PATH', str(Path.home() / 'OneDrive/Desktop/AIvoxel')))
sys.path.insert(0, str(source))
from voxel import build, build_parts, export_vox, PART_PARENTS
root = Path(__file__).resolve().parents[1]
out = root / 'public/models'
out.mkdir(parents=True, exist_ok=True)
def box(a,b,c): return {'type':'box','from':a,'to':b,'color':c}
palette = {'cream':'#FFF0CA','green':'#789851','dark':'#384A36','brown':'#986D48','pink':'#F5AC99','light':'#CEE291','white':'#FFFFFF','gold':'#E8B855'}
def character(kind):
    p={}
    def part(n,pivot,ops): p[n]={'pivot':pivot,'operations':ops}
    part('body',[9.5,5,9],[box([6,4,7],[13,9,12],'green'),box([7,5,5],[12,9,6],'brown')])
    part('head',[9.5,10,10],[box([5,10,7],[14,15,14],'cream'),box([6,12,15],[7,13,15],'dark'),box([12,12,15],[13,13,15],'dark'),box([5,11,15],[6,11,15],'pink'),box([13,11,15],[14,11,15],'pink')])
    for side,x in [('left',4),('right',14)]:
        part(side+'_arm',[x,9,10],[box([x,7,8],[x+1,9,11],'green')])
        part(side+'_hand',[x,6.5,10],[box([x,6,8],[x+1,6,11],'cream')])
    for side,x in [('left',6),('right',11)]:
        part(side+'_leg',[x+1,4,9],[box([x,2,8],[x+2,4,10],'brown')])
        part(side+'_foot',[x+1,1.5,9],[box([x,0,8],[x+2,1,12],'dark')])
    if kind=='alkong': p['head']['operations'] += [box([3,15,5],[16,16,16],'green'),box([6,17,7],[13,18,13],'green'),box([6,17,14],[13,17,14],'gold')]
    if kind=='sprout': p['head']['operations'] += [box([9,16,9],[10,18,10],'green'),box([6,18,9],[9,19,11],'light'),box([11,17,9],[14,18,11],'green')]
    if kind=='bunny': p['head']['operations'] += [box([5,16,8],[7,19,11],'cream'),box([12,16,8],[14,19,11],'cream'),box([6,17,12],[6,19,12],'pink'),box([13,17,12],[13,19,12],'pink')]
    if kind=='dragon':
        p['body']['operations'] += [box([1,6,6],[5,11,7],'gold'),box([14,6,6],[18,11,7],'gold'),box([8,4,2],[11,6,6],'green')]
        p['head']['operations'] += [box([5,16,8],[6,18,9],'gold'),box([13,16,8],[14,18,9],'gold')]
    return {'size':[20]*3,'palette':palette.copy(),'parts':p}
designs={n:character(n) for n in ['alkong','sprout','bunny','dragon']}
designs['bunny']['palette']['green']='#C4A5CD'
designs['dragon']['palette']['green']='#8A9ED6'
for i,color in enumerate(['#A0BE74','#CE99B8','#89C6D8','#EEC775','#A699DE']):
    ops=[box([6,1,6],[13,2,13],'cream'),box([4,3,4],[15,11,15],'cream'),box([5,12,5],[14,14,14],'cream'),box([7,15,7],[12,17,12],'cream'),box([4,6,15],[7,8,15],'green'),box([12,9,15],[15,11,15],'green'),box([7,14,5],[10,14,7],'green')]
    designs[f'egg-{i}']={'size':[20]*3,'palette':dict(palette,green=color),'operations':ops}
designs['tree']={'size':[20]*3,'palette':palette,'operations':[box([8,0,8],[11,8,11],'brown'),box([3,7,3],[16,11,16],'green'),box([5,12,5],[14,15,14],'green'),box([7,16,7],[12,18,12],'light')]}
designs['mushroom']={'size':[20]*3,'palette':palette,'operations':[box([8,0,8],[11,8,11],'cream'),box([2,8,3],[17,11,16],'pink'),box([5,12,5],[14,14,14],'pink'),box([4,11,6],[6,12,8],'cream'),box([12,14,10],[14,14,12],'cream')]}

# Every game character and prop is authored in AIvoxel's editable box format.
pet_colors=['#9ec77b','#73c9b4','#d392b8','#c79ce8','#80c8e6','#bbdcec','#efddac','#edbb64','#9385dc','#b0eee7']
rarity_colors=['#a8c393','#65cfa1','#60bafa','#bd8bfa','#ffc761','#ff87bc','#b5ffff']
for i in range(100):
    species=i%10
    d=character(['sprout','bunny','dragon','fox','cat','bear','drop','fungus','bee','bird'][species])
    d['palette']['green']=pet_colors[i//10]
    d['palette']['cream']=pet_colors[i//10]
    h=d['parts']['head']['operations']; body=d['parts']['body']['operations']
    if species in [3,4,5]:
        for x in [5,12]:
            h += [box([x,16,8],[x+2,18 if species==5 else 19,11],'green'),box([x+1,16,12],[x+1,17,12],'pink')]
        body += [box([8,4,2],[11,7,6],'green'),box([8,7,1],[11,10,3],'white')]
    if species==6:
        h += [box([6,16,8],[13,17,13],'light'),box([8,18,9],[11,19,12],'light')]
    if species==7:
        h += [box([2,14,4],[17,16,16],'pink'),box([5,17,6],[14,19,14],'pink'),box([6,19,8],[8,19,10],'white'),box([12,17,15],[14,17,16],'white')]
    if species==8:
        body += [box([6,6,13],[13,7,13],'dark'),box([1,8,6],[5,10,10],'white'),box([14,8,6],[18,10,10],'white')]
        h += [box([6,16,9],[6,18,9],'dark'),box([13,16,9],[13,18,9],'dark')]
    if species==9:
        h += [box([8,10,16],[11,11,18],'gold')]
        body += [box([2,6,8],[5,9,11],'green'),box([14,6,8],[17,9,11],'green')]
    designs[f'pet-{i}']=d
for region, pet in enumerate([5,27,46,62,82]):
    import copy
    d=copy.deepcopy(designs[f'pet-{pet}'])
    d['palette']['cream']=d['palette']['green']=['#739650','#c77aaf','#62bfd2','#dbb76b','#9275cf'][region]
    d['parts']['head']['operations'] += [box([5,16,6],[14,17,14],'gold'),box([5,18,7],[6,19,8],'gold'),box([9,18,7],[10,19,8],'gold'),box([13,18,7],[14,19,8],'gold')]
    designs[f'boss-{region}']=d
for tier in range(7):
    for region in range(5):
        d={'size':[20]*3,'palette':dict(palette,cream=['#e5efd3','#edd5e3','#c9ecf4','#f4e4b4','#cec8ec'][region],green=rarity_colors[tier]),'operations':[]}
        ops=d['operations']
        # Stepped egg silhouette with biome-specific inlays.
        for y0,y1,r in [(0,1,3),(2,3,5),(4,10,6),(11,13,5),(14,15,4),(16,17,2)]:
            ops.append(box([10-r,y0,10-r],[9+r,y1,9+r],'cream'))
        for x,y in [(5,5),(11,9),(8,13)]:
            ops.append(box([x,y,15 if y<11 else 14],[x+2,y+1,15 if y<11 else 14],'green'))
        if region==0: ops += [box([9,7,16],[10,11,16],'green'),box([7,9,16],[8,10,16],'green')]
        if region==1: ops += [box([7,7,16],[12,8,16],'pink'),box([9,5,16],[10,6,16],'white')]
        if region==2: ops += [box([9,6,16],[10,12,16],'light'),box([8,8,16],[11,10,16],'light')]
        if region==3: ops += [box([7,6,16],[12,6,16],'gold'),box([7,7,16],[7,11,16],'gold'),box([8,11,16],[12,11,16],'gold')]
        if region==4: ops += [box([6,8,16],[13,9,16],'gold'),box([9,5,16],[10,12,16],'gold')]
        if tier>=3: ops += [box([7,17,7],[12,18,12],'green'),box([7,19,8],[8,19,9],'gold'),box([11,19,8],[12,19,9],'gold')]
        designs[f'egg-{tier*5+region}']=d

def prop(name,ops): designs[name]={'size':[20]*3,'palette':palette.copy(),'operations':ops}
from nest_design import nest_design
designs['nest']=nest_design()
prop('camp',[box([0,0,0],[19,1,19],'brown'),box([1,2,1],[2,14,2],'brown'),box([17,2,1],[18,14,2],'brown'),box([1,2,16],[2,14,17],'brown'),box([17,2,16],[18,14,17],'brown'),box([0,14,0],[19,15,19],'green'),box([2,16,1],[17,17,18],'green'),box([5,18,2],[14,19,17],'light'),box([3,2,5],[16,5,14],'brown'),box([3,6,5],[16,6,14],'gold'),box([16,10,17],[18,12,19],'gold'),box([17,13,18],[17,14,18],'dark')])
prop('crystal',[box([2,0,3],[17,2,16],'dark'),box([4,3,6],[8,12,10],'green'),box([5,13,7],[7,16,9],'light'),box([10,3,9],[14,16,13],'light'),box([11,17,10],[13,19,12],'white')])
designs['crystal']['palette'].update(green='#5AA6C0',light='#A5E8EB')
prop('ruin',[box([1,0,1],[18,2,18],'brown'),box([3,3,5],[6,15,12],'cream'),box([13,3,5],[16,15,12],'cream'),box([2,16,4],[17,18,13],'gold'),box([4,7,13],[5,9,13],'gold'),box([14,11,13],[15,13,13],'gold')])
prop('meteor',[box([5,0,5],[14,2,14],'dark'),box([3,3,4],[16,9,15],'green'),box([5,10,6],[14,13,13],'green'),box([7,14,8],[12,17,11],'light'),box([2,6,7],[17,7,10],'gold')])
designs['meteor']['palette'].update(green='#7861A8',light='#B5FFFF')
prop('pedestal',[box([0,0,0],[19,1,19],'brown'),box([1,2,1],[18,3,18],'gold'),box([3,4,3],[16,4,16],'cream')])
prop('hammer',[box([9,0,9],[11,12,11],'brown'),box([4,12,6],[16,17,14],'gold'),box([3,13,7],[4,16,13],'cream')])
prop('pack',[box([4,1,5],[15,14,13],'brown'),box([4,12,6],[15,16,14],'green'),box([8,11,15],[11,13,15],'gold'),box([6,3,14],[13,7,15],'gold')])
prop('compass',[box([3,2,3],[16,4,16],'brown'),box([4,5,4],[15,5,15],'gold'),box([6,6,6],[13,6,13],'cream'),box([9,7,5],[10,7,10],'pink'),box([9,7,11],[10,7,14],'dark')])

# Farm kit and region landmarks. Each editable asset stays inside the 20-cube grid.
prop('barn',[box([1,0,2],[18,1,17],'brown'),box([2,2,3],[17,12,16],'pink'),box([8,2,17],[12,9,17],'dark'),box([3,5,17],[6,8,17],'cream'),box([14,5,17],[16,8,17],'cream'),box([0,12,1],[19,13,18],'green'),box([2,14,2],[17,15,17],'green'),box([4,16,3],[15,17,16],'light'),box([6,18,4],[13,19,15],'light'),box([8,13,19],[11,16,19],'gold')])
prop('fence',[box([1,0,8],[3,12,10],'brown'),box([16,0,8],[18,12,10],'brown'),box([4,4,8],[15,5,9],'cream'),box([4,9,8],[15,10,9],'cream')])
prop('gate',[box([1,0,7],[3,15,10],'brown'),box([16,0,7],[18,15,10],'brown'),box([0,15,6],[19,17,11],'green'),box([9,12,8],[10,14,9],'gold')])
prop('well',[box([3,0,3],[16,3,16],'brown'),box([5,4,5],[14,4,14],'dark'),box([2,4,3],[4,13,5],'cream'),box([15,4,3],[17,13,5],'cream'),box([1,14,1],[18,15,17],'green'),box([4,16,3],[15,17,15],'light'),box([8,5,8],[11,7,11],'gold')])
prop('carrots',[box([1,0,1],[18,1,18],'brown')]+[box([x,2,z],[x+2,4,z+2],'gold') for x in [3,9,15] for z in [3,9,15]]+[box([x+1,5,z+1],[x+1,7,z+1],'green') for x in [3,9,15] for z in [3,9,15]])
prop('cabbage',[box([1,0,1],[18,1,18],'brown')]+[box([x,2,z],[x+4,5,z+4],'green') for x in [2,12] for z in [2,12]]+[box([x+1,6,z+1],[x+3,7,z+3],'light') for x in [2,12] for z in [2,12]])
prop('hay',[box([2,0,3],[17,8,16],'gold'),box([5,0,3],[6,8,16],'brown'),box([13,0,3],[14,8,16],'brown'),box([3,9,4],[16,10,15],'cream')])
prop('flower',[box([9,0,9],[10,11,10],'green'),box([5,4,9],[8,5,10],'light'),box([11,6,9],[14,7,10],'green'),box([6,12,6],[13,14,13],'pink'),box([8,15,8],[11,16,11],'gold')])
prop('lantern',[box([8,0,8],[11,14,11],'brown'),box([5,14,5],[14,15,14],'dark'),box([6,16,6],[13,18,13],'gold'),box([5,19,5],[14,19,14],'green')])
prop('feed',[box([2,0,5],[17,3,14],'brown'),box([4,4,7],[15,4,12],'gold'),box([2,4,5],[3,6,14],'cream'),box([16,4,5],[17,6,14],'cream')])
prop('shop',[box([1,0,2],[18,1,18],'brown'),box([2,2,3],[3,14,4],'cream'),box([16,2,3],[17,14,4],'cream'),box([1,14,1],[18,16,18],'pink'),box([4,14,1],[6,16,18],'cream'),box([10,14,1],[12,16,18],'cream'),box([15,14,1],[17,16,18],'cream'),box([3,2,9],[16,6,16],'brown'),box([4,7,11],[6,10,13],'light'),box([9,7,11],[11,11,13],'gold'),box([14,7,11],[16,10,13],'pink')])
prop('appletree',[box([8,0,8],[11,10,11],'brown'),box([2,9,3],[17,13,16],'green'),box([4,14,5],[15,17,14],'light'),box([5,11,17],[7,13,18],'pink'),box([12,15,15],[14,17,16],'pink'),box([1,11,6],[3,13,8],'gold')])
prop('beehive',[box([8,0,8],[11,8,11],'brown'),box([5,6,5],[14,8,14],'gold'),box([3,9,3],[16,12,16],'gold'),box([5,13,5],[14,15,14],'cream'),box([7,16,7],[12,17,12],'gold'),box([8,8,17],[11,10,17],'dark')])
prop('teapot',[box([5,0,5],[14,2,14],'cream'),box([3,3,3],[16,10,16],'pink'),box([5,11,5],[14,12,14],'cream'),box([8,13,8],[11,14,11],'gold'),box([0,6,6],[2,10,10],'pink'),box([0,10,7],[1,13,9],'pink'),box([17,4,6],[19,10,10],'cream'),box([17,5,7],[18,9,9],'pink')])
prop('log',[box([2,0,5],[17,5,14],'brown'),box([1,1,6],[1,4,13],'gold'),box([18,1,6],[18,4,13],'cream'),box([6,6,7],[8,9,9],'brown')])
prop('cart',[box([2,3,3],[17,9,16],'brown'),box([4,10,5],[9,16,11],'light'),box([11,10,8],[15,14,13],'green'),box([1,0,4],[4,3,7],'dark'),box([15,0,4],[18,3,7],'dark'),box([1,0,12],[4,3,15],'dark'),box([15,0,12],[18,3,15],'dark')])
designs['cart']['palette'].update(light='#A5E8EB',green='#5AA6C0')
prop('stalagmite',[box([1,0,3],[18,2,16],'dark'),box([4,3,5],[10,9,11],'green'),box([5,10,6],[9,14,10],'light'),box([6,15,7],[8,19,9],'white'),box([12,3,11],[16,10,15],'light')])
designs['stalagmite']['palette'].update(green='#6485B0',light='#94D7E4')
prop('statue',[box([2,0,2],[17,2,17],'brown'),box([6,3,6],[13,11,13],'cream'),box([5,12,5],[14,17,14],'cream'),box([1,7,7],[5,13,10],'gold'),box([14,7,7],[18,13,10],'gold'),box([7,14,15],[8,15,15],'dark'),box([11,14,15],[12,15,15],'dark')])
prop('column',[box([2,0,2],[17,2,17],'gold'),box([5,3,5],[14,13,14],'cream'),box([4,14,4],[15,16,15],'gold'),box([5,17,5],[10,18,12],'cream')])
prop('antenna',[box([5,0,5],[14,2,14],'dark'),box([9,3,9],[10,12,10],'cream'),box([2,12,3],[17,13,16],'green'),box([4,14,5],[15,15,14],'green'),box([8,14,8],[11,18,11],'gold')])
designs['antenna']['palette']['green']='#AA9ADF'
prop('starflower',[box([8,0,8],[11,10,11],'green'),box([4,11,4],[15,12,15],'light'),box([8,8,8],[11,16,11],'gold'),box([2,11,8],[17,12,11],'gold')])
designs['starflower']['palette'].update(green='#7861A8',light='#B5FFFF')

# Stage silhouettes, not just recolored shells.
for type in range(35):
    d=designs[f'egg-{type}']; region=type%5;ops=d['operations']
    if region==0:
        ops += [box([9,15,9],[10,18,10],'green'),box([4,17,9],[8,18,11],'light'),box([11,18,8],[15,19,10],'green')]
    if region==1:
        ops += [box([1,11,2],[18,13,17],'pink'),box([3,14,4],[16,16,15],'pink'),box([6,17,6],[13,18,13],'pink'),box([3,13,6],[5,14,8],'white'),box([13,16,9],[15,16,11],'white')]
    if region==2:
        ops[:] = [box([5,0,5],[14,2,14],'green'),box([3,3,4],[16,8,15],'cream'),box([5,9,6],[14,13,13],'cream'),box([7,14,8],[12,17,11],'light'),box([9,18,9],[10,19,10],'white'),box([0,2,7],[3,7,11],'green'),box([1,8,8],[2,11,10],'light'),box([16,3,8],[19,10,12],'green'),box([17,11,9],[18,14,11],'light')]
    if region==3:
        ops += [box([0,6,7],[3,8,12],'gold'),box([0,9,8],[1,12,11],'cream'),box([16,6,7],[19,8,12],'gold'),box([18,9,8],[19,12,11],'cream'),box([7,9,16],[12,10,17],'brown'),box([7,6,16],[8,13,17],'brown')]
    if region==4:
        ops += [box([0,7,3],[19,8,5],'gold'),box([0,7,14],[19,8,16],'gold'),box([0,7,6],[2,8,13],'gold'),box([17,7,6],[19,8,13],'gold'),box([1,16,1],[3,18,3],'light'),box([16,1,16],[18,3,18],'pink')]
    if type//5>=4:
        ops += [box([5,16,5],[6,19,6],'gold'),box([13,16,5],[14,19,6],'gold')]
for i in range(100):
    tier=[0,0,0,1,1,2,2,3,4,5,0,1,2,3,3,4,4,5,5,6][i%20]
    d=designs[f'pet-{i}'];h=d['parts']['head']['operations'];b=d['parts']['body']['operations']
    if tier>=3: h += [box([5,16,6],[6,19,7],'gold'),box([13,16,6],[14,19,7],'gold')]
    if tier>=4: b += [box([0,6,5],[4,12,7],'gold'),box([15,6,5],[19,12,7],'gold')]
    if tier>=5: h += [box([3,14,5],[4,17,6],'light'),box([15,14,5],[16,17,6],'light')]
    if tier==6: b += [box([1,13,4],[4,16,6],'light'),box([15,13,4],[18,16,6],'light')]

prop('gym',[box([1,0,1],[18,2,18],'brown'),box([3,3,2],[16,3,17],'dark'),box([2,3,2],[3,14,3],'gold'),box([16,3,2],[17,14,3],'gold'),box([2,14,2],[17,15,3],'cream'),box([7,15,2],[12,18,4],'green')])

# Tier-specific authored detail: 10..100 cells, with large models built as <=50-cell AIvoxel components.
for i in range(100):
    import math
    d=designs[f'pet-{i}'];species=i%10
    tier=[0,0,0,1,1,2,2,3,4,5,0,1,2,3,3,4,4,5,5,6][i%20]
    n=[10,16,24,32,48,64,100][tier]; f=n/20
    # Species-specific proportions before fine detail is authored.
    if species in [3,4]:
        d['parts']['body']['operations'][0]=box([5,4,3],[14,9,12],'green')
        d['parts']['head']['operations'][0]=box([5,8,10],[14,14,16],'cream')
        d['parts']['head']['operations'] += [box([8,9,17],[11,10,19],'cream'),box([9,11,19],[10,11,19],'dark')]
    if species==5:
        d['parts']['body']['operations'][0]=box([4,3,5],[15,10,13],'green')
        d['parts']['head']['operations'][0]=box([4,10,5],[15,15,15],'cream')
    if species==6:
        d['parts']['body']['operations'][0]=box([4,3,5],[15,10,14],'green')
    if species==8:
        d['parts']['body']['operations'] += [box([6,4,13],[13,5,14],'dark'),box([6,8,13],[13,9,14],'dark')]
    if species==9:
        d['parts']['body']['operations'][0]=box([7,4,7],[12,9,12],'green')
        d['parts']['head']['operations'][0]=box([4,10,5],[15,16,15],'cream')
    for part in d['parts'].values():
        part['pivot']=[v*f for v in part['pivot']]
        for op in part['operations']:
            op['from']=[min(n-1,int(v*f)) for v in op['from']]
            op['to']=[min(n-1,max(op['from'][a],math.ceil((v+1)*f)-1)) for a,v in enumerate(op['to'])]
    d['size']=[n]*3
    if n>=32:
        # Fine crest, wing feather edges, cheek inlays, and dorsal plates use native one-cell detail.
        head=d['parts']['head']['operations']; body=d['parts']['body']['operations']
        for j in range(3+tier):
            x=int(n*.25)+j*max(2,n//18)
            if x<n*.75:
                head.append(box([x,int(n*.79),int(n*.76)],[x+1,int(n*.82),int(n*.77)],'gold'))
                body.append(box([x,int(n*.34),int(n*.25)],[x+1,int(n*.44)+j%3,int(n*.28)],'light'))
        for x in [int(n*.29),int(n*.67)]:
            head.append(box([x,int(n*.57),int(n*.79)],[x+2,int(n*.59),int(n*.8)],'pink'))
    if n==100:
        for side in [0,1]:
            for feather in range(6):
                x=feather*3 if side==0 else 81+feather*3
                d['parts']['body']['operations'].append(box([x,27+feather,19],[x+2,60-feather*3,22],'gold' if feather%2 else 'light'))

# Cull enclosed cells for runtime transport; editable sources and VOX retain solid geometry.
def surface(g):
    dirs=((1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1))
    return {p:c for p,c in g.items() if any(tuple(p[a]+v[a] for a in range(3)) not in g for v in dirs)}

def build_composite(design,name):
    n=design['size'][0]; grids={}; colors=[]
    for part_name,part in design['parts'].items():
        merged={}
        for ox in range(0,n,50):
            for oy in range(0,n,50):
                for oz in range(0,n,50):
                    origin=(ox,oy,oz);ops=[]
                    for op in part['operations']:
                        lo=[max(op['from'][a],origin[a]) for a in range(3)]
                        hi=[min(op['to'][a],origin[a]+49) for a in range(3)]
                        if all(lo[a]<=hi[a] for a in range(3)):
                            ops.append(box([lo[a]-origin[a] for a in range(3)],[hi[a]-origin[a] for a in range(3)],op['color']))
                    if not ops: continue
                    piece={'size':[50]*3,'palette':design['palette'],'operations':ops}
                    folder=out/'components'/name;folder.mkdir(parents=True,exist_ok=True)
                    path=folder/f'{part_name}-{ox}-{oy}-{oz}.json'
                    path.write_text(json.dumps(piece,separators=(',',':')),encoding='utf-8')
                    _,colors,cells=build(json.loads(path.read_text(encoding='utf-8')))
                    merged.update({tuple(p[a]+origin[a] for a in range(3)):c for p,c in cells.items()})
        assert merged
        grids[part_name]=merged
    combined={}
    for g in grids.values(): combined.update(g)
    return design['size'],colors,combined,grids
manifest=[]
for name,design in designs.items():
    # Characters now have their own 50-cube authoring source. Props/player stay here.
    if name.startswith(('pet-','boss-')): continue
    path=out/f'{name}.design.json'
    path.write_text(json.dumps(design,indent=2),encoding='utf-8')
    design=json.loads(path.read_text(encoding='utf-8'))
    grids={}
    if design['size'][0]>64:
        size,colors,grid,grids=build_composite(design,name)
    else:
        if 'parts' in design: _,_,grids=build_parts(design)
        size,colors,grid=build(design)
    assert grid and all(0<=p[a]<size[a] for p in grid for a in range(3))
    (out/f'{name}.vox').write_bytes(export_vox(size,colors,grid))
    parts={k:{'pivot':design['parts'][k]['pivot'],'parent':PART_PARENTS[k],'voxels':[[*p,c] for p,c in surface(g).items()]} for k,g in grids.items()}
    data={'size':size,'colors':colors,'voxels':[[*p,c] for p,c in surface(grid).items()],'parts':parts,'pivot':[(size[0]-1)/2,-0.5,(size[2]-1)/2]}
    (out/f'{name}.json').write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
    manifest.append({'name':name,'grid':size,'paletteCount':len(colors),'voxelCount':len(grid),'bounds':[[min(p[a] for p in grid),max(p[a] for p in grid)] for a in range(3)]})
existing=json.loads((out/'manifest.json').read_text(encoding='utf-8')) if (out/'manifest.json').exists() else {}
names={m['name'] for m in manifest}
manifest.extend(m for m in existing.get('models',[]) if m['name'] not in names)
(out/'manifest.json').write_text(json.dumps({**existing,'generator':'AIvoxel/voxel.py','sourceSha256':hashlib.sha256((source/'voxel.py').read_bytes()).hexdigest(),'models':manifest},indent=2),encoding='utf-8')
print("AIvoxel: exported",len(manifest),"models;",sum(m["voxelCount"] for m in manifest),"voxels")
