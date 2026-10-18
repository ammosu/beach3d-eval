# Task: game-like explore mode for the beach scene

Read NOTES.md, src/ and assets/props.json first. Add a walkable "explore" mode so colleagues can stroll the beach like a small game and switch prop groups live.

Must not break
- The fixed screenshot views `?cam=wide|beach|closeup` and scripts/shoot.mjs, scripts/shoot-props.mjs must render exactly as before (explore mode is opt-in, e.g. default when no `cam` param, or `?explore=1`).
- Do not change water, sky, sand, lighting, props code or the prop fitting rule in src/props.js. Group B/C GLBs may still be missing or being regenerated; handle missing files gracefully.

Explore mode
- Start screen overlay: title "Beach 3D — AI 場景驗證", short controls help, "點擊開始" → pointer lock.
- Third-person by default (a simple procedural walking character, capsule-ish figure with a walk bob/swing is fine), `V` toggles first-person. WASD/arrows move relative to camera, mouse look, Shift run, Space small jump. Smooth camera follow with collision so the camera doesn't go under the sand.
- Walk on the sand terrain using groundHeight(); can wade into shallow water (slow down, splash ring particles) but cannot go into deep water; invisible bounds around the cove.
- Simple collision against props (cylinder/box from each slot's bounding box after loading).
- Group switcher: keys `1` `2` `3` (A/B/C) and an on-screen segmented control; swaps props in place without reloading the page, keeps player position. HUD corner shows current group label (A｜codex 程序化, B｜Tripo, C｜免費素材庫) and that group's triangle count.
- Points of interest: walking near a prop shows a small label with the slot id + group's source info.
- Ambient: procedural WebAudio wave/wind loop (start after the click), mute toggle `M`.
- Photo mode `P`: hides HUD, freezes player for screenshots.
- Mobile/touch: virtual joystick + drag to look (basic is fine).
- Keep 60fps on a desktop GPU: reuse geometries, no per-frame allocations.

Verification
- Playwright (same Chromium path/flags as scripts/shoot.mjs): script `scripts/shoot-explore.mjs` that enters explore mode (skip pointer lock in automation via a `?auto=1` flag), walks a scripted path, and saves shots/explore/{start,walk1,walk2,group_switch}.png.
- Re-run `node scripts/shoot.mjs A` and confirm shots/A/*.png still match the previous framing.
- Iterate at least 2 rounds on feel/visual issues seen in screenshots.
- Append an "Explore mode" section to NOTES.md (controls, known issues).

Note: a Vite dev server is already running on http://localhost:5191 (hot reload) — use it, do not start another one on that port.
