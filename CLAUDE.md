# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

An experiment comparing how well AI builds a three.js tropical beach scene. One shared base scene (water, sky, sand, light) with 8 prop slots, where only the prop source varies:

- **A**: procedural props written by codex.
- **B**: Tripo AI GLBs, decimated in Blender.
  - Exception: since 2026-10-20 the lifeguard tower is a Tripo image-to-model build (`tools/tripo_image_tower.py`) from a Codex reference image (`assets/raw/lifeguard_ladder/`) that adds a ladder and a railing opening. The text-prompt tower had no ladder. Blind scores and REPORT figures predate this swap.
- **C**: free library models (Poly Haven, Sketchfab, Poly Pizza).

On top of that there are an explore mode, a synced split-view compare page, a game mode, three characters (A/B/C), blind scoring, and comparison videos and slides.

Read these first:

- `PLAYBOOK.md`: the reusable process, commands and pitfalls.
- `NOTES.md`: per-feature implementation notes, written by codex.
- `REPORT.md` and `心得.md`: results.

User-facing docs are in Traditional Chinese (Taiwan); keep that.

Sibling worktrees `../beach3d-codex2` (port 5193) and `../beach3d-opus` (port 5192) hold the same pipeline re-run by other models (branches `codex2-run`, `opus-run`). They share only `assets/props.json` and the recorder hooks below.

## Commands

```sh
npx vite --port 5191 --strictPort      # dev server (npm run dev); many scripts assume 5191
npm run build                          # 6 entries: index, scene, compare, props, game, tidepool → dist/ (copies assets/, report/)
node scripts/shoot.mjs <A|B|C>         # fixed-camera stills → shots/<g>/{wide,beach,closeup}.png (SwiftShader)
node scripts/shoot-props.mjs <g> [slot]   # solo prop renders → shots/<g>/props/
node scripts/verify-game.mjs           # full game regression (quests, tide pool, open sea, boat, A/B/C, mobile, missing GLBs)
node scripts/verify-tidepool.mjs       # tide-pool page A/B/C: lift stones, observe 6, mobile → shots/tidepool/
node scripts/verify-explore.mjs        # explore-mode regression
node scripts/probe-clip.mjs [actions] [groups]   # clipping audit: rest,tower,boat,shell,ball × A/B/C (SNAP=1 stills → shots/clip/, DETAIL=1 surfaces)
```

Media pipeline:

- `node scripts/record-path.mjs <g> [fps] [path.json] [outdir]`: frame-by-frame GPU render along a camera path. Uses `SCENE_URL` and `SETTLE_MS` to point at other ports.
- `scripts/record-game.mjs` and `scripts/record-walk.mjs <g>`: game and character recordings.
- `node scripts/record-tidepool.mjs <g> [fps]` → `video/frames/tidepool_<g>/`, then `python3 tools/make_tidepool.py` → `video/tidepool_abc.mp4` (A/B/C side by side, same action timeline).
- `node scripts/record-game-tidepool.mjs [g]` → `video/game_tidepool.mp4` (walk to the pool in the game, observe all 6, return).
- `node scripts/record-game-opensea.mjs <g>` → `video/frames/opensea_<g>/`, `video/game_opensea_<g>.mp4` and `video/opensea_<g>.json` (observation times). Same boat and camera path for every group: row to 10 m from the buoy, turn once in place, press E when a prompt shows (at least 2.5 s apart). `DRY=1` only simulates. Then `python3 tools/make_opensea.py` → `video/opensea_abc.mp4`. The slides use re-encoded copies (crf 27) in `slides/assets/`.
- Compositing: `python3 tools/make_video.py`, `tools/make_zoom.py`, `tools/compare_models.py`.

Assets and stats:

- `.venv/bin/python tools/tripo_gen.py --dry-run|<slots>|--recover <task> <slot>`: Tripo generation. Spends credits, so ask the user first.
- `tools/decimate_all.sh`: Blender headless decimation to 30k tris.
- `tools/build_stats.py` → `report/stats.json`; `tools/compare.py` → `compare/*.png`.

Blind scoring:

