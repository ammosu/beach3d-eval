"""解說影片：AI 做出來之後，還修了哪些細節（修正前 vs 現在）。

一句旁白＝一個畫面變化（self.say）。畫面是前後 commit 以同鏡頭、同時間、同動作逐格錄的（assets/<key>/manifest.json），
裁切縮成 640×360 放在 assets/p/<key>_<before|after>/；數字一律從 data.json 讀（來源見各項 source）。
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
WARN = PALETTE.get("codex", "#F0963C")
PW = 6.5          # 每格寬
FPS = 30


def frames(key, side):
    return [np.array(Image.open(f).convert("RGBA")) for f in sorted(glob.glob(f"assets/p/{key}_{side}/*.jpg"))]


class Clip(ImageMobject):
    """逐格播放的畫面：play_range(a, b) 只在第 a–b 格之間循環；一格的就是靜態圖。"""

    def __init__(self, key, side, width=PW):
        self.fr = frames(key, side)
        super().__init__(self.fr[0])
        self.scale_to_fit_width(width)
        self.t, self.span = 0.0, (0, len(self.fr))
        if len(self.fr) > 1:
            self.add_updater(Clip.tick)

    def tick(self, dt):
        self.t += dt
        a, b = self.span
        self.pixel_array = self.fr[a + int(self.t * FPS) % (b - a)]

    def play_range(self, a, b):
        self.span, self.t = (a, b), 0.0
        return self


class Explainer(ExplainerScene):
    def construct(self):
        L, R = LEFT * 3.4 + UP * 0.55, RIGHT * 3.4 + UP * 0.55
        head_b = tx("修正前", 30, GREY, BOLD)
        head_a = tx("現在", 30, ACC, BOLD)
        st = {"tag_b": None, "tag_a": None}

        def tags(b, a):
            """兩格下方的短標籤（每行 ≤ 8 字）"""
            tb = tx(b, 28, WARN).next_to(L + DOWN * 1.83, DOWN, buff=0.22)
            ta = tx(a, 28, WHITE).next_to(R + DOWN * 1.83, DOWN, buff=0.22)
            return tb, ta

        def swap(key, b_text, a_text, rng=None):
            """換一組前後畫面：舊的淡出、新的淡入，標題留著。"""
            nb, na = Clip(key, "before").move_to(L), Clip(key, "after").move_to(R)
            if rng:
                nb.play_range(*rng), na.play_range(*rng)
            tb, ta = tags(b_text, a_text)
            anims = [FadeOut(st["before"]), FadeOut(st["after"]), FadeIn(nb), FadeIn(na)]
            anims += [FadeOut(st[k]) for k in ("tag_b", "tag_a") if st[k] is not None] + [FadeIn(tb), FadeIn(ta)]
            st.update(before=nb, after=na, tag_b=tb, tag_a=ta)
            return anims

        # 問題：修正前的走路，單格放大
        before = Clip("walk", "before", 10.2).move_to(UP * 0.3)
        lone = tx("修正前", 30, GREY, BOLD).next_to(before, UP, buff=0.15).align_to(before, LEFT)
        self.say("l01", [([FadeIn(before), FadeIn(lone)], 0.12)])

        # 方法：同鏡頭、同時間，前後並排
        after = Clip("walk", "after").move_to(R)
        st.update(before=before, after=after)
        head_b.next_to(L + UP * 1.83, UP, buff=0.15)
        head_a.next_to(R + UP * 1.83, UP, buff=0.15)
        self.say("l02", [([before.animate.scale_to_fit_width(PW).move_to(L), ReplacementTransform(lone, head_b)], 0.3),
                         ([FadeIn(after, shift=LEFT * 0.3), FadeIn(head_a)], 0.25)])

        # 走路
        tb, ta = tags("站著滑過去", "步幅對上速度")
        st.update(tag_b=tb, tag_a=ta)
        self.say("l03", [([FadeIn(tb), FadeIn(ta)], 0.15)])

        # 爬梯：前半段蹲縮 vs 身體離開梯面；後半段手抓扶手
        self.say("l04", [(swap("climb", "蹲成一團", "身體離開梯面", (10, 60)), 0.15)])
        tb, ta = tags("過了最上一階", "手抓兩邊扶手")
        st["before"].play_range(60, 96), st["after"].play_range(60, 96)
        self.say("l05", [([ReplacementTransform(st["tag_b"], tb), ReplacementTransform(st["tag_a"], ta)], 0.15)])
        st.update(tag_b=tb, tag_a=ta)

        # 躺椅
        self.say("l06", [(swap("lounger", "穿過椅背", "照椅背斜度半躺"), 0.15)])

        # 量測：陷入深度
        veil = Rectangle(width=16, height=9, stroke_width=0, fill_color=BLACK, fill_opacity=0.72).set_z_index(5)
        big = tx(f"≤ {D['lounger']['max_cm_all']} 公分", 96, ACC, BOLD).set_z_index(6).shift(UP * 0.7)
        small = tx("每個互動，角色陷進物件的深度", 30, WHITE).set_z_index(6).next_to(big, DOWN, buff=0.35)
        self.say("l07", [([FadeIn(veil), FadeIn(big, scale=0.9), FadeIn(small)], 0.2)])

        # 影子
        self.say("l08", [([FadeOut(veil), FadeOut(big), FadeOut(small)] +
                          swap("shadow", f"離底部 {D['shadow']['gap_m']} 公尺", "從底部開始"), 0.15)])

        # 斜坡上的岩石
        g = D["ground"]["rock_C_cm"]
        self.say("l09", [(swap("ground", f"浮起 {g['min']}–{g['max']} 公分", "貼在沙上"), 0.15)])

        # 小船：槳葉入水
        b = D["boat"]
        self.say("l10", [(swap("boat", f"槳葉離水 {b['blade_above_cm']} 公分", f"入水 {b['blade_below_cm']} 公分"), 0.15)])

        # 外海：船艙進水
        self.say("l11", [(swap("hull", "浪峰蓋過船艙", "船艙是乾的"), 0.15)])

        # 收尾：六項現在的樣子收成一格
        keys = ["walk", "climb", "lounger", "ground", "boat", "hull"]
        grid = Group(*[Clip(k, "after", 3.9) for k in keys]).arrange_in_grid(2, 3, buff=0.18).shift(UP * 0.3)
        cap = tx("現在", 34, ACC, BOLD).next_to(grid, UP, buff=0.2)
        old = [st["before"], st["after"], st["tag_b"], st["tag_a"], head_b, head_a]
        self.say("l12", [([FadeOut(m) for m in old] + [LaggedStart(*[FadeIn(c) for c in grid], lag_ratio=0.15), FadeIn(cap)], 0.4)])

        self.outro("l13", clear=[grid, cap])
