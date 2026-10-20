"""三組角色走位並排：video/frames/walk_{A,B,C}/ → video/walk_abc.mp4（1920×360，投影片「角色在場景中移動」頁）。
用法：
  node scripts/record-walk.mjs <A|B|C>   （三組各錄一次）
  python3 tools/make_walk.py"""
import glob
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = os.path.join(ROOT, "video/frames")
OUT = os.path.join(FR, "walk_compose")
PW, PH, FPS = 640, 360, 30
FONT = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 28)
# 與投影片的 --codex／--tripo／--library 同色
PANES = [("A", "A｜codex 寫程式角色", (240, 150, 60)), ("B", "B｜Tripo 角色", (70, 150, 240)),
         ("C", "C｜素材庫角色（Quaternius）", (90, 190, 110))]


def label(im, text, color):
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = d.textbbox((22, 14), text, font=FONT)
    d.rounded_rectangle((10, 10, x1 + 12, y1 + 10), radius=8, fill=color)
    d.text((22, 14), text, font=FONT, fill="white")


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*.png")):
        os.remove(f)
    frames = {g: sorted(glob.glob(os.path.join(FR, f"walk_{g}", "*.jpg"))) for g, _, _ in PANES}
    n = min(len(v) for v in frames.values())
    for i in range(n):
        im = Image.new("RGB", (PW * 3, PH))
        for k, (g, text, color) in enumerate(PANES):
            pane = Image.open(frames[g][i]).convert("RGB").resize((PW, PH), Image.Resampling.LANCZOS)
            label(pane, text, color)
            im.paste(pane, (k * PW, 0))
        im.save(os.path.join(OUT, f"c_{i:05d}.png"), compress_level=1)
    out = os.path.join(ROOT, "video", "walk_abc.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(OUT, "c_%05d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", out], check=True)
    print(out, n, "frames")


if __name__ == "__main__":
    main()
