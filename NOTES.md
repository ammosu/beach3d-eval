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
