"""Authored object, expression and material layer. No random color noise or global filter."""
import colorsys
from collections import deque,Counter

# One readable object per pet. Its function follows the actual stage environment.
# Rows are stable catalogue slots 0..9, never rarity/probability edits.
OBJECTS=[
 '두 장의 새순|클로버 우산|씨앗 배달 날개|도토리 주머니|풀지붕 등집|바람개비 가슴|건초 침낭|민들레 갈기|꽃잎 돛|수확 나무뿔',
 '태엽 열쇠|블록 손수레|종이비행기 날개|깜짝 상자|리본 손잡이|주사위 등집|회전 팽이치마|블록 미끄럼틀 코|성문 날개|왕관 목마등',
 '구명 부표|나선 조개집|불가사리 집게|해초 띠|진주 패각|파도 꼬리|산호 정원등|둥근 조약돌집|해류 부채|커다란 해마 왕관',
 '열린 화구|용암 꼬리|뜨거운 화로|증기 막날개|현무암 뿔|흑요석 나선|열린 돌집게|굴뚝 등판|불사조 화염부채|분화구 날개',
 '낚싯대 등불|잠수종 갓|먹물 주머니|해저 빈집|발광 부표|길쭉한 맨틀|리본 해류|유적 석문등|심연 지느러미|심해 잠수선등',
 '펼친 책|분필 주머니|종 시계등|사물함 문|잉크 병마개|접힌 공책날개|지우개 망토|책상 우산|칠판 등|교실 문날개',
 '접힌 드론날개|전지 꼬리|신호 안테나|보안문 가슴|광섬유 꼬리|서버 냉각판|홀로그램 창|네온 도로꼬리|레이저 스캐너날개|송신탑 고리',
 '햇빛 가리개|대추야자 잎|사암 나선집|태양 원반|물 저장 혹|코브라 목막|모래 시계꼬리|황금 신전등|전갈 태양갈기|피라미드 부채',
 '양치 귀부채|화석 알집|암모나이트 집|나뭇잎 글라이더|뼈 목깃|타르 늪받침|크고 높은 돛|화석 갈비등|양치 막날개|고대 화석문',
 '도깨비 불씨|달 부채꼬리|작은 방망이|기와 우산|항아리 뚜껑|처마 날개|붉은 달꼬리|마을 등롱|방망이 날개|도깨비 기와문',
 '구름 털갈기|올리브 가지|대리석 등집|금빛 하프|번개 꼬리|구름 우산|폭넓은 번개날개|석상 안장|신전 기둥등|천공 신전문',
 '배양 캡슐|접시 새순|넓은 흡착 발|거꾸로 중력추|실험 센서귀|외계 배양통|공중 촉각판|삼각 착륙선|견인 집게|거대 궤도접시',
 '프로펠러 날개|압력계 꼬리|기어 날개|보일러 등|기관 피스톤|증기 굴뚝|황동 열쇠꼬리|비행선 부유낭|풍향 프로펠러|공중도시 용골',
 '얼음 결정등|빙판 썰매|털 목도리|빙산 등판|넓은 고드름|수정 동굴집|오로라 꼬리|결정 사슴뿔|눈송이 날개|빙하 왕관등',
 '접힌 이불|구름 베개|거꾸로 시계귀|쿠션 나선집|뒤집힌 시계|코끼리 침대|꿈방울 갓|밤하늘 이불꼬리|공중 침대등|꿈의 문날개',
 '여과 방독면|변이 새순|작은 드럼통|이중 버섯갓|정화 수련잎|폐허 판자집|독방울 촉수|여과 장갑등|휘어진 철근뿔|정화 온실등',
 '접힌 풀잎|이슬 주머니|육각 등갑|꿀 저장항아리|풀줄기 낫|거미줄 집|잎집게 가슴|단단한 나무뿔|큰 잎날개|이슬 왕관날개',
 '볼트 어깨|너트 등갑|고철 가방|스프링 귀|자석 집게|무한궤도|금속 부채날개|용접 얼굴가리개|폐선 선체등|고철 크레인문',
 '망원경 부리|달 귀판|별가루 통|작은 행성등|별자리 원판|우주열차 바퀴|혜성 꼬리|성운 리본|은하 부채날개|천문대 고리',
 '비어 있는 문|첫빛 씨앗|어긋난 장갑|끊어진 귀판|빈 조개 공간|거꾸로 뿌리|조각난 그림자|기억의 나무뿔|열린 여섯 날개|창조의 정원문',
]
# Sculpt recipes describe recognisable silhouettes, independent of stage palettes.
RECIPES=[
 'leaves clover seedbag acorn roof windmill hay dandelion petals tree',
 'key cart paper jackbox ribbon dice top slide castle rocking',
 'lifebuoy spiral starfish kelp pearl wave coral pebble fan seacrown',
 'crater lava furnace steam rockhorn obsidian claw chimney flame volcano',
 'lantern bell ink ruin buoy mantle ribbon current fin submarine',
 'book chalk clock locker bottle notebook eraser desk board doorway',
 'drone battery antenna gate fiber heatsink hologram road scanner transmitter',
 'canopy palm sandstone sun hump hood hourglass temple mane pyramid',
 'fern eggnest ammonite glider frill tar sail ribs membrane fossilgate',
 'wisp moon club roof lid eaves crescent lamp doubleclub tilegate',
 'cloud olive marble harp thunder umbrella bolt saddle columns skytemple',
 'capsule saucer suction counterweight sensor vat plates tripod tractor mothership',
 'propeller gauge gear boiler piston smokestack key blimp vane keel',
 'crystal sled scarf iceberg icicles cave aurora antler snowflake glacier',
 'blanket pillow reverseclock quilt spiralclock bed dreamjelly nightquilt flyingbed dreamgate',
 'mask mutation drum mushroom lotus planks toxic shell rebar greenhouse',
 'leafcape dew hexagon honey sickle web pincer horn leafwing dewwing',
 'bolt nut pack spring magnet tracks metalfan visor hull crane',
 'telescope moon starjar planet constellation wheels comet nebula galaxy observatory',
 'voidgate lightseed offset fracture empty roots shadow memorytree seraph garden',
]
PLACEMENT=['머리와 등에 이어지는 기관','등에 붙인 큰 기관','넓은 등집','앞발로 쥔 물건','몸통에 연결된 덮개','등과 옆구리에 이어진 기관','꼬리에 연결된 기관','등에 짊어진 기관','몸 양옆으로 펼친 기관','몸 전체를 감싼 대표 기관']
FACE_DESCRIPTIONS=['위로 향한 두 칸 눈동자와 양끝이 들린 입','아래쪽에 모인 작은 눈동자와 숙인 입','세 칸 가로 눈꺼풀과 낮게 닫힌 입','안쪽으로 향한 눈동자와 들린 눈썹·웃는 입','크림색 눈 가장자리와 색이 있는 세로 눈동자','세 칸 길이의 반쯤 감긴 눈과 넓은 주둥이','밝은 눈판 안에 색이 있는 사각 센서','안쪽이 높은 눈썹과 집중하는 눈동자','높게 놓인 세로 눈과 밝은 안쪽 눈동자','위를 보는 눈동자와 양끝이 들린 자신 있는 입']
MATERIALS=[
 ('식물·털','줄기 뿌리의 짙은 올리브 → 잎 끝의 연두; 얼굴·배는 크림','growth'),
 ('칠한 목재','접합부 적갈색 → 넓은 블록 면의 선명한 원색; 앞면만 밝게','paint'),
 ('젖은 산호·패각','물에 잠긴 아랫면 청록 → 윗면 밝은 산호; 패각 끝은 진주빛','water'),
 ('현무암·용암','돌 표면은 보랏빛 회색층; 열린 화구 안쪽은 주황 → 밝은 노랑','heat'),
 ('심해 피부·광구','몸 아래 짙은 남색 → 등 청색; 촉각 끝만 민트빛','abyss'),
 ('종이·낡은 목재','책등 자주갈색 → 펼친 면 아이보리; 모서리는 옅은 황토','paper'),
 ('전자 패널','패널 면 남청색 → 모서리 차가운 청록; 창 안쪽에 집중된 발광','circuit'),
 ('사암·황동','발의 붉은 사암 → 몸의 황토 → 닳은 윗면 금빛','strata'),
 ('가죽·화석','몸의 숲색 → 배의 따뜻한 모래색; 뼈 절단면은 아이보리','fossil'),
 ('도자기·기와','몸 중앙 따뜻한 자주 → 처마의 짙은 보라; 불씨 중심은 살구','ceramic'),
 ('대리석·금','기둥 아랫면 청회색 → 위쪽 상아색; 연결부만 금색','marble'),
 ('배양막·실험 금속','배양막 중심 라임 → 가장자리 청록; 감각판 안쪽 보라빛','alien'),
 ('황동·구리','이음새 적갈색 → 마모된 평면 황동 → 증기 입구 크림','brass'),
 ('빙층·단열 털','얼음 바닥 남청색 → 절단면 청록 → 꼭대기 흰색','ice'),
 ('쿠션·꿈빛','쿠션 중앙 복숭아색 → 접힌 가장자리 자주색; 달 무늬만 금빛','fabric'),
 ('녹슨 통·변이 식물','녹슨 판 적갈색 → 겹친 판 황토; 여과구만 산성 연두','rust'),
 ('등껍질·잎','등갑 중심 적갈색 → 가장자리 호박색; 잎 끝은 연한 녹색','chitin'),
 ('철·산화 구리','철판 앞면 청회색 → 이음새 남색; 판 아래 녹슨 주황','steel'),
 ('성운·관측 유리','꼬리 시작 남보라 → 끝 청록; 별 원판 중앙은 아이보리','cosmos'),
 ('공허 절단면·첫빛','몸의 짙은 자주 → 열린 절단면 청록; 씨앗 중심은 따뜻한 금빛','void'),
]
PALETTES=[
 ['#71a73d','#c99438','#efe4b7','#316d47'],['#d34d35','#efbb36','#32a6c2','#7255ad'],
 ['#f17e6f','#22a9a4','#f8dfaf','#6868bd'],['#524251','#ed622c','#ffcb56','#938085'],
 ['#223c73','#70479f','#39cebd','#e07bac'],['#775274','#e1cba3','#a7774f','#538590'],
 ['#263d70','#d348ac','#26c6bb','#d6e5f1'],['#d7a247','#93532e','#259c9c','#f5d48b'],
 ['#4e874d','#d6b070','#a4553e','#c9d39d'],['#52416f','#df7148','#52a38b','#e7b64f'],
 ['#e4e2d0','#d6a231','#4886b1','#72ab8e'],['#87bf40','#7854af','#efaa79','#23a49d'],
 ['#c28b37','#3c9b96','#b6532c','#eed79b'],['#55bcd7','#9576c4','#edf6e5','#356eab'],
 ['#c875ae','#efbe6e','#63b8c9','#7663af'],['#718330','#a15634','#d5db58','#367974'],
 ['#70a444','#e3ac44','#aa4a29','#e0d8a8'],['#879bac','#d27831','#3c526b','#dcd6ad'],
 ['#504b9b','#93d1e6','#e9b84c','#b664aa'],['#4a315f','#e4b94d','#48ac9e','#ab658a'],
]

