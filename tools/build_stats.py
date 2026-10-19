"""彙整各組耗時、花費、面數 → report/stats.json（入口頁讀取）。

耗時取 timing.csv；A 組的面數取 shots/A/props/triangles.json，B/C 直接讀 GLB 計算；
Tripo 點數取 assets/tripo/log.csv（試生成另列）；codex token 取 logs/*.jsonl 最後一筆 usage。
"""
import csv, json, re, struct
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLOTS = [s["id"] for s in json.loads((ROOT / "assets/props.json").read_text())["slots"]]


def glb_tris(path):
    data = path.read_bytes()
    n = struct.unpack_from("<I", data, 12)[0]
    gltf = json.loads(data[20:20 + n])
    acc = gltf.get("accessors", [])
    tris = 0
    for mesh in gltf.get("meshes", []):
        for p in mesh["primitives"]:
            if p.get("mode", 4) != 4:
                continue
            idx = p.get("indices")
            count = acc[idx]["count"] if idx is not None else acc[p["attributes"]["POSITION"]]["count"]
            tris += count // 3
    return tris


def codex_tokens(step):
    p = ROOT / "logs" / f"{step}.jsonl"
    if not p.exists():
        return None
    m = re.findall(r'"usage":(\{[^}]*\})', p.read_text())
    return json.loads(m[-1]) if m else None


secs = defaultdict(int)
steps = defaultdict(list)
for r in csv.DictReader((ROOT / "timing.csv").open()):
    secs[r["group"]] += int(r["seconds"])
    steps[r["group"]].append(r["step"])

credits, trial = 0.0, 0.0
log = ROOT / "assets/tripo/log.csv"
if log.exists():
    for r in csv.DictReader(log.open()):
        if not r["credits"] or r["slot"].startswith("character"):
            continue
        if "__" in r["slot"]:
            trial += float(r["credits"])
        else:
            credits += float(r["credits"])

tri = {}
a = ROOT / "shots/A/props/triangles.json"
tri["A"] = sum(x.get("triangles", 0) for x in json.loads(a.read_text())) if a.exists() else None
for g, d in (("B", "assets/tripo"), ("C", "assets/library")):
    files = [ROOT / d / f"{s}.glb" for s in SLOTS]
    tri[g] = sum(glb_tris(f) for f in files if f.exists())


def tokens(*names):
    out = 0
    for n in names:
        u = codex_tokens(n)
        if u:
            out += u["input_tokens"] + u["output_tokens"]
    return out


stats = {
    "groups": {
        "A": {"minutes": round(secs["A"] / 60, 1), "cost": "0 元（codex 訂閱額度，約 %d 萬 token）" % (tokens("propsA") // 10000),
              "triangles": tri["A"], "notes": "codex 純程式碼建模，風格統一、偏卡通"},
        "B": {"minutes": round(secs["B"] / 60, 1), "cost": "Tripo %d 點（另有試生成 %d 點）" % (credits, trial),
              "triangles": tri["B"], "notes": "Tripo v3.1 生成，Blender 減面到每件約 3 萬面"},
        "C": {"minutes": round(secs["C"] / 60, 1), "cost": "0 元（CC0／CC BY，需標作者）",
              "triangles": tri["C"], "notes": "Poly Haven／Sketchfab 現成模型，部分與需求不符"},
    },
    "shared": {
        "base_minutes": round(secs["base"] / 60, 1), "base_tokens": tokens("base", "base2"),
        "ui_minutes": round((secs["explore"] + secs["ui"]) / 60, 1), "ui_tokens": tokens("explore", "compare"),
    },
}
out = ROOT / "report/stats.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(stats, ensure_ascii=False, indent=2))
print(json.dumps(stats, ensure_ascii=False, indent=2))
