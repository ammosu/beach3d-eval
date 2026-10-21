優化前後對照解說影片原始檔（explainer-video skill 產生）。工作目錄在 ~/explainer-videos/beach3d-eval/optimize（含配音 wav、前後畫面 assets）。
前後畫面：capture/ 的腳本把修正前的 commit 開在暫時 worktree，與 HEAD 用同鏡頭、同時間、同動作逐格錄（各項 commit 見 data.json）。
重做：在工作目錄跑 `./build.sh qh`；改旁白後先 `./build.sh tts`。成品轉 720p 複製到 video/optimize.mp4（mp4 不進 git）。
