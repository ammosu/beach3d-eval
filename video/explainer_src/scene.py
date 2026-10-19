"""解說影片：沒有 Tripo，AI 做 3D 場景就做不好嗎？

一句旁白＝一個畫面變化（self.say）。分數一律從 data.json 讀（來源見 data.json 的 *_source）。
"""
import glob
import json

import numpy as np
from PIL import Image

from manim import *

from explainer_lib import PALETTE, ExplainerScene, tx

D = json.load(open("data.json"))
GREY = PALETTE.get("neutral", "#BBBBBB")
ACC = PALETTE.get("accent", "#4696F0")
NAMES = {"tripo": "Tripo AI", "opus": "Opus 寫程式", "codex2": "codex 寫程式（高推理）",
         "codex1": "codex 寫程式（低推理）", "library": "免費素材庫"}
MODEL_NAMES = {"opus": "Opus 5.5", "codex2": "codex（GPU＋高推理）", "codex1": "codex（沙箱＋低推理）"}


def img(name, width):
    return ImageMobject(f"assets/{name}").scale_to_fit_width(width)


def bars(rows, value, label, top, unit_w=0.95, row_h=0.78, x0=-2.2):
    """橫條圖：rows 由上往下；回傳 (群組, {key: (條, 數字, 名稱)})。長度從 0 量起。"""
    grp, parts = VGroup(), {}
    for i, r in enumerate(rows):
        y = top - i * row_h
        name = tx(label(r), 26, GREY).move_to([x0 - 0.3, y, 0], aligned_edge=RIGHT)
        bar = Rectangle(width=value(r) * unit_w * 0.5, height=row_h * 0.62, stroke_width=0,
                        fill_color=GREY, fill_opacity=0.55).move_to([x0, y, 0], aligned_edge=LEFT)
        num = tx(f"{value(r):.1f}", 28, WHITE, BOLD).next_to(bar, RIGHT, buff=0.18)
        grp.add(name, bar, num)
        parts[r["key"]] = (bar, num, name)
    return grp, parts


def grow(parts):
    return [LaggedStart(*[AnimationGroup(GrowFromEdge(b, LEFT), FadeIn(n), FadeIn(nm)) for b, n, nm in parts.values()],
                        lag_ratio=0.18)]


def accent(parts, key, color=ACC):
    b, n, name = parts[key]
    return [b.animate.set_fill(color, opacity=1), name.animate.set_color(WHITE)]


