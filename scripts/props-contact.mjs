// Assemble the inspection renders without introducing an image asset into the scene.
import {execFileSync} from 'node:child_process';
const round=process.argv[2];if(!/^r[1-9][0-9]*$/.test(round))throw Error('Usage: node scripts/props-contact.mjs rN');
execFileSync('python3',['-c',`
from PIL import Image,ImageDraw
from pathlib import Path
import json,sys
slots=json.loads(Path('assets/props.json').read_text())['slots']
out=Image.new('RGB',(1600,800),'#dddddd')
for i,s in enumerate(slots):
 p=Path('shots/A/props')/(s['id']+'.png')
 out.paste(Image.open(p).resize((400,400)),(i%4*400,i//4*400))
 ImageDraw.Draw(out).text((i%4*400+12,i//4*400+12),s['id'],fill='black')
out.save('shots/A/'+sys.argv[1]+'.png')
`,round]);
