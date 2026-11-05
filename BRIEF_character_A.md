# Task: make group A's procedural character look like a real person (round 1: appearance)

You built this character on 2026-10-19 (`procedural()` in `src/game/character.js`, lines 10–42: 11,484 triangles, vertex colours). Since then the game's IK, poses and interactions have been hand-tuned on top of it, but the model itself has not changed. Next to B (Tripo) it reads as a toy.

Read first: `CLAUDE.md` (Characters, Clipping), `procedural()`, and how `createCharacter()` uses the result (`addBone` and the grip setup: fingers are re-skinned at load).

Look at these before you start:
- `shots/character/before/A/sheet.png` and the single stills beside it: the current state.
- `shots/character/before/B/sheet.png`: the bar to reach or pass.

## Defects I can see now
- Cartoon head: egg shape, painted-on eyes, ball nose, hair as a cap plus one blob; no brow, cheekbone, jaw, lips or eyelids; the hair ends in a hard line round the back.
- Neck is a thin peg between head and shirt; no trapezius, no collarbones.
- Shoulders: sleeves are separate boxy tubes, wider than the torso, with a hard fold and small skin-coloured specks showing through at the seam.
- Torso is a smooth tapered tube; no chest, shoulder blades or waist. The white trim at the waist reads as a nappy.
- Shorts are two plain tubes with no crotch, waistband, hem or fabric folds.
- Arms and legs are near-uniform tubes: no deltoid, elbow, forearm taper, kneecap, calf or ankle.
- Hands are mittens: an ellipsoid and a thumb blob.
- Feet are blobs on an oval sole; the sandal is a turquoise patch.
- Flat colour: no skin variation (knuckles, knees, tan, cheeks), no fabric detail.

## Goal
A believable adult man on a beach seen at game distance (2–6 m) and holding up in the close-ups: real proportions, anatomy under the skin, clothes that sit on a body, a face you would take for a person. Realistic stylisation, not cartoon. Your judgement decides how; continuous lofted surfaces with enough rings, sculpted cross-sections (not circles), and smooth normals across joints will likely do more than added parts. Keep it a fully code-generated character: no downloaded or generated assets, no image files. Colour by vertex; canvas textures made in code are allowed if they are seeded and identical on every load.

## Must not change
- Only `procedural()` and new A-only helpers it calls. Do NOT touch `solve()`, `update()`, the `proceduralPose` branch (B and C use it), the rig map, B/C code, or anything else in `src/` (`src/game/*`, `src/main.js`, water, props).
- The skeleton: the same 17 bones, the same names, the same parents, the same bone positions (legLength, hipY, ankleHeight, idleFoot, the climb and the kick are tuned to them). Height 1.75 m with the soles at y=0. Arms stay at the sides as now.
- Every vertex at most 2 bones through the existing `add()` weights (more only if you keep it working on all poses).
- Head, hair, eyes, ears, and anything else on the head rigidly on `head`: first person hides the head by scaling that bone. Nothing near the neck may be left floating.
- Hands rigidly on `handL/handR`: at load a knuckle and a thumb bone are added per hand, from vertices wholly on the hand. If you model fingers, curl must still close them; check it.
- Body volume close to the current one at contact points: `probe-clip` measures penetration against the props (sitting on the thwart, lying on the lounger, ladder, shell, ball). Keep sole thickness and ankle height.
- Budget: at most about 20,000 triangles (B is 19,814), one SkinnedMesh, one or two materials. No per-frame allocation. Deterministic: no `Math.random`, `Date.now`.
- `assets/props.json`, fit rule, camera presets, hooks (`__SCENE__`, `__READY__`, `__TIME__`, `__GAME__`, `__EXPLORE__`, `__CHARACTER__`), port 5191.
- Do not start or stop the dev server on port 5191: it is already running. Do not run git commit, push, stash or reset.

## Loop
Iterate at least three times, looking at the images each time and fixing what you see, including joints when bent:
1. `node scripts/shoot-character.mjs A shots/character/r1/iter<N>` → stills and `sheet.png` (idle front, 3/4, side, back, face, profile, torso, hand, feet; walk; run).
2. `node scripts/probe-ik.mjs boat A`, `tower`, `shell` (→ `shots/ik/`): bent elbows, knees, hips and shoulders must not collapse or tear; look at them.

## Acceptance (run all at the end, and report the numbers)
- `node scripts/probe-clip.mjs rest,tower,boat,shell,ball A`, compared with `shots/character/before/log/clip.txt`: penetration not worse than about 5 cm anywhere; no new hits.
- `node scripts/probe-gait.mjs A shots/character/r1/gait`, compared with `shots/character/before/log/gait.txt`: same numbers.
- `node scripts/probe-ik.mjs walk A`, compared with `shots/character/before/log/ik.txt`: errors empty.
- `node scripts/shoot-character.mjs B /tmp/char_b`: pixel-identical to `shots/character/before/B/` (`sha256sum -c`-style against `shots/character/before/B.sha`), proof that the shared code was not touched.
- `npm run build` passes.

Do not run `verify-game.mjs`; I run it at the end.

Finish with a short report: what changed, triangle count, the numbers above, and what you still think looks wrong. Be honest about the weak spots; the next round starts from them.
