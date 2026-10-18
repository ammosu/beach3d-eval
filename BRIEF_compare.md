# Task: comparison hub + synchronized split view

Explore mode already exists (read NOTES.md "Explore mode"). Colleagues must be able to browse every group and compare them directly.

1. Hub page `index.html` at `/` (move the current scene entry to `scene.html` if needed, and keep `?cam=` / `?group=` / explore URLs working there; update scripts/shoot*.mjs URLs if paths change and verify they still produce identical framing).
   - Title「AI 海邊 3D 場景驗證」, one-paragraph intro: same base scene, only the prop source differs.
   - One card per group (A｜codex 程序化, B｜Tripo AI, C｜免費素材庫): thumbnail from shots/<group>/beach.png, time & cost & total triangles read from `/report/stats.json` (create it with a placeholder structure: {groups:{A:{minutes,cost,triangles,notes}, ...}} — I will fill real numbers), buttons「進入遊覽」and「單件模型」(solo prop viewer for that group with orbit controls and a prop picker).
   - A card/button for「並排比較」.
2. Split view `compare.html?groups=A,B` (2 or 3 groups): one renderer with scissor viewports side by side (or one canvas per group if simpler), all sharing ONE player/camera state — the user walks in explore mode and every pane shows the same viewpoint with its own props. Group label at the top of each pane. Group picker to choose which 2-3 groups. Keep frame rate acceptable (share base scene geometry/materials; only props differ per pane — e.g. toggle props visibility per pane before each viewport render).
3. Solo prop viewer: orbit around a single prop, switch prop (dropdown) and group (A/B/C) — same framing rule as scripts/shoot-props.mjs; show triangle count.

Rules
- Do not change water/sky/sand/lighting, prop code, or the fitting rule in src/props.js.
- Vite server is already running on http://localhost:5191 — use it, do not start another one.
- Missing GLBs must degrade gracefully (show "生成中").

Verification
- Playwright screenshots: shots/ui/{hub,compare_AB,compare_ABC,solo}.png; check them and fix layout issues (desktop 1440x900 and mobile 390x844 for the hub).
- Re-run scripts/shoot.mjs A and confirm framing unchanged.
- Append a "Hub & compare" section to NOTES.md.
