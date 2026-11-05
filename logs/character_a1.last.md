Implemented in `procedural()` only: sculpted face and anatomy, connected shoulders, shaped clothing, fingers, toes and sandals. Seven visual passes completed.

**19,960 triangles · one mesh · one material · original rig preserved.**

| Maximum penetration | Before → after |
|---|---:|
| Rest | 3 → 3 cm |
| Tower | 3 → 4 cm |
| Boat | 2 → 2 cm |
| Shell | 0 → 0 cm |
| Ball | 5 → 3 cm |

- No new contacts across 43 samples.
- Gait and walking IK logs are byte-identical; maximum IK error **2.629 mm**, `errors []`.
- B: **14/14 image hashes identical**.
- Build passes. Grip curl and head hiding verified.
- Clip/gait used SwiftShader because EGL failed.

Still weaker than B: facial naturalness, hair detail, bulky curled palms and fabric folds.

[Final images](/home/cw/git_project/beach3d-eval/shots/character/r1/iter7/sheet.png) · [Full report and logs](/home/cw/git_project/beach3d-eval/shots/character/r1/REPORT.md)