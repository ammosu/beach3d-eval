# 投影片與試玩

線上版：https://ammosu.github.io/beach3d-eval/ （GitHub Pages，`master` 的 `slides/` 有變動就自動發佈，見 `.github/workflows/pages.yml`）

本機：

```bash
python3 start.py      # 只需要 Python 3；會自動開 http://localhost:8730
```

- 根目錄：投影片（←→ 換頁），最後一頁「實際試玩」連到下列場景
- `live/main/`：主版本（遊戲模式、三欄比較、遊覽、角色並排、單件檢視）
- `live/codex2/`：codex 高推理版本的場景
- `live/opus/`：Opus 5.5 版本的場景

直接雙擊 index.html 也能看投影片與影片，但試玩頁需要透過網頁伺服器（瀏覽器不允許用 file:// 載入 3D 模組與模型）。

更新場景後重新打包：在專案根目錄執行 `tools/build_live.sh`，再提交 `slides/live/`。
