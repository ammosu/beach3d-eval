# Tropical cove — shared A/B/C base

Run with Node 22:

```sh
npm ci --cache /tmp/beach-npm-cache
npx vite --port 5191 --strictPort
node scripts/shoot.mjs A
```

Open `http://localhost:5191/?group=A&cam=wide`. Fixed views are `wide`, `beach`, and `closeup`; omit `cam` for mouse/touch OrbitControls. `?time=4` freezes water animation for repeatable comparisons. All screenshot runs use the same time, 1280×720 viewport, specified Chromium executable, and SwiftShader flags.

## Built

- Three.js Water with planar reflections, locally generated repeating normal map, animated fine normals and small geometric swells, sun specular glitter, depth-based turquoise-to-blue absorption, procedural seabed ripples and animated caustics, and broken shoreline foam.
- A shared analytical shoreline controls terrain, wet sand, foam and water depth. Sand has dune relief, a raised berm, filtered wind-ripple normals, and a roughly three-metre dark, low-roughness wet band with an analytical sky-reflection tint. Seeded shells, pebbles and seaweed follow the high-tide debris line. Rocky ridges, dark canopy and a right-hand headland belong to the shared landscape, outside the prop slots.
- Procedural tropical-blue sky with soft cumulus, warm afternoon directional sunlight and hemisphere fill, ACES tone mapping, restrained bloom, atmospheric haze, and shadow support for future props.
- Eight empty `THREE.Group` markers preserve each slot's exact id and position. `src/props.js` exports `loadProps(group)`, `propRoot`, and one empty A function per slot in `slotStubs`.
- B/C use `slot.paths.B` / `slot.paths.C` in `assets/props.json`, load with GLTFLoader, normalize bounding-box height, center X/Z, and place the minimum Y at the analytical ground height. Paths point to `assets/tripo/<id>.glb` and `assets/library/<id>.glb`.
- Vite production builds copy the assets directory, including future GLBs, into `dist/assets`.

## Visual iterations

Four wide-view checkpoints record three screenshot → correction → screenshot cycles. All use the original camera coordinates and frozen time 4.

| Checkpoint | Review and subsequent fixes |
| --- | --- |
| `shots/base_r1.png` | Excessive terrain ridge, beach camera below sand, washed-out water. Capped shoreline curvature, lowered dunes, reduced reflection/light contribution. |
| `shots/base_r2.png` | Broad bloom washed out the coast; uniform foam; regular sand ripples. Reduced bloom and bounded reflected radiance, broke up foam, varied ripples and filtered the normal map. |
| `shots/base_r3.png` | Far terrain boundary visible, water too flat, sand too gray-green. Extended terrain with a nonuniform grid, added small swells and fine wave normals, warmed sand and lighting. |
| `shots/base_r4.png` | Final shared base. Distant boundary removed, turquoise depth gradient readable, warmer sand. |

Final camera images: `shots/A/wide.png`, `shots/A/beach.png`, `shots/A/closeup.png`. Props deliberately remain absent, so the fixed closeup is mostly empty sand until later groups are implemented.

## Shared base polish — round 2

Three additional screenshot → review → fix rounds used the unchanged wide and beach cameras, 1280×720 and frozen time 4. Each checkpoint also has a corresponding `shots/base2_rN_beach.png`.

| Checkpoint | Review and subsequent fixes |
| --- | --- |
| `shots/base2_r1.png` | Added dunes/berm, wet band and tide debris, rolling breakers, blue sky, ridged island and right headland. Ripples were too strong and canopy too spherical/dark; reduced and distance-filtered ripple normals, shrank and increased canopy clusters, broke up foam lines. |
| `shots/base2_r2.png` | Sand relief became subtler and surf readable. Sun glare was excessive, foliage material multiplied its instance colors too dark, and clouds were stretched; bounded glitter, corrected canopy color multiplication and replaced cloud patches with rounded cumulus. |
| `shots/base2_r3.png` | Clouds were oversized and canopy still too coarse. Reduced cloud size, increased smaller canopy clusters, warmed wet sand, increased water-normal frequency for finer mid-distance detail and tightened visible glitter. |
| `shots/A/{wide,beach,closeup}.png` | Final captures after the third correction, regenerated with the original `node scripts/shoot.mjs A`. |

