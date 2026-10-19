Implemented Water v2 with real wave geometry, non-tiling normals, animated swash/foam, and synchronized wet sand.

- [Final 30 fps video](/home/cw/git_project/beach3d-eval/video/water.mp4)
- [Before/after comparison](/home/cw/git_project/beach3d-eval/shots/water_v2/before_after.jpg)
- [Techniques and verification notes](/home/cw/git_project/beach3d-eval/NOTES.md:164)

Five visual review rounds completed. Build, screenshots, regression tests, deterministic seeking, and video decoding passed.

GPU access was unavailable, so rendering used SwiftShader. RTX 60 fps remains unverified.