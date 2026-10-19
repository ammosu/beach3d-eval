import json,subprocess,sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
# 用 Opus 5.5 當第二位評審，評 tools/blind_props.py 產生的同一批匿名圖 → eval_props/scores_opus_judge.json
R=Path(__file__).resolve().parent.parent / 'eval_props'
def judge(n):
    d=R/f'round{n}'
    prompt=f"先用 Read 工具查看 {d}/props_grid.png 這張圖，然後依下面的指示評分。\n\n"+(d/'prompt.md').read_text()
    r=subprocess.run(['claude','-p','--model','claude-opus-5-5','--output-format','json','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--setting-sources','','--tools','Read','--allowedTools','Read'],input=prompt,text=True,capture_output=True,timeout=1200)
    j=json.loads(r.stdout); raw=j['result']; raw=raw[raw.index('{'):raw.rindex('}')+1]
    (d/'score_opus.json').write_text(raw)
    return n,json.loads(raw),j.get('total_cost_usd',0)
with ThreadPoolExecutor(5) as ex: res=list(ex.map(judge,range(5)))
avg=lambda xs: round(sum(xs)/len(xs),2)
tot={};rank=[];cost=0
for n,r,c in res:
    cost+=c
    m=json.loads((R/f'round{n}'/'mapping.json').read_text())
    for lab,src in m.items():
        tot.setdefault(src,[]).append(avg(list(r['criteria'][lab].values())))
    rank.append([m[x] for x in r['ranking']])
out={'total':{s:avg(v) for s,v in tot.items()},'rankings':rank,'cost_usd':round(cost,2)}
(R/'scores_opus_judge.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(out)
