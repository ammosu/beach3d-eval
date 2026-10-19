"""物件來源總盲評：多個來源的 8 件單獨展示圖匿名後交給 codex 評分，輪換順序取平均。

用法：python3 tools/blind_props.py [輪數，預設 3]   → eval_props/round<n>/、eval_props/scores.json
來源與 shots 資料夾寫在 SOURCES；單件圖需是 <資料夾>/<slot>.png。
"""
import json, subprocess, sys
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
GIT = ROOT.parent
SOURCES = {
    "codex1": GIT / "beach3d-eval/shots/A/props",
    "codex2": GIT / "beach3d-codex2/shots/A/props",
    "opus": GIT / "beach3d-opus/shots/A/props",
    "tripo": GIT / "beach3d-eval/shots/B/props",
    "library": GIT / "beach3d-eval/shots/C/props",
}
LABELS = ["P", "Q", "R", "S", "T"]
SLOTS = json.loads((ROOT / "assets/props.json").read_text())["slots"]
FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
OUT = ROOT / "eval_props"


def fit(path, cell):
    """各來源的展示圖取景大小不一：用彩度／明度找出物件外框（不含灰色背景與陰影），等比置中，避免取景大小影響評分。"""
    im = Image.open(path).convert("RGB")
    hsv = np.asarray(im.convert("HSV")).astype(np.int16)
    h, w, _ = hsv.shape
    # 背景與陰影都是低彩度灰：物件 = 有彩度，或明顯比背景暗（深色岩石、船）
    mask = (hsv[..., 1] > 40) | (hsv[..., 2] < 70)
    ys, xs = np.nonzero(mask)
    if len(xs):
        x0, x1 = np.percentile(xs, [0.5, 99.5]).astype(int)
        y0, y1 = np.percentile(ys, [0.5, 99.5]).astype(int)
        side = int(max(x1 - x0, y1 - y0) * 1.3)
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        im = im.crop((max(0, cx - side // 2), max(0, cy - side // 2), min(w, cx + side // 2), min(h, cy + side // 2)))
    im.thumbnail((cell, cell))
    out = Image.new("RGB", (cell, cell), (190, 190, 186))
    out.paste(im, ((cell - im.width) // 2, (cell - im.height) // 2))
    return out


def grid(order, out):
    cell, head, side = 260, 44, 60
    c = Image.new("RGB", (side + cell * len(SLOTS), head + cell * len(order)), "white")
    d = ImageDraw.Draw(c)
    for j, s in enumerate(SLOTS):
        d.text((side + j * cell + 8, 8), s["id"], font=ImageFont.truetype(FONT, 24), fill="black")
    for i, (src, lab) in enumerate(order):
        d.text((16, head + i * cell + cell // 2 - 22), lab, font=ImageFont.truetype(FONT, 40), fill="black")
        for j, s in enumerate(SLOTS):
            p = SOURCES[src] / f"{s['id']}.png"
            if p.exists():
                c.paste(fit(p, cell), (side + j * cell, head + i * cell))
    c.save(out)


def run_round(n):
    names = list(SOURCES)
    order = [(names[(i + n) % len(names)], LABELS[i]) for i in range(len(names))]
    d = OUT / f"round{n}"
    d.mkdir(parents=True, exist_ok=True)
    grid(order, d / "props_grid.png")
    (d / "mapping.json").write_text(json.dumps({lab: src for src, lab in order}))
    props = "\n".join(f"- {s['id']}：{s['prompt']}" for s in SLOTS)
    labs = "、".join(LABELS)
    prompt = f"""你是 3D 遊戲美術評審。附圖是 8 件海灘場景物件，由 {labs} 五個來源各做一套（每列一個來源，左側標籤；每欄一件物件）。
展示的燈光與背景可能略有不同，請忽略，只評物件本身。請只依畫面盲評，不要猜測製作方式。

每件物件的需求：
{props}

請給每個來源：match（符合需求）、realism（造型材質細節的寫實精緻度）、consistency（8 件風格是否一致）各 1–10 分（可用 0.5），
並給每件物件每個來源一個 1–10 綜合分。不要讀寫檔案、不要執行指令。最後只輸出 JSON（不要 markdown 圍欄）：
{{"criteria": {{"P": {{"match": 0, "realism": 0, "consistency": 0}}, ...}}, "props": {{"<slot id>": {{"P": 0, ...}}, ...}},
 "comments": {{"P": "一兩句繁體中文", ...}}, "ranking": ["最好", "...", "最差"]}}
"""
    (d / "prompt.md").write_text(prompt)
    cmd = ["codex", "exec", "--json", "--skip-git-repo-check", "-C", str(d), "-s", "read-only",
           "-c", "service_tier=\"fast\"", "-c", "model_reasoning_effort=high", "-o", str(d / "last.md"), "-i", str(d / "props_grid.png")]
    with open(d / "events.jsonl", "w") as out, open(d / "err.log", "w") as err:
        subprocess.run([str(ROOT / "tools/timed.sh"), "eval", f"props_blind{n}", "--", *cmd],
                       input=prompt, text=True, stdout=out, stderr=err, timeout=3600)
    raw = (d / "last.md").read_text()
    raw = raw[raw.index("{"): raw.rindex("}") + 1]
    (d / "score.json").write_text(raw)
    return n, json.loads(raw)


def aggregate(results):
    avg = lambda xs: round(sum(xs) / len(xs), 2)
    crit, props, comments, rankings = {}, {}, {}, []
    for n, r in results:
        m = json.loads((OUT / f"round{n}" / "mapping.json").read_text())
        for lab, src in m.items():
            for k, v in r["criteria"][lab].items():
                crit.setdefault(src, {}).setdefault(k, []).append(v)
            for s in SLOTS:
                props.setdefault(s["id"], {}).setdefault(src, []).append(r["props"][s["id"]][lab])
            comments.setdefault(src, []).append(r["comments"][lab])
        rankings.append([m[x] for x in r["ranking"]])
    out = {"rounds": len(results),
           "criteria": {s: {k: avg(v) for k, v in c.items()} for s, c in crit.items()},
           "total": {s: avg([avg(v) for v in c.values()]) for s, c in crit.items()},
           "props": {p: {s: avg(v) for s, v in d.items()} for p, d in props.items()},
           "rankings": rankings, "comments": comments}
    (OUT / "scores.json").write_text(json.dumps(out, ensure_ascii=False, indent=2))
    return out


if __name__ == "__main__":
    rounds = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    with ThreadPoolExecutor(rounds) as ex:
        res = list(ex.map(run_round, range(rounds)))
    print(json.dumps(aggregate(res), ensure_ascii=False, indent=2))
