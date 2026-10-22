#!/usr/bin/env bash
# 把三個版本打包成靜態網站放進 slides/live/，投影片的「實際試玩」頁用 slides/start.py 一個指令啟動。
#   tools/build_live.sh   → slides/live/{main,codex2,opus}/
set -euo pipefail
here=$(cd "$(dirname "$0")/.." && pwd); git=$(dirname "$here"); out="$here/slides/live"
rm -rf "$out"; mkdir -p "$out"
build() {  # $1=來源資料夾 $2=輸出名稱
  (cd "$1" && npx vite build --logLevel warn --base ./)   # 相對路徑：同一個網站的子目錄（GitHub Pages、start.py 的 8730）也能開
  cp -r "$1/dist" "$out/$2"
  mkdir -p "$out/$2/assets" && cp "$1/assets/props.json" "$out/$2/assets/"   # 部分版本的 build 沒有複製 assets
  # 別的版本程式裡寫死的 "/assets/…" 改成相對路徑（不動它們的原始碼）
  find "$out/$2/assets" -maxdepth 1 -name '*.js' -exec sed -i -E "s#([\"'\`])/(assets|report|shots)/#\\1./\\2/#g" {} +
  rm -rf "$out/$2/assets/raw"; find "$out/$2/assets" -name '*__*.glb' -delete   # 原始 Tripo 模型與試生成不打包
}
build "$here" main
build "$git/beach3d-codex2" codex2
build "$git/beach3d-opus" opus
# 舊的 Reef Lagoon（reef/）暫不打包、不列入試玩；需要時把 reef/{codex,opus}/index.html 與 reef/tripo_lagoon/{index.html,models} 複製到 $out/reef/ 並在 slides/index.html 的 LIVE 加回卡片
du -sh "$out"/*
