"""把 Tripo 預設動作套到 v3.0（unity spec）綁好的 B 角色上，一段一個 task（每段約 10 點）。
點數用餘額差計算，寫到 assets/tripo/log.csv（slot=character:anim_v3_<動作>）。輸出到 assets/raw/character_rig_v3/anims/<動作>.glb。

用法：.venv/bin/python tools/tripo_retarget_v3.py walk [run idle jump climb]
"""
import asyncio, csv, os, shutil, sys, time
from datetime import datetime
from pathlib import Path
from tripo3d import TripoClient

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "assets" / "tripo" / "log.csv"
RIG_TASK = "fb683ba6-6fbb-4a44-b691-8b573123239c"  # tools/tripo_rig_test.py unity（log.csv）
OUT = ROOT / "assets" / "raw" / "character_rig_v3" / "anims"


def env():
    for line in (ROOT / ".env").read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


async def main(names):
    env()
    OUT.mkdir(parents=True, exist_ok=True)
    async with TripoClient(api_key=os.environ["TRIPO_API_KEY"]) as client:
        for name in names:
            before = (await client.get_balance()).balance
            t0 = time.time()
            task_id = await client.retarget_animation(RIG_TASK, f"preset:{name}", out_format="glb", animate_in_place=True)
            print(name, "task", task_id, flush=True)
            task = await client.wait_for_task(task_id, verbose=False)
            credits = before - (await client.get_balance()).balance
            with LOG.open("a", newline="") as f:
                csv.writer(f).writerow([datetime.now().isoformat(timespec="seconds"), f"character:anim_v3_{name}", task_id, task.status, f"{time.time() - t0:.0f}", f"{credits:g}", ""])
            print(name, task.status, f"{credits:g} credits", flush=True)
            if "success" not in str(task.status).lower():
                raise SystemExit(f"{name} failed: {task.status}")
            d = OUT / name
            d.mkdir(exist_ok=True)
            files = await client.download_task_models(task, str(d))
            src = next(Path(p) for p in files.values() if p and str(p).endswith(".glb"))
            shutil.copy(src, OUT / f"{name}.glb")
            print("saved", OUT / f"{name}.glb", flush=True)


asyncio.run(main(sys.argv[1:] or ["walk"]))
