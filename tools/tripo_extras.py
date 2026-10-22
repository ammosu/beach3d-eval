"""遊戲新增物件（沙堡、風箏、螃蟹、海鷗）的 B 組 Tripo 生成；提示詞寫在本檔，不讀 assets/props.json。

設定跟 tools/tripo_gen.py 相同（text_to_model、texture、pbr、.env 的 TRIPO_MODEL_VERSION），
原始下載放 assets/raw/extras/B/<id>/，耗時與點數記到 assets/tripo/log.csv（slot 欄寫 extras:<id>）。
之後用 reef/tripo/prep.py 正規化成 assets/extras/B/<id>.glb。

用法：
  .venv/bin/python tools/tripo_extras.py --dry-run
  .venv/bin/python tools/tripo_extras.py castle kite        # 只生成指定項目
  .venv/bin/python tools/tripo_extras.py --prompt "<新提示詞>" bird   # 重試時換提示詞
  .venv/bin/python tools/tripo_extras.py --recover <task_id> <id>     # 下載已完成的任務
"""
import argparse, asyncio, csv, os, sys, time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tripo_gen import LOG, ROOT, load_env  # noqa: E402

RAW = ROOT / "assets" / "raw" / "extras" / "B"

PROMPTS = {
    "castle": "a small sand castle on its own, one round tower with low crenellated walls around it, "
              "made of wet beach sand, realistic",
    "kite": "a diamond-shaped kite with a cross frame, coral orange and off-white fabric, with a long ribbon tail, realistic",
    "crab": "a small ghost crab standing on the sand, pale sandy orange shell, two claws, realistic",
    "bird": "a white seagull flying with wings fully spread, realistic",
}


async def download(client, task, name):
    out = RAW / name
    out.mkdir(parents=True, exist_ok=True)
    files = await client.download_task_models(task, str(out))
    src = files.get("pbr_model") or files.get("model") or next(v for v in files.values() if v)
    return Path(src)


async def gen_one(client, name, prompt):
    before = (await client.get_balance()).balance
    t0 = time.time()
    extra = {"model_version": os.environ["TRIPO_MODEL_VERSION"]} if os.environ.get("TRIPO_MODEL_VERSION") else {}
    task_id = await client.text_to_model(prompt=prompt, texture=True, pbr=True, **extra)
    print(f"{name}: task {task_id}", flush=True)  # 先印出，下載失敗時可用 --recover 找回
    task = await client.wait_for_task(task_id, verbose=True)
    secs = round(time.time() - t0)
    status = str(task.status)
    dst = ""
    if "SUCCESS" in status.upper():
        dst = await download(client, task, name)
    after = (await client.get_balance()).balance
    print(f"balance {before} -> {after}", flush=True)
    return [datetime.now().isoformat(timespec="seconds"), f"extras:{name}", task_id, status, secs,
            round(before - after, 2), dst]


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--prompt", help="覆寫提示詞（只能配一個 id）")
    ap.add_argument("--recover", nargs=2, metavar=("TASK_ID", "ID"))
    a = ap.parse_args()
    load_env()
    from tripo3d import TripoClient
    kw: dict = {"api_key": os.environ["TRIPO_API_KEY"]}
    if os.environ.get("TRIPO_GLOBAL", "1") == "0":
        kw["IS_GLOBAL"] = False
    if a.recover:
        async with TripoClient(**kw) as client:
            print(await download(client, await client.get_task(a.recover[0]), a.recover[1]))
        return
    ids = a.ids or list(PROMPTS)
    if a.prompt and len(ids) != 1:
        ap.error("--prompt 只能配一個 id")
    jobs = [(i, a.prompt or PROMPTS[i]) for i in ids]
    for i, p in jobs:
        print(f"- {i}: {p}")
    if a.dry_run:
        return
    async with TripoClient(**kw) as client:
        with LOG.open("a", newline="") as f:
            w = csv.writer(f)
            for i, p in jobs:
                row = await gen_one(client, i, p)
                w.writerow(row); f.flush()
                print(row, flush=True)


if __name__ == "__main__":
    asyncio.run(main())
