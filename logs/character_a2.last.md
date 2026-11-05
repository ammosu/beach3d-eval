完成外觀 6 輪、動作 3 輪迭代，保留未提交工作樹。[完整報告](shots/character/r2/REPORT.md)

- 修正五官、頸部、髮際、衣褲與掌部；加入屈膝、腳掌翻轉、骨盆動作、跑步騰空及呼吸 idle。
- **19,992 面**，build 通過；B／C 各 **14/14 圖片完全一致**。
- 穿模最大 **4 cm**，無新增道具命中；walk IK `errors []`。
- 穩速走／跑支撐腳滑動均 **<0.001 cm**；腳距維持 ±6／±4 cm，膝蓋範圍端點最多改變 **2.3 cm**。

[走路八相位](shots/character/r2/final/side/A_walk_sheet.png) · [跑步八相位](shots/character/r2/final/side/A_run_sheet.png)

仍不足：臉髮偏平滑、袖口略硬，握拳四指仍同步彎曲。未執行 `verify-game.mjs`，未啟停 5191 伺服器。