def object_sculpt(g,recipe):
 """A 16×11×9 object grid: large planes, open spaces and purposeful profiles."""
 b=g.box;q=g.pair # pair is 24-wide in the outer Grid, so use local mirror below.
 def p(x0,x1,y0,y1,z0,z1,c=2):b(x0,x1,y0,y1,z0,z1,c);b(15-x1,15-x0,y0,y1,z0,z1,c)
 def frame(x0,x1,y0,y1,z0,z1,c=2,t=2):g.frame(x0,x1,y0,y1,z0,z1,c,'body',t)
 def leaf(x,y,z,c=2):b(x+2,x+3,y,y+2,z,z+2,3);b(x,x+5,y+2,y+4,z-2,z+3,c);b(x+1,x+4,y+5,y+6,z-1,z+2,c)
 def disc(y,z,c=2):b(2,13,y,y+2,z+2,z+6,c);b(4,11,y,y+2,z,z+8,c)
 def ring(y,z,c=2):frame(1,14,y,y+8,z,z+2,c,3)
 def roof(c=2):b(0,15,1,3,0,8,c);b(2,13,4,6,1,7,c);b(5,10,7,9,2,6,c)
 def shell(c=2):b(1,14,0,3,0,8,c);b(2,13,4,6,1,8,c);b(4,11,7,9,2,7,c)
 def star(c=2):b(5,10,0,10,3,5,c);b(0,15,4,7,3,5,c);p(2,5,1,3,3,5,c)
 if recipe in ['leaves','olive','mutation','palm','fern','leafcape','leafwing']:
  leaf(1,0,3);leaf(9,1 if recipe=='fern' else 0,3)
  if recipe in ['palm','fern']:b(6,9,0,8,4,6,3);p(0,4,5,7,2,6,2)
  if recipe in ['leafcape','leafwing']:p(0,4,0,8,0,7,2)
 elif recipe=='clover':
  p(1,6,4,8,2,6);p(3,6,8,10,2,6);b(6,9,0,5,3,5,3)
 elif recipe in ['seedbag','acorn','eggnest','lightseed','starjar','drum','honey','battery','vat','ink','bottle']:
  shell(3 if recipe in ['eggnest','honey','acorn'] else 2);b(4,11,8,10,2,7,3)
  if recipe in ['acorn','eggnest']:b(0,15,6,8,0,8,3)
  if recipe in ['honey','lightseed','starjar','vat']:b(5,10,3,7,0,1,4)
  if recipe=='battery':b(6,9,10,10,3,5,4)
 elif recipe in ['roof','eaves','canopy','tilegate','temple','skytemple','pyramid','castle','fossilgate','garden']:
  roof();p(1,3,0,6,2,7,3)
  if recipe in ['tilegate','eaves']:p(0,2,5,8,0,8,3)
  if recipe in ['castle','fossilgate']:p(0,3,6,10,1,7,3);b(6,9,5,9,2,6,4)
  if recipe=='garden':leaf(0,0,4,3);leaf(10,0,4,3)
 elif recipe in ['windmill','propeller','vane','gear','snowflake','dandelion','petals','dewwing']:
  b(6,9,0,10,3,5,3);b(0,15,4,6,3,5,2)
  if recipe in ['gear','snowflake','dandelion']:p(2,4,1,3,3,5,2);p(2,4,7,9,3,5,2)
  if recipe in ['petals','dewwing']:p(0,5,0,3,2,6,2);p(0,5,7,10,2,6,4)
 elif recipe=='cloud':
  b(0,15,1,4,1,7,4);b(1,6,4,7,2,6,4);b(7,12,4,9,1,7,4);b(12,15,4,6,2,6,4)
 elif recipe in ['hay','pillow','quilt','blanket','nightquilt','scarf','eraser','pack','planks']:
  shell();b(1,14,0,2,0,8,3)
  if recipe in ['hay','pack']:b(6,9,0,10,0,8,3)
  if recipe in ['blanket','nightquilt','scarf']:p(0,3,0,7,0,8,4)
  if recipe=='planks':
   for y in [1,4,7]:b(0,15,y,y+1,1,7,3 if y==4 else 2)
 elif recipe in ['tree','antler','memorytree','rebar','rockhorn','horn','seacrown']:
  b(6,9,0,8,3,6,3);p(2,5,3,5,3,6,2);p(0,3,5,10,3,6,2);p(4,6,7,10,3,6,2)
  if recipe=='tree':p(0,4,7,10,1,8,2)
 elif recipe in ['key','ribbon','doubleclub','club','bolt','piston','sickle']:
  b(6,9,0,7,3,5,3);p(1,6,6,10,2,6,2)
  if recipe=='key':frame(1,6,6,10,2,6,2,1);frame(9,14,6,10,2,6,2,1)
  if recipe in ['club','doubleclub']:p(1,5,1,10,2,6,2)
 elif recipe in ['cart','rocking','sled','tracks','wheels','tripod']:
  b(2,13,3,5,1,8,2);p(0,3,0,3,0,3,3);p(0,3,0,3,6,8,3)
  if recipe=='cart':p(0,2,5,9,1,8,2);b(2,13,5,8,6,8,2)
  if recipe in ['sled','rocking']:p(0,3,0,2,0,8,3);p(0,3,2,4,0,2,3)
  if recipe=='tripod':b(6,9,0,3,6,8,4)
 elif recipe in ['paper','notebook','book','board','locker','doorway','desk','bed','flyingbed','dreamgate']:
  p(0,6,2,9,2,4,2);b(7,8,0,8,3,5,3)
  if recipe in ['book','notebook']:p(1,5,3,8,1,1,4)
  if recipe in ['desk','bed','flyingbed']:b(0,15,3,5,0,8,2);p(0,2,0,8,0,8,3);b(3,8,6,8,0,4,4)
  if recipe in ['locker','doorway','dreamgate']:frame(0,15,0,10,2,5,3,2);b(2,5,1,8,0,2,2)
 elif recipe in ['jackbox','dice','top','slide']:
  shell();b(3,12,2,7,0,1,4)
  if recipe=='jackbox':b(0,15,9,10,0,8,3);b(6,9,7,9,3,5,4)
  if recipe=='top':b(6,9,0,1,3,5,3);disc(3,0);disc(6,0,3)
  if recipe=='slide':
   for z in range(0,9,2):b(4,11,8-z,10-z,z,z+1,3)
 elif recipe in ['lifebuoy','pearl','buoy','sun','moon','crescent','planet','dew','dreamjelly']:
  ring(0,3,3 if recipe=='lifebuoy' else 2)
  if recipe in ['pearl','dew','dreamjelly','planet']:b(5,10,3,6,2,5,4)
  if recipe in ['moon','crescent']:g.cut(6,15,4,10,0,8)
  if recipe=='dreamjelly':p(2,4,0,3,4,7,4)
 elif recipe in ['spiral','sandstone','ammonite','obsidian','quilt','spiralclock']:
  frame(0,15,0,10,2,7,2,2);b(4,11,3,7,1,6,3);b(8,11,5,7,0,2,4)
 elif recipe in ['starfish','fin','fan','metalfan','frill','mane','flame','leafwing','membrane','glider','galaxy']:
  for n in range(4):p(n*2,n*2+1,n,10-n,2+n,4+n,2 if n%2 else 3)
  if recipe in ['starfish','flame']:star()
 elif recipe in ['kelp','wave','current','ribbon','fiber','lava','thunder','bolt','aurora','nebula','comet']:
  for n in range(4):b(n*3,n*3+5,n*2,n*2+2,2+n%2,5+n%2,2 if n<3 else 4)
  if recipe in ['thunder','bolt']:b(5,10,4,6,1,6,4)
 elif recipe in ['coral','crystal','icicles','iceberg','glacier']:
  p(1,4,0,7,2,6,2);b(6,9,0,10,3,7,3);p(0,3,6,9,2,6,4)
  if recipe=='coral':p(0,2,4,6,0,8,2);p(3,6,2,4,2,6,3)
  if recipe in ['iceberg','glacier']:b(2,13,0,4,0,8,2)
 elif recipe in ['pebble','marble','hump','tar','saddle','shell','hexagon','nut','offset']:
  shell();b(3,12,2,5,0,1,3)
  if recipe in ['nut','hexagon']:g.cut(5,10,3,7,0,8)
  if recipe=='tar':b(0,15,0,2,0,8,4)
  if recipe=='offset':g.cut(0,8,4,5,0,8);b(0,10,8,10,1,7,4)
 elif recipe in ['crater','volcano','furnace','boiler','cave','greenhouse','empty']:
  frame(0,15,0,10,1,8,2,3);b(4,11,0,2,1,8,4)
  if recipe in ['crater','volcano']:g.cut(4,11,7,10,0,8);p(0,3,7,10,1,8,3)
  if recipe=='greenhouse':roof(3);g.cut(5,10,4,7,0,8)
 elif recipe in ['steam','chimney','smokestack','toxic','columns','transmitter','antenna','sensor']:
  p(2,5,0,8,2,6,3);p(1,6,8,10,1,7,2)
  if recipe in ['steam','smokestack','toxic']:b(6,9,8,10,3,6,4)
  if recipe in ['columns','transmitter']:b(0,15,8,10,2,6,2)
 elif recipe in ['claw','pincer','tractor','magnet','suction','crane','visor','mask']:
  p(0,3,0,10,2,6,2);b(0,15,0,2,2,6,3);p(3,6,8,10,2,6,4)
  if recipe in ['visor','mask']:b(3,12,3,8,2,4,3);g.cut(5,10,5,7,0,8)
  if recipe=='suction':disc(0,0,3)
 elif recipe in ['lantern','lamp','bell','gauge','clock','reverseclock','hourglass','counterweight']:
  frame(2,13,1,9,2,6,3,2);b(5,10,3,7,1,6,4)
  if recipe in ['lantern','lamp']:b(6,9,7,10,6,8,2);b(6,9,9,10,0,8,2)
  if recipe in ['clock','reverseclock','gauge']:b(7,8,4,8,0,1,2);b(7,11,4,5,0,1,2)
  if recipe=='hourglass':g.cut(0,4,4,6,0,8);g.cut(11,15,4,6,0,8)
 elif recipe in ['ruin','gate','hologram','voidgate','fracture','observatory','constellation','harp','web']:
  frame(0,15,0,10,2,6,2,3)
  if recipe in ['harp','web']:p(4,5,2,8,3,4,3)
  if recipe in ['voidgate','fracture']:g.cut(0,4,5,6,0,8);g.cut(11,15,3,4,0,8)
  if recipe in ['observatory','constellation']:star(4);g.cut(6,9,4,6,0,8)
 elif recipe in ['mantle','submarine','blimp','hull','keel']:
  b(0,15,3,7,2,6,2);b(2,13,1,9,1,7,2);b(4,11,0,10,2,6,3)
  if recipe in ['submarine','blimp','keel']:b(5,10,0,2,0,8,4)
 elif recipe in ['drone','scanner','heatsink','road']:
  p(0,5,3,8,2,6,2);b(5,10,4,6,3,5,3)
  if recipe=='heatsink':
   for x in range(1,15,4):b(x,x+1,0,10,0,8,2)
  if recipe=='scanner':p(0,3,8,10,1,7,4)
  if recipe=='road':b(0,15,0,3,0,8,3);b(1,14,3,4,3,5,4)
 elif recipe in ['sail','ribs','hood','mushroom','lotus','umbrella']:
  b(6,9,0,6,3,5,3)
  if recipe in ['mushroom','umbrella','lotus']:disc(6,0);disc(8,0,4)
  else:
   p(0,4,2,10,2,6,2);b(3,12,8,10,3,7,3)
   if recipe=='ribs':p(5,6,2,10,3,5,4)
 elif recipe in ['capsule','saucer','plates','mothership']:
  disc(4,0);b(4,11,7,9,2,6,4);p(2,4,0,3,2,6,3)
  if recipe in ['plates','mothership']:p(0,3,8,10,2,6,3)
 elif recipe in ['wisp','chalk','lid','telescope','spring','roots','shadow','seraph']:
  if recipe=='telescope':b(3,12,2,7,0,8,2);frame(2,13,1,8,0,1,3,2)
  elif recipe=='lid':disc(3,0);b(6,9,6,9,3,5,4)
  elif recipe=='spring':
   for n in range(3):b(2,13,n*4,n*4+1,n%2*3,5+n%2*3,2)
  elif recipe in ['roots','shadow','seraph']:
   for y in [0,4,8]:p(0,5,y,y+2,2,6,2 if y!=4 else 3)
  elif recipe=='chalk':p(3,6,0,9,2,6,4)
  else:b(4,11,0,5,2,7,2);b(6,9,6,10,3,6,4)
 else:raise ValueError('Unsculpted object '+recipe)

