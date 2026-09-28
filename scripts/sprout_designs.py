"""Two connected seed silhouettes, authored for the existing 24-cell stage rig."""
def sculpt_sprout(g, first=False):
    g.cells.clear()
    g.parts = {
        'body': {'pivot': [11.5, 5, 11], 'parent': None},
        'head': {'pivot': [11.5, 8, 11], 'parent': 'body'},
        'eyes': {'pivot': [11.5, 11, 6], 'parent': 'head'},
        'crown': {'pivot': [11.5, 14, 11], 'parent': 'head'},
        'left_leg': {'pivot': [8, 3, 11], 'parent': 'body'},
        'right_leg': {'pivot': [15, 3, 11], 'parent': 'body'},
    }
    if not first:
        # A squat bean; the face follows its surface instead of a separate cuboid.
        g.orb(11.5, 8, 11, 6.8, 6.3, 5, 1, 'body')
        for pos, (color, part) in list(g.cells.items()):
            if pos[1] >= 8:
                g.cells[pos] = (color, 'head')
        g.solid(8, 15, 5, 8, 6, 8, 4, 'head')
        g.pair(7, 9, 0, 3, 8, 12, 3, 'left_leg')
        g.curve([(11.5, 13, 11), (11.5, 16, 11), (11.5, 18, 11)], 1.3, 2, 'crown', False)
        for sign in [-1, 1]:
            g.curve([(11.5, 17, 11), (11.5+sign*3, 19, 11), (11.5+sign*6, 21, 11)], 1.5, 2, 'crown', False)
            for distance, y, radius in [(3, 19, 2.5), (5, 20, 3), (7, 21, 2)]:
                g.orb(11.5+sign*distance, y, 11, radius, 1.7, 2.2, 2 if distance==3 else 1, 'crown')
        colors=['#aad16f','#4b884c','#9a744f','#e9edbd','#28382e','#d5e790']
        eye_y=10
    else:
        # Tall ivory seed held by two visible husk halves, with long jade cotyledons.
        g.orb(11.5, 8, 12, 6.5, 6, 4.5, 3, 'body')
        g.orb(11.5, 11, 10.5, 5.4, 6.4, 4.5, 1, 'head')
        g.pair(5, 7, 5, 9, 9, 15, 3, 'body')
        g.pair(6, 8, 3, 6, 8, 13, 4, 'body')
        g.pair(8, 9, 0, 3, 9, 12, 2, 'left_leg')
        g.curve([(11.5, 15, 11), (11.5, 18, 11), (11.5, 20, 11)], 1.25, 2, 'crown', False)
        for sign in [-1, 1]:
            g.curve([(11.5, 18, 11), (11.5+sign*4, 20, 12), (11.5+sign*8, 18, 13)], 1.6, 2, 'crown', False)
            for distance, y, radius in [(3, 20, 2.8), (6, 19, 2.7), (9, 17, 1.6)]:
                g.orb(11.5+sign*distance, y, 12, radius, 1.5, 2.3, 2 if distance==9 else 6, 'crown')
        g.orb(11.5, 22, 11, 1.6, 1.5, 1.5, 4, 'crown')
        colors=['#eee8cc','#447b66','#847558','#cdb777','#2d3937','#91c6a0']
        eye_y=11
    # Pixel eyes are placed on occupied face voxels, never suspended in front.
    for x in [8, 15]:
        for y in [eye_y, eye_y+1]:
            z=min(pos[2] for pos in g.cells if pos[0]==x and pos[1]==y)
            g.box(x, x, y, y, z, z, 5, 'eyes')
    for x in [11, 12]:
        y=eye_y-2
        z=min(pos[2] for pos in g.cells if pos[0]==x and pos[1]==y)
        g.box(x,x,y,y,z,z,5,'head')
    g.face=(eye_y,6)
    return colors