`src/props.js`, `assets/props.json`, cameras and all existing scripts are unchanged. Shared terrain still supplies the loader's analytical ground height. Landscape/debris geometry lives outside `propRoot`; all eight A slots remain empty.

## Verification

- `npm run build` passes. Vite reports a nonblocking bundle-size advisory for the three.js bundle.
- `node scripts/shoot.mjs A` passes for all three cameras with no browser or shader errors.
- `node scripts/verify.mjs` passes: intercepts B/C asset requests with an in-memory offset test mesh, verifies all eight heights, horizontal centers and ground contacts for both groups; also verifies empty A slots, advancing wave time, and mouse-driven OrbitControls. The fixture is never saved into the asset directories.
- Real B/C GLBs were not supplied. Loader failures retain their empty markers and report warnings/results; the screenshot script treats browser resource errors as failure after saving the views, so missing assets cannot silently qualify as a successful group capture.

## Known weaknesses

- Water is an efficient analytical approximation, not a fluid simulation. The visible sandy bottom and caustics are evaluated inside the Water shader rather than through a refractive scene-depth buffer; submerged props will not refract correctly.
- Foam animates along a fixed shoreline; it does not physically advance over the sand. Swells are small, with planar reflection approximations.
- Landforms and canopy are procedural approximations; individual foliage clusters remain discernible. Sand and caustic patterns can reveal repetition at close range. Wet sand uses an analytical sky-colored Fresnel approximation, not a second planar reflection pass.
- Bounding-box grounding uses the slot center's ground height. Very wide future props may need per-asset adjustments to avoid local dune intersections. Animated/compressed GLB extensions have not been tested.
- SwiftShader captures prioritize reproducibility, not real-device frame-rate measurement.

## Group A

All eight slots now contain code-generated three.js models. `src/props.js` dispatches the A builders in `src/props-a.js`, batches geometry by material, and normalizes each model to the exact configured height, horizontal slot center, and analytical ground height. Slot markers retain the exact `pos` values from `assets/props.json`. Seeded geometry, canvas grain/chipped-paint maps, and a procedural basalt shader are the only asset sources: no model files, image assets, remote requests, or CDNs are used by A. B/C loading behavior is unchanged.

The shared `src/main.js`, water, sky, sand, lighting, post-processing, cameras, and slot configuration are unchanged.

| Prop | Approach | Triangles |
| --- | --- | ---: |
| `palm_tall` | Curved, tapered tube trunk with growth rings and crown sheaths; 15 arched fronds made from separate tapered leaflets; seven coconuts. | 17,088 |
| `palm_pair` | Two individually seeded palms with different heights and opposing leans from a shared base. | 30,288 |
| `rocks` | Seven irregular, smoothed basalt meshes, separately grounded; vertex color variation and shader pores; ray-placed open barnacle shells with dark apertures. | 25,340 |
| `boat` | Hollow tapered hull with seven blue strakes per side, separate inner wood surfaces, ribs, floorboards, three thwarts, gunwales, nails, oarlocks, and two stowed wooden oars. | 15,600 |
| `hut` | Short stilts, braces, individual floor/wall planks, doorway, side windows, steps, and seven overlapping courses of irregular palm thatch. | 9,896 |
| `umbrella` | Timber pole and radial ribs under layered straw thatch; two slatted loungers with raised backs, armrests, legs, support struts, and bolts. | 9,788 |
| `driftwood` | Curved irregular bleached trunk, longitudinal grooves, tapered broken branches/root forks, end faces, and splinters. | 7,192 |
| `lifeguard` | Splayed white supports and cross braces, elevated plank deck, railings, ladder, lookout seat, red plank roof, rescue cross, and lifebuoy. | 1,868 |

Total: **117,060 triangles**, counted from the final mesh geometry, excluding the shared scene and inspection floor. Counts are also saved in `shots/A/props/triangles.json`.

### Isolated inspection

With the development server running, open `http://localhost:5191/props.html?solo=boat` (substitute any slot id). This independent viewer uses a neutral grey background/floor, fixed studio lights, and a fixed three-quarter camera. Each model is uniformly scaled so its longest bounding-box dimension is three units; all use the same camera, ground baseline, 38-degree field of view, and 800×800 capture. This exposes the natural aspect-ratio differences rather than stretching narrow props. These studio settings do not affect the beach comparison.

