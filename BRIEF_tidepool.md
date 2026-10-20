# Task: real tide-pool mini-game + move the big sea creatures to the open sea

Read CLAUDE.md, NOTES.md "Game mode", src/game/index.js and src/game/lagoon.js first. User-facing text is Traditional Chinese (Taiwan).

Background: game.html currently has a 6th quest "到潮池放生海洋生物". It walks to a rock pool (`createTidePool` in src/game/lagoon.js, x=-26 near the shore) and opens the Reef Lagoon (`reef/opus/` or `reef/tripo_lagoon/`, a separate three r128 single-file page) in a full-screen iframe to release 7 big animals (sharks, whales, orca, dolphin, turtle, manta). That is ecologically wrong for a tide pool. Split it into two quests:

1. **潮池觀察 (new)**: the rock pool opens a NEW small top-down tide-pool scene with real tide-pool life.
2. **外海放生 (moved)**: the existing Reef Lagoon overlay is opened from the rowboat at the open-sea buoy instead of from the rock pool.

## 1. New tide-pool page: `tidepool.html` + `src/tidepool/*.js`
- Separate Vite entry. Add it to `vite.config.js` `rollupOptions.input`. Use the repo's three (0.185, ES modules). Do NOT import src/main.js; this is its own small scene. Embedded in game.html through the same full-screen iframe overlay as the lagoon. It must also work standalone at `/tidepool.html?group=A|B|C`.
- **Scene**, seen from above at a slight angle (like crouching over a rock pool), about a 3 m × 2 m pool:
  - irregular rock rim (wet dark rocks, barnacles, small algae);
  - shallow clear water with a gentle animated surface (refraction, light caustics on the bottom, soft ripples where you tap);
  - sandy or pebbly bottom with seaweed;
  - warm low sunlight.
  - Polish it, but keep it light: it runs inside the game.
- **Creatures**: 6 species. id → 中文名:
  - hermit_crab 寄居蟹
  - starfish 海星
  - anemone 海葵
  - urchin 海膽
  - octopus 小章魚
  - nudibranch 海蛞蝓
- **Gameplay "翻石頭找生物、記入圖鑑"**:
  - Some creatures are visible: anemone and urchin on the rocks, starfish on the bottom.
  - Others hide under loose stones: hermit crab, octopus, nudibranch. Put about 8 liftable stones in the pool; 3 hide creatures and the rest are empty or show a tiny shrimp or snail.
  - Click or tap a stone to lift and tilt it aside (animated), revealing what is under it.
  - Click or tap a creature to "observe" it: a close-up card shows the Chinese name, a one-line 小知識 (accurate, Taiwan tide-pool flavour) and a check mark in a 圖鑑 strip of 6 slots.
  - Done when all 6 are observed.
  - Idle life: the hermit crab walks, the octopus changes colour and slides to another stone when revealed, the anemone tentacles sway, the urchin spines move slightly, the nudibranch crawls slowly, small fish dart.
  - Gentle sounds via Web Audio are welcome: water drip and a soft chime on observe. Mute follows a `?muted=1` param.
- **Models follow the group** (the experiment compares A/B/C sources):
  - A = procedural, written by you in code.
  - B = Tripo GLB at `assets/tidepool/B/<id>.glb`.
  - C = free-library GLB at `assets/tidepool/C/<id>.glb`.
  - Normalized GLBs: centred on x/z, base at y=0, +y up, longest horizontal extent = 1, "front" toward +x.
  - Scale each species with a real-size table: hermit crab ~6 cm, starfish ~15 cm, anemone ~8 cm, urchin ~8 cm, octopus ~25 cm, nudibranch ~5 cm. The camera framing can exaggerate slightly so all stay visible and tappable.
  - If a GLB is missing or fails to load, use the A procedural version for that species and show it in a small stats line, like the props do.
  - Give GLB creatures simple procedural motion (translate, rotate, squash, sway); they have no rigs.
  - The B/C GLBs are being produced in parallel. Write the loader against the path convention now and test with A; I will drop the files in.
