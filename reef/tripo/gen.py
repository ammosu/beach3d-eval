"""Reef Lagoon 海洋生物：依 creatures.json 用 Tripo v3.1 生成 GLB（同時送出），記錄耗時與點數。

用法（專案根目錄）：
  .venv/bin/python reef/tripo/gen.py --dry-run          # 只列清單
  .venv/bin/python reef/tripo/gen.py                    # 全部（已存在的跳過）
  .venv/bin/python reef/tripo/gen.py manta humpback --force   # 重做指定的（舊檔改名保留）
  .venv/bin/python reef/tripo/gen.py --spec assets/tidepool/critters.json --raw assets/raw/tidepool   # 其他清單（潮池生物）
輸出：reef/tripo/raw/<id>.glb（原始，不進 git）、reef/tripo/log.csv
"""
import argparse, asyncio, csv, json, os, shutil, time
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
RAW = HERE / "raw"
LOG = HERE / "log.csv"
VERSION = "v3.1-20260211"


def load_env():
    for line in (ROOT / ".env").read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


async def gen_one(client, c):
    t0 = time.time()
    task_id = await client.text_to_model(prompt=c["prompt"], texture=True, pbr=True, model_version=VERSION)
    print(f"{c['id']}: task {task_id}", flush=True)
    task = await client.wait_for_task(task_id, verbose=False)
    status = str(task.status)
    dst = ""
    if "SUCCESS" in status.upper():
        tmp = RAW / f"_{c['id']}"
        tmp.mkdir(parents=True, exist_ok=True)
        files = await client.download_task_models(task, str(tmp))
        src = files.get("pbr_model") or files.get("model") or next(v for v in files.values() if v)
        dst = RAW / f"{c['id']}.glb"
        if dst.exists():  # 重做時保留舊檔
            dst.rename(RAW / f"{c['id']}__{datetime.now():%H%M%S}.glb")
        shutil.copy(src, dst)
        shutil.rmtree(tmp)
    secs = round(time.time() - t0)
    print(f"{c['id']}: {status} {secs}s", flush=True)
    return [datetime.now().isoformat(timespec="seconds"), c["id"], task_id, status, secs, str(dst)]


async def main():
    global RAW, LOG
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--spec", default=str(HERE / "creatures.json"))
    ap.add_argument("--raw", default=str(RAW))
    a = ap.parse_args()
    RAW = (ROOT / a.raw).resolve(); LOG = RAW / "log.csv" if a.raw != str(HERE / "raw") else LOG
    todo = [c for c in json.loads((ROOT / a.spec).read_text()) if not a.ids or c["id"] in a.ids]
    if not a.force:
        todo = [c for c in todo if not (RAW / f"{c['id']}.glb").exists()]
    for c in todo:
        print(f"- {c['id']}: {c['prompt'][:90]}…")
    print(f"{len(todo)} 件 × 20 點（{VERSION}）")
    if a.dry_run or not todo:
        return
    load_env()
    from tripo3d import TripoClient
    RAW.mkdir(parents=True, exist_ok=True)
    async with TripoClient(api_key=os.environ["TRIPO_API_KEY"]) as client:
        before = (await client.get_balance()).balance
        rows = await asyncio.gather(*(gen_one(client, c) for c in todo), return_exceptions=True)
        after = (await client.get_balance()).balance
    new = not LOG.exists()
    with LOG.open("a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["time", "id", "task_id", "status", "seconds", "file"])
        for r in rows:
            w.writerow(r if isinstance(r, list) else [datetime.now().isoformat(timespec="seconds"), "?", "", f"ERROR {r}", "", ""])
    print(f"點數：{before} → {after}（用掉 {before - after}）")


if __name__ == "__main__":
    asyncio.run(main())