```sh
node scripts/shoot.mjs A
node scripts/shoot-props.mjs
node scripts/props-contact.mjs r4
node scripts/verify.mjs
npm run build
```

Scene captures: `shots/A/{wide,beach,closeup}.png`. Individual renders: `shots/A/props/<slot>.png`. The contact-sheet utility uses local Python/Pillow solely to arrange verification screenshots; its output is never loaded as a scene asset.

### Three correction rounds

| Checkpoint | Review and corrections |
| --- | --- |
| `shots/A/r1.png` | Initial complete set. Lounger backs tilted downward; rocks were excessively faceted; driftwood ends were open; thatch looked like regular wooden pickets. |
| `shots/A/r2.png` | Round 1: corrected lounger back rotation, smoothed/refined rock topology, closed driftwood ends with splinters, widened palm leaflets, lowered protruding hut posts, and replaced broad regular thatch with finer, denser, varied strips. |
| `shots/A/r3.png` | Round 2: tapered and curved the driftwood with forked branches, added basalt pore shading, cut hut windows, added individual tower roof boards and thatch course relief. Batched meshes by material to reduce draw calls. |
| `shots/A/r4.png` | Round 3 plus final grounding review: irregular drooping thatch edges, open barnacle apertures and denser colonies, gentler driftwood branch taper, boat nails/oarlocks, lounger bolts, and a corrected transform reset after batching. Grounded each rock separately before assembling the cluster. Final scene and individual captures were regenerated. |

### Verification and remaining weaknesses

- `node scripts/shoot.mjs A` and `node scripts/shoot-props.mjs` complete without browser or shader errors.
- `node scripts/verify.mjs` now checks populated A slots as well as the B/C fixture loaders: all eight heights, horizontal centers, and ground contacts match within `1e-5`. Live water animation and OrbitControls remain operational.
- `npm run build` passes; Vite retains its nonblocking large-bundle advisory.
- Palm foliage and straw remain thin ribbon approximations, with no wind animation or subsurface scattering. Thatch still has an underlying conical silhouette, and palm crowns can look sparse at distance.
- Wood grain is procedural and repeated; it is not anatomically correct end grain on every face. The boat's strakes are thin surfaces and its underside is simplified. Driftwood forks are still visibly constructed at close inspection.
- Rock pores are shader detail rather than fully modeled cavities; barnacles repeat a small shell profile.
- The unchanged shared shadow map produces fine self-shadow patterns on small lounge slats and foliage. Large props are grounded at the slot's central terrain height, so individual feet can intersect uneven sand. The isolated viewer removes terrain variation but does not conceal those scene limitations.

## Explore mode

Open **http://localhost:5191/?explore=1&group=A** and press **點擊開始**. Explore is explicitly opt-in: a URL without `explore=1` retains OrbitControls; any `cam` parameter takes precedence and retains the original comparison view. The explore module and CSS load only in explore mode. Shared water, sky, terrain, lights, prop generators, fitting rules, and existing screenshot scripts are unchanged.

- WASD / arrows move relative to the camera; mouse looks around; Shift runs; Space jumps. V toggles third/first person. Esc releases pointer lock and pauses; click the start button to resume. While paused, the group buttons remain accessible.
- 1 / 2 / 3 or the segmented buttons switch A｜codex 程序化, B｜Tripo, C｜免費素材庫 in place. The HUD counts actual mesh triangles, excluding the landscape and avatar. Missing files leave empty slots and a visible missing count. Near loaded props, a label identifies the slot and source.
- M or the sound button mutes procedural wave/wind audio, created only after the initial click. P freezes the player and camera and hides the HUD; P again returns. Touch users can tap the lower-right corner to leave photo mode (the exit control is invisible until hovered/focused so captures remain clean).
- Touch devices have a left joystick, right drag-to-look region, jump button, view toggle, group buttons, and photo control.
- Ground contact uses `groundHeight()`. Water deeper than 0.65 m is blocked, shallow wading slows movement and emits pooled splash rings, and the cove is bounded at X −34…35 and Z ≤27. Expanded world-space slot boxes stop the player and shorten the third-person camera boom. Camera height is clamped above sand. A newly switched model that surrounds the player permits movement toward an exit without teleporting the player.

