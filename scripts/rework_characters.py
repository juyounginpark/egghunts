"""50-cube character authoring. Concepts are written before any geometry.

No external modelling dependency. Source coordinates face -Z; mirror plane X=24.5.
Run --concepts-only to review the brief, then run without arguments to author assets.
"""
import argparse
from collections import deque
import hashlib
import json
import math
import struct
from pathlib import Path
from secret_dragon_designs import DRAGON_BRIEFS,sculpt_secret_dragon

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/models'
BRIEF = ROOT / 'docs/art/character-concepts.json'

# Each habitat changes load-bearing anatomy, not just the palette.
THEMES = [
 ('초원', '잎맥', '햇빛을 모으는 넓은 잎 기관', '#97b971', '#f2c66d'),
 ('장난감', '접힌 나무 조립판', '움직임을 저장하는 커다란 태엽 지지대', '#c99579', '#72b7ca'),
 ('산호 바다', '산호', '물살을 거르는 가지형 아가미', '#df9998', '#75cbbc'),
 ('화산', '화산암', '열을 방출하는 벌어진 등판', '#655966', '#ff9852'),
 ('심해', '유리 등불', '먹이를 부르는 굽은 발광 촉각', '#625b97', '#8ae4ca'),
 ('유령 학교', '접힌 책장', '소리를 기록하는 층층의 종이 깃', '#928097', '#d6dab3'),
 ('사이버 도시', '회로', '신호를 주고받는 갈라진 안테나', '#566587', '#e386d2'),
 ('사막', '사암', '물과 열을 저장하는 둥근 저장실', '#d1ac6e', '#76b8ba'),
 ('공룡섬', '화석', '몸을 지탱하는 돛 모양 척추', '#7c9e73', '#e0be87'),
 ('달마을', '기와', '달빛을 담는 굽은 뿔과 처마', '#758f8d', '#f4a47d'),
 ('신전', '구름 대리석', '바람을 받는 층진 날개 기관', '#d3d3de', '#dcb963'),
 ('외계 습지', '반투명 막', '중력을 느끼는 넓은 감각막', '#9ba5bd', '#a3e59c'),
 ('공중도시', '황동', '증기를 배출하는 등쪽 관과 용골', '#b7916c', '#8ec7c4'),
 ('빙하', '얼음', '열손실을 막는 넓은 결정 깃', '#adcfdc', '#d9b8dd'),
 ('꿈나라', '접힌 천', '꿈을 엮는 둥근 쿠션 막', '#bf9fc3', '#f2d29d'),
 ('폐허', '유리 이끼', '독을 걸러내는 뿌리형 여과기관', '#82915e', '#c3e57c'),
 ('소인국', '잎 껍질', '이슬을 모으는 갈라진 더듬이', '#94ae69', '#e1bb72'),
 ('고철 행성', '겹친 금속판', '수리 도구로도 쓰는 관절 지지대', '#869099', '#dca365'),
 ('천문대', '별 유리', '궤도를 감지하는 아치형 감각기관', '#8383bb', '#acd6e5'),
 ('공허 정원', '흑요석과 씨앗', '빛을 품는 열린 문틀형 골격', '#6e6685', '#ebcb80'),
]
ANATOMY = {
 'sprout': ('씨앗 정령', '갈라진 뿌리 다리·잎 부채 머리', '호기심 많은'),
 'rabbit': ('뛰는 초식수', '기울어진 긴 귀·큰 뒷발', '겁 많지만 재빠른'),
 'bird': ('작은 조류', '쐐기 부리·부채 꼬리', '수다스럽고 경계심 많은'),
 'mouse': ('저장쥐', '넓은 볼·말린 굵은 꼬리', '부지런한'),
 'turtle': ('등짐 거북', '낮고 넓은 등·돌출된 목', '느긋하고 듬직한'),
 'bear': ('수호 곰', '작은 귀·큰 앞발과 좁은 어깨', '무뚝뚝하지만 다정한'),
 'lion': ('갈기 맹수', '방사형 갈기·뒤로 낮아지는 허리', '당당한'),
 'butterfly': ('나비 수호수', '위아래 크기가 다른 네 날개·가는 배', '신비롭고 조심스러운'),
 'deer': ('가지뿔 초식수', '갈라진 뿔·가늘고 높은 다리', '예민하고 고요한'),
 'robot': ('자율 작업수', '분리된 어깨·집게 손', '정확하고 고집 센'),
 'dog': ('달리는 맹수', '앞으로 나온 주둥이·짧은 늘어진 귀', '충직한'),
 'cat': ('지붕을 걷는 맹수', '삼각 귀·고리처럼 말린 꼬리', '도도하고 호기심 많은'),
 'spirit': ('떠도는 정령', '속이 빈 망토 윤곽·갈라진 밑단', '엉뚱하고 낯가리는'),
 'elephant': ('짐꾼 초식수', '낮게 굽는 코·넓은 귀판', '느긋한'),
 'dragon': ('활공 파충수', '비탈진 날개·긴 등과 꼬리', '대담한'),
 'fish': ('부유 어류', '좁은 꼬리자루·수직 꼬리 지느러미', '재빠르고 장난스러운'),
 'snail': ('나선 연체수', '커다란 나선집·낮고 긴 발', '신중한'),
 'crab': ('집게 갑각수', '옆으로 벌어진 집게·여섯 발', '경계심 강한'),
 'seahorse': ('직립 해룡', '수직으로 굽은 몸·고리 꼬리', '수줍은'),
 'clam': ('조개 수호수', '벌어진 두 패각·안쪽 진주핵', '비밀스러운'),
 'ray': ('막날개 유영수', '마름모 가슴지느러미·가는 꼬리', '여유로운'),
 'whale': ('거대 유영수', '긴 유선형 등·수평 꼬리', '평온하고 사려 깊은'),
 'lizard': ('낮은 파충수', '벌어진 네 발·낮은 긴 꼬리', '민첩한'),
 'bat': ('야행 활공수', '접힌 삼각 날개·큰 귀', '까칠하지만 소심한'),
 'ram': ('뿔양', '감긴 양옆 뿔·묵직한 가슴', '완고한'),
 'scorpion': ('독침 갑각수', '머리 위로 굽는 꼬리·열린 집게', '위협적인'),
 'boar': ('굴착 맹수', '쐐기 코·앞으로 치솟는 어깨', '성급한'),
 'phoenix': ('장미깃 조류', '불꽃형 날개·갈라진 긴 꼬리', '도도한'),
 'jelly': ('막종 해파리', '종 모양 갓·가는 긴 촉수', '몽환적인'),
 'octopus': ('연체 작업수', '둥근 맨틀·말린 여덟 팔', '장난기 많은'),
 'squid': ('추진 연체수', '뾰족한 맨틀·두 긴 포획팔', '과묵한'),
 'eel': ('리본 유영수', '세로 S자 몸·길게 이어진 등막', '교활한'),
 'owl': ('관측 조류', '접시 같은 얼굴·두꺼운 낮은 날개', '의심 많고 지적인'),
 'fox': ('꼬리 맹수', '쐐기 머리·몸보다 큰 꼬리 부채', '영리하고 짓궂은'),
 'giraffe': ('높은 관측수', '긴 기둥 목·짧은 뿔', '침착한'),
 'beetle': ('장갑 곤충', '갈라진 등갑·집게형 뿔', '묵묵한'),
 'camel': ('사막 짐꾼', '높낮이 다른 등봉우리·굽은 목', '인내심 강한'),
 'cobra': ('후드 파충수', '펼쳐진 목막·말린 받침 꼬리', '오만한'),
 'caterpillar': ('마디 초식수', '큰 마디 세 개·작은 여러 발', '먹보인'),
 'dinosaur': ('돛등 고대수', '거대한 뒷다리·수직 돛등', '호전적인'),
 'penguin': ('직립 유영조', '물방울 몸·짧은 노 모양 날개', '점잖은'),
 'hedgehog': ('방어 초식수', '뒤로 흐르는 굵은 가시·작은 얼굴', '겁 많은'),
 'frog': ('습지 도약수', '넓은 턱·접힌 뒷다리', '태평한'),
 'mushroom': ('균사 정령', '비대칭처럼 보이는 대칭 이중 갓·뿌리 발', '은둔하는'),
 'bee': ('수집 곤충', '분절된 배·작은 네 날개', '부지런하고 다급한'),
 'mantis': ('낫팔 곤충', '접힌 큰 낫팔·가는 허리', '냉정한'),
 'spider': ('직조 절지수', '둥근 배·네 쌍의 관절 다리', '꼼꼼한'),
 'angel': ('문지기 정령', '세 쌍의 열린 날개·세로 씨앗핵', '엄숙한'),
}
LAYOUTS = [
 'sprout rabbit bird mouse turtle bird bear lion butterfly deer',
 'robot dog bird spirit rabbit turtle spirit elephant dragon bear',
 'fish snail crab seahorse clam fish ray turtle whale dragon',
 'spirit lizard turtle bat ram snail scorpion boar phoenix dragon',
 'fish jelly octopus crab fish squid eel crab ray whale',
 'spirit mouse owl robot spirit bird bat rabbit dragon owl',
 'bird mouse rabbit robot fox turtle jelly fox dragon giraffe',
 'rabbit sprout snail beetle camel cobra fox bird lion phoenix',
 'sprout caterpillar snail bird dinosaur turtle dinosaur giraffe bat dragon',
 'spirit fox robot rabbit clam bird fox robot lion giraffe',
 'ram sprout turtle bird mouse rabbit phoenix deer dragon lion',
 'octopus spirit robot snail rabbit lizard squid robot ray whale',
 'bird robot mouse turtle rabbit penguin fox whale owl dragon',
 'spirit penguin rabbit whale hedgehog snail fox deer phoenix dragon',
 'spirit mouse rabbit snail bird elephant jelly fox whale butterfly',
 'robot sprout mouse mushroom frog turtle octopus bird deer dragon',
 'caterpillar caterpillar beetle bee mantis spider mantis beetle butterfly butterfly',
 'robot beetle dog rabbit crab turtle bird lion whale dragon',
 'bird rabbit mouse turtle owl crab deer eel phoenix whale',
 'spirit sprout turtle rabbit bird sprout jelly deer angel dragon',
]
BOSSES = 'turtle bear octopus lizard squid owl robot scorpion dinosaur robot lion jelly robot ram spirit sprout mantis robot angel angel'.split()

