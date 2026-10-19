你是 3D 遊戲美術評審。附圖是 8 件海灘場景物件，由 P、Q、R、S、T 五個來源各做一套（每列一個來源，左側標籤；每欄一件物件）。
展示的燈光與背景可能略有不同，請忽略，只評物件本身。請只依畫面盲評，不要猜測製作方式。

每件物件的需求：
- palm_tall：a tall tropical coconut palm tree with curved trunk, coconuts, realistic
- palm_pair：two leaning coconut palm trees growing from one base, realistic
- rocks：cluster of weathered dark volcanic beach rocks with barnacles, realistic
- boat：small wooden rowing boat beached on sand, weathered blue paint, realistic
- hut：tropical beach hut on short stilts with thatched palm-leaf roof, realistic
- umbrella：straw beach umbrella with two wooden sun loungers underneath, realistic
- driftwood：large bleached driftwood log lying on sand, realistic
- lifeguard：wooden lifeguard tower painted white and red, realistic

請給每個來源：match（符合需求）、realism（造型材質細節的寫實精緻度）、consistency（8 件風格是否一致）各 1–10 分（可用 0.5），
並給每件物件每個來源一個 1–10 綜合分。不要讀寫檔案、不要執行指令。最後只輸出 JSON（不要 markdown 圍欄）：
{"criteria": {"P": {"match": 0, "realism": 0, "consistency": 0}, ...}, "props": {"<slot id>": {"P": 0, ...}, ...},
 "comments": {"P": "一兩句繁體中文", ...}, "ranking": ["最好", "...", "最差"]}
