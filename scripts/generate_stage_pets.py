"""Author the 200 stage companions and their AIvoxel models/icons. Not a QA runner."""
import json
import math
import os
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ.get('AIVOXEL_PATH', str(Path.home() / 'OneDrive/Desktop/AIvoxel')))
sys.path.insert(0, str(SOURCE))
from voxel import build

# Each row is a stage-exclusive roster, ordered C,C,B,B,A,A,S,SS,SSS,Secret.
# Anatomy keys: plant, rabbit, bird, quadruped, shell, machine, fish, tentacle, dragon, spirit.
ROSTERS = [
 '새순 뽀미:plant,클로버 토토:rabbit,민들레 삐삐:bird,딸기 볼쥐:quadruped,도토리 꼬북:shell,풍차 병아리:bird,꿀단지 곰곰:quadruped,꽃갈기 사자:quadruped,무지개 나비룡:dragon,사계절 정원사슴:quadruped',
 '단추 삐봇:machine,블록 멍멍:quadruped,종이비행 참새:bird,오뚝이 통통:spirit,실타래 토끼:rabbit,주사위 거북:shell,팽이 발레리나:spirit,기관차 코끼리:quadruped,인형극 꼭두룡:dragon,왕관 태엽곰:quadruped',
 '거품 방울어:fish,소라 소곤:shell,산호 집게:tentacle,해초 해마:dragon,진주 조개:shell,줄무늬 삐에로어:fish,파도 가오리:bird,분홍 산호거북:shell,노을 돌고래:fish,산호궁 바다용:dragon',
 '숯덩이 두두:spirit,불씨 도마뱀:quadruped,화로 꼬북:shell,재구름 박쥐:bird,유황 뿔양:quadruped,용암 달팽이:shell,흑요석 전갈:tentacle,분화구 멧돼지:quadruped,불꽃 불사조:bird,심장불 화산룡:dragon',
 '등불 아귀:fish,유리 해파리:tentacle,먹물 꼬마문어:tentacle,해저 소라게:shell,잠수함 복어:fish,발광 오징어:tentacle,해구 리본장어:dragon,유적 갑옷게:shell,달빛 만타:bird,심해별 고래:fish',
 '분필 꼬마령:spirit,지우개 먼지:quadruped,책갈피 부엉:bird,사물함 숨바꼭:machine,잉크병 유령:spirit,시험지 종이학:bird,종지기 박쥐:bird,교복 마법토끼:rabbit,칠판 낙서룡:dragon,자정 교장부엉:bird',
 '픽셀 삐약:bird,배터리 햄찌:quadruped,와이파이 토끼:rabbit,네온 신호등:machine,홀로그램 고양:quadruped,회로 등딱지:shell,스피커 해파리:tentacle,호버보드 여우:quadruped,레이저 날개룡:dragon,도시 코어기린:quadruped',
 '모래 귀쫑:rabbit,오아시스 새싹:plant,항아리 소라:shell,황동 풍뎅이:shell,대추 낙타:quadruped,비단 코브라:dragon,모래시계 여우:quadruped,태양 매:bird,피라미드 스핑크스:quadruped,황금 원반불사조:bird',
 '양치 새순:plant,호박 송충:quadruped,화석 암모:shell,깃털 랩터:bird,꼬마 트리케라:quadruped,바위 안킬로:shell,돛등 스피노:dragon,긴목 브라키오:dragon,하늘 익룡:bird,태초의 세계수룡:dragon',
 '호롱 불씨:spirit,기와 고양:quadruped,방망이 콩깨비:machine,달떡 토끼:rabbit,장독 숨숨:shell,부채 까치:bird,구미호 홍련:quadruped,도깨비 북지기:machine,붉은달 해태:quadruped,소원불 기린:dragon',
 '구름 솜양:quadruped,월계 새싹:plant,대리석 꼬북:shell,리라 종달:bird,번개 다람:quadruped,날개 샌들토끼:rabbit,황금 독수리:bird,샘물 페가수스:quadruped,별갑옷 그리핀:dragon,천둥 왕관사자:quadruped',
 '촉수 콩별:tentacle,외눈 젤리:spirit,탐사 로버:machine,접시 달팽이:shell,안테나 토끼:rabbit,형광 우파루파:quadruped,무중력 오징어:tentacle,수정 원자로봇:machine,성운 비행가오리:bird,모선 품은 고래:fish',
 '리벳 참새:bird,증기 주전자:machine,톱니 햄스터:quadruped,나침반 거북:shell,고글 비행토끼:rabbit,굴뚝 펭귄:bird,프로펠러 여우:quadruped,비행선 고래:fish,시계탑 올빼미:bird,황동 심장용:dragon',
 '눈송이 포포:spirit,목도리 펭귄:bird,서리 토끼:rabbit,빙판 물범:fish,고드름 고슴:quadruped,수정 소라:shell,오로라 여우:quadruped,얼음뿔 순록:quadruped,극광 날개새:bird,영원빙하 백룡:dragon',
 '베개 꾸벅:spirit,별사탕 쥐:quadruped,잠옷 토끼:rabbit,찻잔 달팽이:shell,거꾸로 시계새:bird,풍선 코끼리:quadruped,꿈실 해파리:tentacle,달그네 고양:quadruped,무지개 이불고래:fish,꿈을 짓는 나비룡:dragon',
 '녹슨 통통:machine,형광 이끼:plant,방독면 쥐:quadruped,유리 버섯:plant,세눈 두꺼비:quadruped,폐전지 거북:shell,변이 덩굴문어:tentacle,독안개 까마귀:bird,정화수 사슴:quadruped,재생의 꽃드래곤:dragon',
 '이슬 진딧:quadruped,잎말이 꼬물:shell,점박 무당:shell,꿀벌 붕붕:bird,풀잎 메뚜기:rabbit,실뽑는 거미:tentacle,꽃잎 사마귀:quadruped,장수 투구벌레:shell,달빛 나방:bird,숲왕 유리나비:dragon',
 '볼트 또각:machine,너트 굴렁:shell,고철 강아지:quadruped,스프링 토끼:rabbit,집게 청소봇:tentacle,무한궤도 꼬북:shell,자석 날개새:bird,용접 불꽃사자:quadruped,폐선 우주고래:fish,행성 재조립룡:dragon',
 '별가루 병아리:bird,달조각 토끼:rabbit,혜성 꼬리쥐:quadruped,고리행성 거북:shell,망원경 부엉:bird,운석 소라게:shell,별자리 사슴:quadruped,은하 리본용:dragon,초신성 봉황:bird,밤하늘 유영고래:fish',
 '공허 점방울:spirit,기억의 새싹:plant,차원문 꼬북:shell,시간 모래토끼:rabbit,잊힌 이름새:bird,별씨 정원사:plant,기억실 해파리:tentacle,황금문 수호사슴:quadruped,창조의 여섯날개:dragon,첫빛 세계수룡:dragon',
]
TRAITS = {
 'plant':'머리 위 싹을 돌보며 작은 빛을 나눠 줍니다.', 'rabbit':'긴 귀로 먼 소리를 듣고 두 발로 통통 뛰어옵니다.',
 'bird':'넓은 날개와 작은 부리로 길 위의 소식을 전합니다.', 'quadruped':'네 발로 종종거리며 꼬리로 기분을 표현합니다.',
 'shell':'단단한 등껍질에 소중한 보물을 숨겨 둡니다.', 'machine':'관절과 장치를 달그락거리며 부지런히 따라옵니다.',
 'fish':'꼬리지느러미를 흔들며 공중을 헤엄칩니다.', 'tentacle':'여러 갈래 팔로 호기심 가는 물건을 만져 봅니다.',
 'dragon':'긴 꼬리와 뿔을 세우고 친구의 앞길을 지킵니다.', 'spirit':'발 없이 둥실 떠다니며 잠든 추억을 깨웁니다.',
}
TIERS = [0,0,1,1,2,2,3,4,5,6]
GRIDS = [10,16,24,32,48,64,100]
OUT = ROOT / 'public/models'