Implementation: `src/explore.js` and `src/explore.css`, with a small opt-in hook in `src/main.js`. Character geometry is shared, ten splash meshes are pooled, camera vectors are reused, collision boxes are built only after loading, and POI text changes only when its target/group changes. Group loads are serialized and up to three groups are cached to prevent repeated GPU allocation on revisits. The existing loader and its fitting rule remain untouched.

### Screenshot / feel iterations

1. `shots/explore/round1/`: initial screenshots showed an oversized character, high camera pitch, and floating-looking feet. Pulled the follow camera farther back, lowered its angle, added shoes and head shadows, and added a small walking bob. Kept paused HUD controls reachable after pointer unlock.
2. `shots/explore/round2/`: reviewed the improved walk views. Smoothed limb return when stopping, shortened source labels, and fixed the group-switch overlap case so a player can exit newly overlapping bounds. Final captures are `shots/explore/{start,walk1,walk2,group_switch}.png`; `mobile.png` checks the portrait touch layout.

### Verification

- `node scripts/shoot-explore.mjs`: same Chromium executable and SwiftShader flags as `shoot.mjs`; uses `?auto=1` to bypass pointer lock after clicking start, steps a reproducible scripted path, saves all four required captures, checks movement, A/B/C switching and retained position, V, photo freeze, deep-water limits, and camera height. The automation API exists only with `auto=1`.
- `node scripts/verify-explore.mjs`: passed jump, boat collision, forced 404s for all eight B assets, rapid C→A switching, hidden photo HUD, and touch joystick movement. Missing-file checks use request interception, leaving actual assets untouched.
- `node scripts/shoot.mjs A`: passed all three views. Pillow RGB image differences against pre-change backups were empty for **wide, beach, and closeup**: pixel-identical, not merely the same framing.
- `npm run build`: passed, with the existing nonblocking three.js chunk-size advisory.

### Known issues

- AABB prop collision is deliberately conservative: palm foliage and open hut/umbrella space can block walking. This is a lightweight exploration controller, not mesh-accurate physics; jumping does not implement traversable prop platforms.
- Group geometry is cached for the page lifetime. Reload to pick up newly generated GLBs or retry previously missing files. The first switch may pause movement while assets decode; cached revisits reuse models. Large supplied GLBs can still be expensive.
- SwiftShader verification cannot establish 60 fps on a physical desktop GPU. The controller avoids per-frame object creation, but actual rendering throughput depends on the unchanged base scene and supplied prop complexity. No real-GPU performance claim is made.
- Character animation and audio are procedural approximations. Sound starts after a user gesture; mobile coverage is browser emulation, not a physical handset test.

## Hub & compare

- **Hub:** `http://localhost:5191/` presents A｜codex 程序化, B｜Tripo AI, and C｜免費素材庫, links to Explore and the solo viewer, and a synchronized comparison entry. Thumbnails come from `shots/<group>/beach.png`; absent thumbnails show「生成中」. `/report/stats.json` contains `{groups:{A:{minutes,cost,triangles,notes},B:{...},C:{...}}}` with null numeric placeholders. Fill these values to publish real statistics; cost may be a currency-qualified string. Nothing is estimated from placeholder data.
- **Scene:** the original scene entry is now `/scene.html`. `?cam=`, `?group=`, `?explore=1`, `?time=`, and automation flags retain their behavior. Legacy root URLs containing `cam`, `group`, or `explore` redirect with the complete query/hash preserved. Screenshot and verification scripts now use the explicit scene entry.
- **Comparison:** `/compare.html?groups=A,B` supports any two groups or all three. A single scene, renderer, camera, water clock, avatar, and Explore controller are shared. Props load serially through the unchanged singleton loader, are cached, and toggle visibility per pane. The existing bloom/output pipeline renders at pane resolution; an offscreen composite presents all scissored panes together to avoid a transient blank pane after resizing. Landscape geometry/materials, lights, water/sky/sand, and postprocessing settings are unchanged. The picker changes groups in place, retaining player position and orientation. Collision bounds combine the selected groups, so all panes follow one movement path. Group labels show the number of missing models as「生成中」. Esc pauses pointer lock so the picker is reachable; touch Explore controls are retained.
- **Solo:** `/props.html?group=A&solo=boat` offers group/prop selectors, OrbitControls, and an actual mesh triangle count (including instance multiplicity). Missing models show「生成中」without throwing. Models retain the existing longest-dimension = 3 units normalization, baseline, 38° FOV, and initial `(4.6,3.3,5.8)` camera aimed at `(0,1.25,0)`. Switching groups disposes previous GPU resources. `scripts/shoot-props.mjs` adds `capture=1` to hide the UI and retain the original 800×800 capture behavior.
- **Build:** Vite now builds all four HTML entries and copies report data and available group thumbnails alongside scene assets.

