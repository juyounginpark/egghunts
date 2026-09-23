"""Round woven nest on the project's 20-cube prop grid."""
import math

def nest_design():
    cells={}
    for x in range(20):
        for z in range(20):
            r=math.hypot(x-9.5,z-9.5)
            if r<6.8:cells[x,0,z]='lining' if (x+z)%3 else 'straw'
            for y,inner,outer in [(0,5.8,8.3),(1,5.8,8.8),(2,6.3,9.1),(3,6.9,9.3),(4,7.4,8.9)]:
                if inner<=r<=outer:
                    cells[x,y,z]=['bark','twig','straw'][(x+z+y)%3]
    # Short overlapping tangential twigs soften the rim and break the perfect ring.
    for j in range(22):
        angle=j*math.tau/22;radius=8.2+(j%3)*.18
        for t in range(-2,3):
            x=round(9.5+math.cos(angle)*radius-math.sin(angle)*t)
            z=round(9.5+math.sin(angle)*radius+math.cos(angle)*t)
            if 0<=x<20 and 0<=z<20:cells[x,3+j%3,z]='straw' if j%3 else 'twig'
    return {'size':[20]*3,'palette':{'bark':'#705037','twig':'#98704a','straw':'#cfab6b','lining':'#b98c52'},'voxels':[[*p,c] for p,c in cells.items()]}

if __name__=='__main__':
    import json
    import os
    import sys
    from pathlib import Path
    sys.dont_write_bytecode=True
    root=Path(__file__).resolve().parents[1]
    sys.path.insert(0,os.environ.get('AIVOXEL_PATH',str(Path.home()/'OneDrive/Desktop/AIvoxel')))
    from voxel import build,export_vox
    design=nest_design();size,colors,grid=build(design)
    out=root/'public/models'
    (out/'nest.design.json').write_text(json.dumps(design,separators=(',',':')),encoding='utf-8')
    (out/'nest.json').write_text(json.dumps({'size':size,'colors':colors,'voxels':[[*p,c] for p,c in grid.items()],'parts':{},'pivot':[9.5,-.5,9.5]},separators=(',',':')),encoding='utf-8')
    (out/'nest.vox').write_bytes(export_vox(size,colors,grid))
    manifest=json.loads((out/'manifest.json').read_text(encoding='utf-8'))
    for entry in manifest['models']:
        if entry['name']=='nest':entry.update(paletteCount=len(colors),voxelCount=len(grid),bounds=[[min(p[a] for p in grid),max(p[a] for p in grid)] for a in range(3)])
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print('Authored round woven nest')
