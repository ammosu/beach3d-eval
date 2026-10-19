"""各物件由遠拉近：5 種來源同一鏡頭並排（3×2 格，第 6 格是物件名稱與需求）。

用法：python3 tools/make_zoom.py   → slides/assets/zoom_props.mp4
先錄影格：video/frames/zoom/<來源>/<slot>/%05d.jpg（scripts/record-path.mjs，每件 4 秒同一條鏡頭路徑）。
"""
import json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = [("codex1", "codex 寫程式（低推理）", (240, 150, 60)), ("codex2", "codex 寫程式（高推理）", (240, 150, 60)),
       ("opus", "Opus 寫程式", (150, 110, 220)), ("tripo", "Tripo AI", (70, 150, 240)), ("library", "免費素材庫", (90, 190, 110))]
NAMES = {"palm_tall": "高椰子樹", "palm_pair": "雙椰子樹", "rocks": "黑色火山岩", "boat": "褪色藍漆小船", "hut": "茅草高腳屋",
         "umbrella": "草編陽傘＋兩張躺椅", "driftwood": "漂流木", "lifeguard": "紅白救生塔"}
SLOTS = json.loads((ROOT / "assets/props.json").read_text())["slots"]
B = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
R = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
F = lambda s, b=True: ImageFont.truetype(B if b else R, s)
PW, PH = 640, 360


def info(slot, k):
    im = Image.new("RGB", (PW, PH), (18, 24, 32))
    d = ImageDraw.Draw(im)
    d.text((30, 26), f"{k + 1} / {len(SLOTS)}", font=F(22, False), fill=(150, 160, 170))
    d.text((30, 64), NAMES[slot["id"]], font=F(46), fill="white")
    words, line, y = slot["prompt"].split(), "", 140
    for w in words:  # 英文需求自動換行
        if d.textlength(line + " " + w, font=F(22, False)) > PW - 60:
            d.text((30, y), line.strip(), font=F(22, False), fill=(190, 200, 210)); y += 32; line = ""
        line += " " + w
    d.text((30, y), line.strip(), font=F(22, False), fill=(190, 200, 210))
    d.text((30, PH - 44), "同一條鏡頭路徑，由遠拉近", font=F(20, False), fill=(140, 150, 160))
    return im


def label(im, name, col):
    d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((10, 10, 34 + d.textlength(name, font=F(26)), 52), 10, fill=col + (225,))
    d.text((22, 31), name, font=F(26), fill="white", anchor="lm")
    return im


def main():
    out = ROOT / "slides/assets/zoom_props.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{PW*3}x{PH*2}",
                           "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", "25", "-preset", "slow", "-pix_fmt", "yuv420p",
                           "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
    assert ff.stdin
    for k, s in enumerate(SLOTS):
        pane = info(s, k)
        n = min(len(list((ROOT / f"video/frames/zoom/{src}/{s['id']}").glob("*.jpg"))) for src, _, _ in SRC)
        for f in range(n):
            c = Image.new("RGB", (PW * 3, PH * 2))
            for i, (src, name, col) in enumerate(SRC):
                im = Image.open(ROOT / f"video/frames/zoom/{src}/{s['id']}/{f:05d}.jpg").convert("RGB").resize((PW, PH))
                c.paste(label(im, name, col), ((i % 3) * PW, (i // 3) * PH))
            c.paste(pane, (PW * 2, PH))
            ff.stdin.write(c.tobytes())
    ff.stdin.close()
    ff.wait()
    print(out)


if __name__ == "__main__":
    main()
