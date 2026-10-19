"""Reef Lagoon 對照影片：片頭 → 左右並排（同一虛擬時間、同一操作表）→ 結果卡。
用法：
  python3 reef/compose_reef.py          → video/reef_compare.mp4（codex vs Opus，讀 video/frames/reef_{codex,opus}/）
  python3 reef/compose_reef.py tripo    → video/reef_tripo.mp4（Opus 程序化 vs Opus＋Tripo，讀 reef_{opus,tripo}/）"""
import glob
import os
import subprocess
import sys

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
MODES = {
    "models": dict(
        out="reef_compare.mp4",
        title="Reef Lagoon：codex vs Opus",
        subtitle="同一份 prompt（約 1.2 萬字元），各自從零寫出單一 HTML 檔：俯視潟湖，丟海洋生物入水",
        header="Reef Lagoon：同一份 prompt，codex vs Opus",
        panes=[("codex", "codex（gpt-6-astra，推理 high）", "11 分 37 秒", "用時 11 分 37 秒"),
               ("opus", "Opus 5.5", "33 分 24 秒・$7.47", "用時 33 分 24 秒・$7.47")],
        rows=[
            ("用時", ["11 分 37 秒", "33 分 24 秒"]),
            ("費用", ["約 99 萬 input token（92 萬快取）", "API 換算 $7.47"]),
            ("檔案", ["63 KB・200 行（壓得很密）", "133 KB・2329 行"]),
            ("水色與深度", ["淺綠松色，深淺不明顯", "淺綠到深藍，有深度感"]),
            ("生物辨識度", ["高：斑紋、胸鰭清楚", "較素，深水中較難辨認"]),
            ("漩渦", ["淡淡一圈，幾乎看不到", "明顯的螺旋泡沫臂"]),
            ("介面", ["毛玻璃、襯線字，附描述", "完整，含 Hide UI 按鈕"]),
        ],
        notes=[("・兩邊都沒做到：prompt 要求暖色珊瑚（赭／紫／黃），結果都以墨綠為主", (230, 200, 150)),
               ("・兩邊各自回報自測通過：7 種入水方式、下雨、漩渦、手機版、WebGL1 均無錯誤", "white")],
    ),
    "tripo": dict(
        out="reef_tripo.mp4",
        title="Reef Lagoon：程序化 vs Tripo 模型",
        subtitle="同一個 Opus 寫的潟湖（水、行為、入水方式都相同），只把 7 種生物換成 Tripo 生成的模型",
        header="Reef Lagoon：同一個場景，只換生物模型",
        panes=[("opus", "程序化（Opus 寫程式）", "0 元", "放樣＋鰭片，shader 畫花紋"),
               ("tripo", "Tripo 模型", "200 點・約 $2", "7 件＋槌頭鯊重做 3 次，共 200 點")],
        rows=[
            ("模型來源", ["shader 與數學曲線", "Tripo v3.1 文字生成"]),
            ("成本", ["0（含在寫程式的 $7.47）", "200 點（約 $2）"]),
            ("每件面數", ["數千面", "1.6 萬面（原始約 147 萬面）"]),
            ("外觀", ["乾淨、卡通感", "寫實貼圖：龜殼、鯨魚斑點"]),
            ("動作", ["身體波動＋鰭各自轉動", "同一套身體波動；鰭以位置規則轉動"]),
            ("載入", ["133 KB 單檔", "＋7 個 GLB，共約 5 MB"]),
        ],
        notes=[("・Tripo 不支援魚類綁骨：沿用 shader 依身體位置算波動，模型只需轉正、正規化", "white"),
               ("・槌頭鯊最難：3 次重做才生成出槌狀頭（其中 2 次變成普通鯊魚）", (230, 200, 150))],
    ),
}
PW, PH = 912, 513
PX = [32, W - 32 - PW]
PY = 210


def caption_at(t):
    return [c for s, c in CAPTIONS if s <= t][-1]


def title_card(M):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 330), M["title"], font=F(76), fill="white", anchor="mm")
    d.text((W // 2, 440), M["subtitle"], font=F(34, False), fill=(190, 200, 210), anchor="mm")
    for (key, name, _, info), x in zip(M["panes"], PX):
        d.text((x + PW // 2, 590), name, font=F(44), fill="white", anchor="mm")
        d.text((x + PW // 2, 650), info, font=F(32, False), fill=(160, 175, 190), anchor="mm")
    d.text((W // 2, 820), "錄影用虛擬時鐘逐格推進：兩邊時間、亂數種子、按鍵時間表完全相同", font=F(30, False), fill=(140, 150, 160), anchor="mm")
    return im


def end_card(M):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((W // 2, 110), "比較", font=F(64), fill="white", anchor="mm")
    cols = [700, 1300]
    for (key, name, _, _), x in zip(M["panes"], cols):
        d.text((x, 225), name, font=F(36), fill="white", anchor="mm")
    for i, (label, vals) in enumerate(M["rows"]):
        y = 310 + i * 76
        d.text((120, y), label, font=F(34, False), fill=(170, 180, 190), anchor="lm")
        for v, x in zip(vals, cols):
            d.text((x, y), v, font=F(32), fill="white", anchor="mm")
    for i, (text, color) in enumerate(M["notes"]):
        d.text((120, 900 + i * 60), text, font=F(32, False), fill=color, anchor="lm")
    return im


def main():
    M = MODES[sys.argv[1] if len(sys.argv) > 1 else "models"]
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*.png")):
        os.remove(f)
    frames = {p[0]: sorted(glob.glob(os.path.join(FR, f"reef_{p[0]}", "f_*.png"))) for p in M["panes"]}
    n = min(len(v) for v in frames.values())
    idx = 0

    def emit(im, count=1):
        nonlocal idx
        for _ in range(count):
            im.save(os.path.join(OUT, f"c_{idx:05d}.png"), compress_level=1)
            idx += 1

    emit(title_card(M), 4 * FPS)
    base = Image.new("RGB", (W, H), BG)
    bd = ImageDraw.Draw(base)
    bd.text((W // 2, 60), M["header"], font=F(44), fill="white", anchor="mm")
    for (key, name, cost, _), x in zip(M["panes"], PX):
        bd.text((x, PY - 30), name, font=F(34), fill="white", anchor="lm")
        bd.text((x + PW, PY - 30), cost, font=F(26, False), fill=(160, 175, 190), anchor="rm")
    for i in range(n):
        im = base.copy()
        for (key, _, _, _), x in zip(M["panes"], PX):
            im.paste(Image.open(frames[key][i]).resize((PW, PH), Image.Resampling.LANCZOS), (x, PY))
        d = ImageDraw.Draw(im)
        t = i / FPS
        d.text((W // 2, PY + PH + 110), caption_at(t), font=F(42), fill="white", anchor="mm")
        d.text((W - PX[0], H - 50), f"t = {t:4.1f} s", font=F(26, False), fill=(120, 130, 140), anchor="rm")
        emit(im)
    emit(end_card(M), 8 * FPS)
    out = os.path.join(ROOT, "video", M["out"])
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(OUT, "c_%05d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", out], check=True)
    print(out, idx, "frames")


if __name__ == "__main__":
    main()
