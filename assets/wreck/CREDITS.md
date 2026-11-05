# 沉船點與遠海漁船素材出處（三組共用）

全部來自 [Scenario 3D Collection](https://huggingface.co/datasets/scenario-labs/3d-collection)（Hugging Face 資料集），由 AI 生成，授權 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，出處標示 Scenario。

只用在遊戲模式，A/B/C 三組相同，不屬於比較項目。用 `tools/fetch_scenario.sh` 下載、減面（`tools/prep_scenario.py`）：合併網格、縮小貼圖、不保留原本的動畫。

| 項目 | 檔案 | 資料集路徑 | 生成模型 | 面數 |
|---|---|---|---|---|
| 沉沒的飛機 | plane.glb | assets/12162a48873f808d/0e72556a81c774f2.glb | gpt-6-astra | 85,404 → 25,000 |
| 艦砲 | cannon.glb | assets/5cbff075537ceb2f/136a39478a85e7af.glb | gpt-6-astra | 135,852 → 12,000 |
| 舊寶箱 | chest.glb | assets/scenario_asset_VV9HsyS3eambEdEFR8KHWQAu/output.glb | meshy-7-1-img23d | 2,053,508 → 30,000 |
| 潛水頭盔 | helmet.glb | assets/scenario_asset_5cScwkD17sxxPuBeRALT4Pw2/output.glb | tripo-p2-image-to-3d | 5,407 |
| 破損陶甕 | jar.glb | assets/scenario_asset_mcxbLfN4cmqyjtwaZghK6vtE/output.glb | rodin-hyper3d-v2 | 35,168 → 4,000 |
| 遠海漁船 | trawler.glb | assets/c908eeca2605ca5a/d646af767b201652.glb | claude-opus-5-5 | 39,962 |
