"""試 Tripo v3.0 綁骨是否帶手指骨：沿用 B 角色的原模型 task，只送一次 rig（約 25 點），不做 retarget。
點數用餘額差計算，寫到 assets/tripo/log.csv（slot=character:rig_v3_<spec>）。輸出到 assets/raw/character_rig_v3/。

用法：.venv/bin/python tools/tripo_rig_test.py [spec=unity]
"""
import asyncio, csv, json, os, struct, sys, time
from datetime import datetime
from pathlib import Path
from tripo3d import TripoClient

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "assets" / "tripo" / "log.csv"
MODEL_TASK = "7620c213-780e-4d75-a622-4160bd5ae629"  # B 角色的 text_to_model（log.csv 第 11 行）
SPEC = sys.argv[1] if len(sys.argv) > 1 else "unity"
OUT = ROOT / "assets" / "raw" / "character_rig_v3" / SPEC


def env():
    for line in (ROOT / ".env").read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())


def bones(path):
    """Joint names of the first skin in a GLB, with each joint's parent."""
    b = Path(path).read_bytes()
    n = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + n])
    nodes = j["nodes"]
    parent = {c: i for i, nd in enumerate(nodes) for c in nd.get("children", [])}
    joints = j["skins"][0]["joints"] if j.get("skins") else []
    return [(nodes[k].get("name"), nodes[parent[k]].get("name") if k in parent else None) for k in joints]


async def main():
    env()
    OUT.mkdir(parents=True, exist_ok=True)
    async with TripoClient(api_key=os.environ["TRIPO_API_KEY"]) as client:
        print("riggable:", await client.check_riggable(MODEL_TASK), flush=True)
        before = (await client.get_balance()).balance
        t0 = time.time()
        task_id = await client.rig_model(MODEL_TASK, model_version="v3.0-20260909", out_format="glb", rig_type="biped", spec=SPEC)
        print("rig task", task_id, flush=True)
        task = await client.wait_for_task(task_id, verbose=False)
        credits = before - (await client.get_balance()).balance
        with LOG.open("a", newline="") as f:
            csv.writer(f).writerow([datetime.now().isoformat(timespec="seconds"), f"character:rig_v3_{SPEC}", task_id, task.status, f"{time.time() - t0:.0f}", f"{credits:g}", ""])
        print("status", task.status, f"{credits:g} credits", flush=True)
        if "success" not in str(task.status).lower():
            raise SystemExit("rig failed")
        files = await client.download_task_models(task, str(OUT))
        for p in files.values():
            if p and str(p).endswith(".glb"):
                names = bones(p)
                print("file", p, "joints", len(names))
                for name, par in names:
                    print(f"  {name}  <- {par}")


asyncio.run(main())
