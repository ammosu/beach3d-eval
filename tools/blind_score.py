"""盲評：把 A/B/C 截圖匿名成 X/Y/Z 交給 codex astra 評分，輪換 3 次順序抵銷位置偏誤，最後還原組別取平均。

用法：python3 tools/blind_score.py [輪數，預設 3]   → eval/round<n>/（匿名圖、prompt、score.json）、eval/scores.json
耗時記到 timing.csv（group=eval）。
"""
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
GROUPS = ["A", "B", "C"]
LABELS = ["X", "Y", "Z"]
CAMS = ["wide", "beach", "closeup"]
FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
SLOTS = json.loads((ROOT / "assets/props.json").read_text())["slots"]
CRITERIA = {
    "match": "物件符合需求：每件物件是否就是 prompt 描述的東西（種類、材質、細節）",
    "realism": "物件質感：造型、材質、細節的寫實與精緻程度",
    "cohesion": "整體協調：物件彼此、與場景（沙灘、海、光線）風格與比例是否一致",
    "overall": "第一眼觀感：當成遊戲／展示場景，整體好不好看",
}


def labeled_row(paths, labels, size):
    font = ImageFont.truetype(FONT, 40)
    w, h = size
    canvas = Image.new("RGB", (w * len(paths), h + 60), "white")
    d = ImageDraw.Draw(canvas)
    for i, (p, lab) in enumerate(zip(paths, labels)):
        canvas.paste(Image.open(p).convert("RGB").resize(size), (i * w, 60))
        d.text((i * w + 16, 6), lab, font=font, fill="black")
    return canvas


def props_grid(order, out):
    font = ImageFont.truetype(FONT, 28)
    cell, head, side = 300, 50, 70
    canvas = Image.new("RGB", (side + cell * len(SLOTS), head + cell * len(order)), "white")
    d = ImageDraw.Draw(canvas)
    for j, s in enumerate(SLOTS):
        d.text((side + j * cell + 10, 10), s["id"], font=font, fill="black")
    for i, (g, lab) in enumerate(order):
        d.text((20, head + i * cell + cell // 2 - 20), lab, font=ImageFont.truetype(FONT, 40), fill="black")
        for j, s in enumerate(SLOTS):
            p = ROOT / "shots" / g / "props" / f"{s['id']}.png"
            if p.exists():
                canvas.paste(Image.open(p).convert("RGB").resize((cell, cell)), (side + j * cell, head + i * cell))
    canvas.save(out)


def prompt_text(images):
    props = "\n".join(f"- {s['id']}：{s['prompt']}" for s in SLOTS)
    crit = "\n".join(f"- {k}：{v}" for k, v in CRITERIA.items())
    return f"""你是 3D 場景美術評審。以下是同一個海邊 three.js 場景的三個版本 X、Y、Z：
水、天空、沙灘、光線、植被完全相同，只有 8 件物件的製作方式不同。請只依畫面盲評，不要猜測製作方式。

附圖（依序）：{', '.join(images)}
- scene_wide / scene_beach / scene_closeup：三個鏡頭，每張由左到右是 X、Y、Z（左上角有標籤）
- props_grid：8 件物件單獨展示，每列一個版本（左側標籤），每欄一件物件

每件物件的需求（prompt）：
{props}

評分項目（1–10 分，可用 0.5）：
{crit}

另外每件物件分別給 X/Y/Z 一個 1–10 分（綜合符合需求與質感）。
不要讀寫任何檔案、不要執行指令。最後只輸出一個 JSON（不要 markdown 圍欄），格式：
{{"criteria": {{"X": {{"match": 0, "realism": 0, "cohesion": 0, "overall": 0}}, "Y": {{...}}, "Z": {{...}}}},
 "props": {{"<slot id>": {{"X": 0, "Y": 0, "Z": 0}}, ...}},
 "comments": {{"X": "一兩句繁體中文優缺點", "Y": "...", "Z": "..."}},
 "ranking": ["最好", "次之", "最差"]}}
"""


def run_round(n):
    order = [(GROUPS[(i + n) % 3], LABELS[i]) for i in range(3)]  # 每輪輪換：X 依序是 A、B、C
    d = ROOT / "eval" / f"round{n}"
    d.mkdir(parents=True, exist_ok=True)
    images = []
    for cam in CAMS:
        labeled_row([ROOT / "shots" / g / f"{cam}.png" for g, _ in order], LABELS, (960, 540)).save(d / f"scene_{cam}.png")
        images.append(f"scene_{cam}.png")
    props_grid(order, d / "props_grid.png")
    images.append("props_grid.png")
    (d / "mapping.json").write_text(json.dumps({lab: g for g, lab in order}))
    prompt = prompt_text(images)
    (d / "prompt.md").write_text(prompt)
    cmd = ["codex", "exec", "--json", "--skip-git-repo-check", "-C", str(d), "-s", "read-only",
           "-c", "service_tier=\"fast\"", "-c", "model_reasoning_effort=high",
           "-o", str(d / "last.md"), "-i", *[str(d / x) for x in images]]
    with open(d / "events.jsonl", "w") as out, open(d / "err.log", "w") as err:
        subprocess.run([str(ROOT / "tools/timed.sh"), "eval", f"blind{n}", "--", *cmd],
                       input=prompt, text=True, stdout=out, stderr=err, timeout=3600)
    raw = (d / "last.md").read_text().strip()
    raw = raw[raw.index("{"): raw.rindex("}") + 1]
    (d / "score.json").write_text(raw)
    return n, json.loads(raw)


def aggregate(results):
    crit = {g: {k: [] for k in CRITERIA} for g in GROUPS}
    props = {s["id"]: {g: [] for g in GROUPS} for s in SLOTS}
    comments, rankings = {g: [] for g in GROUPS}, []
    for n, r in results:
        m = json.loads((ROOT / "eval" / f"round{n}" / "mapping.json").read_text())
        for lab, g in m.items():
            for k in CRITERIA:
                crit[g][k].append(r["criteria"][lab][k])
            for s in props:
                props[s][g].append(r["props"][s][lab])
            comments[g].append(r["comments"][lab])
        rankings.append([m[x] for x in r["ranking"]])
    avg = lambda xs: round(sum(xs) / len(xs), 2)
    out = {
        "rounds": len(results),
        "criteria": {g: {k: avg(v) for k, v in crit[g].items()} for g in GROUPS},
        "total": {g: avg([avg(v) for v in crit[g].values()]) for g in GROUPS},
        "props": {s: {g: avg(v) for g, v in props[s].items()} for s in props},
        "rankings": rankings,
        "comments": comments,
    }
    (ROOT / "eval" / "scores.json").write_text(json.dumps(out, ensure_ascii=False, indent=2))
    return out


if __name__ == "__main__":
    rounds = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    with ThreadPoolExecutor(rounds) as ex:
        results = list(ex.map(run_round, range(rounds)))
    print(json.dumps(aggregate(results), ensure_ascii=False, indent=2))
