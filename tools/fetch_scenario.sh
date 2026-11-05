#!/usr/bin/env bash
# 下載沉船點與遠海漁船的原始 GLB（Scenario 3D Collection，CC BY 4.0）→ assets/raw/scenario/<id>/，再減面到 assets/wreck/<id>.glb。
# 來源：https://huggingface.co/datasets/scenario-labs/3d-collection
set -e
root=$(cd "$(dirname "$0")/.." && pwd)
base=https://huggingface.co/datasets/scenario-labs/3d-collection/resolve/main
mkdir -p "$root/assets/wreck" "$root/shots/wreck/prep"
# id  資料集路徑  目標面數  貼圖邊長  旋轉
while read -r id path tris tex rot; do
  [ -z "$id" ] && continue
  raw="$root/assets/raw/scenario/$id"; mkdir -p "$raw"
  [ -s "$raw/source.glb" ] || curl -sSL -f -o "$raw/source.glb" "$base/$path"
  (cd "$root" && blender -b --factory-startup --python tools/prep_scenario.py -- "$raw/source.glb" "assets/wreck/$id.glb" "shots/wreck/prep/$id.png" "$tris" "$tex" $rot 2>&1 | grep -E "^PREP|Error|Traceback" || true)
done <<'LIST'
helmet assets/scenario_asset_5cScwkD17sxxPuBeRALT4Pw2/output.glb 6000 512
jar assets/scenario_asset_mcxbLfN4cmqyjtwaZghK6vtE/output.glb 4000 512
cannon assets/5cbff075537ceb2f/136a39478a85e7af.glb 12000 512
plane assets/12162a48873f808d/0e72556a81c774f2.glb 25000 1024
chest assets/scenario_asset_VV9HsyS3eambEdEFR8KHWQAu/output.glb 30000 1024
trawler assets/c908eeca2605ca5a/d646af767b201652.glb 40000 1024
LIST
ls -la "$root/assets/wreck"
