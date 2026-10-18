"""依 assets/props.json 用 Tripo 生成 GLB 到 assets/tripo/，並記錄耗時與點數到 log.csv。

用法：
  .venv/bin/python tools/tripo_gen.py --dry-run        # 只列出要生成的物件
  .venv/bin/python tools/tripo_gen.py palm_tall rocks  # 只生成指定槽位
  .venv/bin/python tools/tripo_gen.py                  # 全部（已存在的跳過）
"""
import argparse, asyncio, csv, json, os, shutil, time
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "tripo"
LOG = OUT / "log.csv"


def load_env():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())




async def download(client, task, slot_id, raw_dir, name=None):
    out_dir = raw_dir / slot_id
    out_dir.mkdir(parents=True, exist_ok=True)
    files = await client.download_task_models(task, str(out_dir))
    src = files.get("pbr_model") or files.get("model") or next(v for v in files.values() if v)
    dst = OUT / f"{name or slot_id}.glb"
    shutil.copy(src, dst)
    return dst


async def gen_one(client, slot, raw_dir):
    before = (await client.get_balance()).balance
    t0 = time.time()
    extra = {"model_version": os.environ["TRIPO_MODEL_VERSION"]} if os.environ.get("TRIPO_MODEL_VERSION") else {}
    task_id = await client.text_to_model(prompt=slot["prompt"], texture=True, pbr=True, **extra)
    print(f"{slot['id']}: task {task_id}", flush=True)  # 先印出，下載失敗時可用 --recover 找回
    task = await client.wait_for_task(task_id, verbose=True)
    secs = round(time.time() - t0)
    status = str(task.status)
    dst = ""
    if "SUCCESS" in status.upper():
        dst = await download(client, task, slot["id"], raw_dir)
    after = (await client.get_balance()).balance
    return [datetime.now().isoformat(timespec="seconds"), slot["id"], task_id, status, secs, round(before - after, 2), dst]


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="已存在也重新生成")
    ap.add_argument("--recover", nargs=2, metavar=("TASK_ID", "NAME"), help="下載已完成的任務：slot 取 NAME 的 __ 前段")
    a = ap.parse_args()
    if a.recover:
        load_env()
        from tripo3d import TripoClient
        OUT.mkdir(parents=True, exist_ok=True)
        async with TripoClient(api_key=os.environ["TRIPO_API_KEY"]) as client:
            task = await client.get_task(a.recover[0])
            print(await download(client, task, a.recover[1].split("__")[0], ROOT / "assets" / "raw" / "tripo", a.recover[1]))
        return

    slots = json.loads((ROOT / "assets" / "props.json").read_text())["slots"]
    if a.ids:
        slots = [s for s in slots if s["id"] in a.ids]
    if not a.force:
        slots = [s for s in slots if not (OUT / f"{s['id']}.glb").exists()]
    for s in slots:
        print(f"- {s['id']}: {s['prompt']}")
    if a.dry_run or not slots:
        return

    load_env()
    from tripo3d import TripoClient

    OUT.mkdir(parents=True, exist_ok=True)
    raw_dir = ROOT / "assets" / "raw" / "tripo"
    new = not LOG.exists()
    kw: dict = {"api_key": os.environ["TRIPO_API_KEY"]}
    if os.environ.get("TRIPO_GLOBAL", "1") == "0":
        kw["IS_GLOBAL"] = False
    async with TripoClient(**kw) as client:
        with LOG.open("a", newline="") as f:
            w = csv.writer(f)
            if new:
                w.writerow(["time", "slot", "task_id", "status", "seconds", "credits", "file"])
            for s in slots:  # 逐一跑，方便看單件耗時
                row = await gen_one(client, s, raw_dir)
                w.writerow(row); f.flush()
                print(row)


if __name__ == "__main__":
    asyncio.run(main())
