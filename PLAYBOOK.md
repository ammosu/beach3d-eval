# 3D 場景驗證流程手冊（下次換主題照做）

beach3d-eval 實際跑過的流程、指令與踩過的坑。換主題（森林、城市、室內…）時，複製整個專案，改 `assets/props.json` 與底座 brief 即可沿用。

## 實測耗時與花費（海邊、8 件物件）

| 步驟 | 耗時 | 花費 |
|---|---|---|
| 底座：水、天空、沙灘、光線（codex 2 輪） | 6.8 分 | 約 186 萬 token |
| A 組：codex 程序化物件 | 6.7 分 | 約 150 萬 token |
| B 組：Tripo 生成 8 件（逐件跑）＋ Blender 減面 | 18.5 分＋2 分 | 140 點（另試生成 130 點） |
| C 組：素材庫挑選＋匯入（Blender MCP） | 4.8 分 | 0（CC BY 需標作者） |
| 遊覽模式＋入口頁＋並排比較（codex） | 8.1 分 | 約 215 萬 token |
| codex 盲評 3 輪 | 約 20 秒 | 少量 token |
| 60 秒影片（逐格算繪＋合成） | 約 3 分 | 0 |

## 流程

### 0. 開專案
- 系統 Python 沒有 ensurepip，venv 用 uv 建：`uv venv && uv pip install tripo3d`
- Vite 開發伺服器**自己在背景開**：`npx vite --port 5191 --strictPort`。brief 裡要寫明「伺服器已在跑，不要另開」。codex 開的伺服器會隨 codex 結束一起被關掉。
- `.env` 放 `TRIPO_API_KEY`（chmod 600、gitignore），由使用者手動填，不要貼進對話。

### 1. 規劃 `assets/props.json`
- `cameras`：固定截圖鏡頭（wide／beach／closeup）。
- `slots`：每件物件都有 `id`、`pos`、`height`，選填 `maxLen`，以及英文 `prompt`。A／B／C 三組共用同一份 prompt。
- **縮放規則三組一致**：`scale = min(height/size.y, maxLen/max(size.x,size.z))`。只用高度縮放的話，長形物件（船、漂流木）會變得巨大，所以長形物件一定要設 `maxLen`。

### 2. 底座與 A 組（codex）
- 寫 `BRIEF_*.md`（任務、不能動的部分、驗證方式），再跑 `tools/codex_run.sh <組別> <步驟> <brief>`。
  - 腳本內容：用 `timed.sh` 計時，執行 `codex exec --json -s workspace-write -c sandbox_workspace_write.network_access=true -c service_tier='"fast"' -o logs/<步驟>.last.md`，prompt 從 stdin 餵入。
- token 用量會從 `logs/<步驟>.jsonl` 最後一筆 usage 抓出來（`build_stats.py`）。
- 底座的已知弱點是植被呈圓球狀、雲很卡通，物件來源幫不上忙。下次可以考慮 HDRI 天空，或用 Tripo 生成植被。

### 3. B 組（Tripo）
- `.venv/bin/python tools/tripo_gen.py --dry-run`：先列清單，**使用者確認後才花點數**。
- 模型版本以 API 實際接受的為準，SDK docstring 列的不一定能用。可用版本：`P1-20260311`、`P2-20260801`、`v2.5-20250123`、`v3.0-20250812`、`v3.1-20260211`。
- **選 v3.1**：每件 20 點，約 2–3 分鐘，產出約 147 萬面、品質最好。P2 每件 110 點、只有 4.3k 面，反而比較醜。
- 下載前輸出資料夾必須先存在，腳本已修好。下載失敗不用重新生成：用 `client.get_usage()` 找 task id，再跑 `tools/tripo_gen.py --recover <task_id> <slot>`。
- 減面（必做，原始模型網頁跑不動）：`tools/decimate_all.sh [30000]`，每件約 15 秒，用 Blender 無頭模式 COLLAPSE 減面，匯出貼圖用 JPEG。
- 可改進：8 件同時送出，生成時間可從 18.5 分縮到 5 分以內。

### 4. C 組（免費素材庫，Blender MCP）
- Blender 5.2.1 位置：`~/.local/opt/blender-5.2.1-linux-x64/blender`，Cycles 已設定 OPTIX。
- MCP 的素材庫開關是**每個 scene 各自一份**。新建 scene 後，要把 `blendermcp_use_polyhaven` 等屬性從 'Scene' 複製過去。
- 匯入後檢查：
  - 多出來的 Icosphere 要刪掉。
  - 帶 armature 的模型匯出 GLB 後零件會跑位，直接換別的模型。
  - 作者寫進 `assets/library/CREDITS.md`。
- 素材庫最大的問題是**找不到符合需求的模型**（茅草屋、草編傘＋躺椅），只能將就。

### 5. 截圖與對照圖
- `node scripts/shoot.mjs <A|B|C>`：三個固定鏡頭，輸出 `shots/<組>/*.png`。
- `node scripts/shoot-props.mjs <組> [slot]`：單件物件展示圖。
- `python3 tools/compare.py`：輸出 `compare/<鏡頭>.png`，三欄並排並標註耗時與花費。
- `python3 tools/build_stats.py`：輸出 `report/stats.json`，入口頁會讀取這份資料。
- 單張截圖用 swiftshader 就夠（約 1.6 秒一張）。

### 6. 可遊覽介面（codex）
- `BRIEF_explore.md`：遊覽模式，WASD 移動、1/2/3 切換組別、V 切換第一和第三人稱、P 拍照。
- `BRIEF_compare.md`：入口頁、三欄同步比較、單件模型檢視。
- 網址：`/`、`/compare.html?groups=A,B,C`、`/scene.html?explore=1&group=B`、`/props.html?group=B`

### 7. codex 盲評
- `python3 tools/blind_score.py [輪數]`
  - 三組匿名成 X／Y／Z，每輪輪換順序。
  - 附 3 張場景圖和物件總表，用 `-i` 附圖、prompt 走 stdin、`-s read-only`。
  - 輸出 `eval/scores.json`，會還原成原本組別再平均。
- 評分項目：符合需求、物件質感、整體協調、第一眼觀感，再加上每件物件各自的分數。
- 截圖上不能有組別文字，跑之前先確認。

### 8. 60 秒對照影片
1. 編輯 `video/path.json`：鏡頭關鍵格（`t`、`pos`、`target`，以 Catmull-Rom 曲線串接）和每段說明（`from`、`to`、`title`、`text`、`slots`）。
2. **先跑低格率預覽**，確認鏡頭沒有穿進物件：`node scripts/record-path.mjs B 0.5`，再把影格拼成縮圖總表檢查。這次就抓到鏡頭穿過陽傘和小船。
3. 正式算繪：三組平行跑 `node scripts/record-path.mjs A|B|C`，約 2.5 分鐘。
   - 用 GPU：`--use-gl=angle --use-angle=gl-egl`，每格 0.17 秒，比 swiftshader 快 10 倍。
   - 頁面透過 `window.__TIME__` 固定水面時間，所以三組逐格完全對齊。
4. `python3 tools/make_video.py`：片頭、四宮格（A、B、C 加說明格）、結論表，輸出 `video/compare.mp4`，約 30 秒完成。

## 換主題時要改的地方
- `assets/props.json`：鏡頭、物件槽位、prompt。
- 底座 brief（地形、水、天空、光線），以及 `src/main.js` 和 `src/terrain.js`。
- `video/path.json`：關鍵格座標要依新的物件位置重排。
- `tools/make_video.py`：片頭和結論文字、`NAMES` 對照表。
- `tools/build_stats.py`：notes 文字。
