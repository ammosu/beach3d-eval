"""潮池 A/B/C 對照影片：片頭 → 三組並排（同一虛擬時間、同一操作表）→ 比較卡 → 素材出處卡。
用法：
  node scripts/record-tidepool.mjs <A|B|C> 30   → video/frames/tidepool_<g>/
  python3 tools/make_tidepool.py                 → video/tidepool_abc.mp4"""
import glob
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = os.path.join(ROOT, "video/frames")
OUT = os.path.join(FR, "tidepool_compose")
W, H, FPS = 1920, 1080, 30
BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
REG = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
F = lambda size, bold=True: ImageFont.truetype(BOLD if bold else REG, size)
BG = (14, 22, 30)
MUTED = (160, 175, 190)
COLORS = {"A": (120, 200, 160), "B": (240, 170, 90), "C": (140, 170, 240)}

# 與 scripts/record-tidepool.mjs 的 TIMELINE 對應（虛擬秒數 → 字幕）
CAPTIONS = [
    (0, "看得見的：海葵、海膽在岩石上，海星在池底"),
    (2, "點生物觀察：海星，記入圖鑑"),
    (4.3, "海葵：觸手隨水流擺動"),
    (6.6, "海膽：棘刺會慢慢轉動"),
    (9, "翻石頭：小石頭下也是小動物的家"),
    (9.8, "石頭下有寄居蟹"),
    (13.1, "再翻：小章魚躲在石頭下，變色後滑到旁邊"),
    (17, "翻開剩下的石頭，找到海蛞蝓"),
    (19.4, "6 種都記入圖鑑，完成"),
]
PANES = [
    ("A", "A　程序化（codex 寫程式）", "0 元"),
    ("B", "B　Tripo 生成", "120 點・約 $1.2"),
    ("C", "C　免費素材庫", "0 元・CC BY 需標註"),
]
PW, PH = 818, 460
POS = [(40, 95), (W - 40 - PW, 95), (40, 95 + PH + 50)]
INFO = (POS[1][0], POS[2][1])  # 右下格放字幕
ROWS = [
    ("模型來源", ["codex 寫的幾何＋材質", "Tripo v3.1 文字生成", "Sketchfab 2 件＋Poly Pizza 4 件"]),
    ("取得時間", ["含在寫潮池的程式裡", "6 件並行，每件 2–3.5 分鐘", "搜尋、挑選、匯入"]),
    ("成本", ["0", "120 點（約 $1.2）", "0，但要標註作者"]),
    ("每件面數", ["程序化幾何（無貼圖）", "1.2 萬面（Blender 減面）", "260～1.2 萬面"]),
    ("後製", ["不需要", "轉正、正規化", "海星拆三隻留一隻、寄居蟹轉正"]),
    ("外觀", ["卡通、配色統一", "寫實貼圖，風格最一致", "風格不一：章魚無貼圖、站姿"]),
]
NOTES = [
    ("・三組共用同一個潮池場景與玩法；模型都正規化成頭朝 +X、底在地面、水平最長邊＝1，再依物種大小縮放", "white"),
    ("・素材庫最難找的是「符合需求」：海星原檔是三隻一組，章魚是站立姿勢，和池底的趴姿不合", (230, 200, 150)),
]
CREDITS = [
    ("寄居蟹", "\"Little Hermit Crab\" by allegory.fake", "Sketchfab", "CC BY 4.0"),
    ("海蛞蝓", "\"Felimida Britoi\" by israelfernandez", "Sketchfab", "CC BY 4.0"),
    ("海星", "\"Starfish\" by Poly by Google", "poly.pizza/m/6H-0K9IEr56", "CC BY 3.0"),
    ("海葵", "\"Sea anemone\" by Poly by Google", "poly.pizza/m/5mWGVL6VgMd", "CC BY 3.0"),
    ("海膽", "\"Sea Urchin\" by Poly by Google", "poly.pizza/m/f4iwEhEP3-d", "CC BY 3.0"),
    ("小章魚", "\"Octopus\" by Poly by Google", "poly.pizza/m/9F8QJKUT77V", "CC BY 3.0"),
]


def caption_at(t):
    return [c for s, c in CAPTIONS if s <= t][-1]


