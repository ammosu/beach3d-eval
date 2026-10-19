# Task: turn the beach into a small playable game scene (simple interactions)

Read NOTES.md (Explore mode, Hub & compare, Water v2), src/main.js, src/explore.js, src/water.js, src/terrain.js, assets/props.json first.
Build on the existing explore controller (third-person character, WASD, collisions, group switching). New page `game.html` (+ `src/game/*.js`, `src/game.css`); add a「遊戲模式」card/button to the hub (`index.html` / src/hub.js). Default props group B (Tripo), keys 1/2/3 still switch A/B/C.

## Game loop: 「海灘小任務」(~3–5 minutes of play)
Start screen → quest list HUD (top-left, checkboxes) → completion screen with time taken and「再玩一次」.
Quests (each is one simple interaction; an `E` / tap「互動」prompt appears when near):
1. 撿貝殼 ×8: procedural seashells / starfish scattered on sand and in shallow water (deterministic positions, avoid props). Pickup: small hop + sparkle + soft sound; counter in HUD.
2. 踢沙灘球: a beach ball with simple custom physics (gravity, bounce on groundHeight(), rolling friction, floats and bobs on the water surface with the waves, collides with player/props AABBs). Quest: kick it into the sea.
3. 躺椅休息: interact with the umbrella slot → character sits/lies on a lounger, camera eases to a nice view of the sea, short fade; press E to stand up.
4. 爬上救生塔看海: interact with the lifeguard slot → character moves to the platform, camera switches to a high wide view; binocular-style zoom with mouse wheel optional.
5. 划小船到外海小島: interact with the boat slot → player boards the boat, WASD now paddles it on the water (only where water is deep enough, waves move the boat: pitch/roll/heave sampled from the same wave function as the water shader — reuse/expose it from src/water.js in JS). Reach a marker ring near the offshore island, then return to shore and press E to disembark.
6. 留下腳印 (passive bonus): footprints decal trail in dry sand that fades over ~20 s; wet-sand footprints fade faster as the swash reaches them (if easy).

Feedback & feel
- Interaction prompt floating above the target (world-to-screen), highlight outline or soft glow on the interactable.
- Procedural WebAudio SFX (pickup chime, kick thump, splash, paddle) reusing the existing ambience; M mutes.
- Wading/swimming: in water deeper than knee level the character wades slowly with splash rings (existing); deep water still blocked unless in the boat.
- Optional if time allows: day → sunset toggle (`T`) that changes sun direction/colour, sky tint, light and water sun colour consistently.

Rules
- Do not change: prop code, src/props.js fitting rule, assets/props.json, terrain shape, water look (you may export helper functions from src/water.js without changing visuals), existing pages (scene/explore/compare/props/hub) behaviour, scripts/shoot*.mjs output, scripts/record-path.mjs.
- Scene/water animation must stay driven by the water time uniform (window.__TIME__ override must keep working for offline rendering).
- Keep 60 fps on a desktop GPU: pooled objects, no per-frame allocations, instanced shells/footprints.
- Missing GLBs must degrade gracefully (interactions anchored on slot positions/bounding boxes, not on specific meshes).
- Mobile/touch: joystick + an「互動」button.
- Vite server already runs on http://localhost:5191 — use it, do not start another. Your sandbox has no GPU (SwiftShader, ~1.5 s/frame): keep automated runs short; do NOT render long videos.

Verification
- `scripts/verify-game.mjs` with `?auto=1` automation API: complete every quest programmatically (teleport/walk near, press E, kick ball, paddle boat to ring and back), assert quest state, completion screen, no console errors. Save shots/game/{start,shells,ball,lounger,tower,boat,complete,mobile}.png and look at them; iterate at least 2 rounds on visual/feel issues you see.
- Re-run `node scripts/shoot.mjs B` and `node scripts/verify-explore.mjs` to confirm nothing regressed; `npm run build`.
- Append a "Game mode" section to NOTES.md (controls, quests, architecture, known issues).
