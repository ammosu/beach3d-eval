"""Blender 無頭：Tripo 原始 GLB → 減面、縮貼圖、轉正、正規化 → three.js 用的 GLB，並算繪檢查圖。

用法：
  blender -b --factory-startup --python reef/tripo/prep.py -- <in.glb> <out.glb> <preview.png> [tris] [rot]
  rot＝在 Blender 座標（Z 朝上）依序套用的旋轉，例如 "z90,x-90"；套用後應為：頭朝 +X、背朝 +Z。
輸出模型：頭朝 +x、長度（x 方向）＝1、包圍盒中心在原點（glTF 匯出後即 three.js 的 +x 前、+y 上）。
預覽圖：top＝從上往下看（+X 朝右、+Y 朝上）；side＝從 -Y 看（+X 朝右、+Z 朝上）；front＝從 +X 看（+Y 朝右、+Z 朝上）。
"""
import math
import sys

import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, dst, preview = argv[0], argv[1], argv[2]
target = int(argv[3]) if len(argv) > 3 else 16000
rot = argv[4] if len(argv) > 4 else ""

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]

# 套用所有物件的變換，合併成一個網格
for o in bpy.context.scene.objects:
    o.select_set(o.type == "MESH")
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
for o in list(bpy.context.scene.objects):
    if o != obj:
        bpy.data.objects.remove(o)

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

# 轉正
for step in filter(None, rot.split(",")):
    axis, deg = step[0].upper(), float(step[1:])
    obj.data.transform(Matrix.Rotation(math.radians(deg), 4, axis))
# 正規化：包圍盒置中、X 長度＝1
vs = [v.co for v in obj.data.vertices]
lo = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
hi = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
size = hi - lo
if len(argv) > 5 and argv[5] == "base":  # 潮池生物：水平最長邊＝1、底部貼 z=0
    s = 1.0 / max(size.x, size.y)
    obj.data.transform(Matrix.Scale(s, 4) @ Matrix.Translation(-Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))))
else:
    s = 1.0 / size.x
    obj.data.transform(Matrix.Scale(s, 4) @ Matrix.Translation(-(lo + hi) / 2))
obj.data.update()
print(f"PREP {src}: {before} -> {after} tris; raw size {size.x:.3f} x {size.y:.3f} x {size.z:.3f}; "
      f"normalized 1 x {size.y * s:.3f} x {size.z * s:.3f}")

# 貼圖縮到 1024
for img in bpy.data.images:
    if img.size[0] > 1024:
        img.scale(1024, 1024)

bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", export_image_format="JPEG", export_jpeg_quality=85,
                          export_apply=True, use_selection=False)

# 檢查圖：Workbench，貼圖色，左上視、右側視
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "TEXTURE"
scene.render.resolution_x, scene.render.resolution_y = 640, 480
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new("w")
scene.world.color = (0.25, 0.32, 0.38)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
scene.collection.objects.link(cam)
scene.camera = cam
cam.data.type = "ORTHO"
cam.data.ortho_scale = max(size) * s * 1.15
shots = []
for name, loc, rot_euler in [("top", (0, 0, 5), (0, 0, 0)), ("side", (0, -5, 0), (math.pi / 2, 0, 0)),
                             ("front", (5, 0, 0), (math.pi / 2, 0, math.pi / 2))]:
    cam.location, cam.rotation_euler = loc, rot_euler
    path = preview.replace(".png", f"_{name}.png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    shots.append(path)
print("PREVIEW", " ".join(shots))
