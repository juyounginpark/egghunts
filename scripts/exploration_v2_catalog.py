"""Compile the supplied design rows into compact, explicit runtime recipes."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=json.loads((ROOT/'docs/art/exploration-v2-catalog.json').read_text(encoding='utf8'))
recipes=[
'tree leaf bridge log fence well windmill house hay stump flower mushroom sprout hive clover mud cart arch nest trace',
'castle bridge gift balls station rail rug spring duck horse fence dice puzzle rings crayons plane drum slide maze cushion',
'coral shell spiral starweed seaweed vent sponge anemone jelly bridge ship anchor chest hat jar shelter coral crystal steps nest',
'furnace lava anvil bridge coal chimney bellows bucket pot tools crystal rock steps crystal cart chain vent gate statue nest',
'gate locker floor clock door board desk shelf books chalk bridge mat hoop locker cabinet piano bed bell frame nest',
'arch monitor station bridge crossing station booth charger antenna cable vending stall locker bin fan pillar cabinet dish tower chest',
'pyramid sphinx pillar obelisk dune palm jar tent hourglass steps rock fossil wheel jar camel gate board coffin torch nest',
'fern root bridge footprint shell vine mushroom crystal fossil waterfall leaf cliff sprout tooth nest tree flower pool cave nest',
'totem gate bridge fence pine lantern stall jar rope tent well knot statue pillar mortar pool gazebo lantern cloth nest',
'temple bridge pillar statue arch gate steps bolt torch fountain mosaic jar wings bell pillar drum tree cloud shield nest',
'ufo floor tank bridge gate dish antenna statue tentacle mushroom eye orb desk pillar monitor ufo locker capsule mosaic nest',
'tower airship bridge pipe net gear boiler windmill gauge chimney station balloon pulley telescope suitcase coil bird teapot chest nest',
'arch rock icicle ice bridge snowball snowball pillar pine flower igloo tent sled seal cliff lantern fountain cliff crystal nest',
'cup book bridge pillow rug clock door lamp steps sofa spoon key chair tent fence pillow umbrella teapot house nest',
'dome station bus bridge pipe barrel fence lamp fan vending tire mushroom gate greenhouse asphalt toy mask tank flower nest',
'mushroom leaf root acorn bridge flower petal bowl cave hive arch cocoon net pollen shell shell umbrella steps cart nest',
'arch robot bridge crusher claw piston battery gear wheel barrel hand cable tower ramp crane chest basin beam monitor nest',
'dome telescope crater meteor orbit planets board helipad sand crystal globe pillar bench fountain lantern floor cabinet ship window nest',
'pillar bridge floor gate rock hole chain crystal curtain floor statue steps throne hourglass lantern tree mirror rings orb nest',
'tree bridge leaf gate fence fountain flower seed hand chair gazebo fruit jar sprout crystal butterfly floor pool arch nest',
]
roles={'구조':'structure','장식':'decor','표식':'mark','트롤':'troll','보행':'walk','착지':'landing','알자리':'nest','위험':'hazard','개방':'gate'}
objects=[]
for i,row in enumerate(source['objects']):
 stage=i//20+1;slot=i%20;kind=recipes[stage-1].split()[slot]
 motion=row['motion'];mode='static'
 if any(w in motion for w in ['흔들','기울','움직','흐르','펄럭','떠오','오르내','반짝','밝기','광택','숨을','부풀','회전','돌아','돌며']):mode='sway'
 if any(w in motion for w in ['회전','돌아','돌며']):mode='spin'
 if any(w in motion for w in ['떠오','오르내','기포','입자']):mode='float'
 if '완전 고정' in motion or roles[row['role']]=='hazard':mode='static'
 objects.append([row['id'],row['name'],kind,roles[row['role']],mode])
forms='sprout bug soldier block crab squid bug flame ghost book robot drone crab sand lizard vine goblin jar soldier bird jelly eye gear kettle snow crab pillow cup bug liquid ant bug dog turret rock star dog eye seed moth'.split()
enemies=[]
for i,row in enumerate(source['enemies']):
 text=row['attack'];timings=re.findall(r'(\d+(?:\.\d+)?)초',text)
 warning=float(timings[0]);recovery=float(re.findall(r'회복 (\d+(?:\.\d+)?)초',text)[0])
 ranged='1발' in text or '2발' in text
 kind='projectile' if ranged else 'dash' if any(w in text for w in ['돌진','구르기','도약']) else 'cone' if any(w in text for w in ['부채꼴','휘두','분사','파동','방전','증기']) else 'melee'
 active=2.4 if ranged else float(timings[1])
 hp=int(re.search(r'HP (\d+)A_s',row['stats'])[1]);damage=int(re.search(r'(\d+)%H_s',row['stats'])[1])
 enemies.append(dict(id=row['id'],name=row['name'],stage=i//2+1,form=forms[i],kind=kind,warning=warning,active=active,recovery=recovery,hits=hp,damage=damage,shots=2 if '2발' in text else 1))
out='// Generated from the v2 source catalog by scripts/exploration_v2_catalog.py.\n'
out+='export const EXPLORATION_OBJECTS='+json.dumps(objects,ensure_ascii=False,separators=(',',':'))+' as const;\n'
out+='export const MOB_TYPES='+json.dumps(enemies,ensure_ascii=False,separators=(',',':'))+' as const;\n'
(ROOT/'src/exploration-catalog.ts').write_text(out,encoding='utf8')
