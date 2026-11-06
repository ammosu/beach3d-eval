"""把只拿來取動畫的 GLB 瘦身：保留所有節點（名稱、層級、靜止姿勢）與動畫，拿掉網格、蒙皮、材質、貼圖、圖片。

B 組角色的 walk／run／jump／climb.glb 各自帶一份完整模型與約 4 MB 貼圖，但遊戲只取它們的動畫
（src/game/character.js：clip 綁到 idle.glb 的骨架上，靠節點名稱對應），所以這些都是多下載的。
節點全部保留、順序與名稱不變，動畫軌道名稱就不會變；只重新打包用到的 bufferView。

用法：python3 tools/strip_clip_glb.py assets/character/{walk,run,jump,climb}.glb
（就地覆寫；重新跑 tools/tripo_retarget_v3.py 產生新 clip 之後要再跑一次）"""
import json
import struct
import sys


def read(path):
    data = open(path, "rb").read()
    assert data[:4] == b"glTF", path
    off, chunks = 12, {}
    while off < len(data):
        length, kind = struct.unpack("<I4s", data[off:off + 8])
        chunks[kind] = data[off + 8:off + 8 + length]
        off += 8 + length
    return json.loads(chunks[b"JSON"]), chunks.get(b"BIN\x00", b"")


def strip(path):
    gltf, binary = read(path)
    before = len(open(path, "rb").read())
    for key in ("meshes", "skins", "materials", "textures", "images", "samplers"):
        gltf.pop(key, None)
    for node in gltf["nodes"]:
        node.pop("mesh", None)
        node.pop("skin", None)
    for anim in gltf.get("animations", []):
        for ch in anim["channels"]:
            assert ch["target"]["path"] in ("translation", "rotation", "scale"), ch["target"]
    used = sorted({a for anim in gltf["animations"] for s in anim["samplers"] for a in (s["input"], s["output"])})
    accessors = [gltf["accessors"][i] for i in used]
    remap = {old: new for new, old in enumerate(used)}
    for anim in gltf["animations"]:
        for s in anim["samplers"]:
            s["input"], s["output"] = remap[s["input"]], remap[s["output"]]
    views, out = [], bytearray()
    view_remap = {}
    for acc in accessors:
        assert "sparse" not in acc
        v = acc["bufferView"]
        if v not in view_remap:
            view = dict(gltf["bufferViews"][v])
            chunk = binary[view.get("byteOffset", 0):view.get("byteOffset", 0) + view["byteLength"]]
            while len(out) % 4:
                out.append(0)
            view["byteOffset"], view["buffer"] = len(out), 0
            view.pop("target", None)
            out += chunk
            view_remap[v] = len(views)
            views.append(view)
        acc["bufferView"] = view_remap[v]
    while len(out) % 4:
        out.append(0)
    gltf["accessors"], gltf["bufferViews"] = accessors, views
    gltf["buffers"] = [{"byteLength": len(out)}]
    for key in ("extensionsUsed", "extensionsRequired"):
        gltf.pop(key, None)
    text = json.dumps(gltf, separators=(",", ":")).encode()
    text += b" " * (-len(text) % 4)
    body = struct.pack("<I4s", len(text), b"JSON") + text + struct.pack("<I4s", len(out), b"BIN\x00") + bytes(out)
    with open(path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, 12 + len(body)) + body)
    print(f"{path}: {before / 1e6:.2f} MB → {(12 + len(body)) / 1e6:.2f} MB, "
          f"{len(gltf['nodes'])} nodes, {sum(len(a['channels']) for a in gltf['animations'])} channels")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        strip(p)
