"""外海觀察 A/B/C 對照影片：片頭 → 三組並排（同一虛擬時間、同一條船與鏡頭路線）→ 比較卡 → 素材出處卡。
用法：
  node scripts/record-game-opensea.mjs <A|B|C>   → video/frames/opensea_<g>/、video/opensea_<g>.json（每次觀察的時間）
  python3 tools/make_opensea.py                   → video/opensea_abc.mp4"""
import glob
import json
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = os.path.join(ROOT, "video/frames")
OUT = os.path.join(FR, "opensea_compose")
W, H, FPS = 1920, 1080, 30
BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
REG = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
F = lambda size, bold=True: ImageFont.truetype(BOLD if bold else REG, size)
BG = (14, 22, 30)
MUTED = (160, 175, 190)
COLORS = {"A": (120, 200, 160), "B": (240, 170, 90), "C": (140, 170, 240)}

# 與 scripts/record-game-opensea.mjs 的時間表對應（APPROACH = 7、TURN = 32）
CAPTIONS = [
    (0, "划向外海浮標，7 種動物在附近繞游"),
    (7, "停船，原地慢慢轉一圈看四周"),
    (8, "浮出水面、出現在畫面上時按 E 觀察"),
    (39, "7 種都觀察到了，划回岸邊"),
]
PANES = [
    ("A", "A　程序化（Opus 寫程式）", "0 元"),
    ("B", "B　Tripo 生成", "200 點・約 $2"),
    ("C", "C　免費素材庫", "0 元・CC BY 需標註"),
]
PW, PH = 818, 460
POS = [(40, 95), (W - 40 - PW, 95), (40, 95 + PH + 50)]
INFO = (POS[1][0], POS[2][1])  # 右下格放字幕與進度
ROWS = [
    ("模型來源", ["Opus 寫的放樣曲面＋頂點色", "Tripo v3.1 文字生成", "Sketchfab 7 件"]),
    ("取得時間", ["移植 Reef Lagoon 的程式", "沿用 Reef Lagoon 生成的模型", "搜尋、挑選、匯入、烘骨架"]),
    ("成本", ["0", "200 點（槌頭鯊重做 3 次）", "0，但要標註作者"]),
    ("每件面數", ["程序化幾何（無貼圖）", "1.6 萬面（Blender 減面）", "最多 1.6 萬面（減面）"]),
    ("後製", ["不需要", "轉正、正規化", "轉正、正規化；蝠鱝含細長尾巴"]),
    ("外觀", ["卡通、配色統一", "寫實貼圖、風格一致", "寫實，但蝠鱝單色無花紋"]),
]
NOTES = [
    ("・三組共用同一片海、同一套游動與換氣、躍身動作；模型都正規化成頭朝 +X、長度＝1，再依物種大小縮放", "white"),
    ("・水面不透明，只看得到露出水面的部分：是否「看得到」依各組模型實際的最高點判斷，所以按 E 的時間可能不同", (230, 200, 150)),
]
CREDITS = [
    ("大白鯊", "\"Great White Shark\" by Mehrus"),
    ("槌頭鯊", "\"Hammerhead Shark\" by kenchoo"),
    ("座頭鯨", "\"Game-ready Humpback Whale\" by Allie2k"),
    ("虎鯨", "\"Orca Killer Whale\" by LostPlaces"),
    ("海豚", "\"Bottlenose Dolphin\" by popcornbag"),
    ("海龜", "\"Sea turtle low poly\" by C.J..Goldman"),
    ("蝠鱝", "\"Manta Ray\" by s4306270"),
]


def caption_at(t):
    return [c for s, c in CAPTIONS if s <= t][-1]