def design(stage, slot, shape, primary, accent, name):
    ops=[]
    def box(x,y,z,w,h,d,c='body'):
        lo=[x-w/2,y-h/2,z-d/2];hi=[x+w/2,y+h/2,z+d/2]
        ops.append({'type':'box','from':[max(0,int(v)) for v in lo],'to':[min(19,math.ceil(v)-1) for v in hi],'color':c})
    def eyes(y=11,z=15):
        for x in [7,12]:box(x,y,z,2,2,1,'eye')
    def feet():
        for x in [6,13]:
            for z in [6,13]:box(x,2,z,3,4,4,'accent')
    if shape=='quadruped':
        box(10,7,8,10,7,12);box(10,11,14,9,8,7);feet()
        box(10,9,2,3,7,3,'accent');eyes(12,18)
        for x in [6,13]:box(x,16,13,3,4,3,'accent')
    elif shape=='rabbit':
        box(10,7,9,8,9,8);box(10,12,11,10,7,8);eyes()
        for x in [6,13]:box(x,17,10,3,6,3,'accent');box(x,2,12,4,3,6,'cream')
    elif shape=='bird':
        box(10,8,9,7,10,8);box(10,13,12,8,6,7);eyes(13,16);box(10,11,17,3,2,3,'gold')
        for x in [3,16]:box(x,9,9,6,3,9,'accent');box(8 if x==3 else 12,2,11,2,3,4,'gold')
    elif shape=='shell':
        box(10,5,10,13,5,12,'accent');box(10,10,8,11,8,10);box(10,7,16,6,4,5,'cream');feet();eyes(8,18)
        box(10,14,8,5,2,6,'gold')
    elif shape=='machine':
        box(10,8,9,10,9,8);box(10,14,10,11,5,9,'accent');eyes(14,15)
        for x in [3,16]:box(x,8,10,3,7,4,'gold');box(7 if x==3 else 12,2,10,4,3,6,'eye')
        box(10,18,10,2,3,2,'gold');box(10,8,14,4,3,1,'cream')
    elif shape=='fish':
        box(10,9,11,9,8,12);box(10,9,17,7,6,3,'cream');eyes(11,19)
        box(10,9,2,13,2,4,'accent');box(10,13,9,2,5,6,'accent')
        for x in [3,16]:box(x,7,11,5,2,5,'accent')
    elif shape=='tentacle':
        box(10,13,10,10,9,10);eyes(14,15)
        for j in range(6):
            a=j*math.pi/3;x=10+math.cos(a)*6;z=10+math.sin(a)*6
            box(x,5+j%2,z,3,8,3,'accent');box(x,2,z+1,4,2,4,'cream')
    elif shape=='dragon':
        box(10,7,8,8,8,10);box(10,12,13,8,7,7);eyes(13,17);feet()
        box(10,6,2,3,5,5,'accent')
        for x in [3,16]:box(x,10,7,5,8,2,'accent');box(7 if x==3 else 12,17,12,2,4,2,'gold')
    elif shape=='plant':
        box(10,7,10,7,9,7);box(10,11,11,10,6,9,'cream');eyes(11,16)
        box(10,16,10,2,6,2,'accent');box(6,17,10,7,2,4,'accent');box(14,18,10,6,2,4)
        for x in [5,14]:box(x,2,10,5,3,6,'accent')
    else:
        box(10,10,10,10,10,10);box(10,4,10,6,4,6,'accent');eyes(12,15)
        for x in [3,16]:box(x,9,11,4,3,4,'cream')
    # Stage-specific anatomy/props, not palette swaps.
    if stage==1:
        for j in range(3):box(5+j*4,16+j%2,8,3,2,3,'accent')
    elif stage==2:
        box(10,9,2,2,7,2,'gold');box(10,11,1,8,2,2,'gold')
    elif stage==3:
        for x in [4,15]:box(x,14,7,2,8,2,'accent');box(x,15,7,5,2,2,'accent')
    elif stage==4:
        for j in range(3):box(10,12+j*2,4,7-j*2,2,4,'gold')
    elif stage==5:
        box(10,17,11,1,5,1,'accent');box(10,19,14,3,2,3,'cream')
    elif stage==6:
        box(10,7,3,11,8,3,'accent');box(10,7,1,1,8,1,'gold')
    elif stage==7:
        for x in [3,16]:box(x,13,10,3,7,3,'eye');box(x,16,10,4,1,4,'accent')
    elif stage==8:
        for j in range(3):box(10,16+j,9,10-j*3,1,8-j*2,'gold')
    elif stage==9:
        for j in range(4):box(10,9+j,2+j*3,2,5,2,'accent')
    elif stage==10:
        for x in [5,14]:box(x,16,10,2,6,2,'gold')
        box(3,8,13,3,7,3,'accent')
    elif stage==11:
        for x in [3,16]:box(x,12,4,5,7,2,'cream')
        box(10,18,10,9,1,6,'gold')
    elif stage==12:
        box(10,5,10,18,2,14,'accent');box(10,18,10,2,3,2,'cream')
    elif stage==13:
        box(5,14,5,3,9,3,'gold');box(5,19,5,5,1,5,'eye');box(14,10,4,4,7,4,'accent')
    elif stage==14:
        for j in range(3):box(5+j*5,14+j%2,6,2,8,3,'cream')
    elif stage==15:
        box(10,4,10,16,2,14,'cream');box(4,16,7,4,4,4,'gold')
    elif stage==16:
        for x in [4,15]:box(x,12,6,3,9,3,'accent');box(x,17,6,4,2,4,'gold')
        box(10,14,16,2,2,1,'gold')
    elif stage==17:
        for x in [3,16]:
            box(x,11,7,5,8,1,'cream');box(x,7,5,4,4,1,'accent')
        for x in [7,12]:box(x,17,12,1,5,1,'eye')
    elif stage==18:
        for x in [4,15]:box(x,4,8,4,6,12,'eye');box(x,15,6,3,5,3,'gold')
        box(10,13,6,12,2,3,'accent')
    elif stage==19:
        box(10,7,10,19,1,3,'gold');box(10,7,10,3,1,19,'gold');box(10,18,10,3,3,3,'cream')
    elif stage==20:
        for x in [3,16]:box(x,12,4,2,13,2,'gold')
        box(10,18,4,15,2,2,'gold');box(10,16,8,3,6,3,'accent')
    # Named species get recognisable anatomy in addition to their regional kit.
    if any(word in name for word in ['사슴','순록','기린']):
        for x in [5,14]:
            box(x,17,12,1,6,1,'gold');box(x,18,12,5,1,1,'gold');box(x,16,12,3,1,1,'gold')
    if any(word in name for word in ['부엉','올빼미']):
        for x in [6,13]:box(x,13,16,5,5,1,'cream');box(x,13,17,2,2,1,'eye')
    if any(word in name for word in ['불사조','봉황']):
        for j in range(3):box(6+j*4,4+j,3,2,9,2,'gold')
    if '고래' in name:
        box(10,8,10,13,9,13);eyes(11,17);box(10,13,10,1,5,1,'cream');box(10,18,10,5,1,2,'cream')
    if any(word in name for word in ['꽃','세계수','정원']):
        for j in range(5):
            a=j*math.tau/5;box(10+math.cos(a)*4,18,9+math.sin(a)*4,3,2,3,'accent')
        box(10,18,9,3,3,3,'gold')
    if any(word in name for word in ['왕관','교장','수호']):
        box(10,16,11,10,2,7,'gold')
        for x in [6,10,14]:box(x,18,11,2,3,2,'gold')
    if any(word in name for word in ['기차','기관차','로버','무한궤도']):
        for x in [3,16]:
            for z in [5,10,15]:box(x,3,z,3,4,3,'eye')
    if any(word in name for word in ['나비','나방']):
        for x in [3,16]:box(x,12,8,6,10,1,'accent');box(x,5,8,5,4,1,'gold')
    if any(word in name for word in ['별','달']):
        box(10,17,15,7,1,1,'cream');box(10,17,15,1,5,1,'cream')
    # Every slot has a different crest outline and asymmetric identifying mark.
    box(4+slot,15+(slot%3),8,2+slot%3,2,2,'gold')
    box(5+slot%4,8+slot%3,16,1,1+slot%3,1,'accent')
    colors={'body':primary,'accent':accent,'cream':'#fff0cf','eye':'#283143','gold':'#efbd65'}
    n=GRIDS[TIERS[slot]]
    scaled=[]
    for op in ops:
        scaled.append(dict(op,**{'from':[int(v*n/20) for v in op['from']], 'to':[min(n-1,math.ceil((v+1)*n/20)-1) for v in op['to']]}))
    return {'size':[n]*3,'palette':colors,'operations':scaled},ops

