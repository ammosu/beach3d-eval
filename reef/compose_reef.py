"""Reef Lagoon 兩版對照影片：片頭 → 左右並排（同一虛擬時間、同一操作表）→ 結果卡。
用法：python3 reef/compose_reef.py  → video/reef_compare.mp4（讀 video/frames/reef_{codex,opus}/）"""
import glob
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = os.path.join(ROOT, "video/frames")
OUT = os.path.join(FR, "reef_compose")
W, H, FPS = 1920, 1080, 30
BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
REG = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
F = lambda size, bold=True: ImageFont.truetype(BOLD if bold else REG, size)
BG = (14, 22, 30)

# 與 record.mjs 的 TIMELINE 對應（虛擬秒數 → 字幕）
CAPTIONS = [
    (0, "開場：兩隻海豚、海龜、鯊魚、蝠鱝在游，1 秒後座頭鯨躍出水面"),
    (7, "按 1　大白鯊：垂直切入（Knifes straight in）"),
    (10.5, "按 2　槌頭鯊：螺旋翻滾入水（Corkscrew dive）"),
    (14, "按 3　座頭鯨：翻背拍水（Backflop breach）"),
    (19, "按 4　虎鯨：側身落水（Lands on its side）"),
    (23, "按 5　海豚：弧線入水（Clean arc dive）"),
    (26, "按 6　海龜：腹部拍水（Belly plop）"),
    (29, "按 7　蝠鱝：前空翻拍翅（Wing slap）"),
    (34, "按 R　下雨：雨絲、雨滴波紋、陽光變暗"),
    (38, "按 W　漩渦：螺旋泡沫，把生物捲進去"),
]
PANES = [("codex", "codex（gpt-6-astra，推理 high）", "11 分 37 秒"),
         ("opus", "Opus 5.5", "33 分 24 秒・$7.47")]
PW, PH = 912, 513
PX = [32, W - 32 - PW]
PY = 210


def caption_at(t):
    return [c for s, c in CAPTIONS if s <= t][-1]


def title_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 330), "Reef Lagoon：codex vs Opus", font=F(76), fill="white", anchor="mm")
    d.text((W // 2, 440), "同一份 prompt（約 1.2 萬字元），各自從零寫出單一 HTML 檔：俯視潟湖，丟海洋生物入水", font=F(34, False), fill=(190, 200, 210), anchor="mm")
    for (key, name, cost), x in zip(PANES, PX):
        d.text((x + PW // 2, 590), name, font=F(44), fill="white", anchor="mm")
        d.text((x + PW // 2, 650), "用時 " + cost, font=F(32, False), fill=(160, 175, 190), anchor="mm")
    d.text((W // 2, 820), "錄影用虛擬時鐘逐格推進：兩邊時間、亂數種子、按鍵時間表完全相同", font=F(30, False), fill=(140, 150, 160), anchor="mm")
    return im


def end_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 110), "比較", font=F(64), fill="white", anchor="mm")
    cols = [700, 1300]
    rows = [
        ("用時", ["11 分 37 秒", "33 分 24 秒"]),
        ("費用", ["約 99 萬 input token（92 萬快取）", "API 換算 $7.47"]),
        ("檔案", ["63 KB・200 行（壓得很密）", "133 KB・2329 行"]),
        ("水色與深度", ["淺綠松色，深淺不明顯", "淺綠到深藍，有深度感"]),
        ("生物辨識度", ["高：斑紋、胸鰭清楚", "較素，深水中較難辨認"]),
        ("漩渦", ["淡淡一圈，幾乎看不到", "明顯的螺旋泡沫臂"]),
        ("介面", ["毛玻璃、襯線字，附描述", "完整，含 Hide UI 按鈕"]),
    ]
    for (key, name, _), x in zip(PANES, cols):
        d.text((x, 225), name, font=F(36), fill="white", anchor="mm")
    for i, (label, vals) in enumerate(rows):
        y = 310 + i * 76
        d.text((120, y), label, font=F(34, False), fill=(170, 180, 190), anchor="lm")
        for v, x in zip(vals, cols):
            d.text((x, y), v, font=F(32), fill="white", anchor="mm")
    d.text((120, 900), "・兩邊都沒做到：prompt 要求暖色珊瑚（赭／紫／黃），結果都以墨綠為主", font=F(32, False), fill=(230, 200, 150), anchor="lm")
    d.text((120, 960), "・兩邊各自回報自測通過：7 種入水方式、下雨、漩渦、手機版、WebGL1 均無錯誤", font=F(32, False), fill="white", anchor="lm")
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*.png")):
        os.remove(f)
    frames = {k: sorted(glob.glob(os.path.join(FR, f"reef_{k}", "f_*.png"))) for k, _, _ in PANES}
    n = min(len(v) for v in frames.values())
    idx = 0

    def emit(im, count=1):
        nonlocal idx
        for _ in range(count):
            im.save(os.path.join(OUT, f"c_{idx:05d}.png"), compress_level=1)
            idx += 1

    emit(title_card(), 4 * FPS)
    base = Image.new("RGB", (W, H), BG)
    bd = ImageDraw.Draw(base)
    bd.text((W // 2, 60), "Reef Lagoon：同一份 prompt，codex vs Opus", font=F(44), fill="white", anchor="mm")
    for (key, name, cost), x in zip(PANES, PX):
        bd.text((x, PY - 30), name, font=F(34), fill="white", anchor="lm")
        bd.text((x + PW, PY - 30), cost, font=F(26, False), fill=(160, 175, 190), anchor="rm")
    for i in range(n):
        im = base.copy()
        for (key, _, _), x in zip(PANES, PX):
            im.paste(Image.open(frames[key][i]).resize((PW, PH), Image.Resampling.LANCZOS), (x, PY))
        d = ImageDraw.Draw(im)
        t = i / FPS
        d.text((W // 2, PY + PH + 110), caption_at(t), font=F(42), fill="white", anchor="mm")
        d.text((W - PX[0], H - 50), f"t = {t:4.1f} s", font=F(26, False), fill=(120, 130, 140), anchor="rm")
        emit(im)
    emit(end_card(), 8 * FPS)
    out = os.path.join(ROOT, "video/reef_compare.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(OUT, "c_%05d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", out], check=True)
    print(out, idx, "frames")


if __name__ == "__main__":
    main()
