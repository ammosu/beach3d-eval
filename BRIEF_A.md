# Task: group A props — procedural models only

The shared beach base in this folder is done (read NOTES.md and src/). Now fill group A: implement every slot stub in `src/props.js` for `?group=A`.

Hard rules
- Code-generated only: procedural three.js geometry and canvas/shader textures. No model files, no image files, no external assets or CDNs.
- Do NOT change the water, sky, sand, lighting, post-processing or cameras. Only props code. Props must respect each slot's position and `height` in assets/props.json.
- Aim for realism matching each slot's `prompt` in props.json (that same text is sent to Tripo for group B, so the comparison is fair).

Verification
- `node scripts/shoot.mjs A` → shots/A/{wide,beach,closeup}.png.
- Also render each prop alone (neutral grey background, 3/4 view, same framing for all) to shots/A/props/<slot>.png — add a `?solo=<slot>` mode for this if needed.
- Iterate at least 3 rounds on the weakest props; keep shots/A/r1.png, r2...
- Append a "Group A" section to NOTES.md: approach per prop, iterations, triangle count per prop, known weaknesses.
