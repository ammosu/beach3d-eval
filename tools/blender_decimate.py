"""Blender 無頭減面：把 Tripo 原始 GLB 減到目標三角面數後匯出給 three.js。

用法：
  ~/.local/opt/blender-5.2.1-linux-x64/blender -b --factory-startup \
    --python tools/blender_decimate.py -- <in.glb> <out.glb> [目標三角面數，預設 30000]
"""
import sys
import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst = argv[0], argv[1]
target = int(argv[2]) if len(argv) > 2 else 30000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]


def tri_count():
    n = 0
    for o in meshes:
        o.data.calc_loop_triangles()
        n += len(o.data.loop_triangles)
    return n


before = tri_count()
if before > target:
    ratio = target / before
    for o in meshes:
        bpy.context.view_layer.objects.active = o
        m = o.modifiers.new("decimate", "DECIMATE")
        m.decimate_type = "COLLAPSE"
        m.ratio = ratio
        m.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=m.name)
after = tri_count()

bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", export_image_format="JPEG", export_jpeg_quality=85)
print(f"DECIMATE {src} -> {dst}: {before} -> {after} tris")