- **Hooks** (keep the same style as the rest of the repo):
  - `window.__TIDEPOOL__ = {found: [...ids], species, stones, group}`, and with `?auto=1` also `lift(i)`, `observe(id)` and `step(seconds)`.
  - `?time=N` freezes animation time.
  - All animation derives from one time value.
  - `window.__READY__` is set when ready.

## 2. game.html changes (src/game/index.js, src/game/lagoon.js)
- Generalise the overlay in lagoon.js so it can host either page: the tide pool, or the Reef Lagoon open-sea page. Keep the top bar with a checklist and the "回到… Esc" button. Keep unloading the iframe on close: two WebGL contexts together broke the beach render in the software-rendered regression. Progress lives in the game state.
- Rock pool (keep `createTidePool` on the beach) → opens `tidepool.html?group=<current group>`. The parent polls `__TIDEPOOL__.found`.
  - Quest: `潮池觀察 <b>0 / 6</b>`.
  - Prompt: `蹲下看看潮池`.
- Open sea: in boat mode, within ~11 m of the island buoy (`island` in index.js), show the prompt `E 往海裡看：放生大型海洋生物`.
  - E opens the existing Reef Lagoon overlay, with the same group mapping as now: A/C → `reef/opus/index.html`, B → `reef/tripo_lagoon/index.html`. Title: `外海：放生 7 種大型海洋生物`.
  - Closing returns to the boat (mode stays `boat`, same position and yaw), NOT to walking.
  - Quest: `在外海放生大型海洋生物 <b>0 / 7</b>`.
  - The existing detection logic (thrown or grabbed creature reaching `state==='entry'`) stays.
  - Reaching the buoy still sets `state.island`. Disembarking still only happens at the dock ring.
- Quest list order: shells, ball, lounger, tower, 潮池觀察, 外海放生, boat round trip. Total 7 quests.
  - Update the welcome card (7 個小任務, time estimate).
  - Update the completion card text (e.g. `8 枚貝殼 · 6 種潮池生物 · 7 種海洋生物`).
  - Update the navigation goal order: in the boat, guide to the buoy and hint E there.
- `state` gets `tidepool` (bool), `observed` (count), `opensea` (bool) and `released` (count). This replaces the current `lagoon` key; update the `__GAME__` targets (`tidepool` point) and API accordingly.

## 3. Verification (must pass, run them)
- `scripts/verify-tidepool.mjs` (new, SwiftShader like the others): for each group A/B/C, load `tidepool.html?auto=1&group=…`, lift every stone, observe all 6, assert done, save screenshots to `shots/tidepool/<group>_{start,lifted,done}.png`, and assert no page errors. Missing B/C GLBs must fall back without errors; filter the 404 console noise like verify-game does.
- Update `scripts/verify-game.mjs`:
  - Rock pool → tide pool iframe, observe 6 → `state.tidepool`.
  - In the boat at the buoy → E → Reef Lagoon, release 7 → `state.opensea`, Esc/back → still in the boat.
  - Then paddle back and finish.
  - The whole existing regression (A/B/C switching, characters, mobile, missing GLBs) must still pass.
- Look at your screenshots, and iterate on the tide-pool look until it reads clearly as a rock pool with recognisable creatures.
- `npm run build` must succeed and include tidepool.html.
- Append a short "Tide pool" section to NOTES.md.

## Must NOT change
- The water look, sand and sky of the beach scene; the prop fit rule; `assets/props.json`; the camera presets.
- The Reef Lagoon files under `reef/`. Embed them as they are.
- Hooks: `__SCENE__`, `__READY__`, `__TIME__`, `?time=`, `__EXPLORE__` and `__GAME__` (extend, don't break).
- Port 5191. A Vite dev server is already running there; reuse it and do not kill it. Do not touch port 8791.
- Do not run git commit.
