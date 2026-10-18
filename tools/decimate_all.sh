#!/usr/bin/env bash
# 把 assets/raw/tripo/<slot>/*_model.glb 全部減面到 assets/tripo/<slot>.glb
set -e
root=$(cd "$(dirname "$0")/.." && pwd); target=${1:-30000}
blender=~/.local/opt/blender-5.2.1-linux-x64/blender
for d in "$root"/assets/raw/tripo/*/; do
  slot=$(basename "$d"); src=$(ls "$d"*_model.glb | head -1)
  "$blender" -b --factory-startup --python "$root/tools/blender_decimate.py" -- "$src" "$root/assets/tripo/$slot.glb" "$target" 2>&1 | grep DECIMATE
done