### Validation and visual review

- `node scripts/verify-ui.mjs` passes: 1440×900 hub/comparison/solo, 390×844 hub viewport without horizontal overflow, synchronized movement, picker changes retaining player location, solo selection, forced GLB 404s in both solo/comparison, and legacy URL redirection. Screenshots: `shots/ui/{hub,compare_AB,compare_ABC,solo}.png` plus full-page `shots/ui/hub_mobile.png`. All five were visually reviewed. The initial three-pane resize capture exposed a blank pane; composing the complete frame before display fixed it.
- `node scripts/shoot.mjs A` passes. RGB image differences against pre-task backups are empty for **wide, beach, and closeup**: pixel-identical framing and rendering.
- `node scripts/shoot-props.mjs A boat` passes; its RGB difference against the original boat capture is also empty.
- `node scripts/verify.mjs` passes. Its outdated exact-height-only assertion was updated to respect the already-existing height/maxLen caps: both bounds must hold and one must be reached. Prop implementations and fitting rules were not changed.
- `npm run build` passes with the existing nonblocking large-chunk advisory.

Comparison caches all three prop groups for fast switching. Missing GLBs are retried on reload. Rendering costs grow with pane count because reflections, shadows, and bloom still run per pane, while base geometry/material allocations remain shared. SwiftShader checks establish rendering correctness, not a measured physical-GPU frame rate. B assets are being generated independently; missing counts and available thumbnails can change as that work completes.

## Water v2

Water and sand shading now live together in `src/water.js`, wired into `src/main.js`. The existing sun/sky, exposure, lights, camera presets, terrain functions/mesh, props/fitting, slots and Explore/compare/hub behavior are unchanged. The only time source is `water.material.uniforms.time`; the sand material references **that exact uniform object**. `?time=` and `window.__TIME__` therefore freeze/seek waves, normals, foam, caustics, swash and drying together. No simulation history, random animation state, texture downloads or wall-clock-driven shader inputs are used.

### Techniques

- Four directional Gerstner components (19, 11.3, 6.7 and 3.8 m wavelengths; offshore amplitudes 0.29, 0.16, 0.085 and 0.045 m) give actual horizontal/vertical displacement and analytical wave normals. Lagoon attenuation and a separate asymmetric shoaling bore produce readable nearshore crests. Troughs are bounded above the existing seabed to prevent disconnected water strips. Distant displacement/detail fades before coarse mesh rows can alias.
- A single coast-following water grid concentrates 35 cm rows in the surf and coarsens offshore. It contains **110,767 vertices / 220,160 triangles**, versus 204,800 triangles previously (+7.5%). The terrain itself is untouched.
- Domain-warped, world-space procedural gradient noise replaces the tiled normal texture. Four scales, with different rotations and advection directions, move independently; fine detail diminishes with viewing distance. There is no repeating normal-map tile.
- Breaking foam follows the same crest phase as the shoaling wave, with irregular caps, cellular-looking lace, small bubbles and a dispersing wake. A fast uprush and slower backwash move a conforming thin water sheet approximately 0–2.7 m onto the beach. Its ragged edge and foam coverage vary spatially. The cycle is about 4.62 s, with alongshore phase offsets.
- Sand keeps its warm hue while wetness lowers albedo/roughness. A stateless inverse-smoothstep calculation of time since retreat leaves a mottled damp mark that gradually dries. Fresnel sheen is strongest in the fresh film; the old uniform gray strip is gone.
- RGB Beer–Lambert absorption, an angle-dependent optical path, refracted procedural bottom coordinates, restrained moving caustics, shallow crest tint, Schlick Fresnel reflection and sun-aligned glitter replace the previous fixed color/reflection blend. Reflections use a bounded projected reflected ray and filtered planar samples; their sky fallback matches the existing sky gradient. The original 512×512 planar reflection pass is retained.

