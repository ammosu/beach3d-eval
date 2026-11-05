"""Blender 無頭：Scenario 3D Collection 的 GLB → 合併、減面、縮貼圖、底部貼 y=0 → three.js 用的 GLB，並算繪檢查圖。

沉船點與遠海漁船用（三組共用，見 src/game/wreck.js）。下載清單與目標面數在 tools/fetch_scenario.sh。
用法：
  blender -b --factory-startup --python tools/prep_scenario.py -- <in.glb> <out.glb> <preview.png> <tris> <貼圖邊長> [rot]
  rot＝在 Blender 座標（Z 朝上）依序套用的旋轉，例如 "z90"；模型自己的動畫不匯出（只留靜止姿勢）。
"""
import math
import sys

import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst, preview, target, tex = argv[0], argv[1], argv[2], int(argv[3]), int(argv[4])
rot = argv[5] if len(argv) > 5 else ""

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
scene = bpy.context.scene
meshes = [o for o in scene.objects if o.type == "MESH"]
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.make_single_user(object=True, obdata=True)
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
for o in list(scene.objects):
    if o != obj:
        bpy.data.objects.remove(o)
obj.animation_data_clear()

obj.data.calc_loop_triangles()
before = len(obj.data.loop_triangles)
if before > target:
    m = obj.modifiers.new("decimate", "DECIMATE")
    m.decimate_type = "COLLAPSE"
    m.ratio = target / before
    m.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=m.name)
obj.data.calc_loop_triangles()
after = len(obj.data.loop_triangles)

for step in filter(None, rot.split(",")):
    obj.data.transform(Matrix.Rotation(math.radians(float(step[1:])), 4, step[0].upper()))
vs = [v.co for v in obj.data.vertices]
lo = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
hi = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
size = hi - lo
s = 1.0 / max(size)
obj.data.transform(Matrix.Scale(s, 4) @ Matrix.Translation(-Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))))
obj.data.update()

imgs = 0
for img in bpy.data.images:
    if max(img.size) > tex:
        k = tex / max(img.size)
        img.scale(max(1, round(img.size[0] * k)), max(1, round(img.size[1] * k)))
        imgs += 1
print(f"PREP {src}: {before} -> {after} tris; size {size.x:.3f} x {size.y:.3f} x {size.z:.3f}; "
      f"{len(obj.data.materials)} materials, {len(bpy.data.images)} images, {imgs} scaled")

bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", export_image_format="JPEG", export_jpeg_quality=85,
                          export_animations=False, export_apply=True)

scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "TEXTURE"
scene.render.resolution_x, scene.render.resolution_y = 640, 480
scene.world = bpy.data.worlds.new("w")
scene.world.color = (0.25, 0.32, 0.38)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.type = "ORTHO"
cam.data.ortho_scale = 1.15
for name, loc, e in [("top", (0, 0, 5), (0, 0, 0)), ("side", (0, -5, .5), (math.pi / 2, 0, 0)),
                     ("front", (5, 0, .5), (math.pi / 2, 0, math.pi / 2))]:
    cam.location, cam.rotation_euler = loc, e
    scene.render.filepath = preview.replace(".png", f"_{name}.png")
    bpy.ops.render.render(write_still=True)
