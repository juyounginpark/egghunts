# Pastel voxel diorama lighting — 2026-09-26

## Implemented

Continuous day, golden hour, sunset and cool night presentation, warm existing windows/lamps, character readability, directional face shading, contact grounding and distance fog. Gameplay timing, movement, damage, catalog IDs, saves, existing obstacle/selection outlines and DOM HUD are unchanged.

The previous renderer changed light/fog colors abruptly at mechanical night and eased intensity afterwards. It had no advance sunset warning, no dedicated contact blobs, and village structures did not cast shadows. Existing batching, ACES exposure 1, orthographic camera and single directional shadow map were retained.

## Files Changed

- `src/environment-visual.ts`: presets, clock mapping, lighting/fog, 14 instanced emissive surfaces, contact shadows.
- `src/diorama-material.ts`: shared native Lambert shader extension.
- `src/world.ts`: controller integration and soft directional shadows.
- `src/voxel.ts`, `src/region-art.ts`: shared materials and character-only readability.
- `src/unvisited-fog.ts`: existing discovery fog follows the environment palette.
- `src/qa.ts`: development preview controls and authoritative-time testing hooks.
- `scripts/qa/diorama.mjs`: opt-in phase, clock, low-quality and release-login smoke checks.

## Visual System Architecture

`GameState.now/nightAt/nightUntil → cycleClock → EnvironmentVisualController → lights, fog, shared shader values, emissive, contacts`.

Scene-scoped shader values keep separate pet viewers from inheriting the world's night state. Native Three.js lighting/shadow/fog chunks remain in use; materials and voxel geometry are shared. No scene traversal or new material creation occurs in the environment's per-frame update. DOM UI receives no world grading.

## Day/Night Mapping

| Day progress | Presentation |
| --- | --- |
| 0–55% | Cream sunlight, pastel ambient |
| 55–75% | Gradual golden-hour warmth |
| 75–92% | Warm light, cool shadow/ambient contrast |
| 92–100% | Cool night transition and lamp activation |
| Mechanical night | Night preset immediately, including initialization |

Smoothstep interpolation maps directly from authoritative remaining time. There is no visual countdown accumulator. With the existing 285-second day, 10 and 3 seconds remaining correspond to 96.49% and 98.95%. The first eight seconds after night use the same clock to return smoothly through the palette to daytime. Hatchery presentation uses day lighting. Online clients continue using their existing synchronized gameplay clocks; no new replication fields were added.

Development preview: `/?qa=true&environment=1`. Open **Environment preview** for phase buttons, frozen visual slider, Live and AO/fog/rim/emissive/shadow toggles. Preview affects visuals only, so screenshot countdowns intentionally stay fixed. Actual clock synchronization is tested separately. Controls are absent from production.

## Shader Changes

Soft half-Lambert bands, ±5% surface-orientation bias, up to 20% low-wall contact darkening, restrained saturation and character-only rim/ambient fill. Native fragment normals preserve voxel faces; instanced transforms participate in orientation and height calculations. Character support includes the player's hat and guardians, not buildings.

AO is an inexpensive approximation, not SSAO: near-ground side darkening plus a shared 32×32 radial texture for player, peers, guardians and village-building contacts. The player's contact shrinks/fades with height. Existing lamps/windows gain emissive material response without point lights or bloom. A 1024² PCFSoft directional map remains the only shadow map; low quality disables it and retains contact blobs. No post-processing passes were added.

## Performance Considerations

Headless Edge / SwiftShader, portrait 390×844, 60 frame samples per phase:

| Comparable daytime scene | Before | After |
| --- | --- | --- |
| Village draws / triangles | 38 / 64,924 | 41 / 65,114 |
| Region 1 draws / triangles | 46 / 102,618 | 49 / 102,802 |
| Village frame median / P95 | 175.8 / 187.8 ms | 181.8 / 230.4 ms |
| Region 1 frame median / P95 | 175.8 / 187.9 ms | 181.8 / 212.1 ms |

Draw/triangle budgets pass in these scenes. Program count stays 22 in village and 20 in region across all four phases. Village GPU resource counters change from 47 geometries / 3 textures to 49 / 4. These counters are not memory byte measurements. No extra real-time light was added. Preview-night measurements retain the same camera; old mechanical-night region measurements teleported home and are not comparable.

Aggregate production JS gzip: baseline HEAD 311,747 bytes (304.4 KiB), rework approximately 314,130 bytes (306.8 KiB), +2.3 KiB. **The 300 KiB budget remains exceeded**, including before this change. Separate baseline compilation used original HEAD sources without editing the working tree. Initial authenticated gameplay transfer, GPU fragment time, isolated shadow GPU cost and physical-device thermals were not measured. Software-renderer variance and slower P95 mean mobile performance acceptance is still open; these numbers are not phone FPS.

## Validation Performed

- `npm run build`: TypeScript and production build pass.
- Targeted ESLint on the new controller, material and QA script: pass.
- `node scripts/qa/diorama.mjs`: eight same-camera captures (village and region × four phases); no game or shader console errors; draw/triangle limits pass.
- Authoritative clock tests at .55/.75/.92/.99/1 match environment progress. Night begins immediately and HUD reads `00:15`.
- Low quality, all effect toggles off and hatchery daylight checks pass.
- `node scripts/qa/diorama.mjs --production`: login shell/reload and exclusion of QA hooks/debug panel pass. The initial attempt expected immediate gameplay and timed out because release builds require login. Authenticated production rendering was **not** tested.
- Screenshots inspected for daytime continuity, sunset color separation, night player/guardian visibility and warm lamps. Existing missing `favicon.ico` was identified in baseline; only that exact console resource path is excluded from the dedicated smoke test.

Generated local evidence: `artifacts/screenshots/diorama/`, `artifacts/test-results/diorama-{before,after,production,bundle}.json`. These artifact directories are git-ignored; visual baselines were not replaced. Run the script manually to regenerate them.

## Remaining Limitations

Physical Android/iOS/Toss WebView, authenticated release play, multiplayer visual drift and long thermal soak remain untested. No claim of zero mobile regression or guaranteed shader-stutter absence is made. WebGL2 is still required by Three.js r180; low quality is a lighter supported renderer, not a WebGL1 fallback. No unsupported-shader fault injection was performed. AO does not simulate arbitrary wall-corner occlusion, and emissive lights do not illuminate nearby objects physically. Existing red gameplay obstacle borders remain visible. Aggregate JS budget reduction remains separate outstanding work.
