#!/usr/bin/env bash
# 用法：tools/timed.sh <組別> <步驟> -- <指令...>   → 追加一行到 timing.csv
set -u
group=$1; step=$2; shift 2; [ "${1:-}" = "--" ] && shift
root=$(cd "$(dirname "$0")/.." && pwd); log="$root/timing.csv"
[ -f "$log" ] || echo "group,step,start,end,seconds,exit" > "$log"
start=$(date +%s); "$@"; rc=$?; end=$(date +%s)
echo "$group,$step,$(date -d @$start -Iseconds),$(date -d @$end -Iseconds),$((end-start)),$rc" >> "$log"
exit $rc