Wave construction was informed by [NVIDIA GPU Gems: Effective Water Simulation from Physical Models](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models). The nearshore visual reference was [Mohamed Sameeh's Maldives surf photograph](https://unsplash.com/photos/waves-of-water-at-beach-8iKpG2BmjOA). Neither reference supplies runtime assets.

### Five image-review rounds

Each round used the existing server at `http://localhost:5191`, `node scripts/record-path.mjs B 2 video/water.json /tmp/water_check`, and `node scripts/shoot.mjs B`. Flythrough contact sheets and all three fixed camera images are retained under `shots/water_v2/round1` through `round5`. Compared against `shots/before_water/` and decoded frames of `video/water_before.mp4`.

| Round | Visual findings and correction |
| --- | --- |
| 1 | Removed the reflection grid and gray sand strip, but the lagoon was too yellow/glassy and reflected whole clouds. Increased shoaling relief, restrained reflected radiance and adjusted absorption. |
| 2 | Surf silhouettes became visible; very shallow troughs exposed a narrow sand gap. Bounded the trough above the seabed, widened lace/wake coverage and softened the swash edge. |
| 3 | Gaps resolved and deterministic sand/water seeking passed. Whole-cloud reflections still read too flat. Added projected reflection-ray lookup and small crest disturbance. |
| 4 | Full ray projection created overly sharp, high-contrast reflection fragments at grazing angles. Limited ray travel/UV offset, blended its strength and widened reflection filtering. |
| 5 | Corrected the shallow-floor normal direction and aligned drying with the exact retreat phase. Reviewed the balanced result at aerial, waterline and shore-parallel angles, plus wide/beach/closeup. Kept visible wave shapes, cyan depth progression, irregular foam, and warm wet sand. |

`shots/water_v2/before_after.jpg` compares the first flythrough frame. `shots/water_v2/compare_ABC.png` records all three comparison panes after settling. One capture immediately following the two-to-three-pane resize caught an unfinished pane; a separate capture after six frames confirmed all three panes render. No UI code was changed.

### Verification and performance

- `npm run build`: passed; existing nonblocking three.js chunk-size advisory remains.
- `node scripts/shoot.mjs B`: all eight real assets loaded in all three fixed views; no browser/shader errors.
- `node scripts/verify.mjs`: A/B/C fitting, centering, ground contact, live water time and OrbitControls passed.
- `node scripts/verify-ui.mjs`: hub, synchronized comparison movement/group switching, solo viewer, missing assets and legacy URLs passed. Stable three-pane rendering was also inspected separately.
- `node scripts/verify-water.mjs`: compares exact PNG bytes after seeking **4 → 6 → 4 seconds**. Both the whole scene and sand-only views change with time and reproduce the original pixels after reverse seeking. It catches browser/shader errors and records rendering counters in `shots/water_v2/verification/results.json`.
- Resource design: one water draw per view, the existing one planar reflection per view, no FFT targets, no depth/refraction buffer, no extra reflection pass for wet sand, and no per-frame CPU mesh updates. The B verification camera recorded **47 draw calls / 2,482,050 triangles** for the complete frame including reflections, shadows and postprocessing. Comparison retains the same shared geometry/materials and renders per pane.
- **Hardware limitation:** this environment exposes neither `/dev/dri` nor NVIDIA devices, and `nvidia-smi` cannot contact a driver. The requested ANGLE `gl-egl` backend fails screenshot capture. `record-path.mjs` now probes it first and explicitly reports a SwiftShader fallback; `RECORD_RENDERER=gpu` requires GPU success and `RECORD_RENDERER=swiftshader` selects software directly. It also fails on shader-console errors and writes a render manifest. These captures validate images/determinism, **not RTX 60 fps**. No physical-GPU performance claim is made.

Final render commands (default output is the recorder's unchanged 960×540 resolution):

```sh
node scripts/record-path.mjs B 30 video/water.json video/frames/water
ffmpeg -y -framerate 30 -i video/frames/water/%05d.jpg -vf scale=in_range=full:out_range=limited -color_range tv -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart video/water.mp4
```

The final `video/water.mp4` is complete: **601 frames, 30 fps, 20.033 s, 960×540, H.264 / yuv420p**, with fast-start metadata. The explicit range conversion preserves the full-range JPEG capture appearance in standard limited-range H.264; the initial exact encoding command inherited JPEG's full-range flag. All 601 source JPEGs and the complete MP4 decode were verified. The software capture took 808.695 s; `shots/water_v2/render-info.json` retains the backend/timing record. Final contact sheet: `shots/water_v2/final_contact.jpg`. Consecutive 30 fps samples at the opening, shore and waterline were visually inspected (`motion_start.jpg`, `motion_shore.jpg`, `motion_waterline.jpg`).

### Remaining limitations

This is an analytical lagoon approximation, not a fluid solver: breakers do not overturn into tubes or throw particle spray, and foam does not collide with individual props. Bottom refraction/caustics are procedural, so submerged models are not refracted through a scene-depth buffer. Reflections remain planar with a bounded ray approximation; steep nearshore waves and grazing views can reveal stretching, and the existing stylized clouds/landforms remain visible in reflections. Wet-sand drying is a deterministic cyclic approximation, not an accumulated physical moisture simulation. The unchanged sand tessellation can reveal minor water-film contact errors at distant/coarse shoreline sections. Real RTX profiling remains outstanding.

## Game mode

Open **http://localhost:5191/game.html** (also linked as **遊戲模式** on the hub). Defaults to **B / Tripo**; `?group=A` or `?group=C` selects another source. Press **開始玩**, finish the five tasks in any order, and return from the boat to see the completion time and **再玩一次**. A normal walk around the beach plus the approximately one-minute boat round trip is designed for a 3–5 minute visit. The automated run teleports between shore activities, so its ~1:21 simulated time is not a human playtime measurement.

### Controls and tasks

- On foot: WASD / arrows, mouse look, Shift to run, Space to jump, **E** to interact. **1 / 2 / 3** switch A/B/C without losing quests. **M** or the sound button mutes the shared ambience and game sounds. Esc releases pointer lock and pauses; **繼續玩** resumes. V/P remain Explore-only so they cannot interrupt game cameras.
- Touch: left joystick moves (or steers the boat), right drag looks around on foot, yellow **互動** button performs the same action as E. Group and sound buttons remain available. The top arrow points toward the next unfinished activity and displays distance.
- **撿貝殼 ×8:** four scalloped shells and four starfish, at deterministic sand/shallow-water locations outside conservative slot envelopes. Gold rings identify collectibles, including submerged ones. Pickup hops, pooled sparkles and a soft chime provide feedback.
- **踢沙灘球:** approach from the landward side and press E to kick away from the character. The striped ball has gravity, bounce, rolling drag, prop AABB and player collision, and buoyancy sampled from the water field. Crossing into water deeper than 0.65 m finishes the task.
- **躺椅休息:** interact beside the umbrella. A game-owned chair beside the source model provides a consistent seat across all three groups. The character sits, the camera eases toward the sea, and a short fade softens the transition. Rest for 1.2 seconds; E stands up.
- **爬上救生塔看海:** interact at the tower approach. A game-owned observation deck at the slot's platform height supports the character even when the model is missing. Stay for 1.2 seconds; E returns to the approach point.
- **划小船到外海小島:** E at the beached boat launches it into sufficiently deep water. W/S paddle forward/backward; A/D steer. Follow the gold buoy near the offshore island `(60, -286)`, then follow the returning arrow to the launch ring. E disembarks only within 11 m of that ring; the quest finishes only after the island visit **and** return/disembark. Shallows, prop bounds, and the existing island footprints block sailing through land. Waves control heave, pitch and roll; paddle sounds reuse the ambience's AudioContext and master gain.
- **留下腳印:** a passive bonus, not a completion prerequisite. Up to 128 instanced sole marks fade over 20 seconds; the shared swash field accelerates washing to about half a second after contact.

### Architecture and boundaries

- `game.html` shares `src/main.js`'s scene, renderer, lighting and postprocessing. The game module loads only on that pathname. It is a fifth Vite build entry. Hub navigation is the only existing page UI addition.
- `src/game/index.js` owns quest state, start/replay/completion, interaction targets, camera modes and rowing. The small optional adapter in `src/explore.js` exposes the existing avatar, inputs, start gesture, shared audio, and a movement/camera override. Ordinary Explore and comparison keep their original defaults.
- `src/game/objects.js` owns instanced shells/starfish, collection rings, 48 pooled sparkle instances, 128 instanced footprint decals, and the beach ball. `physics.js` substeps the ball at at most 1/60 s. Reusable vectors, wave-output records, interaction records and pooled instances avoid allocating geometry or physics objects in the animation loop. Sound nodes are short-lived interaction/paddle events and disconnect when finished.
- `sampleWater(x,z,time,out)` and `swashReach(x,time)` are additive exports from `src/water.js`. They mirror the existing four Gerstner components, attenuation, coastal bore/noise, seabed clamp and shore film; the sampler inverts horizontal displacement and derives the local surface slope. Shader strings, water mesh, shading and material settings are unchanged. Ball/boat queries and visual effects use `water.material.uniforms.time`, and the footprint shader shares that exact uniform object. `?time=` and `window.__TIME__` continue to freeze/seek the water. Game input/physics use nonnegative, bounded differences of that clock rather than a second animation clock.
- Quests anchor to config slots and current bounding boxes. Sailing uses a detached clone sharing the selected source model's geometry/materials, temporarily hiding the beached source instance; disembarking restores it. A cached procedural hull is used when the GLB is unavailable. The chair/deck belong to the game, not the source props. Source models, fitting rules, `assets/props.json`, terrain shape, coast geometry, camera presets and recording/shooting scripts were not edited.
- Only `?auto=1` exposes `window.__GAME__`: read-only state snapshots, target locations, on-foot teleport, view/steering helpers, `interact()`, deterministic `step(seconds)`, and live vessel state. It has no quest-completion setter; automated completion uses the same interaction and physics paths as play.

### Visual and feel review

1. `shots/game/round1/`: reviewed start, collectible, ball, chair and tower views. Fixed a floating seated pose by repositioning thighs/shoes; reframed the tower view to retain the character/deck. The boat test caught a snapshot getter in the automation adapter, which was corrected to return live vessel coordinates.
2. `shots/game/round2/`: completed the full loop, inspected desktop and 390×844 touch screenshots. Corrected collectible rings inheriting a tilted rotation, raised shallow-water markers to the sampled surface, removed offshore disembark prompts, added context-specific rowing instructions, and removed the mobile tap-highlight artifact. Completion now uses the existing wide camera composition. Pausing hides game overlays so they do not obscure the resume screen.
3. Final reviewed captures are `shots/game/{start,shells,ball,lounger,tower,boat,complete,mobile}.png`. `shots/game/results.json` records completion state and verification results.

### Verification and limitations

- `node scripts/verify-game.mjs`: passed all five quests, passive footprints, island-and-back sailing using W input, refusal to disembark offshore, completion/replay, A/B/C keyboard switching, deterministic CPU wave seeking, mobile joystick/pickup and overflow checks, and functional chair/tower/boat interactions with all B GLBs deliberately missing. No page/shader/console errors in normal runs; expected intercepted 404 resource messages are exempted only in the missing-assets case.
- `node scripts/shoot.mjs B` and `node scripts/verify-explore.mjs`: passed. All eight B assets load in all three fixed cameras; RGB comparisons against the pre-task images are **pixel-identical** for wide, beach and closeup. Existing jump, prop collision, missing assets, rapid group switching, photo HUD and mobile movement checks pass.
- A short live-mode check (without `auto=1`) passed real pointer lock, muted pause/resume, and resume-screen visibility; automation APIs are absent. A direct physics check also passed buoyancy/sea entry, stationary-player collision and prop-AABB separation.
- `npm run build`: passes with the pre-existing large three.js bundle advisory.
- Game physics and quest history are stateful: freezing the water clock freezes progression, but seeking it backwards does not undo collected items or reconstruct earlier ball trajectories. Use replay plus deterministic inputs for a fresh game capture.
- Collision remains conservative AABB/envelope collision. Boarding and tower ascent use a short transition rather than a climbing/pathfinding animation. Chair and deck supplements are deliberately simple, with approximate alignment across differently shaped source models. The existing opaque water shader hides submerged shell geometry, so surface rings identify those pickups.
- CPU wave sampling matches the analytic field, while the rendered mesh interpolates that field across vertices; small contact differences are possible at a sharp breaker. This is simple buoyancy, not rigid-body hydrodynamics. The optional sunset toggle and binocular zoom are not implemented.
- SwiftShader verifies functionality and appearance, **not 60 fps on a desktop GPU**. No long video was rendered; all captures use the existing port 5191 server. Physical GPU profiling and physical handset testing remain outstanding.