def mount_object(g,stage,slot,Grid):
 recipe=RECIPES[stage-1].split()[slot];obj=Grid();object_sculpt(obj,recipe)
 feet={pos:value for pos,value in g.cells.items() if value[1].endswith('_leg')}
 # Remove the old generic extra ears/horns when they compete with the main object.
 if slot not in [1,8] and recipe not in ['scarf','pack']:
  for xyz,(_,part) in list(g.cells.items()):
   if part in ['crown','float'] or (part.endswith('_ear') and stage not in [8,9]):del g.cells[xyz]
 mode=['back','back','shell','held','shell','saddle','tail','back','wings','halo'][slot]
 if mode in ['back','halo']:origin=(4,13 if slot in [0,9] else 11,13);scale=(1,1,1);part='crown'
 elif mode=='shell':origin=(4,7,14);scale=(1,1,1);part='crown'
 elif mode=='held':origin=(0,5,3);scale=(.55,.8,.8);part='left_arm'
 elif mode=='saddle':origin=(4,10,14);scale=(1,1,1);part='crown'
 elif mode=='tail':origin=(4,4,15);scale=(1,1,1);part='tail'
 else:origin=(0,8,12);scale=(.4,1,1);part='left_arm'
 if stage in [12,20] and mode in ['back','halo']:part='float'
 if mode=='held':g.box(3,7,6,8,6,10,1,'left_arm')
 elif mode=='wings':g.box(4,19,8,11,13,16,3,'body')
 elif stage not in [12,20]:g.box(9,14,6,origin[1]+2,12,17,3,part)
 for (x,y,z),(c,_)in obj.cells.items():
  xx,yy,zz=[origin[i]+int(v*scale[i]) for i,v in enumerate([x,y,z])]
  g.box(xx,xx,yy,yy,zz,zz,c,part)
  if mode=='wings':g.box(23-xx,23-xx,yy,yy,zz,zz,c,'right_arm')
 # Carried objects sit beside legs; they must not erase one member of a pair.
 g.cells.update(feet)
 return recipe,mode

