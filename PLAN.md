# 海邊 3D 場景驗證：codex astra 單獨做 vs. 搭配 Tripo 模型

## 要回答的問題
「AI（codex gpt-6-astra）做 3D 場景，沒有 Tripo 模型是不是很難做好？」

水面、天空、沙灘、光影都是 shader／程序化的工作，Tripo 幫不上；Tripo 只能補「物件」（椰子樹、岩石、船、小屋…）。
所以實驗只換物件來源，其他全部固定，才能看出差異到底來自哪裡。

## 實驗設計

| 組別 | 場景底座（水、天空、沙、光、後製） | 物件來源 | 成本 |
|---|---|---|---|
| A | 共用（codex 寫一次） | codex 程序化建模（純程式碼） | 0 |
| B | 共用 | Tripo 生成 GLB | Tripo 點數 |
| C（選做） | 共用 | 免費素材庫（Poly Haven / Sketchfab CC0） | 0 |

C 組用來區分「是 Tripo 特別好」還是「只要有真的模型就好」。

物件槽位固定 6～8 個，清單見 `assets/props.json`；三組放在同一位置、同一尺寸（載入後依 bounding box 正規化並貼地）。

## 場景規格（共用底座）
- 熱帶海灣午後：淺水區透出沙底的青綠色 → 深海藍、浪花打上沙灘的泡沫線、遠方小島、Sky 物理天空＋太陽反射。
- 技術：Vite + three.js；水面先用 three.js 官方 `Water`（webgl_shaders_ocean）起步，再要求 codex 加淺灘漸層、岸邊泡沫、焦散。
- 後製：ACES tone mapping、bloom、輕微霧氣。
- 固定 3 個鏡頭：①遠景全景 ②沙灘人視角 ③物件特寫。另錄 10 秒環繞影片。

## 流程
1. **底座**：`BRIEF_base.md` 交給 codex astra（fast 模式），Playwright 截圖自評至少 3 輪。
2. **A 組**：codex 依 `props.json` 程序化做物件。
3. **B 組**：`tools/tripo_gen.py` 依同一份清單生成 GLB → `assets/tripo/`，codex 負責接進場景。
4. **C 組**（選做）：依同清單從素材庫挑 → `assets/library/`。
5. **評分**：同鏡頭截圖拼成對照圖；codex 與 Claude 各自盲評（不告知組別），評分項：寫實度、物件細節、整體構圖、水面（對照組，應三組一致）、風格一致性，各 1～10 分。
6. **報告**：`REPORT.md`，給同事分享用（見下節）。

## 花費時間與成效紀錄（分享用）
- 每個步驟都用 `tools/timed.sh <組別> <步驟> -- <指令>` 執行，自動記到 `timing.csv`（開始／結束時間、耗時、結束碼）。
- 另記：Tripo 每個物件的點數與生成秒數（`tripo_gen.py` 寫進 `assets/tripo/log.csv`）、codex 每輪的 token 用量（從 codex exec 輸出擷取）、人工介入次數。
- 交付物：
  - `compare/<鏡頭>.png`：A｜B｜C 同鏡頭並排，每格標註組別、總耗時、花費（`tools/compare.py` 產生）
  - `compare/props_grid.png`：8 個物件逐一並排（A 程序化 vs. B Tripo vs. C 素材庫）
  - `compare/progress.png`：底座迭代 r1→r3 演進
  - 約 60 秒對照影片（三組同一路徑環繞鏡頭剪在一起）
  - `REPORT.md` 一頁摘要表：組別 × 耗時 × 花費 × 盲評分數 × 結論

## 參考範例（社群）
- three.js 官方海洋範例 webgl_shaders_ocean（`Water` + `Sky`）——大部分 AI 海景 demo 的起點
- [jbouny/ocean](https://www.github.com/jbouny/ocean)：經典 three.js 海洋 shader
- [掘金〈Three.js 打造缤纷夏日3D梦中情岛〉](https://juejin.cn/post/7102215670477094925)：`Water`+`Sky`＋島嶼模型＋紅鶴，最接近本案的風格化海島
- [Opus 5.5 史前島嶼案例（Vib3Coded prompt）](https://aiidelist.com/blog/opus-5-5-prehistoric-island)：社群流傳的「一句 prompt 做 three.js 海島」brief，含水下場景與互動要求，可拿來當 D 組：原 prompt 一次生成、不准外部模型
- [Tidewater（2026-05）](https://ilikekillnerds.com/2026/05/21/i-built-tidewater-threejs-ocean-kit/)：FFT 海洋＋水下＋浮力，水面品質的上限參考（付費，不採用）
- [WaterThreeJS](https://gitee.com/theyn/WaterThreeJS)：MIT 程序化海洋（Gerstner 波＋水下），新專案、未經驗證

## 待確認
- Tripo API key（放 `.env`，不進 git）
- B 組物件清單與數量（`assets/props.json`），確認後才開始花點數
