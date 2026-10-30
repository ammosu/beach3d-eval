"""潛水海底（礁石、珊瑚、海草、熱帶魚）的 B 組 Tripo 生成；提示詞寫在本檔，不讀 assets/props.json。

設定跟 tools/tripo_gen.py 相同（text_to_model、texture、pbr、.env 的 TRIPO_MODEL_VERSION），
原始下載放 assets/raw/seabed/B/<id>/，耗時與點數記到 assets/tripo/log.csv（slot 欄寫 seabed:<id>）。
之後用 reef/tripo/prep.py 正規化成 assets/seabed/B/<id>.glb（魚轉成頭朝 +X；遊戲載入時再依 A 組規則縮放）。

用法：
  .venv/bin/python tools/tripo_seabed.py --dry-run
  .venv/bin/python tools/tripo_seabed.py castle kite        # 只生成指定項目
  .venv/bin/python tools/tripo_seabed.py --prompt "<新提示詞>" bird   # 重試時換提示詞
  .venv/bin/python tools/tripo_seabed.py --recover <task_id> <id>     # 下載已完成的任務
"""
import argparse, asyncio, csv, os, sys, time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tripo_gen import LOG, ROOT, load_env  # noqa: E402

RAW = ROOT / "assets" / "raw" / "seabed" / "B"

PROMPTS = {
    "rock": "a single rounded seabed boulder, grey stone with patches of green algae, realistic",
    "coral_branch": "a branching staghorn coral colony on its own, warm orange and pink branches, realistic",
    "coral_brain": "a single dome-shaped brain coral with winding grooves, yellow-green, realistic",
    "coral_fan": "a single purple sea fan coral (gorgonian), flat lace-like fan on a short stem, realistic",
    "seaweed": "a clump of tall green seaweed (kelp) blades growing from one base, realistic",
    "fish_yellow": "a yellow tang reef fish, bright yellow tall flat body, side view, swimming pose, realistic",
    "fish_bluetang": "a blue tang reef fish, royal blue body with a black pattern and a yellow tail, realistic",
    "fish_clown": "a clownfish, orange body with three white bands edged in black, realistic",
    "fish_butterfly": "a butterflyfish, white and yellow flat round body with a black band through the eye, realistic",
    "fish_angel": "a regal angelfish, yellow body with blue and white vertical stripes, realistic",
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
    return [datetime.now().isoformat(timespec="seconds"), f"seabed:{name}", task_id, status, secs,
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
    print(f"{len(jobs)} 個模型，以上次同設定每個 20 點估算：約 {20*len(jobs)} 點")
    if a.dry_run:
        async with TripoClient(**kw) as client:
            print("目前餘額", (await client.get_balance()).balance)
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