def title_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 300), "潮池：三種模型來源", font=F(76), fill="white", anchor="mm")
    d.text((W // 2, 410), "同一個潮池小遊戲（翻石頭、記圖鑑），只換 6 種潮間帶生物的模型來源", font=F(34, False), fill=(190, 200, 210), anchor="mm")
    for i, (g, name, cost) in enumerate(PANES):
        x = W // 2 + (i - 1) * 560
        d.text((x, 570), name, font=F(40), fill=COLORS[g], anchor="mm")
        d.text((x, 630), cost, font=F(30, False), fill=MUTED, anchor="mm")
    d.text((W // 2, 800), "寄居蟹・海星・海葵・海膽・小章魚・海蛞蝓", font=F(36), fill="white", anchor="mm")
    d.text((W // 2, 880), "錄影用固定時鐘逐格推進：三組時間、操作時間表完全相同", font=F(30, False), fill=(140, 150, 160), anchor="mm")
    return im


def end_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 100), "比較", font=F(64), fill="white", anchor="mm")
    cols = [690, 1150, 1610]
    for (g, name, _), x in zip(PANES, cols):
        d.text((x, 210), name, font=F(32), fill=COLORS[g], anchor="mm")
    for i, (label, vals) in enumerate(ROWS):
        y = 300 + i * 82
        d.text((90, y), label, font=F(32, False), fill=(170, 180, 190), anchor="lm")
        for v, x in zip(vals, cols):
            d.text((x, y), v, font=F(28), fill="white", anchor="mm")
    for i, (text, color) in enumerate(NOTES):
        d.text((90, 860 + i * 60), text, font=F(28, False), fill=color, anchor="lm")
    return im


def credits_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 130), "C 組素材出處", font=F(60), fill="white", anchor="mm")
    for i, (name, work, src, lic) in enumerate(CREDITS):
        y = 280 + i * 95
        d.text((140, y), name, font=F(36), fill=COLORS["C"], anchor="lm")
        d.text((330, y), work, font=F(34, False), fill="white", anchor="lm")
        d.text((1080, y), src, font=F(30, False), fill=MUTED, anchor="lm")
        d.text((1780, y), lic, font=F(30, False), fill=MUTED, anchor="rm")
    d.text((W // 2, 920), "經 Blender 正規化、減面；海星原檔三隻只取一隻，寄居蟹轉向", font=F(30, False), fill=(140, 150, 160), anchor="mm")
    d.text((W // 2, 975), "B 組：Tripo v3.1 生成（使用者付費點數）；A 組：codex 寫程式產生", font=F(30, False), fill=(140, 150, 160), anchor="mm")
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*.png")):
        os.remove(f)
    frames = {g: sorted(glob.glob(os.path.join(FR, f"tidepool_{g}", "f_*.png"))) for g, _, _ in PANES}
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
    bd.text((W // 2, 40), "潮池：同一個場景，只換生物模型", font=F(40), fill="white", anchor="mm")
    for (g, name, cost), (x, y) in zip(PANES, POS):
        bd.text((x, y - 22), name, font=F(28), fill=COLORS[g], anchor="lm")
        bd.text((x + PW, y - 22), cost, font=F(24, False), fill=MUTED, anchor="rm")
    for i in range(n):
        im = base.copy()
        for (g, _, _), pos in zip(PANES, POS):
            im.paste(Image.open(frames[g][i]).convert("RGB").resize((PW, PH), Image.Resampling.LANCZOS), pos)
        d = ImageDraw.Draw(im)
        t = i / FPS
        cx, cy = INFO[0] + PW // 2, INFO[1] + PH // 2
        d.text((cx, cy - 40), caption_at(t), font=F(38), fill="white", anchor="mm")
        d.text((cx, cy + 40), "三組同一時間、同一組操作", font=F(26, False), fill=MUTED, anchor="mm")
        d.text((INFO[0] + PW, INFO[1] + PH - 10), f"t = {t:4.1f} s", font=F(26, False), fill=(120, 130, 140), anchor="rm")
        emit(im)
    emit(end_card(), 8 * FPS)
    emit(credits_card(), 6 * FPS)
    out = os.path.join(ROOT, "video", "tidepool_abc.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(OUT, "c_%05d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", out], check=True)
    print(out, idx, "frames")


if __name__ == "__main__":
    main()
