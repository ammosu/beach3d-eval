# 沙灘新增物件 C 組素材出處

用 MCP for Blender 從 Sketchfab 匯入（拿掉旗子、風箏線、色卡等多餘零件，太重的先在 Blender 裡分段減面），再用 `reef/tripo/prep.py` 正規化（減到最多 1.6 萬面、頭朝 +X、背朝上、長度（x）＝1、包圍盒置中；風箏是頂點朝 +X、正面朝上）。

| id | 模型 | 作者 | 來源 | 授權 | 備註 |
|---|---|---|---|---|---|
| castle（沙堡） | Sand castle - Day 19 | patrakeevasveta | Sketchfab 0379b3c84e7944dab7537a0799375ee4 (https://sketchfab.com/3d-models/0379b3c84e7944dab7537a0799375ee4) | CC BY | 不旋轉；刪掉頂端小紅旗與底下半透明沙堆，材質改成不透明；淺米灰色沙紋貼圖；4530 面 |
| kite（風箏） | Kite | phac | Sketchfab 881a6736d0eb4f53b38d75c5b03dc7fe (https://sketchfab.com/3d-models/881a6736d0eb4f53b38d75c5b03dc7fe) | CC BY | 原本頂點朝 +Z、正面朝 −Y，轉 x-90,z-90；刪掉風箏線；四色菱形帆面加蝴蝶結尾巴（長度含尾巴，帆面約佔四成）；雙面材質；4288 面 |
| crab（沙蟹） | CC0 ツノメガニ 🦀 ♀ Horn-eyed Ghost Crab | ffishAsia-and-floraZia | Sketchfab bf68a281970e461584f1352d67316197 (https://sketchfab.com/3d-models/bf68a281970e461584f1352d67316197) | CC0 | 角眼沙蟹標本掃描；原本前方朝 +Z、背朝 −Y，轉 x-90,z-90；刪掉色卡；八塊網格（16 位元索引切開的同一個掃描）合併後 48 萬面分段減到 14316 面；殼上有幾個減面留下的小暗點 |
| bird（海鷗） | seagull v1 | FreddyFoxFreddy | Sketchfab f3fa166ff6bd4ffe8133f6f6eed74d64 (https://sketchfab.com/3d-models/f3fa166ff6bd4ffe8133f6f6eed74d64) | CC BY | 飛行姿勢（雙翼上揚、腳垂下）；原本頭朝 −Y，轉 z90；22 萬面（腳就佔 19 萬）分部位減到 15409 面；羽毛片用透明貼圖裁切（alphaMode MASK）；身體、頭、腳貼圖縮到 512 |

授權條款：CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ ；CC0 https://creativecommons.org/publicdomain/zero/1.0/