class Explainer(ExplainerScene):
    def construct(self):
        # 問題：三組近景
        two = [("close_A.png", "沒有 Tripo（AI 寫程式）", PALETTE["codex"]), ("close_B.png", "有 Tripo", PALETTE["tripo"])]
        abc = Group(*[Group(tx(t, 30, c, BOLD), img(f, 6.5)).arrange(DOWN, buff=0.18) for f, t, c in two])
        abc.arrange(RIGHT, buff=0.3).shift(UP * 0.4)
        self.say("l01", [([LaggedStart(*[FadeIn(a) for a in abc], lag_ratio=0.5)], 0.45)])

        # 實驗：同一場景，只換物件
        wide = img("wide_B.png", 10.5).shift(UP * 0.35)
        tag = tx("同一個場景，只換 8 件物件", 30, WHITE, BOLD).next_to(wide, UP, buff=0.18)
        self.say("l02", [([FadeOut(abc), FadeIn(wide)], 0.3), ([FadeIn(tag, shift=DOWN * 0.1)], 0.2)])

        # 三種來源：同一艘小船的三個版本
        srcs = [("boat_A.png", "AI 寫程式", PALETTE["codex"]), ("boat_B.png", "Tripo 生成", PALETTE["tripo"]),
                ("boat_C.png", "免費素材庫", PALETTE["library"])]
        boats = Group(*[Group(img(f, 3.9), tx(t, 30, c, BOLD)).arrange(DOWN, buff=0.22) for f, t, c in srcs])
        boats.arrange(RIGHT, buff=0.45).shift(UP * 0.35)
        self.say("l03", [([FadeOut(wide), FadeOut(tag)], 0.15),
                         ([LaggedStart(*[FadeIn(b, shift=UP * 0.15) for b in boats], lag_ratio=0.45)], 0.6)])

        # 盲評：匿名物件總表
        grid = img("props_grid_anon.png", 9.4).shift(UP * 0.45)
        judge = tx("評審：codex、Opus（匿名・輪換順序）", 26, GREY).next_to(grid, UP, buff=0.12)
        self.say("l04", [([FadeOut(boats)], 0.15), ([FadeIn(grid), FadeIn(judge)], 0.35)])

        # 結果：五種物件來源（兩位評審平均）
        title = tx("物件盲評（兩位評審平均，1–10 分）", 30, WHITE, BOLD).to_edge(UP, buff=0.45)
        chart, parts = bars(D["props"], lambda r: r["avg"], lambda r: NAMES[r["key"]], top=2.1)
        self.say("l05", [([FadeOut(grid), FadeOut(judge), FadeIn(title)], 0.15), (grow(parts), 0.45),
                         (accent(parts, "tripo"), 0.15)])

        # AI 寫程式只差 0.3
        gap = D["props"][0]["avg"] - D["props"][1]["avg"]
        n1, n2 = parts["opus"][1], parts["codex2"][1]
        brace = Brace(VGroup(n1, n2), RIGHT, buff=0.15, color=WHITE)
        gap_t = VGroup(brace, tx(f"AI 寫程式\n只差 {gap:.1f}", 26, WHITE, BOLD).next_to(brace, RIGHT, buff=0.15))
        self.say("l06", [(accent(parts, "opus", PALETTE["opus"]) + accent(parts, "codex2", PALETTE["codex"])
                          + [FadeIn(gap_t, shift=LEFT * 0.1)], 0.35)])

        # 素材庫：找不到符合需求
        pairs = Group(*[Group(img(f, 2.7), tx(t, 24, c, BOLD)).arrange(DOWN, buff=0.15) for f, t, c in [
            ("umb_B.png", "Tripo：草編傘＋躺椅", PALETTE["tripo"]), ("umb_C.png", "素材庫：彩色布傘", PALETTE["library"]),
            ("hut_B.png", "Tripo：茅草高腳屋", PALETTE["tripo"]), ("hut_C.png", "素材庫：木板屋", PALETTE["library"])]])
        pairs.arrange(RIGHT, buff=0.3).shift(UP * 0.3)
        self.say("l07", [(accent(parts, "library", PALETTE["library"]), 0.2),
                         ([FadeOut(chart), FadeOut(title), FadeOut(gap_t)], 0.12),
                         ([LaggedStart(*[FadeIn(p) for p in pairs], lag_ratio=0.15)], 0.3)])

        # 轉折：差距在寫場景的 AI
        three = [("model_M1.png", "codex（低推理）", PALETTE["codex"]), ("model_M2.png", "codex（高推理）", PALETTE["codex"]),
                 ("model_M3.png", "Opus 5.5", PALETTE["opus"])]
        scenes = Group(*[Group(tx(t, 28, c, BOLD), img(f, 4.5)).arrange(DOWN, buff=0.16) for f, t, c in three])
        scenes.arrange(RIGHT, buff=0.2).shift(UP * 0.4)
        self.say("l08", [([FadeOut(pairs)], 0.12), ([LaggedStart(*[FadeIn(m) for m in scenes], lag_ratio=0.35)], 0.45)])

        # 場景盲評：三個版本
        title2 = tx("整個場景盲評（codex 評審，1–10 分）", 30, WHITE, BOLD).to_edge(UP, buff=0.45)
        rows = D["models"]
        chart2, p2 = bars(rows, lambda r: r["score"], lambda r: MODEL_NAMES[r["key"]], top=1.4, row_h=1.15,
                          unit_w=0.8, x0=-1.6)
        mins = {r["key"]: VGroup(tx(f"{r['minutes']} 分鐘{'（fast）' if r['key'] != 'opus' else ''}", 22, GREY),
                                 tx(f"API 換算 ${r['api_usd']:.2f}", 22, GREY)).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
                .next_to(p2[r["key"]][1], RIGHT, buff=0.35) for r in rows}
        note = tx("API 換算：codex 以一般費率計", 20, GREY).to_edge(DOWN, buff=1.1)
        self.say("l09", [([FadeOut(scenes), FadeIn(title2)], 0.15), (grow(p2), 0.35),
                         (accent(p2, "opus", PALETTE["opus"]) + [FadeIn(mins["opus"]), FadeIn(note)], 0.2)])
        speed = rows[0]["minutes"] / rows[1]["minutes"]
        fast = tx(f"比 Opus 快 {speed:.1f} 倍", 22, PALETTE["codex"], BOLD).next_to(p2["codex2"][0], DOWN, buff=0.08,
                                                                                   aligned_edge=LEFT)
        self.say("l10", [(accent(p2, "codex2", PALETTE["codex"]) + [FadeIn(mins["codex2"]), FadeIn(mins["codex1"])], 0.3),
                         ([FadeIn(fast, shift=LEFT * 0.1)], 0.15)])

        # 角色：上方是三組角色並排（展示頁），下方是同一段走位的實際錄影（逐格播放）
        chars = img("chars_crop.png", 6.5).move_to(UP * 1.95)
        clab = VGroup(*[tx(t, 22, c, BOLD) for t, c in [("codex 寫程式", PALETTE["codex"]), ("Tripo", PALETTE["tripo"]),
                                                       ("素材庫", PALETTE["library"])]])
        for i, t in enumerate(clab):
            t.move_to([chars.get_left()[0] + chars.width * (0.2 + 0.3 * i), chars.get_bottom()[1] - 0.22, 0])
        frames = [np.array(Image.open(f).convert("RGBA")) for f in sorted(glob.glob("assets/walk/*.jpg"))]
        walk = ImageMobject(frames[0]).scale_to_fit_width(13.4).move_to(DOWN * 1.35)
        clock = {"t": 0.0}

        def advance(m, dt):
            clock["t"] += dt
            m.pixel_array = frames[int(clock["t"] * 30) % len(frames)]

        walk.add_updater(advance)
        self.say("l11", [([FadeOut(chart2), FadeOut(title2), FadeOut(fast), FadeOut(note), *[FadeOut(m) for m in mins.values()],
                           FadeIn(chars), FadeIn(clab), FadeIn(walk)], 0.2)])

        # 分工
        roles = [("codex", "寫場景、介面、互動", PALETTE["codex"]), ("Tripo", "角色、主角物件", PALETTE["tripo"]),
                 ("Opus", "最後收尾", PALETTE["opus"])]
        boxes = VGroup()
        for who, what, c in roles:
            box = RoundedRectangle(width=4.0, height=2.2, corner_radius=0.18, stroke_color=c, stroke_width=4)
            boxes.add(VGroup(box, VGroup(tx(who, 40, c, BOLD), tx(what, 26, WHITE)).arrange(DOWN, buff=0.25).move_to(box)))
        boxes.arrange(RIGHT, buff=0.4).shift(UP * 0.4)
        walk.clear_updaters()
        self.say("l12", [([FadeOut(chars), FadeOut(clab), FadeOut(walk)], 0.12),
                         ([LaggedStart(*[FadeIn(b, shift=UP * 0.15) for b in boxes], lag_ratio=0.5)], 0.45)])

        self.outro("l13", clear=[boxes])
