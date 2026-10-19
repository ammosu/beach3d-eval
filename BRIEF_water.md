# Task: make the water / shoreline as photorealistic as possible

Read NOTES.md and src/main.js (water + sand shaders), src/terrain.js, src/coast.js first.
The water currently lives in src/main.js (three.js `Water` + custom shore shader). A 20 s water flythrough of the current state is at video/water_before.mp4; stills in shots/before_water/.

Problems seen in the current water (fix all):
1. Aerial views show an obvious repeating grid / tiling pattern in the reflections (single tiled normal map).
2. White foam looks like parallel dashed lines, not breaking surf; there is no wave running up the beach and receding (swash).
3. The wet-sand band is a uniform grey strip that looks like asphalt.
4. Swell is ~5 cm, so up close the surface is flat; no real wave shapes.

Goal: real tropical lagoon / beach water, judged against photos of e.g. Maldives / Thai beaches. Ideas (pick what works, research community three.js references if useful — e.g. Gerstner/FFT-style ocean, jbouny/ocean, multi-octave normals):
- Break tiling: multiple normal layers at different scales/directions/speeds, or procedural normals; distance-dependent detail.
- Real waves: several Gerstner waves in the vertex shader (water plane may be subdivided more near the shore), wave height decreasing into the lagoon; waves shoal and break at the shore.
- Shoreline: animated swash — a thin foam sheet runs up the sand and recedes on a cycle, leaving a dark wet sand mark that slowly dries; foam texture should be organic (noise-based, broken lace), not lines. Breaking-wave foam lines along the wave crests near shore.
- Wet sand: darker, slightly glossy (reflective) where the swash just receded, gradient to dry sand; no flat grey band.
- Water colour: depth-based absorption (clear → turquoise → deep blue), refraction of the sand bottom, caustics, fresnel reflection of the sky, subtle subsurface tint in wave crests, sun glitter.
- Keep it physically consistent with the existing sun direction and sky.

Hard rules
- EVERY animation must be driven only by the water `time` uniform (`window.__TIME__` already overrides it in src/main.js frame loop). No Math.random/Date/clock-dependent state in shaders or JS animation, so offline frame-by-frame rendering stays deterministic. Shared sand shader animation (swash, wet sand) must read the same time value — wire it in.
- Do not change: props code, src/props.js fitting rule, assets/props.json, terrain shape (groundHeight / shore are used by explore mode and prop placement), camera presets, explore/compare/hub UI behaviour.
- Keep `?cam=` screenshots, scripts/shoot.mjs, scripts/record-path.mjs working. compare.html renders 3 viewports — keep it at an acceptable frame rate (desktop RTX GPU, aim 60 fps single view).
- Vite server is already running on http://localhost:5191 — use it, do not start another.

Verification loop (do at least 3 rounds, look at the images each round and fix what looks fake)
- GPU frames: `node scripts/record-path.mjs B 2 video/water.json /tmp/water_check` (2 fps preview of the water flythrough; 30 fps for a final check of animation). Also `node scripts/shoot.mjs B` and look at shots/B/*.png.
- Compare against shots/before_water/ and video/water_before.mp4 frames.
- Final: render `node scripts/record-path.mjs B 30 video/water.json video/frames/water` and encode
  `ffmpeg -y -framerate 30 -i video/frames/water/%05d.jpg -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart video/water.mp4`.
- Append a "Water v2" section to NOTES.md: techniques used, performance, known remaining issues.
