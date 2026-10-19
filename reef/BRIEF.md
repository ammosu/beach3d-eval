Build a single self-contained HTML file (inline CSS and JS; the only external script is Three.js r128 from cdnjs.cloudflare.com/ajax/libs/thre…) called "Reef Lagoon": an interactive top-down view of a sunlit Maldives-style lagoon where the user throws sea creatures into the water and watches them swim. Output the complete file, no placeholders, no omitted sections.

CAMERA AND LAYOUT
- Perspective camera straight overhead (height ~26 world units, up vector (0,0,-1)). Fit the vertical FOV so the visible water is about ±8.4 units in the short screen direction; the long direction scales with the aspect ratio. Recompute on resize.
- The whole screen is water. One world unit is roughly 1 m at toy scale: dolphin ~2.4, white shark ~3.3, hammerhead ~3.1, orca ~4.5, humpback ~6, turtle ~1.35 shell length, manta ~1.6 length / 3.2 wingspan.

WATER SIMULATION
- GPU ripple height field (ping-pong float/half-float render targets, about 440 texels on the long side, stepped at 90 Hz). Update: average of 4 neighbours, velocity += (avg − h)*1.8, velocity *= 0.9935, h += velocity, h *= 0.9993. Absorbing "sponge" edges, so waves leaving the screen don't reflect.
- Drops are queued (x, z, radius, amplitude, foam) and applied with a smooth cosine bump; a second channel stores foam that diffuses and fades.

RENDERING (draw order per frame)
1. A tileable animated caustics texture (512², mipmapped).
2. A shadow pass: creature geometry projected along the sun onto the floor, rendered from the main camera into a half-res target with MAX blending.
3. The underwater scene into an off-screen target. Its alpha stores depth*0.22, which later scales refraction and blur.
   - Floor: a large heightfield mesh. Depth goes from ~1.35 near the bottom of the screen to ~4.3 at the top, with gentle undulation.
   - Coral heads come from noise masks: raised 1–1.4 units, warm ochre/purple/yellow colours with knobbly and brain-coral detail, plus a rubble ring around them.
   - Pale sand with soft irregular ripple shading.
   - Lighting: ambient + sun × (base + caustics focused by the Laplacian of the ripple field) × shadow × drifting cloud shadows (large slow noise).
   - Water absorption along the light path plus the view path, e.g. T = exp(−(0.30, 0.058, 0.04)·path), plus depth-based turquoise→blue scatter.
4. A full-screen water-surface pass. Each pixel is ray-cast through the inverse view-projection to the plane y=0.
   - Surface normal from the ripple field + scrolling wind-ripple gradient noise + a gentle swell.
   - Refraction: offset sampling of the underwater target, with chromatic split and depth blur.
   - Fresnel sky reflection with clouds, sun glints, foam, splash craters (a short-lived analytic bowl around each impact; brighten it, never let it go dark), and an optional whirlpool funnel with spiral foam arms.
   - Mild tone curve.
5. An overlay pass, depth-tested, drawn after the surface: creatures above water, water droplets (point sprites, gravity 20), soft mist sprites, rain streaks, expanding ring quads, and a drop-target marker.

CREATURES (procedural geometry, no external models)
- Local frame: nose at +x (x=0.5), tail toward −x, up +y, body length 1.
- Body: lofted elliptical cross-sections along x. Half-width W(u), half-height H(u) and centre offset C(u) are Catmull-Rom curves through control points, where u runs 0 at the nose to 1 at the tail. Flatten the belly, cap the ends, compute normals from the grid.
- Fins: thin double-sided sheets made as bilinear patches between a root chord and a tip chord, with bowed leading and trailing edges.
- Species:
  1. Great white shark: slate-grey back with a ragged countershading line to a white belly, gill slits, tall triangular dorsal fin, big swept pectorals with dark tips underneath, crescent tail with a longer upper lobe.
  2. Great hammerhead: flat wide cephalofoil with eyes at its tips, bronze-grey colour, tall sickle dorsal fin.
  3. Humpback whale: near-black back, mottled white belly with throat pleats, knobs on the head, very long scalloped white pectorals, small dorsal hump, serrated flukes.
  4. Orca: black, with the white eye patch, white chin, belly and flank lobe, grey saddle behind a towering dorsal fin, paddle-shaped pectorals.
  5. Bottlenose dolphin: beak and melon forehead, dark cape over grey flanks and a pale belly, curved dorsal fin.
  6. Green sea turtle: domed shell with scute pattern and amber streaks, pale belly plate, scaly head, long front flippers and small rear flippers.
  7. Manta ray: diamond-shaped swept-back wings, curled horn-like fins at the mouth, whip tail, black top with white shoulder chevrons, white spotted belly.
- Draw each species as one InstancedBufferGeometry. Per-instance data: position, orientation quaternion, (swim phase, wave amplitude, turn, fin phase), (scale, alpha, body arch, fin amplitude), (seed, water-class flag, wetness, flipper angle offset).
- Vertex shader:
  - Swimming body wave: side to side for sharks, up and down for whales, orca and dolphins, none for turtle and manta.
  - Amplitude envelope grows toward the tail, plus turn curvature and arch.
  - Rotate each cross-section to stay perpendicular to the bent spine.
  - Rotate flippers on hinges about the body axis.
  - Manta wing beat travels outward with amplitude ∝ |z|^1.45.
  - Sample the GPU water height at the vertex for the waterline.
