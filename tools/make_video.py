"""合成約 60 秒對照影片：片頭 → A/B/C 同路徑四宮格（第四格是說明＋盲評分）→ 結論表。

用法：python3 tools/make_video.py   → video/compare.mp4
先跑 node scripts/record-path.mjs A|B|C 產生 video/frames/<組>/；文字取 video/path.json，數字取 report/stats.json、eval/scores.json。
"""
import json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PATH = json.loads((ROOT / "video/path.json").read_text())
STATS = json.loads((ROOT / "report/stats.json").read_text())
SCORES = json.loads((ROOT / "eval/scores.json").read_text())
SLOTS = {s["id"]: s for s in json.loads((ROOT / "assets/props.json").read_text())["slots"]}
FPS, W, H = PATH["fps"], 1920, 1080
TITLE_S, END_S, FADE = 4, 8, 0.5
GROUPS = {"A": ("A｜codex 程序化", (240, 150, 60)), "B": ("B｜Tripo AI", (70, 150, 240)), "C": ("C｜免費素材庫", (90, 190, 110))}
BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
REG = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
F = lambda size, bold=True: ImageFont.truetype(BOLD if bold else REG, size)
BG = (18, 24, 32)
NAMES = {"palm_tall": "椰子樹", "driftwood": "漂流木", "hut": "茅草高腳屋", "umbrella": "草編陽傘", "boat": "小船", "rocks": "火山岩", "lifeguard": "救生塔"}


def title_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 300), "AI 做 3D 海邊場景：物件從哪來差多少？", font=F(72), fill="white", anchor="mm")
    d.text((W // 2, 410), "同一個 codex 寫的底座（海、天空、沙灘、光線），只換 8 件物件的來源", font=F(36, False), fill=(190, 200, 210), anchor="mm")
    for i, g in enumerate("ABC"):
        name, col = GROUPS[g]
        x = W // 2 + (i - 1) * 520
        d.rounded_rectangle((x - 230, 520, x + 230, 640), 18, fill=col)
        d.text((x, 580), name, font=F(44), fill="white", anchor="mm")
    d.text((W // 2, 760), "鏡頭路徑三組完全相同・評分為 codex 匿名盲評 3 輪平均（1–10）", font=F(30, False), fill=(150, 160, 170), anchor="mm")
    return im


def end_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 110), "結果", font=F(64), fill="white", anchor="mm")
    cols = [520, 980, 1440]
    rows = [("物件耗時", lambda g: f"{STATS['groups'][g]['minutes']:.0f} 分"),
            ("花費", lambda g: {"A": "0（codex 額度）", "B": "Tripo 140 點", "C": "0（需標作者）"}[g]),
            ("盲評總分", lambda g: f"{SCORES['total'][g]:.1f}"),
            ("符合需求", lambda g: f"{SCORES['criteria'][g]['match']:.1f}"),
            ("物件質感", lambda g: f"{SCORES['criteria'][g]['realism']:.1f}")]
    for x, g in zip(cols, "ABC"):
        name, col = GROUPS[g]
        d.rounded_rectangle((x - 210, 190, x + 210, 260), 14, fill=col)
        d.text((x, 225), name, font=F(36), fill="white", anchor="mm")
    for i, (label, fn) in enumerate(rows):
        y = 320 + i * 82
        d.text((150, y), label, font=F(36, False), fill=(170, 180, 190), anchor="lm")
        for x, g in zip(cols, "ABC"):
            d.text((x, y), fn(g), font=F(42 if label == "盲評總分" else 36), fill="white", anchor="mm")
    d.line((120, 760, W - 120, 760), fill=(60, 70, 80), width=2)
    lines = ["Tripo：8 件全部最高分，但每件要 2–3 分鐘＋點數，還得減面（原始約 147 萬面）",
             "codex 程序化：免費又快、風格統一；椰子樹、岩石這類自然形狀最弱",
             "免費素材庫：最快，但找不到符合需求的模型時只能將就，風格也拼湊"]
    for i, t in enumerate(lines):
        d.text((150, 810 + i * 70), "・" + t, font=F(34, False), fill="white", anchor="lm")
    return im


def info_pane(cap):
    im = Image.new("RGB", (960, 540), BG)
    d = ImageDraw.Draw(im)
    d.text((48, 40), cap["title"], font=F(52), fill="white")
    for i, line in enumerate(cap["text"].split("\n")):
        d.text((48, 125 + i * 48), line, font=F(34, False), fill=(200, 210, 220))
    items = [(NAMES[s] + "（盲評）", SCORES["props"][s]) for s in cap["slots"]] or [("三組盲評總分", SCORES["total"])]
    two = len(items) > 1
    y = 238 if two else 260
    for label, sc in items:
        d.text((48, y), label, font=F(24 if two else 26, False), fill=(150, 160, 170))
        y += 36
        for g in "ABC":
            col, bh = GROUPS[g][1], 24 if two else 30
            d.text((48, y + bh // 2), g, font=F(28), fill=col, anchor="lm")
            d.rounded_rectangle((90, y, 90 + int(sc[g] / 10 * 680), y + bh), 6, fill=col)
            d.text((90 + int(sc[g] / 10 * 680) + 12, y + bh // 2), f"{sc[g]:.1f}", font=F(26), fill="white", anchor="lm")
            y += 34 if two else 56
        y += 12
    return im


def label(im, g):
    d = ImageDraw.Draw(im, "RGBA")
    name, col = GROUPS[g]
    d.rounded_rectangle((16, 16, 48 + d.textlength(name, font=F(34)), 76), 12, fill=col + (230,))
    d.text((32, 46), name, font=F(34), fill="white", anchor="lm")
    return im


def fade(im, a):
    return Image.blend(Image.new("RGB", im.size, "black"), im, max(0.0, min(1.0, a)))


def main():
    n = len(list((ROOT / "video/frames/A").glob("*.jpg")))
    panes = {c["title"]: info_pane(c) for c in PATH["captions"]}
    out = ROOT / "video/compare.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
                           "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
    assert ff.stdin
    put = lambda im: ff.stdin.write(im.tobytes())
    tc, ec = title_card(), end_card()
    for f in range(TITLE_S * FPS):
        t = f / FPS
        put(fade(tc, min(t / FADE, (TITLE_S - t) / FADE)))
    for f in range(n):
        t = f / FPS
        frame = Image.new("RGB", (W, H))
        for g, xy in zip("ABC", [(0, 0), (960, 0), (0, 540)]):
            frame.paste(label(Image.open(ROOT / f"video/frames/{g}/{f:05d}.jpg").convert("RGB"), g), xy)
        cap = next((c for c in PATH["captions"] if c["from"] <= t < c["to"]), PATH["captions"][-1])
        frame.paste(panes[cap["title"]], (960, 540))
        put(fade(frame, min(t / FADE, (n / FPS - t) / FADE)))
    for f in range(END_S * FPS):
        t = f / FPS
        put(fade(ec, min(t / FADE, (END_S - t) / FADE)))
    ff.stdin.close()
    ff.wait()
    print(out, f"{TITLE_S + n / FPS + END_S:.1f}s")


if __name__ == "__main__":
    main()
