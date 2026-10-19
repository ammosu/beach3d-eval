"""同一套流程換不同模型做的三個版本：場景對照圖＋水面影片四宮格。

用法：python3 tools/compare_models.py   → compare/models_<鏡頭>.png、compare/models_props.png、video/water_models.mp4
先用 scripts/record-path.mjs（video/water16.json）錄好 video/frames/water_{codex,codex2,opus}/。
"""
import json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
GIT = ROOT.parent
VARIANTS = [  # (代號, 標題, 副標, shots/A 資料夾, 影格資料夾, 顏色)
    ("M1", "codex 第一輪", "沙箱・推理 low（水面 high）｜44 分｜約 1,176 萬 token", GIT / "beach3d-eval/shots/A", "water_codex", (240, 150, 60)),
    ("M2", "codex 第二輪", "無沙箱・fast・推理 high｜33 分｜約 990 萬 token", GIT / "beach3d-codex2/shots/A", "water_codex2", (70, 150, 240)),
    ("M3", "Opus 5.5", "claude -p・預設｜119 分｜26.35 美元", GIT / "beach3d-opus/shots/A", "water_opus", (150, 110, 220)),
]
SCORES = json.loads((ROOT / "eval_models/scores.json").read_text())
SLOTS = [s["id"] for s in json.loads((ROOT / "assets/props.json").read_text())["slots"]]
BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
REG = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
F = lambda size, bold=True: ImageFont.truetype(BOLD if bold else REG, size)


def header(d, x, v, w):
    _, title, sub, _, _, col = v
    d.rectangle((x, 0, x + w, 8), fill=col)
    d.text((x + 16, 14), f"{title}｜盲評 {SCORES['total'][v[0]]:.1f}", font=F(30), fill="black")
    d.text((x + 16, 54), sub, font=F(20, False), fill="#555")


def scenes():
    for cam in ["wide", "beach", "closeup"]:
        w, h = 1280, 720
        c = Image.new("RGB", (w * 3, h + 90), "white")
        d = ImageDraw.Draw(c)
        for i, v in enumerate(VARIANTS):
            c.paste(Image.open(v[3] / f"{cam}.png").convert("RGB").resize((w, h)), (i * w, 90))
            header(d, i * w, v, w)
        c.save(ROOT / f"compare/models_{cam}.png")
    cell = 300
    c = Image.new("RGB", (200 + cell * len(SLOTS), 50 + cell * 3), "white")
    d = ImageDraw.Draw(c)
    for j, s in enumerate(SLOTS):
        d.text((200 + j * cell + 10, 10), s, font=F(26), fill="black")
    for i, v in enumerate(VARIANTS):
        d.text((14, 50 + i * cell + 110), v[1], font=F(30), fill=v[5])
        for j, s in enumerate(SLOTS):
            p = v[3] / "props" / f"{s}.png"
            if p.exists():
                c.paste(Image.open(p).convert("RGB").resize((cell, cell)), (200 + j * cell, 50 + i * cell))
    c.save(ROOT / "compare/models_props.png")


def info():
    im = Image.new("RGB", (960, 540), (18, 24, 32))
    d = ImageDraw.Draw(im)
    d.text((40, 30), "同一份需求、同一套流程，換 AI 模型", font=F(38), fill="white")
    d.text((40, 90), "底座 → 第二輪意見 → A 組程序化物件 → 水面升級", font=F(24, False), fill=(190, 200, 210))
    y = 150
    for v in VARIANTS:
        code, title, sub, _, _, col = v
        sc = SCORES["total"][code]
        d.text((40, y), title, font=F(30), fill=col)
        d.rounded_rectangle((300, y + 4, 300 + int(sc / 10 * 520), y + 36), 6, fill=col)
        d.text((300 + int(sc / 10 * 520) + 10, y + 20), f"{sc:.1f}", font=F(28), fill="white", anchor="lm")
        d.text((40, y + 46), sub, font=F(20, False), fill=(170, 180, 190))
        y += 120
    d.text((40, 505), "盲評：codex 匿名評分 3 輪平均（1–10），三輪排名皆 Opus > codex 第二輪 > codex 第一輪", font=F(17, False), fill=(140, 150, 160))
    return im


def label(im, v):
    d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((16, 16, 48 + d.textlength(v[1], font=F(32)), 74), 12, fill=v[5] + (230,))
    d.text((32, 45), v[1], font=F(32), fill="white", anchor="lm")
    return im


def video():
    n = min(len(list((ROOT / "video/frames" / v[4]).glob("*.jpg"))) for v in VARIANTS)
    out = ROOT / "video/water_models.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1920x1080", "-r", "30",
                           "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)],
                          stdin=subprocess.PIPE)
    assert ff.stdin
    pane = info()
    for f in range(n):
        frame = Image.new("RGB", (1920, 1080))
        for v, xy in zip(VARIANTS, [(0, 0), (960, 0), (0, 540)]):
            frame.paste(label(Image.open(ROOT / "video/frames" / v[4] / f"{f:05d}.jpg").convert("RGB").resize((960, 540)), v), xy)
        frame.paste(pane, (960, 540))
        ff.stdin.write(frame.tobytes())
    ff.stdin.close()
    ff.wait()
    print(out, n / 30, "s")


if __name__ == "__main__":
    scenes()
    video()