def title_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 300), "外海觀察：三種模型來源", font=F(76), fill="white", anchor="mm")
    d.text((W // 2, 410), "同一個遊戲任務（划船到浮標、等牠們浮出水面按 E），只換 7 種海洋生物的模型來源", font=F(34, False), fill=(190, 200, 210), anchor="mm")
    for i, (g, name, cost) in enumerate(PANES):
        x = W // 2 + (i - 1) * 560
        d.text((x, 570), name, font=F(40), fill=COLORS[g], anchor="mm")
        d.text((x, 630), cost, font=F(30, False), fill=MUTED, anchor="mm")
    d.text((W // 2, 800), "大白鯊・槌頭鯊・座頭鯨・虎鯨・海豚・海龜・蝠鱝", font=F(36), fill="white", anchor="mm")
    d.text((W // 2, 880), "錄影用固定時鐘逐格推進：三組時間、船與鏡頭路線完全相同", font=F(30, False), fill=(140, 150, 160), anchor="mm")
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
        d.text((90, 860 + i * 60), text, font=F(26, False), fill=color, anchor="lm")
    return im


def credits_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 130), "C 組素材出處", font=F(60), fill="white", anchor="mm")
    for i, (name, work) in enumerate(CREDITS):
        y = 260 + i * 85
        d.text((140, y), name, font=F(36), fill=COLORS["C"], anchor="lm")
        d.text((330, y), work, font=F(34, False), fill="white", anchor="lm")
        d.text((1780, y), "Sketchfab・CC BY", font=F(30, False), fill=MUTED, anchor="rm")
    d.text((W // 2, 920), "經 Blender 烘成靜態網格、正規化、減面；詳見 assets/sea/C/CREDITS.md", font=F(30, False), fill=(140, 150, 160), anchor="mm")
    d.text((W // 2, 975), "B 組：Tripo v3.1 生成（使用者付費點數）；A 組：Opus 寫程式產生", font=F(30, False), fill=(140, 150, 160), anchor="mm")
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*.png")):
        os.remove(f)
    frames = {g: sorted(glob.glob(os.path.join(FR, f"opensea_{g}", "*.png"))) for g, _, _ in PANES}
    seen = {g: [t for t, _ in json.load(open(os.path.join(ROOT, "video", f"opensea_{g}.json")))] for g, _, _ in PANES}
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
    bd.text((INFO[0] + PW // 2, INFO[1] + 40), "外海觀察：同一片海，只換生物模型", font=F(40), fill="white", anchor="mm")
    for (g, name, cost), (x, y) in zip(PANES, POS):
        bd.text((x, y - 22), name, font=F(28), fill=COLORS[g], anchor="lm")
        bd.text((x + PW, y - 22), cost, font=F(24, False), fill=MUTED, anchor="rm")
    for i in range(n):
        im = base.copy()
        for (g, _, _), pos in zip(PANES, POS):
            im.paste(Image.open(frames[g][i]).convert("RGB").resize((PW, PH), Image.Resampling.LANCZOS), pos)
        d = ImageDraw.Draw(im)
        t = i / FPS
        cx, cy = INFO[0] + PW // 2, INFO[1] + 175
        d.text((cx, cy - 40), caption_at(t), font=F(36), fill="white", anchor="mm")
        d.text((cx, cy + 20), "三組同一時間、同一條船與鏡頭路線", font=F(26, False), fill=MUTED, anchor="mm")
        for k, (g, _, _) in enumerate(PANES):
            x = INFO[0] + 140 + k * 270
            d.text((x, cy + 115), g, font=F(34), fill=COLORS[g], anchor="mm")
            d.text((x, cy + 170), f"{sum(s <= t for s in seen[g])} / 7", font=F(34, False), fill="white", anchor="mm")
        d.text((INFO[0] + PW, INFO[1] + PH - 10), f"t = {t:4.1f} s", font=F(26, False), fill=(120, 130, 140), anchor="rm")
        emit(im)
    emit(end_card(), 8 * FPS)
    emit(credits_card(), 6 * FPS)
    out = os.path.join(ROOT, "video", "opensea_abc.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(OUT, "c_%05d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", out], check=True)
    print(out, idx, "frames")


if __name__ == "__main__":
    main()