def icon(ops, colors):
    def project(p):
        x,y,z=p
        return (48+(x-z)*2.1,77-y*2.8+(x+z-20)*1.05)
    polygons=[]
    for op in sorted(ops,key=lambda o:sum(o['from'][a]+o['to'][a] for a in [0,2])+o['from'][1]*.01):
        x,y,z=op['from']; X,Y,Z=[v+1 for v in op['to']]
        for face,shade in [([(x,Y,z),(X,Y,z),(X,Y,Z),(x,Y,Z)],1.1), ([(X,y,z),(X,y,Z),(X,Y,Z),(X,Y,z)],.72), ([(x,y,Z),(X,y,Z),(X,Y,Z),(x,Y,Z)],.92)]:
            base=colors[op['color']].lstrip('#');rgb=[min(255,int(int(base[j:j+2],16)*shade)) for j in [0,2,4]]
            fill='#'+''.join(f'{v:02x}' for v in rgb)
            points=' '.join(f'{a:.1f},{b:.1f}' for a,b in map(project,face))
            polygons.append(f'<polygon points="{points}" fill="{fill}"/>')
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" shape-rendering="crispEdges">'+''.join(polygons)+'</svg>'

def main():
    stages=re.findall(r"\['([^']+)',(0x[0-9a-f]+),(0x[0-9a-f]+)", (ROOT/'src/stage-data.ts').read_text(encoding='utf-8'))
    catalog=[]
    for stage,roster in enumerate(ROSTERS,1):
        stage_name,primary,accent=stages[stage-1]
        primary=f'#{int(primary,16):06x}';accent=f'#{int(accent,16):06x}'
        for slot,entry in enumerate(roster.split(',')):
            name,shape=entry.split(':');pet_id=100+(stage-1)*10+slot
            d,ops=design(stage,slot,shape,primary,accent,name)
            n=d['size'][0];grid={};colors=[]
            # AIvoxel limits each authored component to 50³; assemble larger pets.
            for ox in range(0,n,50):
                for oy in range(0,n,50):
                    for oz in range(0,n,50):
                        origin=[ox,oy,oz];pieces=[]
                        for op in d['operations']:
                            lo=[max(op['from'][a],origin[a]) for a in range(3)]
                            hi=[min(op['to'][a],origin[a]+49) for a in range(3)]
                            if all(lo[a]<=hi[a] for a in range(3)):
                                pieces.append(dict(op,**{'from':[lo[a]-origin[a] for a in range(3)],'to':[hi[a]-origin[a] for a in range(3)]}))
                        if not pieces:continue
                        piece={'size':[min(n,50)]*3,'palette':d['palette'],'operations':pieces}
                        _,colors,cells=build(piece)
                        grid.update({tuple(p[a]+origin[a] for a in range(3)):c for p,c in cells.items()})
            dirs=[(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)]
            voxels=[[*p,c] for p,c in grid.items() if any(tuple(p[a]+v[a] for a in range(3)) not in grid for v in dirs)]
            pivot=[(n-1)/2,-.5,(n-1)/2]
            model={'size':[n]*3,'colors':colors,'voxels':voxels,'pivot':pivot,'parts':{'body':{'pivot':pivot,'parent':None,'voxels':voxels}}}
            (OUT/f'pet-{pet_id}.json').write_text(json.dumps(model,separators=(',',':')),encoding='utf-8')
            (OUT/f'pet-{pet_id}.design.json').write_text(json.dumps(d,separators=(',',':')),encoding='utf-8')
            (OUT/f'pet-{pet_id}.svg').write_text(icon(ops,d['palette']),encoding='utf-8')
            catalog.append({'name':name,'description':f'{stage_name}의 {name}. {TRAITS[shape]}','stageId':stage,'slot':slot,'tier':TIERS[slot],'color':primary,'shape':shape})
        print(f'Authored stage {stage}: 10 companions',flush=True)
    (ROOT/'src/stage-pet-catalog.ts').write_text('// Generated by scripts/generate_stage_pets.py; legacy IDs 0–99 stay intact.\nexport const STAGE_PET_ROWS = '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')

if __name__=='__main__':main()