def expressive_face(g,slot,stage):
 y,z=g.face;style=(slot+stage)%10
 for xyz,(_,p)in list(g.cells.items()):
  if p=='eyes':del g.cells[xyz]
 # Keep the early catalogue's compact eyes. Pale face masks belong only to
 # owlish/sleepy expressions, never a universal muzzle or cheek treatment.
 if style in [2,5]:g.box(7,16,y-1,y+2,z+1,z+2,6,'head')
 def pair(x0,x1,y0,y1,c,p='eyes'):g.pair(x0,x1,y0,y1,z,z,c,p)
 if style in [0,1,4,6,9]:
  if style==6 and stage in [2,7,12,18]:
   pair(6,8,y,y+2,3);pair(7,8,y+1,y+1,7)
  else:
   pair(7,8,y,y+1,5)
   if style in [0,9]:pair(7,7,y+1,y+1,6)
 elif style in [2,5]:pair(5,8,y+1,y+1,5);pair(5,8,y,y,6)
 elif style in [3,7]:pair(6,8,y+1,y+1,5);pair(5,6,y+2,y+2,3,'head')
 else:pair(7,8,y,y+2,5);pair(7,7,y+2,y+2,6)
 g.box(11,12,y-2,y-2,z,z,5,'head')
 if style in [0,3,9]:g.box(10,10,y-1,y-1,z-1,z,5,'head');g.box(13,13,y-1,y-1,z-1,z,5,'head')
 if style in [2,5]:g.box(10,13,y-2,y-2,z-1,z,3,'head')

