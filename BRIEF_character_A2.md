# Task: group A's character, round 2: fix what round 1 left, then make it move like a person

Round 1 (`BRIEF_character_A.md`, report `shots/character/r1/REPORT.md`) sculpted the body in `procedural()`. It passed all checks. The working tree holds it, uncommitted; keep building on it. All of round 1's "must not change" list still applies, except for the one permission in part 2.

Look at `shots/character/check1/A/sheet.png`, `idle_face.png`, and B's `shots/character/before/B/idle_face.png`.

## Part 1: appearance defects I saw in round 1's result (fix these, in this order)
1. Nose: in profile and 3/4 it juts far out like a wedge, with a dark brown patch under it reading as a moustache or a shadow stain. Real nose projection is about 2 cm past the lip line at this head size. Remove the stain.
2. Neck: too long and too thin, a pale column rising straight out of the collar, a visible step at the jaw and at the collar. Shorten the visible part with shirt and trapezius rising to it, thicken it, keep it skinned so that head turns do not tear.
3. Head: small on the body and narrow at the top. Check head height against about 1/7.5 of body height. Bone positions stay; the skull's shape and hair are free. Hair is a bowl with a hard bottom edge: break the hairline into uneven tufts, with a real side and back fade.
4. Face colouring: eyes are thin dark strokes with hard lash lines and read as drawn on. Give the eye real shape (a lid fold, sclera, iris, a darker upper lid line), softer brows, lips with a little volume and colour change, less orange on the chin.
5. Shorts: the dark V at the front, starting at the waist, reads as a cone stuck on the crotch. Replace with a proper fly seam and gentle folds; a waistband.
6. Shirt: the body is flat and the sleeves stick out rigidly like a cape, with a hard open rim. They should hang from the shoulder and sit close to the upper arm, with a hem that has thickness. A collar band with thickness; the jagged neck rim must go. A few drape folds at waist and under the arm, shaded by vertex colour and geometry.
7. Hands and palms: round 1 reported bulky curled palms. Check them in `shots/ik/` close-ups of a grip.

## Part 2: motion (new)
Permission: you may now change A's procedural locomotion and idle in `update()`'s `proceduralPose` branch, the parts that only run when `rate>0` or for `selected==='idle'`, guarded so that they run for `source==='A'` only. Sit, lie, paddle, jump, climb, kick and interact poses stay, as do `solve()`, B and C.

Today: fixed cadence, sine swing, the stance leg dead straight, the swing knee barely bending, arms as stiff pendulums, the spine a tiny sway, the head fixed. There is no heel-strike, no toe-off, no pelvis motion. Standing is a statue.

Walk and run should have, driven by the same `stride` phase as now (the game's footprints, IK and sound hang off it):
- Stance knee slightly bent at contact, near straight at midstance. Swing knee flexes about 60° walking, about 100° running.
- Foot pitch: heel strike, flat, heel rise, toe-off. Use `foot` bones. The IK layer (`solve()`) follows afterwards in game with terrain-following feet: read how it treats feet so your motion survives it; if it flattens part of this, say so, do not change `solve()`.
- Pelvis: drop and rotation a few degrees, opposite shoulder counter-rotation, vertical bob (lowest at double support, walk). Run: a real flight phase, forward lean, arms bent about 90° driving at the elbows.
- Arms swing from the shoulder, elbows bent more on the forward swing, and hang relaxed, not straight.
- The head stays nearly level, compensating for the torso.
- Blend walk and run through `blendRun` with no pop. Keep `leg·amplitude·ω = speed` at the plant, so that feet do not slide.
- Idle: slow breathing in the chest, a very slight weight shift, a small head movement, a natural arm hang with a slight elbow bend. A function of time (`age`), so it stays deterministic. It must not move the feet.

Frame independent: it uses the phase and `age`, not accumulation per call. A frozen clock (`update(0)`) still has to render the pose, and must not restore the bones (see the gotcha in CLAUDE.md).

## Loop
At least three iterations of each part, looking at images each time.
- Appearance: `node scripts/shoot-character.mjs A shots/character/r2/iter<N>`.
- Motion: the viewer's walk runs at speed 0 and barely moves, so judge it in the game. `scripts/probe-gait.mjs A <outdir>`, `scripts/probe-legs.mjs A <outdir>`. Add a new `scripts/probe-walk-side.mjs` that takes a side-view contact sheet of 8 evenly spaced phases of a walk and of a run in `game.html?auto=1` (group argument, default A, using `__GAME__.step`), and print the foot's slide over the ground during stance from `__GAME__.legs()` or `character` foot positions.

## Acceptance (run all at the end, report the numbers)
- `node scripts/probe-clip.mjs rest,tower,boat,shell,ball A` against `shots/character/check1/log/clip.txt`: nothing over about 5 cm, no new props hit.
- `node scripts/probe-ik.mjs walk A`: errors empty.
- `node scripts/probe-gait.mjs A`: width against the centre line stays close to `shots/character/before/log/gait.txt`. Report any change.
- Stance foot slide (from your new probe) under 3 cm per stance, walking and running.
- `node scripts/shoot-character.mjs B /tmp/char_b2` and `C /tmp/char_c2`: pixel-identical to `shots/character/before/{B,C}.sha`.
- Triangles at most about 20,000. `npm run build` passes.
- No git commit, push, stash or reset; do not start or stop the dev server on 5191. Do not run `verify-game.mjs`; I run it at the end.

Finish with a short report: what changed, the numbers, what still looks wrong.
