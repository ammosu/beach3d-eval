"""用 Tripo 生成遊戲角色：文字生模型（T-pose）→ 綁骨（biped）→ 套預設動作 → assets/character/
每一步的點數用餘額差計算，寫到 assets/tripo/log.csv（slot=character:<步驟>）。

用法：.venv/bin/python tools/tripo_character.py
"""
import asyncio, csv, os, shutil, time
from datetime import datetime
from pathlib import Path
from tripo3d import TripoClient

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "character"
RAW = ROOT / "assets" / "raw" / "character"
LOG = ROOT / "assets" / "tripo" / "log.csv"
PROMPT = ("full-body young adult beach tourist game character standing in T-pose, arms straight out horizontally, "
          "floral hawaiian shirt, khaki shorts, flip-flop sandals, short hair, realistic proportions, friendly face")
ANIMS = ["preset:idle", "preset:walk", "preset:run", "preset:jump", "preset:climb"]


def env():
    for line in (ROOT / ".env").read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


async def step(client, name, start):
    before = (await client.get_balance()).balance
    t0 = time.time()
    task_id = await start()
    print(name, "task", task_id, flush=True)
    task = await client.wait_for_task(task_id, verbose=False)
    secs = time.time() - t0
    credits = before - (await client.get_balance()).balance
    with LOG.open("a", newline="") as f:
        csv.writer(f).writerow([datetime.now().isoformat(timespec="seconds"), f"character:{name}", task_id, task.status, f"{secs:.0f}", f"{credits:g}", ""])
    print(name, task.status, f"{secs:.0f}s", f"{credits:g} credits", flush=True)
    if str(task.status).lower().find("success") < 0:
        raise SystemExit(f"{name} failed: {task.status}")
    return task_id, task


async def main():
    env()
    OUT.mkdir(parents=True, exist_ok=True)
    async with TripoClient(api_key=os.environ["TRIPO_API_KEY"]) as client:
        model_id, _ = await step(client, "model", lambda: client.text_to_model(
            prompt=PROMPT, model_version=os.environ["TRIPO_MODEL_VERSION"], face_limit=20000))
        print("riggable:", await client.check_riggable(model_id))
        rig_id, _ = await step(client, "rig", lambda: client.rig_model(model_id, out_format="glb"))
        for anim in ANIMS:
            name = anim.split(":")[-1]
            _, task = await step(client, f"anim_{name}", lambda a=anim: client.retarget_animation(rig_id, a, out_format="glb", animate_in_place=True))
            d = RAW / name
            d.mkdir(parents=True, exist_ok=True)
            files = await client.download_task_models(task, str(d))
            src = next(Path(p) for p in files.values() if p)
            shutil.copy(src, OUT / f"{name}.glb")
            print("saved", OUT / f"{name}.glb", flush=True)


asyncio.run(main())
