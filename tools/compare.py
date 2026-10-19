"""把各組同鏡頭截圖並排成對照圖，標註組別、耗時與花費。

用法：python3 tools/compare.py [A B C]   → compare/<鏡頭>.png
耗時取自 timing.csv（各組 seconds 加總，base 步驟另列），花費取自 assets/tripo/log.csv。
"""
import csv, sys
from collections import defaultdict
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
CAMS = ["wide", "beach", "closeup"]
NAMES = {"A": "A｜codex 程序化", "B": "B｜Tripo AI", "C": "C｜免費素材庫", "D": "D｜社群 prompt 一次生成"}
FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"


def minutes_by_group():
    t = defaultdict(int)
    p = ROOT / "timing.csv"
    if p.exists():
        for r in csv.DictReader(p.open()):
            t[r["group"]] += int(r["seconds"])
    return t


def tripo_credits():
    p = ROOT / "assets" / "tripo" / "log.csv"
    if not p.exists():
        return ""
    rows = [r for r in csv.DictReader(p.open()) if r["credits"] and not r["slot"].startswith("character")]
    main = sum(float(r["credits"]) for r in rows if "__" not in r["slot"])
    trial = sum(float(r["credits"]) for r in rows if "__" in r["slot"])
    return f"{main:.0f}（另試生成 {trial:.0f}）" if rows else ""


def main(groups):
    secs = minutes_by_group()
    credits = tripo_credits()
    font = ImageFont.truetype(FONT, 30)
    small = ImageFont.truetype(FONT, 22)
    out = ROOT / "compare"
    out.mkdir(exist_ok=True)
    for cam in CAMS:
        tiles = [(g, ROOT / "shots" / g / f"{cam}.png") for g in groups]
        tiles = [(g, p) for g, p in tiles if p.exists()]
        if not tiles:
            continue
        w, h = Image.open(tiles[0][1]).size
        bar = 70
        canvas = Image.new("RGB", (w * len(tiles), h + bar), "white")
        d = ImageDraw.Draw(canvas)
        for i, (g, p) in enumerate(tiles):
            canvas.paste(Image.open(p).convert("RGB").resize((w, h)), (i * w, bar))
            d.text((i * w + 16, 6), NAMES.get(g, g), font=font, fill="black")
            info = f"耗時 {(secs[g] + secs['base']) / 60:.0f} 分（底座 {secs['base'] / 60:.0f}）"
            if g == "B" and credits:
                info += f"｜Tripo {credits} 點"
            d.text((i * w + 16, 42), info, font=small, fill="#555")
        canvas.save(out / f"{cam}.png")
        print(out / f"{cam}.png")


if __name__ == "__main__":
    main(sys.argv[1:] or ["A", "B", "C"])
