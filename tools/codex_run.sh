#!/usr/bin/env bash
# 用法：tools/codex_run.sh <組別> <步驟> <brief檔>  → 計時跑 codex astra（fast），JSON 事件存 logs/<步驟>.jsonl
set -u
root=$(cd "$(dirname "$0")/.." && pwd)
group=$1; step=$2; brief=$3
cd "$root"
"$root/tools/timed.sh" "$group" "$step" -- bash -c "timeout 3h codex exec --json --skip-git-repo-check -C '$root' \
  -s workspace-write -c sandbox_workspace_write.network_access=true -c service_tier='\"fast\"' \
  -o 'logs/$step.last.md' < '$brief' > 'logs/$step.jsonl' 2> 'logs/$step.err'"