- `tools/blind_score.py`; set `BLIND_CONFIG` to compare other dirs.
- `tools/blind_props.py`; `tools/judge_opus.py` runs Opus as a second judge.

Slides:

- `tools/build_live.sh` packages the three versions into `slides/live/`.
- `cd slides && python3 start.py` serves the slides and live demos (`live/`) on port 8730.

Delegation to other models:

- `tools/codex_run.sh <group> <step> <BRIEF.md>`: runs codex exec on a brief, timed via `tools/timed.sh` into `timing.csv`.
- Opus runs use `tools/claude_run.sh` in the opus worktree.

There is no lint or unit-test setup. Verification means running the Playwright scripts and looking at the screenshots.

## Architecture

- **One scene module, many pages.** `src/main.js` builds the renderer, sky, sand, water (`src/water.js`), coast details and the prop root for every page. It switches behaviour by URL and pathname:
  - `?cam=` gives a fixed view.
  - `?explore=1` lazy-loads `src/explore.js`.
  - `compare.html` adds `src/compare.js`, which uses one renderer with scissor viewports and toggles props per pane.
  - `game.html` adds `src/game/*`.
  - `props.html` runs `src/props-solo.js`, a separate solo viewer.
  - `tidepool.html` runs `src/tidepool/`, its own small scene that does not import `src/main.js`.
  - `index.html` is the hub (`src/hub.js`, reads `report/stats.json`).
- **Props.** `assets/props.json` is the single source of slots: `pos`, `height`, optional `maxLen`, `prompt`, and `paths.B/C` GLB paths. `src/props.js` `loadProps(group)` places either A's procedural builders (`src/props-a.js`) or GLBs.
  - `?swapB=<slot>:<glb path>` swaps one B prop for a trial, without touching `props.json` (same fit rule).
  - The fit rule is shared by all groups: `scale = min(height/size.y, maxLen/max(size.x,size.z))`. Don't change it per group, or the comparison stops being fair.
  - Grounding (since 2026-10-21, all groups): after the box bottom is put on the sand under the slot, `settle()` shifts the prop so the median gap of its lowest 6 cm of vertices to the sand is zero (on the slope the seaward side used to float up to ~15 cm). `node scripts/probe-ground.mjs [groups]` prints min/median/max gaps per prop.
- **Terrain and water are analytic and stateless.**
  - `src/terrain.js` `shore(x)` and `groundHeight(x,z)` are used by JS, by the shaders (`shoreGLSL`), by explore and game collision, and by the recorders.
  - `src/water.js` also exports CPU mirrors `sampleWater()` and `swashReach()`, which drive game buoyancy and footprints.
  - Shading-only wave detail (since 2026-10-21, same for all groups; blind scores and REPORT predate it): `swellState()` in the water fragment shader re-evaluates the four Gerstner waves per pixel (the offshore mesh is too coarse), for light through the swell (green-blue, most when backlit) and whitecaps where the crest is squeezed tightest (Jacobian), in patches, with foam left behind for a moment. The game's rowboat feeds `wakeRings` (24 stern points: x, z, time, speed; `WAKE_RINGS`): each spreads a ring of small ripples at a third of the boat's speed, which together keep the Kelvin wake's V; shading only, the surface does not move, so the CPU mirrors are unchanged.
  - Shallow water is see-through (since 2026-10-22, all groups): the water material is transparent with premultiplied alpha; up to about 1.6 m deep it writes only its own light (tint, caustics, reflection, foam) and lets the real sand and whatever stands in it (legs, the ball, a hull) through, tinted, 85% at most. Deeper it is opaque as before, except over the open-sea animals, which show through by the water's thickness in front of them (see Open sea below).
  - Wading (`src/explore.js`, game and explore alike): while the walker stands in water, the feet in turn feed `wadeRings` (10 points: x, z, time, strength; `WADE_RINGS`): short ripples (about 35 cm) running out at walking pace and a broken foam ring, gone within a couple of seconds; shading only. They replaced flat white ring meshes fixed at y 0.09.
  - All animation must derive from one time value so offline rendering is deterministic.