def material_colors(stage,slot):
 pal=PALETTES[stage-1];object_color=[0,1,0,1,2,1,2,0,0,0,1,1,0,0,0,0,0,0,2,2][stage-1]
 if stage==1 and slot in [2,3,4,6]:object_color=1
 return [pal[slot%4],pal[object_color],pal[(slot+2)%4],pal[(slot+3)%4],'#253143','#fff1cf',pal[1 if stage in [4,11,19,20] else 2],pal[1] if stage in [7,12,18,20] else '#e89b7c']

def finish_colors(g,stage,slot):
 base=material_colors(stage,slot)
 colors=base[:];cache={};mode=MATERIALS[stage-1][2]
 def shade(color,band):
  key=(color,band)
  if key in cache:return cache[key]
  rgb=tuple(int(base[color-1][i:i+2],16)/255 for i in [1,3,5]);h,l,s=colorsys.rgb_to_hls(*rgb)
  # Hue-shift shadows; sparse bands keep surfaces large and greedy-meshable.
  h=(h+(-.025 if band<0 else .01)*abs(band))%1;l=max(.06,min(.94,l+band*.065));s=max(.1,min(.9,s+(.035 if band<0 else -.018)*abs(band)))
  out='#'+''.join(f'{round(v*255):02x}' for v in colorsys.hls_to_rgb(h,l,s));colors.append(out);cache[key]=len(colors);return cache[key]
 for xyz,(c,p)in list(g.cells.items()):
  if p=='eyes' or c>=5:continue
  x,y,z=xyz
  if mode=='growth':band=(y//6)-1 if p in ['crown','tail','left_arm','right_arm'] else (1 if z<7 else -1 if y<5 else 0)
  elif mode in ['water','abyss']:band=(y//6)-2 if c==1 else (1 if z<10 else 0)
  elif mode=='heat':band=2 if c in [2,4] and abs(x-11.5)<5 else -1 if c==1 else 0
  elif mode in ['strata','fossil','marble','ice']:band=[-2,-1,0,1][min(3,y//6)]
  elif mode in ['circuit','alien','void','cosmos']:band=(2 if c in [2,4] and (z<5 or abs(x-11.5)<4) else -1 if y<8 else 0)
  elif mode in ['paint','paper','brass','steel','rust']:band=1 if z<7 else -1 if z>16 else 0
  elif mode in ['fabric','ceramic']:band=1 if abs(x-11.5)<5 and z<10 else -1 if abs(x-11.5)>7 else 0
  else:band=1 if y>12 and abs(x-11.5)<6 else -1 if y<5 else 0
  # A broad pale belly prevents the head and torso from reading as one solid box.
  if p=='body' and 8<=x<=15 and 5<=y<=10 and z<=9:c=4;band=1
  # Two-voxel contact band at roots of appendages, mirrored exactly.
  if p not in ['body','head'] and y in [6,7] and z in range(12,17):band=-1
  g.cells[xyz]=(shade(c,band),p)
 return colors

def connect_anatomy(g,stage):
 """Thick attachment roots at the nearest anatomical surfaces, before material bands.

  Only explicitly named floating sensory plates/void pieces may stay detached.
  This checks topology, not random decorative additions.
 """
 def adjacent(p):
  x,y,z=p
  return [(x-1,y,z),(x+1,y,z),(x,y-1,z),(x,y+1,z),(x,y,z-1),(x,y,z+1)]
 remaining=set(g.cells);components=[]
 while remaining:
  queue=[remaining.pop()];component=set(queue)
  while queue:
   for q in adjacent(queue.pop()):
    if q in remaining:remaining.remove(q);component.add(q);queue.append(q)
  components.append(component)
 components.sort(key=len,reverse=True);connected=components.pop(0)
 while components:
  target=components.pop(0)
  if stage in [12,20] and all(g.cells[p][1]=='float' for p in target):continue
  if target&connected:connected|=target;continue
  parent={p:None for p in connected};queue=deque(connected);end=None
  while queue and end is None:
   p=queue.popleft()
   for q in adjacent(p):
    if q in parent or any(n<0 or n>23 for n in q):continue
    parent[q]=p
    if q in target:end=q;break
    queue.append(q)
  part=Counter(g.cells[p][1] for p in target).most_common(1)[0][0]
  color=Counter(g.cells[p][0] for p in target).most_common(1)[0][0]
  p=end;anchors=set(connected)
  while p is not None and p not in anchors:
   x,y,z=p
   for yy in [y,min(23,y+1)]:
    for zz in [z,min(23,z+1)]:
     for xx,pp in [(x,part),(23-x,part.replace('left_','right_') if part.startswith('left_') else part.replace('right_','left_'))]:
      g.cells.setdefault((xx,yy,zz),(color,pp));connected.add((xx,yy,zz))
   p=parent[p]
  connected|=target
