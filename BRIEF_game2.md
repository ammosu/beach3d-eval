# Task: game mode polish — camera, real prop interactions, Tripo character

Read NOTES.md "Game mode" and src/game/*, src/explore.js first. Three fixes; review the frames in video/frames/game/ (a 40 s recorded playthrough, 30 fps, see scripts/record-game.mjs) to see the problems.

## 1. Third-person camera crashes into the character's head
Near the shore / ball area (≈ frames 270–420 of video/frames/game/) the follow camera is pulled so close that the head fills the screen. Cause is likely the camera-boom collision against expanded prop AABBs (or the ball / shells) shortening the boom to almost zero.
- Use a proper camera collision: raycast / sphere-cast against actual prop meshes (BVH or coarse per-prop collision meshes), not the conservative AABBs; ignore small pickups, the ball and the player.
- Minimum boom distance (~1.6 m); if the camera would be closer than that, raise it over the head (pitch up) instead; fade the character to semi-transparent when the camera is still very close.
- Smooth boom length changes (fast in, slow out) to avoid popping.

## 2. Interactions must use the actual props, not extra placeholders
- Lounger quest: the character currently sits on a separate white lounger. Remove it; the character must lie on one of the two real loungers of the current group's umbrella prop (B Tripo has two loungers under the umbrella; A has loungers too; C has no loungers → fall back to sitting on the sand/towel under the umbrella). Find a lounger surface from the loaded prop geometry (e.g. raycast down within the umbrella prop's bounding box to find the flat seat height/positions), not hard-coded per group if avoidable; per-group offsets in a small table are acceptable as a fallback.
- Lifeguard tower quest: the character currently stands on an extra white plank beside the tower and appears to float. Remove the plank; place the character on the tower's real platform (raycast down from above the tower centre to find the platform/deck height inside the prop bounds; ensure the character is inside the cabin/deck footprint), with a short climb animation along the ladder side.
- Boat: board into the real boat prop (already OK — keep), check seat height with the same raycast approach.
- Must work for groups A, B, C (switch with 1/2/3) and degrade gracefully if a GLB is missing.

## 3. Characters per group (compare character sources like the props)
The character must follow the active group (keys 1/2/3 switch props AND character; keep position/state):
- **A｜codex 程序化**: you build it in code — a proper procedural humanoid with a SkinnedMesh + Skeleton (not separate capsules): beach outfit (shirt, shorts, sandals, hair), smooth proportions ~1.75 m, and your own procedural animations for idle / walk / run / jump / climb / sit / lie / paddle / kick. Make it as good as you can.
- **B｜Tripo AI**: `assets/character/{idle,walk,run,jump,climb}.glb` — Tripo-generated + Tripo-rigged (biped) GLBs of the same character, one in-place clip each (bone names identical). Load idle.glb as the visible mesh, use the clips from the other files on the same skeleton via AnimationMixer.
- **C｜免費素材庫**: `assets/character_C/character.glb` — Quaternius "Beach Character" (CC0, poly.pizza/m/DojKLcO34E), low-poly with 24 clips including CharacterArmature|Idle, Walk, Run, Kick_Right, Interact, Wave, Roll. Use Kick_Right for the ball kick, Interact for pickups.
Common:
- Crossfade idle ↔ walk ↔ run by speed, jump on Space, climb on the tower ladder (B has a climb clip; A/C pose procedurally).
- Sitting/lying on the lounger and sitting in the boat: pose the skeleton procedurally (hip/knee/spine rotations blended in ~0.4 s) when no clip exists; simple paddling arm motion in the boat.
- Scale each to ~1.75 m, feet on groundHeight(), shadows on; first-person view hides the head.
- HUD shows the current character source and triangle count alongside the props count.
- Missing files → fall back to the A procedural character.
- Keep 60 fps (B is ~20k faces).
- Add a character showcase to the solo viewer (props.html): a「角色」entry per group with animation picker, so the three characters can be compared side by side; and screenshots shots/characters/{A,B,C}_{idle,walk}.png from the same camera (front three-quarter, neutral grey background like shoot-props).

Rules
- Do not change: water look, props code / fitting rule / assets/props.json, terrain, other pages' behaviour, scripts/shoot*.mjs, scripts/record-path.mjs output. Keep the `?auto=1` `window.__GAME__` / `window.__EXPLORE__` APIs backward compatible (scripts/record-game.mjs and scripts/verify-game.mjs use them).
- Animations in game mode must stay driven by the game dt derived from the water time (already the case) so offline frame-by-frame recording works.
- Vite server already runs on http://localhost:5191 — do not start another. No GPU in your sandbox (SwiftShader ~1.5 s/frame) — keep automated runs short, no long video rendering.

Verification
- Extend scripts/verify-game.mjs: lounger/tower/boat positions are on real prop surfaces for groups A, B and C (character within the prop bounding box, feet within ~10 cm of the found surface), camera never closer than the minimum to the head during the whole scripted run, for each group the character loads with idle/walk/run working (B ≥4 clips, C ≥ 20 clips). Keep all existing checks passing.
- Screenshots shots/game/round3/*.png (lounger, tower, boat, walking near ball, for B; plus lounger/tower for A and C); look at them and iterate at least 2 rounds.
- `node scripts/verify-explore.mjs`, `node scripts/shoot.mjs B`, `npm run build`.
- Update the "Game mode" section of NOTES.md.