def concepts():
    text = (ROOT / 'src/stage-pet-catalog.ts').read_text(encoding='utf-8')
    rows = json.loads(text[text.index('['):text.rindex(']')+1])
    species = ['새싹콩','달토리','별꼬리','여우콩','고양콩','곰구리','물방울','버섯몽','꿀벌콩','아기새']
    variants = ['풀빛','이슬','버섯','포자','수정','서리','구름','황금','은하','태초']
    legacy_shapes = 'sprout rabbit mouse fox cat bear jelly mushroom bee bird'.split()
    result = []
    def entry(key, name, stage, slot, shape, boss=False):
        habitat, material, organ, primary, accent = THEMES[stage-1]
        if '고양' in name:shape='cat'
        if '딸기' in name:primary,accent='#cc7d86','#91b56e'
        elif '꿀' in name:primary,accent='#c5a171','#e3bf73'
        elif '잉크' in name or '먹물' in name:primary,accent='#67627d','#c5abc5'
        elif '분홍' in name:primary,accent='#d8a0b5','#b5d6bd'
        elif '황금' in name:primary,accent='#d1b576','#94b7bb'
        elif '서리' in name or '얼음' in name:primary,accent='#b2cedd','#eef1db'
        animal, outline, personality = ANATOMY[shape]
        # Unique authored proportion profile, shared by the written brief and geometry.
        profile = {'width': 8 + (stage*3+slot*2)%5, 'height': 8+(stage+slot*3)%6,
                   'depth': 8+(stage*2+slot)%6, 'ear': 7+(stage+slot)%6,
                   'tail': 9+(stage*3+slot)%8, 'stance': 7+(stage+slot*2)%4}
        result.append({'key':key,'name':name,'stage':stage,'slot':slot,'boss':boss,'anatomy':shape,
          'concept':f'{animal} × {material}', 'silhouette':[outline,organ],
          'personality': '영역을 지키는 '+personality if boss else personality,
          'ecology':f'{habitat}에 살며 {organ}으로 환경에 적응한다. {name.split()[0]}의 형태를 기관의 구조로 표현한다.',
          'colors':{'primary':primary,'accent':accent},'profile':profile,
          'symmetry':'x ↔ 49-x, 모든 신체·표정·기관 대칭', 'front':'-Z'})
    for i in range(100):
        variant, sp = divmod(i,10)
        stage = [1,3,16,17,12,14,11,8,19,20][variant]
        entry(f'pet-{i}',f'{variants[variant]} {species[sp]}',stage,sp,legacy_shapes[sp])
        result[-1]['profile']['height'] += 1  # Distinct from present-day relatives.
        result[-1]['lineage'] = '기존 수집종'
    for i,row in enumerate(rows):
        stage,slot = row['stageId'],row['slot']
        entry(f'pet-{i+100}',row['name'],stage,slot,LAYOUTS[stage-1].split()[slot])
    dragon_rows=[]
    for i,(name,egg,outline,personality,ecology) in enumerate(DRAGON_BRIEFS):
        entry(f'pet-{300+i}',name,i+1,10,'dragon')
        result[-1].update(secretDragon=True,concept=f'거대한 드래곤 × {egg}',silhouette=outline.split('·'),personality=personality,ecology=ecology)
        dragon_rows.append({'name':name,'eggName':egg,'description':ecology,'stageId':i+1,'slot':10,'tier':6,'color':THEMES[i][3],'shape':'dragon'})
    (ROOT/'src/secret-dragon-catalog.ts').write_text('// Generated from scripts/secret_dragon_designs.py. Append-only pet IDs 300–319.\nexport const SECRET_DRAGON_ROWS = '+json.dumps(dragon_rows,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    for stage,shape in enumerate(BOSSES,1):
        entry(f'guardian-{stage}',f'{THEMES[stage-1][0]} 둥지 수호자',stage,10,shape,True)
    entry('guardian-final','첫빛 정원의 문지기',20,11,'angel',True)
    BRIEF.parent.mkdir(parents=True,exist_ok=True)
    BRIEF.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['# 50³ 캐릭터 제작 콘셉트','', '플레이어 제외. 펫 320종(시크릿 거대 드래곤 20종 포함), 스테이지 보스 20종, 최종 보스 1종. 기존 ID·이름·능력·저장은 유지한다.',
           '','정면 -Z, 중심 X=24.5. 모든 쌍 기관은 색과 두께까지 대칭이다. 하단 여백 2칸, 외곽 여백 최소 1칸.','',
           '각 모델의 편집 가능한 원본은 `public/models/*.design.json`이며 `scripts/rework_characters.py`로 재생성한다.','']
    for r in result:
        lines += [f"## {r['key']} · {r['name']}",f"- 콘셉트: {r['concept']}",f"- 대표 특징: {' / '.join(r['silhouette'])}",
                  f"- 성격: {r['personality']}",f"- 능력·생태: {r['ecology']}",f"- 대표 색: {r['colors']['primary']} / {r['colors']['accent']}",'']
    (BRIEF.parent/'character-concepts.md').write_text('\n'.join(lines),encoding='utf-8')
    return result


class Sculpt:
    def __init__(self):
        self.cells = {}
        self.ops = []
        self.sampling = False

    def put(self,x,y,z,c,part):
        if not (1<=x<=48 and 2<=y<=47 and 1<=z<=48):
            return
        partner = part.replace('left_','right_') if part.startswith('left_') else part.replace('right_','left_') if part.startswith('right_') else part
        self.cells[x,y,z] = (c,part)
        self.cells[49-x,y,z] = (c,partner)

    def ell(self,x,y,z,rx,ry,rz,c=1,part='body',faceted=False):
        if not self.sampling:self.ops.append(['ellipsoid',x,y,z,rx,ry,rz,c,part,faceted])
        for ix in range(max(1,math.floor(x-rx)),min(48,math.ceil(x+rx))+1):
            for iy in range(max(2,math.floor(y-ry)),min(47,math.ceil(y+ry))+1):
                for iz in range(max(1,math.floor(z-rz)),min(48,math.ceil(z+rz))+1):
                    v=[abs((ix-x)/rx),abs((iy-y)/ry),abs((iz-z)/rz)]
                    inside = sum(v)<=1.55 and max(v)<=1 if faceted else sum(a*a for a in v)<=1
                    if inside:self.put(ix,iy,iz,c,part)

    def box(self,x,y,z,rx,ry,rz,c=1,part='body'):
        self.ops.append(['box',x,y,z,rx,ry,rz,c,part])
        for ix in range(math.ceil(x-rx),math.floor(x+rx)+1):
            for iy in range(math.ceil(y-ry),math.floor(y+ry)+1):
                for iz in range(math.ceil(z-rz),math.floor(z+rz)+1):self.put(ix,iy,iz,c,part)

    def tube(self,points,radius,c=1,part='body',end=None):
        self.ops.append(['tube',points,radius,c,part,end]);self.sampling=True
        # A chain with overlapping sections has no floating beads or accidental gaps.
        length=max(1,len(points)-1)
        for k,(a,b) in enumerate(zip(points,points[1:])):
            n=max(1,math.ceil(math.dist(a,b)*1.25))
            for i in range(n+1):
                t=i/n;r=radius if end is None else radius+(end-radius)*(k+t)/length
                self.ell(*(a[j]+(b[j]-a[j])*t for j in range(3)),r,r,r,c,part)
        self.sampling=False

    def fin(self,points,c=2,part='body',thickness=1.5):
        self.ops.append(['fin',points,c,part,thickness]);self.sampling=True
        a,b,d=points
        for i in range(31):
            for j in range(31-i):
                p=[a[k]+(b[k]-a[k])*i/30+(d[k]-a[k])*j/30 for k in range(3)]
                self.ell(*p,thickness,thickness,thickness,c,part)
        self.sampling=False

    def face(self,y,z,spread=4,expression=0,wide=False):
        # Ink follows the actual front surface rather than floating in front of it.
        front={}
        for xx,yy,zz in self.cells:
            front[xx,yy]=min(zz,front.get((xx,yy),50))
        for x in range(13,25):
            for yy in range(round(y)-4,round(y)+5):
                eye=abs(x-(24.5-spread))<=(2 if wide else 1.5) and abs(yy-y)<=(3 if wide else 2)
                brow=abs(x-(24.5-spread))<=2 and yy==round(y+4+(x-(24.5-spread))*(.35 if expression==2 else -.2 if expression==1 else 0))
                if not eye and not brow:continue
                zz=front.get((x,yy))
                if zz is None or zz>z+5:continue
                c=5 if brow or (abs(x-(24.5-spread))<1 and abs(yy-y)<2) else 4
                self.put(x,yy,zz,c,'eyes')
                if eye and x==round(24.5-spread) and yy==round(y+1):self.put(x,yy,zz,4,'eyes')
        for x in [24,25]:
            yy=round(y-4);zz=front.get((x,yy))
            if zz is not None:self.put(x,yy,zz,5,'head')

    def join_anatomy(self):
        """Weld nearest structural roots after integer resampling; no floating limbs.

        Connections are retained as explicit source operations, not hidden render fixes.
        Paired joints are mirrored by the same brush as every authored feature.
        """
        def neighbors(p):
            x,y,z=p
            return [(x-1,y,z),(x+1,y,z),(x,y-1,z),(x,y+1,z),(x,y,z-1),(x,y,z+1)]
        for _ in range(32):
            remaining=set(self.cells);components=[]
            while remaining:
                todo=[remaining.pop()];component=set(todo)
                while todo:
                    for p in neighbors(todo.pop()):
                        if p in remaining:remaining.remove(p);component.add(p);todo.append(p)
                components.append(component)
            if len(components)==1:return
            components.sort(key=len,reverse=True);root=components[0];other=set().union(*components[1:])
            queue=deque(sorted(root));previous={p:None for p in root};target=None
            while queue and target is None:
                p=queue.popleft()
                for n in neighbors(p):
                    if n in previous or not(1<=n[0]<=48 and 2<=n[1]<=47 and 1<=n[2]<=48):continue
                    previous[n]=p
                    if n in other:target=n;break
                    queue.append(n)
            if target is None:raise ValueError('Cannot join structural root')
            path=[target]
            while path[-1] not in root:path.append(previous[path[-1]])
            if len(path)>12:raise ValueError(f'Anatomy root too far away: {path}')
            c,part=self.cells[target]
            self.tube([path[0],path[-1]],1.5,c,part)
        raise ValueError('Too many disconnected anatomy roots')


def sculpt(r):
    if r.get('secretDragon'):return sculpt_secret_dragon(r,Sculpt())
    g=Sculpt();e,b,t,f=g.ell,g.box,g.tube,g.fin
    p=r['profile'];w,h,d=p['width'],p['height'],p['depth'];s=r['anatomy'];stage=r['stage'];slot=r['slot']
    cx=24.5;head=(27,13);spread=4;facewide=False
    fac=stage in [2,4,6,7,8,9,12,13,14,18,20]
    def body(y=19,z=26,rx=w,ry=h,rz=d):e(cx,y,z,rx,ry,rz,1,'body',fac)
    def skull(y=28,z=14,rx=9,ry=8,rz=7):
        nonlocal head
        head=(y+1,z-rz);e(cx,y,z,rx,ry,rz,1,'head',fac)
    def leg(x,y,z,length=8,thick=3):
        t([(x,y,z),(x+1,y-length,z-1)],thick,1,'left_leg',max(2,thick-1));e(x+1,max(4,y-length),z-3,thick+1,2,5,2,'left_leg')
    def ears(y=35,z=14,length=p['ear'],x=18):
        t([(x,y,z),(x-2,y+length*.65,z+2),(x,y+length,z+3)],2.5,1,'head',1.5)
        t([(x,y+2,z-1),(x-1,y+length*.65,z+1)],1,2,'head')
    def tail(y=16,z=34,thick=3):t([(cx,y,z),(cx,y+4,z+7),(cx,y+p['tail'],43)],thick,2,'tail',1.5)
    def wings(y=24,z=25,long=20,kind=0):
        for j in range(3 if kind else 1):
            f([(cx-5,y-j*5,z),(cx-long,y+8-j*7,z+3),(cx-long+5,y-6-j*4,z+9)],2 if j%2==0 else 4,'left_wing')
            t([(cx-5,y-j*5,z),(cx-long,y+8-j*7,z+3)],1.5,1,'left_wing')
    if s in ['rabbit','mouse','bear','robot','spirit']:
        body(18,27,w-1,h,9)
        skull(29,19,9+(s=='bear'),8,8)
        if s=='rabbit':ears(34,20,length=min(12,p['ear']))
        elif s in ['mouse','bear']:e(16,36,21,4 if s=='mouse' else 3,4,2.5,2,'head')
        elif s=='robot':
            b(cx,28,20,9,5,6,1,'head');b(cx,28,13,7,3,1,5,'head');head=(29,12)
            t([(16,22,26),(10,19,21),(11,12,18)],3,2,'left_arm');t([(10,13,18),(8,10,15)],1.5,1,'left_arm');t([(12,13,18),(14,10,15)],1.5,1,'left_arm')
        if s=='spirit':
            for x in [16,21,24]:t([(x,18,27),(x-2,8,29),(x,6+(x%3),33)],3,2,'body',1)
            e(12,22,23,4,3,4,2,'left_arm')
        else:
            leg(18,13,26,9,4 if s=='bear' else 3)
            if s!='robot':t([(15,24,23),(12,18,18)],3 if s!='bear' else 4,1,'left_arm')
        if s=='mouse':tail(13,33,4)
        elif s=='rabbit':e(cx,14,36,4,4,4,4,'tail')
    elif s in ['dog','cat','fox','lion','deer','giraffe','elephant','ram','boar','camel','lizard','hedgehog','dinosaur','dragon']:
        low=s in ['lizard','hedgehog'];height=14 if low else 19
        body(height,28,w-2,7 if low else h-2,12)
        leg(17,height-1,19,7 if low else 13,3);leg(17,height-2,34,7 if low else 12,3)
        hy=22 if low else 31 if s not in ['giraffe','deer','camel'] else 35
        if s in ['giraffe','camel','deer']:t([(cx,20,19),(cx,hy,14)],4,1,'head')
        skull(hy,13,7 if s in ['deer','giraffe'] else 9,6 if low else 7,7)
        t([(cx,height,21),(cx,hy-2,15)],4,1,'body')
        e(cx,hy-3,7,5,3,4,4 if s in ['fox','dog'] else 2,'head')
        if s=='elephant':
            e(12,hy,17,6,8,3,2,'head');t([(cx,hy-1,6),(cx,hy-10,5),(cx,hy-14,10)],3.5,1,'head',2)
        elif s=='ram':
            t([(17,hy+5,17),(10,hy+5,15),(10,hy-2,12),(15,hy-4,12)],3,2,'head',2)
        else:ears(hy+4,15,5 if s not in ['fox','deer'] else 8,17)
        if s in ['deer','giraffe']:
            t([(19,hy+4,15),(17,44,19),(12,46,23)],1.7,2,'head');t([(17,42,18),(12,42,16)],1.4,2,'head')
        if s=='lion':
            for i in range(8):
                a=math.tau*i/8;e(cx+math.cos(a)*10,hy+math.sin(a)*9,18,4,5,4,2,'head',True)
        if s=='fox':
            for x in [18,24]:t([(cx,17,34),(x,23,39),(x-3,35,43)],4,2,'tail',2)
        elif s=='hedgehog':
            for x in [16,21,24]:
                for z in [24,30,36]:t([(x,19,z),(x-2,27+(z%3),z+4)],2.5,2,'body',.9)
        elif s=='camel':e(cx,28,26,6,10,6,2);e(cx,25,35,5,7,4,2)
        elif s in ['dinosaur','dragon','lizard']:
            t([(cx,14,34),(cx,11,41),(cx,7,46)],4,1,'tail',1.5)
            if s=='dragon':wings(25,28,21,1)
            if s=='dinosaur':f([(cx,24,20),(cx,39,29),(cx,22,39)],2)
        elif s=='cat':t([(cx,16,35),(cx,26,42),(cx,34,39),(cx,32,34)],2,2,'tail')
        else:tail(15,36,2.5)
    elif s in ['bird','owl','phoenix','penguin','bat','butterfly','bee','angel']:
        body(20,25,6 if s in ['butterfly','bee','angel'] else 9,12,7)
        skull(31,19,8 if s!='owl' else 11,7,6)
        if s in ['bird','owl','phoenix','penguin']:
            t([(cx,28,13),(cx,26,7)],3,2,'head',1)
            leg(20,10,24,6,2)
            if s=='penguin':e(13,21,25,3,9,3,2,'left_wing')
            elif s=='owl':e(12,21,27,4,8,5,2,'left_wing');facewide=True;spread=5
            else:wings(24,25,21,s=='phoenix')
            for x in [20,24]:t([(x,15,30),(x-2,7,40)],2.5,2,'tail',1)
        elif s=='bat':wings(25,25,21,0);ears(35,21,10,17)
        elif s in ['butterfly','bee']:
            for yy,rx,ry in [(30,8,11),(15,7,6)]:e(10 if s=='butterfly' else 14,yy,28,rx,ry,2,2 if yy==30 else 4,'left_wing',fac)
            t([(20,36,20),(18,42,18),(15,44,17)],1.2,2,'head')
            if s=='bee':
                for yy in [12,17,22]:b(cx,yy,27,5,1,5,5)
        else:
            wings(31,28,21,1);t([(cx,17,25),(cx,5,29)],4,2,'body',1)
            e(cx,24,17,3,6,2,2)
    elif s in ['fish','whale','ray','eel','seahorse','cobra']:
        if s in ['eel','seahorse','cobra']:
            t([(cx,12,40),(cx,8,32),(cx,12,25),(cx,24,28),(cx,32,17)],4.5,1,'body',5)
            skull(33,14,7,5,6)
            if s=='cobra':e(cx,28,23,13,11,2.5,2,'body')
            else:f([(cx,13,28),(cx,31,32),(cx,21,41)],2)
        else:
            body(23,22,11 if s=='whale' else 7,8 if s=='whale' else 7,15)
            skull(23,12,10 if s=='whale' else 7,7,6)
            t([(cx,23,33),(cx,23,43)],3,1,'tail',2)
            if s=='fish':f([(cx,23,40),(cx,35,47),(cx,12,47)],2,'tail')
            else:f([(cx,23,40),(8,24,45),(cx,23,46)],2,'tail')
            if s=='ray':f([(cx-3,24,12),(3,23,26),(cx-4,23,36)],2,'left_wing')
            else:f([(cx-5,21,20),(7,17,28),(cx-6,20,30)],2,'left_wing')
            if s=='fish':f([(cx,27,17),(cx,37,27),(cx,27,33)],2)
    elif s in ['turtle','snail','clam','beetle']:
        if s=='snail':
            body(9,24,8,5,18);e(cx,23,29,11,13,11,2)
            for i in range(23):
                a=i*.28;rad=1+i*.32;e(14,23+math.sin(a)*rad,29+math.cos(a)*rad,1.4,1.6,1.6,4)
            skull(15,11,7,5,6);t([(20,18,10),(18,25,9)],1.6,1,'head');head=(23,9);spread=6
        elif s=='clam':
            e(cx,13,25,15,5,14,2);e(cx,26,31,15,13,4,1)
            e(cx,19,20,7,7,7,4,'head');head=(20,13)
        else:
            body(16,27,13,9,13);e(cx,21,28,11,10,11,2)
            skull(15,10,6,5,6)
            leg(14,13,18,8,3);leg(14,13,34,8,3)
            if s=='beetle':
                b(cx,24,28,.5,7,10,5);t([(21,20,12),(18,32,10),(21,35,12)],2,2,'head');leg(12,13,26,8,2)
    elif s in ['crab','scorpion','spider','mantis']:
        body(18,28,10 if s!='mantis' else 5,6,10)
        skull(23,15,8,5,5)
        for zz in [20,26,32,37] if s=='spider' else [23,29,35]:t([(16,18,zz),(6,14,zz+1),(3,5,zz+3)],1.8,1,'left_leg')
        if s=='mantis':
            t([(20,24,21),(10,32,17),(9,22,11),(16,25,10)],2.5,2,'left_arm')
            t([(20,28,17),(18,38,14),(13,40,16)],1,2,'head')
        elif s!='spider':
            t([(16,20,19),(8,22,14),(9,26,7)],3,2,'left_arm')
            t([(9,25,8),(5,30,5)],2,2,'left_arm',1);t([(10,25,8),(14,30,6)],2,2,'left_arm',1)
        if s=='scorpion':t([(cx,19,36),(cx,25,43),(cx,39,39),(cx,42,29),(cx,37,25)],3,2,'tail',1.5)
    elif s in ['jelly','octopus','squid']:
        hy=30;body(hy,24,11,9 if s!='squid' else 14,10)
        head=(hy,14)
        if s=='jelly':e(cx,27,24,14,4,13,2)
        if s=='squid':f([(18,33,24),(9,37,27),(16,21,28)],2,'left_wing')
        for x,z in [(16,19),(19,29),(24,34),(12,26)]:
            t([(x,24,z),(x-2,15,z+2),(x-4,7+(x%3),z),(x-2,5+(x%3),z-4)],2.5 if s=='octopus' else 1.6,2,'left_arm',1.3)
    elif s=='caterpillar':
        for yy,zz,rx in [(14,34,8),(17,25,10),(21,15,11)]:e(cx,yy,zz,rx,8,8,1)
        skull(23,14,10,8,7)
        for zz in [15,25,35]:leg(15,10,zz,6,2)
        ears(30,15,7,18)
    elif s=='frog':
        body(14,28,10,7,9);skull(23,17,13,6,8)
        e(12,12,30,6,7,7,2,'left_leg');t([(15,15,19),(12,5,13)],2.5,1,'left_arm')
        spread=8
    else:  # Root bodies and mushroom caps have different structural silhouettes.
        body(16,26,7,12,7);skull(26,20,9,6,7)
        for x in [18,23]:t([(x,14,26),(x-4,6,23),(x-6,4,17)],2,2,'left_leg')
        if s=='mushroom':
            e(cx,34,24,16,7,12,2);e(cx,39,25,10,5,8,1)
            for x in [15,20]:t([(x,30,19),(x,34,15)],1,4,'head')
        else:
            t([(cx,30,25),(cx,38,25)],2,2,'head')
            f([(cx,36,25),(7,43,23),(14,34,28)],2,'head')
    # Functional habitat organs start at the dorsal body, visibly changing the outline.
    # Their span and topology vary with the anatomy's gait and head height.
    basey=25 if s not in ['turtle','snail','clam','beetle','lizard','hedgehog'] else 22
    basez=29 if s not in ['fish','whale','ray'] else 25
    reach=6+(slot%4)*2
    if stage in [1,16]:
        t([(cx,basey,basez),(cx,basey+8,basez+3)],2,2)
        f([(cx,basey+4,basez),(cx-reach,basey+11,basez+3),(cx-3,basey+5,basez+8)],2)
    elif stage in [2,13,18]:
        b(cx,basey,basez+6,7,3,4,2)
        t([(17,basey-2,basez+3),(14,basey+8,basez+4),(14,basey+8,basez+8)],2,2)
        b(14,basey+8,basez+8,3,1,2,5)
    elif stage in [3,17]:
        t([(18,basey-2,basez),(15,basey+reach,basez),(11,basey+reach+3,basez+2)],1.7,2)
        t([(15,basey+4,basez),(10,basey+6,basez-3)],1.5,2)
    elif stage in [4,9,14]:
        for zz in [basez-3,basez+3,basez+9]:f([(cx-3,basey-3,zz),(cx,basey+reach,zz+2),(cx+3,basey-3,zz+4)],2,thickness=2)
    elif stage==5:
        t([(cx,basey+2,basez),(cx,42,basez-3),(cx,44,basez-12),(cx,40,basez-15)],1.4,2)
        e(cx,39,basez-15,3,3,3,4)
    elif stage in [6,10]:
        for j in range(3):f([(cx-3,basey-j*4,basez),(cx-reach-3,basey+4-j*4,basez+2),(cx-6,basey-3-j*4,basez+9)],2 if j%2 else 4)
    elif stage==7:
        t([(17,basey-3,basez),(13,basey+10,basez),(8,basey+10,basez)],2,2)
        b(13,basey+8,basez,3,1,2,4)
    elif stage==8:e(cx,basey+1,basez+5,7,8,7,2,faceted=True)
    elif stage in [11,15]:
        e(14,basey+2,basez+4,6,reach*.6,4,4);e(11,basey+6,basez+5,4,4,3,2)
    elif stage==12:
        f([(cx-3,basey-5,basez),(cx-reach-4,basey+6,basez+4),(cx-4,basey+10,basez+8)],2)
    elif stage in [19,20]:
        t([(17,basey-3,basez+4),(10,basey+5,basez+4),(16,basey+14,basez+4),(cx,basey+16,basez+4)],1.5,2)
    # Name-specific anatomy supplies the identifying idea on top of habitat adaptation.
    name=r['name']
    if any(word in name for word in ['풍차','프로펠러','원반']):
        for j in range(4):
            a=j*math.pi/2;f([(cx,30,35),(cx+math.cos(a)*12,30+math.sin(a)*12,35),(cx+math.cos(a+.5)*9,30+math.sin(a+.5)*9,35)],4)
    if any(word in name for word in ['기차','기관차','무한궤도']) or '로버' in name.split():
        for zz in [18,27,36]:e(12,7,zz,3,4,4,5,'left_leg');e(10,7,zz,1,2,2,2,'left_leg')
        b(cx,24,33,5,9,5,2);b(cx,33,33,6,1,6,5)
    if any(word in name for word in ['클로버','월계','꽃','정원','세계수']):
        for j in range(3):
            a=j*math.pi/3;e(cx-abs(math.sin(a))*8,38+math.cos(a)*5,22,4,3,4,2,'head')
    if any(word in name for word in ['주사위','단추','볼트','너트']):
        e(cx,21,12,5,5,2,2,faceted=True);e(cx,21,10,2,2,1,5)
    if any(word in name for word in ['거품','진주','이슬']):e(cx,31,28,6,6,6,4)
    if any(word in name for word in ['망원경','고글','시계탑']):
        for xx in [18]:e(xx,head[0],head[1],4,4,4,2,'head');e(xx,head[0],head[1]-3,3,3,1,4,'head')
    if any(word in name for word in ['주전자','찻잔','항아리','장독','꿀단지']):
        t([(14,19,29),(9,24,29),(10,30,29),(16,31,29)],2,2);b(cx,32,28,7,1,6,4)
    if any(word in name for word in ['왕관','교장','수호','숲왕']):
        t([(18,38,20),(17,44,20),(21,41,20),(24,45,20)],1.7,2,'head')
    if any(word in name for word in ['초신성','불꽃','불씨','심장불']):
        for xx in [19,24]:f([(xx,27,31),(xx-3,44,35),(xx+3,36,37)],2)
    if '구미호' in name:
        for xx in [11,16,21,24]:t([(cx,16,32),(xx,24,39),(xx-3,39-abs(xx-24)*.4,42)],2.5,4,'tail',1)
    if '세눈' in name:e(cx,31,13,3,3,2,4,'head');e(cx,31,11,1,2,1,5,'head')
    if '외눈' in name:e(cx,head[0],head[1]-1,4,4,2,4,'head')
    if r['boss']:
        # Broad collar and split orbital brows mark adults without scaling pet geometry.
        e(12,23,25,5,7,6,2,'left_arm',True)
        t([(18,head[0]+5,15),(14,head[0]+9,19),(12,head[0]+7,24)],2,2,'head')
    g.face(*head,0 if '외눈' in name else spread,2 if r['boss'] else slot%3,facewide)
    # Every brief's dimensions affect the complete skeletal proportions. Resample solids
    # (not surface points) so narrowed limbs remain continuous, exactly on the mirror plane.
    sx=.79+(w-8)*.045;sy=.78+(h-8)*.032;sz=.78+(d-8)*.04
    if r['key']=='guardian-final':sx=1;sy=1;sz=.91
    old=g.cells;g.cells={}
    for x in range(1,25):
        for y in range(2,48):
            for z in range(1,49):
                source=(math.floor((x-24.5)/sx+25),round((y-2)/sy+2),math.floor((z-24.5)/sz+25))
                if source in old:g.put(x,y,z,*old[source])
    g.ops.append(['resample-solid',sx,sy,sz])
    g.join_anatomy()
    return g


def export(r,g):
    colors=[r['colors']['primary'],r['colors']['accent'],'#687367','#fff0d0','#303747']
    voxels=[[*p,c] for p,(c,_) in sorted(g.cells.items())]
    parts={}
    for part in sorted({part for _,part in g.cells.values()}):
        cells=[[*p,c] for p,(c,n) in sorted(g.cells.items()) if n==part]
        pivot=[24.5,20,24.5]
        if part.startswith('left_'):pivot[0]=15
        if part.startswith('right_'):pivot[0]=34
        if part.endswith('leg'):pivot[1]=13
        if part=='head':pivot[1]=28
        if part=='eyes':pivot=[24.5,(min(v[1] for v in cells)+max(v[1] for v in cells))/2,(min(v[2] for v in cells)+max(v[2] for v in cells))/2]
        parts[part]={'pivot':pivot,'parent':'head' if part=='eyes' and any(n=='head' for _,n in g.cells.values()) else None,'voxels':cells}
    data={'size':[50]*3,'front':'-z','colors':colors,'pivot':[24.5,-.5,24.5],'voxels':voxels,'parts':parts}
    (OUT/f"{r['key']}.json").write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
    design={'schema':'alkong-symmetric-sculpt-v1','size':[50]*3,'front':'-z','mirrorX':24.5,'concept':r,'operations':g.ops}
    (OUT/f"{r['key']}.design.json").write_text(json.dumps(design,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    def chunk(tag,body):return tag+struct.pack('<II',len(body),0)+body
    palette=b''.join(bytes.fromhex(c[1:])+b'\xff' for c in colors)+bytes((256-len(colors))*4)
    # MagicaVoxel uses Z up: map authored (x,y,z) to (x,z,y).
    chunks=chunk(b'SIZE',struct.pack('<III',50,50,50))+chunk(b'XYZI',struct.pack('<I',len(voxels))+b''.join(bytes([x,z,y,c]) for x,y,z,c in voxels))+chunk(b'RGBA',palette)
    (OUT/f"{r['key']}.vox").write_bytes(b'VOX '+struct.pack('<I',150)+b'MAIN'+struct.pack('<II',0,len(chunks))+chunks)
    bounds=[[min(p[a] for p in g.cells),max(p[a] for p in g.cells)] for a in range(3)]
    return {'name':r['key'],'grid':[50]*3,'paletteCount':len(colors),'voxelCount':len(voxels),'bounds':bounds,'anatomy':r['anatomy']}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--concepts-only',action='store_true');parser.add_argument('--secrets-only',action='store_true');args=parser.parse_args()
    if args.concepts_only:
        print('Concepts:',len(concepts()));return
    if not BRIEF.exists():raise SystemExit('Write and review concepts first: --concepts-only')
    rows=json.loads(BRIEF.read_text(encoding='utf-8'));manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
    records=[];audits=[]
    for r in rows:
        if args.secrets_only and not r.get('secretDragon'):continue
        g=sculpt(r)
        records.append(export(r,g))
        symmetry=all(g.cells.get((49-x,y,z),(None,))[0]==c for (x,y,z),(c,_) in g.cells.items())
        assert symmetry,r['key']
        silhouettes={view:hashlib.sha256(str(sorted({tuple(p[i] for i in axes) for p in g.cells})).encode()).hexdigest() for view,axes in [('front',(0,1)),('side',(2,1)),('top',(0,2))]}
        audits.append({'key':r['key'],'symmetric':symmetry,'silhouettes':silhouettes,'voxels':len(g.cells)})
        if len(records)%25==0:print('Authored',len(records),flush=True)
    # Old bossVisual callers still resolve to redesigned regional representatives.
    for old,stage in enumerate([1,5,9,13,17]):
        if args.secrets_only:continue
        for ext in ['json','design.json','vox']:(OUT/f'boss-{old}.{ext}').write_bytes((OUT/f'guardian-{stage}.{ext}').read_bytes())
        records.append(dict(next(v for v in records if v['name']==f'guardian-{stage}'),name=f'boss-{old}'))
    keys={r['name'] for r in records}
    manifest['models']=[r for r in manifest['models'] if r['name'] not in keys]+records
    manifest['characterGenerator']='scripts/rework_characters.py'
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    audit_path=BRIEF.parent/'character-geometry-audit.json'
    if args.secrets_only:
        previous=json.loads(audit_path.read_text(encoding='utf-8'));replaced={a['key'] for a in audits}
        audits=[a for a in previous if a['key'] not in replaced]+audits
    audit_path.write_text(json.dumps(audits,indent=2)+'\n',encoding='utf-8')
    catalog_path=ROOT/'src/stage-pet-catalog.ts'
    source=catalog_path.read_text(encoding='utf-8')
    catalog=json.loads(source[source.index('['):source.rindex(']')+1])
    for i,pet in enumerate(catalog):
        art=rows[100+i]
        pet.update(description=art['concept']+'. '+art['personality']+'.',color=art['colors']['primary'])
    catalog_path.write_text('// Stable gameplay IDs; visual descriptions follow docs/art/character-concepts.json.\nexport const STAGE_PET_ROWS = '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    print('Authored',len(records),'models; player and save IDs preserved.')


if __name__=='__main__':main()
