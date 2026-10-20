"""B 的救生塔（2026-10-20 起）：Codex 生的參考圖（自帶梯子、欄杆留開口）→ Tripo image-to-model → Blender 減面到 30k。
原本用 props.json 文字 prompt 生成的塔沒有梯子；這版取代它，輸出 assets/tripo/lifeguard.glb。點數用餘額差計算，寫到 assets/tripo/log.csv（slot=lifeguard_ladder）。

用法：.venv/bin/python tools/tripo_image_tower.py [圖=assets/raw/lifeguard_ladder/tower.png]
"""
import asyncio, csv, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
from tripo3d import TripoClient

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "assets" / "tripo" / "log.csv"
IMAGE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "assets" / "raw" / "lifeguard_ladder" / "tower.png"
RAW = ROOT / "assets" / "raw" / "tripo" / "lifeguard"
OUT = ROOT / "assets" / "tripo" / "lifeguard.glb"
BLENDER = Path.home() / ".local/opt/blender-5.2.1-linux-x64/blender"


def env():
    for line in (ROOT / ".env").read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


async def main():
    env()
    async with TripoClient(api_key=os.environ["TRIPO_API_KEY"]) as client:
        before = (await client.get_balance()).balance
        t0 = time.time()
        task_id = await client.image_to_model(str(IMAGE), model_version=os.environ["TRIPO_MODEL_VERSION"], texture=True, pbr=True)
        print("task", task_id, flush=True)
        task = await client.wait_for_task(task_id, verbose=False)
        credits = before - (await client.get_balance()).balance
        with LOG.open("a", newline="") as f:
            csv.writer(f).writerow([datetime.now().isoformat(timespec="seconds"), "lifeguard_ladder", task_id, task.status, f"{time.time() - t0:.0f}", f"{credits:g}", "image_to_model from Codex reference"])
        print("status", task.status, f"{credits:g} credits", flush=True)
        if "success" not in str(task.status).lower():
            raise SystemExit("generation failed")
        files = await client.download_task_models(task, str(RAW))
    src = next(Path(p) for p in files.values() if p and str(p).endswith(".glb"))
    print("raw", src, flush=True)
    subprocess.run([str(BLENDER), "-b", "--factory-startup", "--python", str(ROOT / "tools" / "blender_decimate.py"), "--", str(src), str(OUT), "30000"], check=True)
    print("saved", OUT)


asyncio.run(main())
