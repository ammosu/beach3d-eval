你是 3D 場景美術評審。以下是同一個海邊 three.js 場景的三個版本 X、Y、Z：
水、天空、沙灘、光線、植被完全相同，只有 8 件物件的製作方式不同。請只依畫面盲評，不要猜測製作方式。

附圖（依序）：scene_wide.png, scene_beach.png, scene_closeup.png, props_grid.png
- scene_wide / scene_beach / scene_closeup：三個鏡頭，每張由左到右是 X、Y、Z（左上角有標籤）
- props_grid：8 件物件單獨展示，每列一個版本（左側標籤），每欄一件物件

每件物件的需求（prompt）：
- palm_tall：a tall tropical coconut palm tree with curved trunk, coconuts, realistic
- palm_pair：two leaning coconut palm trees growing from one base, realistic
- rocks：cluster of weathered dark volcanic beach rocks with barnacles, realistic
- boat：small wooden rowing boat beached on sand, weathered blue paint, realistic
- hut：tropical beach hut on short stilts with thatched palm-leaf roof, realistic
- umbrella：straw beach umbrella with two wooden sun loungers underneath, realistic
- driftwood：large bleached driftwood log lying on sand, realistic
- lifeguard：wooden lifeguard tower painted white and red, realistic

評分項目（1–10 分，可用 0.5）：
- match：物件符合需求：每件物件是否就是 prompt 描述的東西（種類、材質、細節）
- realism：物件質感：造型、材質、細節的寫實與精緻程度
- cohesion：整體協調：物件彼此、與場景（沙灘、海、光線）風格與比例是否一致
- overall：第一眼觀感：當成遊戲／展示場景，整體好不好看

另外每件物件分別給 X/Y/Z 一個 1–10 分（綜合符合需求與質感）。
不要讀寫任何檔案、不要執行指令。最後只輸出一個 JSON（不要 markdown 圍欄），格式：
{"criteria": {"X": {"match": 0, "realism": 0, "cohesion": 0, "overall": 0}, "Y": {...}, "Z": {...}},
 "props": {"<slot id>": {"X": 0, "Y": 0, "Z": 0}, ...},
 "comments": {"X": "一兩句繁體中文優缺點", "Y": "...", "Z": "..."},
 "ranking": ["最好", "次之", "最差"]}
