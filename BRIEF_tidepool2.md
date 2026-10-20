# Task: tide-pool visual polish (round 2)

You built `tidepool.html` + `src/tidepool/*` in the previous run; the gameplay and hooks are good and must keep working. Fix the look. Reference screenshot: `shots/tidepool/round1_gpu_B.png` (GPU, 1280×720, group B). Problems:

1. **There is no visible water.** The pool reads as dry sand inside a rock ring.
   - Add a real water layer: a transparent surface slightly below the rim, with a cool green-blue tint that deepens with depth (depth-based absorption), a Fresnel sky reflection, a moving normal-map ripple, and soft specular sun glints.
   - Light caustics should dance on the bottom.
   - Rocks and stones should be wet and darker below the waterline, with a thin bright meniscus line where the water meets the rocks.
   - Taps on the water spawn ripple rings.
   - Creatures and stones under water get a slight refraction wobble or at least a tint.
2. **Creatures are far too small.** The urchin and anemone are a few pixels; the hermit crab is hard to find.
   - Keep relative sizes plausible but exaggerate. Every creature's footprint should be at least ~5% of the screen height at 1280×720. Octopus at most about 2.5× the hermit crab.
   - Bring the camera closer or shrink the pool so the pool fills ~85% of the viewport width.
   - B (Tripo) creatures look dull and grey; check the textures are applied (sRGB colorSpace, no metalness, sensible roughness).
   - Add a subtle pulsing ring or sparkle on creatures that are not observed yet, so they can be found. Hidden ones only after their stone is lifted.
3. **The surroundings are an empty khaki background.**
   - Extend the scene: wet rocky shore and sand around the pool edge, with barnacles, a few limpets and dried seaweed, out to the screen edges.
   - Warm low sun, soft shadows, a slight vignette.
   - Rock colour: real basalt/sandstone greys and browns with green algae near the water, not uniform olive.
4. **Stones**: the liftable stones should look like distinct loose cobbles, slightly lighter and rounder than the rim rocks. Give them a subtle hover highlight (desktop) to show they can be lifted.

Also verify at a mobile viewport (390×844, portrait). The pool and the 圖鑑 strip must both fit and stay tappable.

## Process
- Render GPU screenshots yourself: Chromium with `--use-gl=angle --use-angle=gl-egl`, see CLAUDE.md. Iterate until all 6 creatures are clearly recognisable in A, B and C and the water clearly reads as water.
- C GLBs (`assets/tidepool/C/`) may still be missing; the fallback must keep working.
- Re-run `scripts/verify-tidepool.mjs` and `scripts/verify-game.mjs`; both must pass. `npm run build` must pass.

## Must NOT change
- Hooks (`__TIDEPOOL__`, `__GAME__`, `__READY__`, `?time=`, `?auto=1`), the gameplay rules, the game.html quests, `reef/` files, and the beach scene.
- Port 5191 (the dev server is running; don't kill it). Port 8791.
- No git commit.