- **Determinism and automation hooks.** These are what the recorders and verifiers use; keep them working.
  - `window.__SCENE__` (`{scene, camera, renderer, water, …}`) and `window.__READY__`.
  - `window.__TIME__`: when set, it overrides the water/sand clock.
  - `?time=N`: freezes time.
  - With `?auto=1` only: `window.__EXPLORE__` and `window.__GAME__` (including deterministic `step(seconds)`, `teleport`, `view`, `interact`).
  - In game mode, game/explore dt is derived from the water clock, so a frozen clock freezes play. `__GAME__.step()` records the time it advanced to (`water.userData.simTime`), and the frame loop only simulates past it; before 2026-10-21 a recorder that stepped and then waited for a frame advanced play twice per step (game recordings ran at double speed).
- **Characters.** `src/game/character.js` serves both the game and the solo viewer.
  - A: procedural SkinnedMesh.
  - B: Tripo `assets/character/{idle,walk,run,jump,climb}.glb`, with clips merged onto one skeleton. Since 2026-10-20 the rig is Tripo v3.0 `spec=unity` (67 joints, three-joint fingers). It was re-rigged from the original model task with `tools/tripo_rig_test.py` and `tools/tripo_retarget_v3.py`; credits are in `assets/tripo/log.csv`. The old 41-joint rig had no fingers.
  - C: Quaternius `assets/character_C/character.glb`.
  - Missing clip poses (sit, lie, paddle, climb) are procedural bone aiming.
  - Gotcha: an `update(0)` call must not `restore()` bones. three.js `PropertyMixer` skips writing unchanged values, so the rest pose would stay on screen in offline recordings.
  - Walk/run playback is time-scaled to measured clip stride so feet don't slide.
  - IK layer (`solve()` in `character.js`, all three rigs): analytic two-bone IK for hands/feet with world targets and per-limb weights, pelvis drop for crouches, terrain-following feet (`ground`), spine lean/twist, head look-at, wrist aim (`handAim`) and finger curl (`curl`). The game passes targets per mode from `poseIK()` in `src/game/index.js`; `info().ik` reports reach errors.
  - Grip (`curl`): rigs with finger bones (B) bend each finger joint about an axis built in bind space (T pose, palms down). A rig without fingers instead gets a knuckle bone and a thumb bone per hand at load, re-skinned in bind space from vertices wholly on the hand. Wrist aim puts the roll on the forearm; a wrist that rolls far tears the skin. The Tripo climb clip is a chest-to-wall climb: at load its hips are pinned at the standing position and its hips-to-head rotations at the bind pose (values overwritten in place, since the actions already exist), so the game's body placement and `spine.lean` set the torso. On a leaning ladder `climbPose` keeps the hips about 42 cm off the ladder plane (nearly over the feet, as on steep stairs) and 25 cm below the rung line, so both knees bend. Above the top rung the hands take the handrails: `ladder.handrails` (own ladders) lists, per side, the nearest upright beside the centre line (the ladder's rails, then the posts of the railing opening), found by sideways probes; the mantle grips those posts at about waist height on the deck.
  - Launch: E at the beached boat swaps in the clone exactly where and how the prop lies (`boat.restYaw`); holding W pushes it from the stern (hands on the stern top found by scanning the centre line, lean eased where it rides high), first swinging it round on the spot if it faces up the beach, then down to the water past the umbrella and driftwood (hull corners against the prop boxes). It rests on the sand (keel on the ground) or floats, whichever is higher. Where its middle is deep enough to row (ground < -0.75 m) the rower climbs in over the stern (`boardPose()`, 3.2 s, a function of the time since it began; keys in vessel space): steps up to the stern and takes its top in both hands, pushes up with the chest folded over it (hips at the top), brings one knee then the other over (each foot on a Bézier through a point 26 cm above the top) onto what is inside (`boat.deck`: floor or thwart along the centre line, probed at hull setup), crouches with the hands on the gunwales (`boat.deck[].gun`: the side found by a ray from outside, hits over 0.9 m off the centre line skipped for C's oars), steps forward over the thwart and lowers onto it facing the bow while the hands go to the paddle. The weight presses the stern down 5° and settles the hull 2 cm. At 2.9 s the hips are on the seat and the seated pose takes over with `character.update({snapPose:true})` (body offset not blended, so no jump); `character.hipHeight` is exposed for this. With `?auto=1`, `__GAME__.boardInfo()` returns the stern, deck profile and current targets. Holding S pulls it back (0.9 m/s, walking backwards: a negative `speed` to `character.update()` runs the gait phase the other way), A / D swinging it, so a hull run into a lounger can be backed off; `verify-game` checks it. E during the push skips to the old start at the dock (the paddle, hidden while pushing, is shown again; `verify-game` checks it). With `?auto=1` it is off unless `__GAME__.pushBoat=true` (probes and recorders board directly); `__GAME__.launch` reports it. `verify-game` covers it (shot `push.png`).
  - Splashes (`src/game/splash.js`): a blade crossing the water line (in or out) and, under way, both sides of the bow emit a splash event; drops and a speckled foam ring are a pure function of the time since the event. Paddle length and roll come from the hull: at the bottom of the stroke the blade is 16 cm under the water and 45 cm clear of the side (a blade dipped beside the hull read as spray from the boat). While a blade is in the water it leaves small swirls every 0.08 s. Drops are camera-facing quads stretched along their velocity (a streak, not a bead), leaving from across the blade's width; bigger splashes add a dim mist puff; a blade just out of the water drips for 0.8 s (drip events: three falling drops and a small ring where they land). Quad winding: the side vector must be `(dir.y,-dir.x)` or the quads are back-face culled. Splash heights use `surfaceHeight()`.
  - Wake and hull foam (`src/game/wake.js`): the stern is sampled every 0.15 s while under way; the wake is a foam ribbon over those samples that widens at about the Kelvin angle (capped at 1.2 m/s), breaks up and fades over 5.5 s, and is hidden over sand. Both it and the hull foam line count as in the water only where the swash reaches (`wet()`: `z-shore(x)<swashReach(x,t)` and 10 cm deep), since the water mesh runs on over the dry beach; a boat pushed over the sand used to wear its foam line there. A foam line hugs the hull at the water line (outline probed inward at local y 0 when the hull is set up), wider at the bow under way. Foam texture is fixed to the water (v along distance travelled, the ring in world space). Everything is a function of the samples and the time, so recordings stay deterministic. `surfaceHeight()` caches the displaced grid corners per time, so the hundreds of calls per frame stay under about 0.5 ms.
  - Boat: one stroke phase drives a double-bladed paddle, both hands (overhand grip), torso twist and thrust pulses. The hull is turned so its long axis runs along travel; the rower sits on a thwart near midships, feet braced on the floor.
  - Shells: walk up, face, squat (pelvis down, feet planted), reach; the shell counts when the hand closes on it and rides in the hand.
  - Ball (since 2026-10-22): a shot, not a clip. E walks the player to 0.78 m behind the ball with the right foot in line, then IK plays `kickIK()` as a function of the time since the wind-up: the foot drawn back and up with the knee bent and the upper body leaning forward (0.3 s), the swing to the ball's lower back (the ball leaves at contact, `KICK_HIT` 0.42 s), a follow-through forward and up, back down by 0.95 s; the arms swing against the leg. With `?auto=1`, `__GAME__.kick` reports it. `explore.setHold()` blocks movement input without driving the camera.
  - Tower: `findLadder()` probes a BVH copy of the tower, in this order. The climb is a function of time, so E plays it backward to climb down.
    1. Stairs (C): tread tops rising along one direction. The climber walks the centre line; foot IK finds the treads, ignoring the handrail.
    2. The tower's own ladder (A): evenly spaced thin hits that line up. Rung heights and lean are measured, so hands and feet land on real rungs.
    3. Otherwise (B): the widest railing opening with standing room, or a railed stretch to climb over (found with vertical probes). The game draws a ladder there.
    Mantling over a railing ducks under a low roof.
  - C's shin end bone does not follow its clips. An `ankle-mark` helper on each shin tracks the animated `Foot.*` bone and serves as the leg IK effector.
  - Walk and run blend between 2.9 and 4.3 m/s on one shared stride phase, aligned at foot plants. The body's speed itself changes at a limited rate (`src/explore.js`, game and explore alike): about 0.3 s to start or stop walking, ~0.8 s from a walk up to a run or back down (a few shortening strides), ~1 s to stop from a run; with no input the last direction carries it to a stop; setHold/setDriven/clearInput stop it at once. The blend follows that speed closely (pace damping 10), and the game leans the upper body into the change (`e.accel`, ±0.1 rad via `spine.lean`). `verify-game` waits 0.9 s for the run.
  - `node scripts/probe-ik.mjs <boat|shell|tower|walk> [groups]` saves close-up stills to `shots/ik/` and logs IK errors.
- **Tide pool and open sea (game quests 5 and 6).**
  - Rock pool on the beach (`createTidePool()` in `src/game/lagoon.js`, shared by all groups; since 2026-10-22 built like the tide-pool page: its `rockGeometry()` and grain, wet/algae below a level water sheet, the seaward rocks taller to hold it on the slope) → `tidepool.html?group=<g>&embedded=1` (`src/tidepool/`) in a full-screen iframe overlay (`src/game/lagoon.js`). Gameplay: lift stones, observe 6 intertidal species. The parent polls `__TIDEPOOL__.found`.
  - Open sea (since 2026-10-20 in the beach scene, no overlay): 7 animals live around the island buoy from the start (`src/game/sea.js`), looping round it and surfacing in view of the rowboat. The quest is to observe them: from the boat, E observes the nearest unobserved animal within 30 m that is on screen with its model top at least 15 cm out of the water (`pose().showing`; the top is measured per group's model, so fin cruisers always qualify and the rest while surfacing or leaping). All 7 take about 20–35 s of waiting at the buoy. Behaviour is mostly at the surface: dorsal fins, backs rolling out with spouts, leaps and breaches, a turtle's shell. Under the water they show faintly (since 2026-10-22, all groups): `sea.js` wraps the water's `onBeforeRender` to draw the animals alone (depth-material twins carrying the swim bend) into a depth texture from the same camera; where one lies behind the water and nearer than the seabed, the water shader (`seeDepth`, off on other pages) lets it through by the water's thickness in front of it (absorption plus a fade, gone by about 3 m; weaker at grazing angles). Observing still needs the top 15 cm out. Splashes scale with the animal (since 2026-10-22, all groups; size `heft` = length/4, a humpback 2.75, a dolphin 0.65): drops (streaks, the rowboat splashes' `dropMaterial()`; a tall column for a breach), soft mist puffs over the big ones, a blow as a column of mist rising from the blowhole (a third of the body ahead of the middle) with fine drops, and `seaRings` (`SEA_RINGS` 10: x, z, time, size) in the water shader: a packet of rings running out faster and longer the bigger the splash, foam on the leading crest and a patch of white water where it went in (shading only). A back breaking the surface to breathe makes a smaller ring (`wash`). `sea.swell(x,z,t)` is the same rings as a few centimetres of lift, added to the four hull samples, so a breach nearby rocks the boat. Interactions (`seaContact()` in `src/game/index.js`): a splash or tail slap within 1.5 + 3·size m showers the boat (drops on the hull; a toast for the big ones); rowing hard (over 3 m/s) within 4 m plus a third of its length of an animal near the surface startles it: a tail slap and a dive of about a body length, back up after about 6 s (`startledAt`, 10 s cooldown; `diveDepth()`). `record-game-opensea` (DRY) still observes all 7 in A/B/C. The drop cap used to be the last frame's count, so after one frame without drops no splash showed drops again (fixed). Motion is a pure function of the water clock (`SEA` table: length, rest depth, events per cycle); paths bend around the boat. Hooks: `__GAME__.sea` (`ready`, `creatures`, `seen`, `observe(i)`, `pose(i,t)`); game state `spotted`. `node scripts/probe-sea.mjs [groups] [gpu]` → `shots/sea/`.
  - Models: A procedural (`src/game/sea-a.js`, the reef/opus lofted bodies with vertex colours), B `assets/sea/B/<id>.glb` (the Reef Lagoon's Tripo models), C `assets/sea/C/<id>.glb` (Sketchfab CC BY, `CREDITS.md`). All normalised to length 1, head +x, back +y; `SEA[i].length` sets the size for every group. A missing GLB falls back to A.
  - The old Reef Lagoon pages (`reef/opus/`, `reef/tripo_lagoon/`, `reef/codex/`) are no longer linked from the game, copied into `dist/` or `slides/live/`, or listed as slide demos (since 2026-10-20); the sources are kept unedited, and the slides still show their stills and videos.
  - The iframe is unloaded (`about:blank`) on close: two WebGL contexts blanked the beach under SwiftShader. While the overlay is open, `game.suspended` skips the beach render.
  - Tide-pool hooks: `__TIDEPOOL__` (`found`, `done`, `species`, `stones`, `group`; with `?auto=1` also `lift(i)`, `observe(id)`, `step(s)`, `project`), `__READY__`, `?time=`, `?muted=1`, `?found=`. `step(0)` freezes the iframe clock for recording.
  - Creature models follow the group: A procedural (`src/tidepool/creatures.js`), B `assets/tidepool/B/<id>.glb` (Tripo), C `assets/tidepool/C/<id>.glb` (Sketchfab/Poly Pizza, CC BY, credits in `CREDITS.md`). A missing GLB falls back to A per species.
  - GLBs are normalized with `reef/tripo/prep.py <in> <out> <preview> [tris] [rot] base`: head +X, base at y=0, longest horizontal extent 1. `species.js` `display` sets the on-screen size, shared by all groups.
- **Clipping (interactions).** `__GAME__.penetration()` (auto only) counts skinned avatar vertices (and the paddle) inside nearby props: behind the nearest face over all of a prop's meshes, with the far side of a solid, facing the other way, within 30 cm (so sitting inside a single-skin hull is not a hit); plus vertices below the sand. Up to about 3 cm is contact (a hand round a rung, thighs on a thwart).
  - Lounger: `findSurface` returns `lie {point, recline}` from the lounger's height profile (slat gaps ignored): hips just in front of the backrest bend, on a slat; `character.update({recline})` tips the body back to the backrest slope with the legs level on the seat.
  - Boat: the hull frame ignores parts sticking out (C's model includes its oars): the longest run of columns reaching near the bottom sets the centre line when it is off the box centre. The feet stand on the measured inner floor plus `character.ankleHeight`.
  - On the ground the soles keep the clip's world orientation through leg IK, so a squat does not dig the toes into the sand.
- **Islands and vegetation** (`src/coast.js` `hill()`, `src/vegetation.js`, shared by all groups; since 2026-10-21, blind scores and REPORT predate it). Reworked the same day against Codex concept art (`~/explainer-videos/beach3d-eval/island-concept/`).
  - Shape: a rounded hill, gentle at the water and rising to an off-centre summit (no cliff skirt). Bare rock is a broken band just above the water line plus the steepest faces; sand at the water; green-brown forest floor.
  - Vegetation: about 3000 small broadleaf crowns per island packed into a canopy (lumpy clumps, darker underneath, a world-space leaf-cluster pattern fading out past ~110 m, sunlit yellow-green to olive), a few emergent trees, coconut palms (shore palms leaning downhill, taller ones on the slopes standing out of the canopy), shrubs, leafy ground plants (broad-leaf rosettes and strap-leaf fans, a fringe along the forest edge spilling onto the sand and some under the canopy), and boulders along the water line (dark green weed round the foot, moss patches on top, some greener all over). Fixed seeds; instanced meshes shared by both islands (15 meshes, about 2M triangles).
  - `haze()` (exported from `vegetation.js`): island materials fade towards the fog colour past ~80 m, much more than the scene's thin fog, so the far island reads as far.
  - The terrain grid and the old blob trees used to draw from the coast's shared seed; `hill()` still draws the same numbers over the old shape, so the tide debris on the beach is unchanged (checksum of its instance matrices).
  - The sky adds about 20 small cumulus low around the horizon to the four big clouds.
  - Walking to the headland: the walk area runs along the beach to x 100, so the near island's forest edge can be reached. `coast.js` exports `islandHeight()`, `landHeight()` (beach or island, whichever is higher; used by the explore and game cameras) and `shoreClear(x,z)` (false where the island rises over 15 cm out of the sand). The headland's plants, shrubs, rocks and trunks block by their real shapes: `src/explore.js` rasterises the vegetation instances a walker on the beach can reach (inside the walk area, rooted at most 1.5 m above the sand) into the same 0.2 m cells as the props, once. Nothing grows where the island's edge runs under the beach sand, or outside its outline (boulders there used to be buried under the sand yet block walkers, or float out at sea). `verify-game` walks to it (shot `headland.png`).
- **Shadows.** The sun is low (about 22°). The shadow camera's depth range is set to the scene (near 5, far 200) with bias -.00005 and normalBias .03, map 4096: the old default range made bias -.0004 about 20 cm, so shadows started ~0.5 m from prop bases and props looked afloat.
- **Game boat in the water.** The clone floats with a draft (keel a quarter of the hull height, 12–25 cm, under the water line; height and tilt fit the water at bow, stern and both sides, since near the shore a hull levelled at its centre had water 15 cm over its inside). The heights come from `surfaceHeight()` in `src/water.js`, the water as drawn: offshore the water mesh rows are 10–16 m apart, so the flat triangles stray 20–30 cm from the exact field (`sampleWater`), and every ten seconds or so a crest covered the whole inside of a hull that followed the exact field. A depth-only cap over the hull's inside (20 cm above the water line, `renderOrder` 1, water 2) keeps the opaque water plane from showing inside the hull; the water stays at least 8 cm under it along the whole route. The hull's long axis comes from the vertex spread (C's oars skewed the box) and the narrower end is the bow (B and C ran transom first before); the rower takes a thwart clear of the floor in the aft half, so the legs have room before the bow narrows. Its materials are double-sided (C's single-skin hull showed the sea from inside).
- **Lite render on phones** (`src/lite.js`, since 2026-10-22): touch-only devices (`pointer: coarse` and no fine pointer) get pixel ratio 1, no MSAA, a 2048 shadow map, no bloom, and the islands' trees left out of the shadow map (about 6.4M → 4.3M triangles a frame, half the pixels). `?lite=1` / `?lite=0` force it. The tide-pool page takes the pixel ratio only. Desktop, stills and recordings are unchanged.
- **Bloom guard.** `src/main.js` runs a pass before bloom that turns NaN/Inf pixels to black and caps values at 1e4; otherwise one bad pixel (seen near A's palm_pair in game mode) spreads over the whole frame and the verifier sees an "empty" frame. Normal pixels are unchanged (A stills match to 1 level).
- **Collision.** The game camera uses BVH (`three-mesh-bvh`) copies of the real prop triangles. The player (`src/explore.js`) is blocked by prop geometry 0.12–1.85 m above the sand, rasterised into 0.2 m cells (body radius 0.26). Palms block only with their trunks (since 2026-10-22, all groups): `trunkOnly()` traces each trunk down from the top height band (centre follows a lean, cells within 0.3 m of it count), so the leafy plants round B's tall palm and C's pair no longer wall the walker off; those leaves (and any palm geometry below 2 m off the trunk) bend away from the walker in a vertex shader (`brushable()`, `brush` attribute, uniform at the player). Ball, boat and camera-probe collision still use the whole-prop AABBs in `colliders`.
- **Game camera and feedback** (since 2026-10-22; project skills `camera-systems` and `game-feel` in `.claude/skills/`, from awesome-gamedev-agent-skills, Apache-2.0).
  - `src/game/camera.js`: the orbit centre leads the walker in the direction of travel (0.2 s of travel, at most 0.9 m: about 0.35 m walking, 0.9 m running), eased over about 0.3 s. A jump of over 3 m between frames (a teleport, a cut between modes) is a hard cut: no lead, the camera goes straight to its spot.
  - Landing from a jump (over 0.15 s in the air): sand kicked up (`objects.puff()`: 14 grains thrown out and falling back, a soft dust sprite; a pure function of the time since it) or, where the swash reaches, a splash; the hips dip about 9 cm within 0.07 s and ease back (`poseIK()` pelvis). A kick throws sand from in front of the foot towards the ball, and the ball squashes for 0.4 s. A count going up or a quest ticking off pops in the quest book (CSS, off with reduced motion). With `?auto=1`, `__GAME__.feel` reports `landedAt`, `landSize`, `kickedAt`.
  - Gotcha: the water mesh (and `surfaceHeight()`) runs up over the dry beach, where the shader discards it beyond the swash front. To ask "is there water here", check `z-shore(x)<swashReach(x,t)` first.
- **Gait and footprints.** Walking downhill stays ground-snapped (`airborne` means a real jump). While moving, locomotion wins over one-shot poses. B/C clips are time-scaled to the measured clip speed (cap 5×). A's procedural gait matches its swing amplitude to speed. Footprints are stamped where a foot really comes down (`src/game/index.js`, since 2026-10-22): it has stopped moving across the sand (0.08 s under 0.3 m/s) near the rig's lowest foot height, and must lift (8 cm higher or over 0.8 m/s) before it prints again; a foot shuffling under 15 cm does not print twice. So stops and settling steps print under the feet. (The old code read a `character.plants` flag that never existed and printed every 0.55 m beside the body's centre.)

## Conventions and gotchas

- Headless GPU screenshots of the tide pool occasionally capture a frame without the water layer; re-rendering the same time fixes it. The tide-pool recorders shoot each frame until two screenshots match. Also scan finished frames for single-frame spikes.
- Blender MCP library toggles (Sketchfab, Poly Pizza) are per scene: a new temp scene starts with them off.
- Headless Chromium path: `~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`.
  - GPU: `--use-gl=angle --use-angle=gl-egl` (≈0.17 s/frame).
  - SwiftShader: `--use-angle=swiftshader --enable-unsafe-swiftshader` (≈1.6 s/frame), used for stills and verification.
- Codex runs stop the Vite dev server when they exit. Restart it before recording.
- When writing briefs for codex, state the "must not change" list explicitly: water look, fit rule, `props.json`, camera presets, the hooks above, and port 5191.
- Before a long video render, preview at 0.5–2 fps and look at a contact sheet. This catches cameras clipping through props and black frames.
- Comparisons must stay fair:
  - Same camera path, same time, same framing.
  - Blind scoring anonymizes and rotates order.
  - Framing differences between sources bias scores; normalize them (`tools/blind_props.py` `fit()`).
- `.env` (Tripo key) is gitignored. `assets/raw/`, trial GLBs (`*__*.glb`), `video/*.mp4` and `video/frames/` are not committed.
- Commit messages are in Chinese.
- Paths are relative so the build works under a sub-path (GitHub Pages `ammosu.github.io/beach3d-eval/`): Vite `base:'./'`, page links without a leading `/`, and runtime asset URLs through `asset()` in `src/url.js` (it strips the leading `/` of `props.json` paths, which must not change). The build's asset copy skips `assets/raw/` and trial `*__*.glb`.
- Publishing: `.github/workflows/pages.yml` deploys `slides/` (slides at the root, `live/{main,codex2,opus}/` from `tools/build_live.sh`, which builds with `--base ./` and rewrites the sibling versions' hard-coded `/assets/` in their bundles) on every push to `master` that touches `slides/`. CI does not rebuild: run `tools/build_live.sh` and commit `slides/live/`. `slides/start.py` now serves only port 8730.
- Credits: group C's third-party models (mostly CC BY) are credited in the page by a 「素材出處」 button (`src/credits.js`, same data as the `CREDITS.md` files; keep them in step), shown only where C is on screen: hub C card, explore/game HUD and start/pause panel (pointer lock leaves no cursor while playing), the C compare pane, props viewer, tide pool. A and B (paid Tripo API) need none.