- Render each species in three passes: under water (discard fragments above the local water height, tint by water), above water (discard below), shadow (project to the floor). Also render card thumbnails with the same materials.
- Fade with an ordered (Bayer) dither. Lighting: sky/ground ambient, sun diffuse with caustics under water, glossy specular that increases when wet, rim light, eyes as dark spheres in the shader.

BEHAVIOUR
- Swimming: wander steering inside the screen (stay above the bottom dock UI), separation between creatures, preferred depth with floor clearance, pitch toward the target depth, roll into turns, currents from the whirlpool.
- Whales, orcas and dolphins periodically surface to breathe and spout: droplet column plus soft mist sprites plus a blow sound. Humpback spout is bushy, orca tall, dolphin a small puff. The humpback dives fluke-up.
- Sharks often cruise with the dorsal fin cutting the surface and leaving a V-wake of small drops.
- Turtles surface to breathe; mantas glide with wing beats.
- Dolphins porpoise-leap often; orca, humpback, shark and manta occasionally breach. A breach means rising fast, launching out of the water with an exit splash, then re-entering in the species style below.
- Tapping the water makes ripples. Sharks, dolphins and orcas come to look at the spot; turtles and mantas flee.

ENTERING THE WATER: EACH SPECIES DIFFERENT (the core feature)
- Tapping a creature card throws the creature from the card's screen position (projected onto the water plane, y=0.6) along a ballistic arc to a random free spot.
- Per-species gravity (whale 6.2, orca 7.5, dolphin 11, others 10) and flight time (whale 1.8 s, orca 1.5, hammerhead 1.3, manta 1.35, shark 1.2, dolphin 1.15, turtle 1.0). Start velocity: vy = (−y0 + ½gT²)/T.
- In the air, orientation is scripted against flight progress τ ∈ [0,1], relative to the trajectory pitch, and blended in from the start orientation over the first 22%:
  - Shark: noses steeply down for a knife entry; tail thrashes.
  - Hammerhead: corkscrews, two full rolls.
  - Humpback: rolls onto its back (≈2.75 rad) and levels out, pectorals raised, body arched: a backflop.
  - Orca: rolls onto its side (≈1.5 rad) and levels out.
  - Dolphin: follows the arc for a clean head-first dive.
  - Turtle: wobbles with flippers flapping into a belly-flop.
  - Manta: forward somersault (−2π) into a flat wing slap, wings beating.
- Each entry has its own splash: a crater drop plus several drops along the body line for long animals, expanding rings, a droplet crown with species-specific counts and speeds, mist, bubbles, and sound.
  - Dolphin: tiny "rip" splash.
  - Sharks: tall crown; hammerhead adds spiral droplets.
  - Humpback: huge white curtain (~500 droplets), mist and a low boom.
  - Orca: big side splash.
  - Turtle: low flat plop.
  - Manta: wide low sheet of spray and a sharp slap.
- After entry the creature decelerates under water with a bubble trail, slerps back to its swimming orientation over 1.6–3.2 s (the whale rolls back over from its back), then swims.
- Dragging a card holds the creature above the water under the pointer (with a target ring on the water) and drops it on release with its own entry style.
- The user can grab any creature from the water (pick by distance to its projected body axis), carry it, and throw it back.

UI (English)
- Frosted-glass dock at the bottom: 7 creature cards with thumbnails rendered from the real models and a short description each ("Knifes straight in", "Corkscrew dive", "Backflop breach", "Lands on its side", "Clean arc dive", "Belly plop", "Wing slap"). On phones show short names.
- Tool buttons: Rain (streaks, ring ripples, dimmer sun), Whirlpool (draggable vortex that carries creatures), Calm, Clear (all creatures swim off and fade), Sound (synthesized Web Audio: splashes, plops, blows, slaps, booms, occasional humpback song, dolphin whistles, orca calls, ambient water), Hide UI.
- Top-left name plate "Reef Lagoon" with a live creature count; toasts and a hint line.
- Keyboard: 1–7 throw creatures, R W C M H.

QUALITY AND ROBUSTNESS
- Works on desktop and mobile (touch, pointer events, no horizontal overflow) and in both WebGL2 and WebGL1.
- Adaptive pixel ratio when frames are slow.
- Caps: 24 creatures total, max 3 humpbacks.
- Start with two dolphins, a turtle, a shark and a manta already swimming; a humpback breaches 1 s after load.
- Show a toast for runtime errors and lost WebGL contexts.

---
EXECUTION NOTES (environment)
- Write the finished file to `index.html` in the current working directory. Work only inside this directory; do not modify anything outside it.
- Three.js r128 URL: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
- You may test it headlessly. Chromium: ~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome (GPU flags: --use-gl=angle --use-angle=gl-egl; software: --use-angle=swiftshader --enable-unsafe-swiftshader). Node package `playwright-core` is at /home/cw/git_project/beach3d-eval/node_modules/playwright-core (require it by that absolute path). Serve the file with e.g. `python3 -m http.server` on a port in 8800–8899.
- When done, reply with a short summary of what was implemented and anything not finished.
