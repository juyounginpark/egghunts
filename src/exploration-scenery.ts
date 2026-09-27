/** Twenty scenery types per biome. No traps, floor panels or interact gates. */
export const SCENERY_KINDS=[
 'tree fern flower mushroom stump log clover sprout hive well windmill house cart fence arch barrel lantern bird acorn rock',
 'castle gift station spring duck horse fence dice rings crayons plane drum maze balloon toy chest clock house wheel flag',
 'coral spiral starweed seaweed sponge jelly ship anchor chest hat jar shelter crystal shell pearl fossil rock clam anemone lantern',
 'furnace anvil coal chimney bellows bucket pot tools crystal rock cart chain statue barrel lantern hammer tongs ore bell pillar',
 'gate locker clock door board desk shelf books chalk hoop cabinet piano bed bell frame lamp chair bin globe coat',
 'tower monitor station booth charger antenna cable vending stall locker bin fan pillar cabinet dish battery lamp cart drone sign',
 'pyramid sphinx pillar obelisk palm jar tent hourglass rock fossil wheel camel gate board coffin torch chest pot banner well',
 'root fern shell vine mushroom crystal fossil waterfall sprout tooth nest tree flower pool cave log stump rock fruit bone',
 'gate totem fence pine lantern stall jar rope tent well knot statue pillar mortar pool gazebo cloth bell pot drum',
 'temple pillar statue arch torch fountain jar wings bell drum tree shield obelisk column amphora chariot banner harp scroll wreath',
 'ufo tank dish antenna statue tentacle mushroom eye orb desk pillar monitor locker capsule crystal lamp specimen console cable rings',
 'tower airship pipe gear boiler windmill gauge chimney station balloon pulley telescope suitcase coil bird teapot chest barrel clock tools',
 'cave rock icicle pillar pine flower igloo tent sled seal lantern fountain cliff crystal fossil cairn fir camp chest snowball',
 'castle cup book clock door lamp sofa spoon key chair tent fence umbrella teapot house pillow gift balloon toy starweed',
 'greenhouse station bus pipe barrel fence lamp fan vending tire mushroom gate toy mask tank flower bin sprout cable cabinet',
 'mushroom acorn flower bowl cave hive arch cocoon pollen shell umbrella cart fern sprout leafbud seed snail stump lantern pebble',
 'arch robot claw piston battery gear wheel barrel hand cable tower crane chest basin beam monitor tools coil tank cart',
 'dome telescope orbit planets board crystal globe pillar bench fountain lantern cabinet ship window starweed comet dish antenna moonrock satellite',
 'gate pillar rock hole chain crystal statue throne hourglass lantern tree mirror rings orb arch ruin obelisk mask shard vessel',
 'tree gate fence flower hand chair gazebo fruit jar sprout crystal butterfly pool arch seed fountain vine pot bird wreath',
] as const;

// Uneven clearings and alternating sides break up the old repeated prop rows.
export const SCENERY_CLEARINGS=[
 [.13,.31,.56,.76],[.16,.37,.61,.80],[.12,.35,.59,.78],[.18,.34,.58,.79],
 [.14,.32,.62,.81],[.17,.39,.60,.78],[.12,.30,.55,.77],[.15,.36,.59,.80],
 [.18,.33,.57,.79],[.13,.35,.60,.81],[.16,.38,.58,.79],[.12,.31,.56,.78],
 [.14,.37,.62,.81],[.18,.34,.57,.78],[.13,.32,.59,.80],[.16,.36,.61,.79],
 [.12,.33,.55,.80],[.17,.38,.60,.82],[.14,.31,.58,.79],[.12,.35,.60,.81],
];
export const NATURAL_SCENERY=new Set(['tree','fern','pine','palm','flower','mushroom','stump','log','clover','sprout','rock','coral','seaweed','crystal','shell','root','vine','fossil','icicle','starweed','leafbud','pebble','shard','moonrock','fir']);
