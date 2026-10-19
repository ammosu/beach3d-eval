#!/usr/bin/env bash
# 把三個版本打包成靜態網站放進 slides/live/，投影片的「實際試玩」頁用 slides/start.py 一個指令啟動。
#   tools/build_live.sh   → slides/live/{main,codex2,opus}/
set -euo pipefail
here=$(cd "$(dirname "$0")/.." && pwd); git=$(dirname "$here"); out="$here/slides/live"
rm -rf "$out"; mkdir -p "$out"
build() {  # $1=來源資料夾 $2=輸出名稱
  (cd "$1" && npx vite build --logLevel warn)
  cp -r "$1/dist" "$out/$2"
  mkdir -p "$out/$2/assets" && cp "$1/assets/props.json" "$out/$2/assets/"   # 部分版本的 build 沒有複製 assets
  rm -rf "$out/$2/assets/raw"; find "$out/$2/assets" -name '*__*.glb' -delete   # 原始 Tripo 模型與試生成不打包
}
build "$here" main
build "$git/beach3d-codex2" codex2
build "$git/beach3d-opus" opus
for w in codex opus; do mkdir -p "$out/reef/$w" && cp "$here/reef/$w/index.html" "$out/reef/$w/"; done   # Reef Lagoon 單檔，由 8730 直接提供
du -sh "$out"/*
