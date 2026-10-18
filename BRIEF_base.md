# Task: tropical beach scene base (shared by all test groups)

Build a three.js tropical cove scene in this folder. This is the shared base for an A/B test: only the props will change later, so keep props out of it.

Stack
- Vite + three.js, npm install locally (node 22, no sudo). Dev server: `npx vite --port 5191 --strictPort`.

Scene
- Afternoon tropical cove: turquoise shallows where the sand bottom shows through, fading to deep blue; animated waves; a foam line where waves meet the sand; caustics on the shallow sea floor; a distant island silhouette.
- Start from three.js `Water` + `Sky` (examples/jsm/objects), then extend: depth-based shallow color, shoreline foam, sun glitter.
- Sand terrain with gentle dunes and wet-sand darkening near the waterline.
- ACES tone mapping, bloom, light atmospheric haze.
- Prop slots: read `assets/props.json` and place an empty marker (`THREE.Group` named after each slot id) at each slot position. Add a loader `src/props.js` with `loadProps(group)` where group is `A`, `B` or `C` (URL `?group=A`). For B/C it loads GLBs from the path in props.json, normalizes them to the slot's `height` by bounding box and drops them onto the ground. For A leave a stub function per slot.

Cameras
- Fixed views via `?cam=wide|beach|closeup` (positions in props.json `cameras`), plus OrbitControls when no cam is given.

Verification
- Install `playwright-core` locally; launch Chromium at ~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome with args ['--use-angle=swiftshader','--enable-unsafe-swiftshader'], viewport 1280x720.
- Write `scripts/shoot.mjs <group>` that saves shots/<group>/{wide,beach,closeup}.png.
- Iterate at least 3 rounds: screenshot → fix the 3 weakest visual aspects of the water/sand/sky → repeat. Keep shots/base_r1.png, r2...
- Finish with NOTES.md: what you built, iterations, known weaknesses.
