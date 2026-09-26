"""Author the permanent weekly S pet (320); existing model IDs are untouched."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'public' / 'models'
parts = {}

def part(name, pivot, parent=None):
    cells = {}
    parts[name] = {'pivot': pivot, 'parent': parent, 'voxels': cells}
    return cells

def box(cells, x, y, z, w, h, d, color):
    for a in range(x, x+w):
        for b in range(y, y+h):
            for c in range(z, z+d):
                cells[a,b,c] = color

body = part('body', [12,7,12])
box(body,6,3,7,12,11,10,1)
box(body,8,5,16,8,7,1,2)
for x in [5,15]: box(body,x,1,9,4,3,7,3)
head = part('head', [12,14,12], 'body')
box(head,4,12,6,16,11,13,1)
box(head,6,13,18,12,7,1,2)
for x in [7,15]:
    box(head,x,17,19,2,3,1,5)
    box(head,x,19,20,1,1,1,2)
box(head,11,15,19,2,1,1,5)
for name,x in [('left_ear',4),('right_ear',16)]:
    ear=part(name,[x+2,22,11],'head')
    box(ear,x,22,9,4,7,4,1);box(ear,x+1,23,12,2,4,1,4)
tail=part('tail',[12,7,7],'body')
for i in range(5):box(tail,10+i,7+i,4-i,3,3,3,3)
# Ribbon wings and seven golden beads connect pet and event egg visually.
box(body,9,12,17,6,2,2,4)
box(body,6,11,17,3,4,2,4);box(body,15,11,17,3,4,2,4)
for i in range(7):box(head,6+i*2,22+(i%2),18,1,1,1,3)
colors=['#e5cf93','#fff7dc','#e5a74e','#9d87df','#304444']
voxels=[]
for value in parts.values():
    value['voxels']=[[*xyz,c] for xyz,c in value['voxels'].items()]
    voxels.extend(value['voxels'])
model={'colors':colors,'size':[24,32,24],'pivot':[12,0,12],'unit':24,'parts':parts,'voxels':voxels,'previewAngle':32,'artMaterial':'matte'}
(root/'pet-320.json').write_text(json.dumps(model,separators=(',',':')),encoding='utf-8')
(root/'pet-320.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><g stroke="#6b613f" stroke-width="2" stroke-linejoin="round"><path fill="#e5a74e" d="M64 67L79 56L85 40L78 32L73 49L59 58Z"/><path fill="#e5cf93" d="M27 48H67V84H27Z"/><path fill="#e5cf93" d="M19 27V7H31L38 27H59L66 7H78V57H19Z"/><path fill="#fff7dc" stroke="none" d="M24 39H72V53H24Z"/><path fill="#9d87df" d="M35 63L21 56V73L35 68H57L73 73V56L57 63Z"/><path fill="#e5a74e" d="M45 55L48 61L55 62L50 67L51 74L45 71L39 74L40 67L35 62L42 61Z"/><path fill="#e5a74e" d="M25 81H40V88H25ZM57 81H72V88H57Z"/><g fill="#304444" stroke="none"><path d="M30 34H36V42H30ZM60 34H66V42H60ZM45 43H51V46H45Z"/></g><g fill="#fff7dc" stroke="none"><path d="M30 34H32V36H30ZM60 34H62V36H60Z"/></g><g fill="#e5a74e" stroke="none"><path d="M26 23H30V27H26ZM33 20H37V24H33ZM40 23H44V27H40ZM47 20H51V24H47ZM54 23H58V27H54ZM61 20H65V24H61ZM68 23H72V27H68Z"/></g></g></svg>''',encoding='utf-8')
