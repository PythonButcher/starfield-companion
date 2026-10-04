"""Stable sector illustration. Coordinates never represent game distances."""
import hashlib
import math

ANCHORS = {'Sol': (0, 0), 'Alpha Centauri': (115, 75), 'Cheyenne': (-300, -220),
           'Volii': (-260, 230), 'Kryx': (330, -240), 'Narion': (70, -260),
           'Porrima': (310, 230), 'Olympus': (-60, 320), 'Bessel': (-390, 30)}


def sector_layout(systems):
    positions = dict(ANCHORS)
    # Content hashes avoid alphabetical rows and keep placement reproducible.
    for system in sorted(systems, key=lambda s: s['name']):
        name = system['name']
        if name not in positions:
            for attempt in range(10000):
                digest = hashlib.sha256(f'{name}:{attempt}'.encode()).digest()
                angle = int.from_bytes(digest[:4], 'big') / 2**32 * math.tau
                radius = 380 + int.from_bytes(digest[4:8], 'big') / 2**32 * 660
                point = (round(math.cos(angle) * radius), round(math.sin(angle) * radius * .8))
                if all(math.dist(point, other) >= 90 for other in positions.values()):
                    positions[name] = point
                    break
            else:
                raise ValueError(f'Cannot place {name} without overlapping a system.')
        system.update(x=positions[name][0], y=positions[name][1], layout_only=True)
        if name == 'Narion':
            system['faction'] = 'Freestar Collective'
    return systems
