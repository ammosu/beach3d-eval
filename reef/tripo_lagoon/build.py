"""Opus 版 Reef Lagoon → Tripo 模型版：生物網格改用 reef/tripo/models/*.glb，其餘（水、行為、入水、介面）完全沿用。

用法：python3 reef/tripo_lagoon/build.py   → reef/tripo_lagoon/index.html、models/
- 先載入 7 個 GLB 再啟動主程式；某個 GLB 載入失敗時，該物種退回原本的程序化模型。
- 游動仍由原本的 vertex shader 依本地座標 p.x 算身體波動；外觀改取 Tripo 貼圖。
- 胸鰭／海龜鰭沒有零件，依寬度輪廓（reef/tripo/prep.py 正規化後量得）指定轉軸與權重。
"""
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "opus" / "index.html"
MODELS = HERE.parent / "tripo" / "models"

s = SRC.read_text()


def sub(old, new, count=1):
    global s
    assert s.count(old) == count, f"找不到或不唯一：{old[:60]!r}（{s.count(old)} 處）"
    s = s.replace(old, new)


sub("<title>Reef Lagoon</title>", "<title>Reef Lagoon · Tripo</title>")
sub('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n(function(){',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n'
    '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>\n'
    '<script>\nwindow.__lagoonMain = function(){')
sub("})();\n</script>\n</body>", """};
</script>
<script>
// Tripo 模型：先全部載入，再啟動主程式（失敗的物種沿用程序化模型）
(function(){
  const FILES = { shark: 'shark', hammer: 'hammerhead', humpback: 'humpback', orca: 'orca', dolphin: 'dolphin', turtle: 'turtle', manta: 'manta' };
  window.TRIPO = {};
  const loader = THREE.GLTFLoader ? new THREE.GLTFLoader() : null;
  const one = (key, file) => new Promise(done => {
    if (!loader) return done();
    loader.load('models/' + file + '.glb', gltf => {
      gltf.scene.updateMatrixWorld(true);
      let mesh = null; gltf.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
      if (mesh) { const g = mesh.geometry.clone(); g.applyMatrix4(mesh.matrixWorld); window.TRIPO[key] = { geo: g, map: mesh.material.map || null }; }
      done();
    }, undefined, err => { console.warn('Tripo model failed:', file, err); done(); });
  });
  Promise.all(Object.keys(FILES).map(k => one(k, FILES[k]))).then(() => window.__lagoonMain());
})();
</script>
</body>""")

# ---- 幾何：有 Tripo 模型的物種直接回傳 GLB 網格 ----
sub("function buildSpecies(key) {\n", """// 胸鰭／海龜鰭的轉軸：x 範圍、|z| 起點（往外 0.04 漸入權重）、y 上限、轉軸位置；rear＝海龜後鰭（part 5）
const TRIPO_HINGE = {
  shark: [{ x0: -0.05, x1: 0.25, z0: 0.09, y1: 0.02, piv: [0.13, -0.03, 0.08] }],
  hammer: [{ x0: 0.05, x1: 0.28, z0: 0.09, y1: 0.02, piv: [0.17, -0.03, 0.08] }],
  humpback: [{ x0: -0.15, x1: 0.20, z0: 0.15, y1: 1, piv: [0.08, -0.04, 0.13] }],
  orca: [{ x0: 0.0, x1: 0.25, z0: 0.16, y1: 0.02, piv: [0.12, -0.05, 0.14] }],
  dolphin: [{ x0: -0.05, x1: 0.20, z0: 0.10, y1: 0.02, piv: [0.08, -0.04, 0.09] }],
  turtle: [{ x0: -0.32, x1: 0.32, z0: 0.29, y1: 1, piv: [0.12, -0.01, 0.26] },
           { x0: -0.60, x1: -0.36, z0: 0.06, y1: 1, piv: [-0.36, -0.02, 0.08], rear: true }],
};
function tripoSpecies(key) {
  const T = window.TRIPO[key], src = T.geo;
  const pos = src.attributes.position, n = pos.count;
  const info = new Float32Array(n * 4), hinge = new Float32Array(n * 4);
  const H = TRIPO_HINGE[key] || [];
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), az = Math.abs(z), sd = z < 0 ? -1 : 1;
    let part = 0;
    for (const h of H) {
      if (x < h.x0 || x > h.x1 || y > h.y1 || az < h.z0) continue;
      const w = Math.min(1, (az - h.z0) / 0.04);
      hinge.set([h.piv[0], h.piv[1], h.piv[2] * sd, w], i * 4);
      part = h.rear ? 5 : 2;
      break;
    }
    info.set([part, 0.5 - x, 0, sd], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', pos);
  g.setAttribute('normal', src.attributes.normal);
  if (src.attributes.uv) g.setAttribute('uv', src.attributes.uv);
  g.setAttribute('aInfo', new THREE.BufferAttribute(info, 4));
  g.setAttribute('aHinge', new THREE.BufferAttribute(hinge, 4));
  g.setIndex(src.index);
  return { geo: g, eye: new THREE.Vector4(0, 0, 0, 0), map: T.map };
}
function buildSpecies(key) {
  if (window.TRIPO && window.TRIPO[key]) return tripoSpecies(key);
""")
sub("  return { geo: g, eye };\n}", "  return { geo: g, eye, map: null };\n}")

# ---- 材質：貼圖 uniform ----
sub("function creatureMat(sp, eye, pass) {", "function creatureMat(sp, eye, pass, map) {")
sub("uEye: { value: eye } });", "uEye: { value: eye }, uMap: { value: map || null }, uHasTex: { value: map ? 1 : 0 } });")
sub("const mk = (pass, scene) => { const m = new THREE.Mesh(geo, creatureMat(i, b.eye, pass));",
    "const mk = (pass, scene) => { const m = new THREE.Mesh(geo, creatureMat(i, b.eye, pass, b.map));")
sub("const r = { base: b.geo, eye: b.eye, geo,", "const r = { base: b.geo, eye: b.eye, map: b.map, geo,")
sub("creatureMat(i, RENDER[i].eye, 'THUMB')", "creatureMat(i, RENDER[i].eye, 'THUMB', RENDER[i].map)")

# ---- shader：傳 uv、取貼圖 ----
sub("varying float vAlpha; varying float vWet; varying float vWaterH; varying float vShade;\nvec3 qrot",
    "varying float vAlpha; varying float vWet; varying float vWaterH; varying float vShade; varying vec2 vUv;\nvec3 qrot")
sub("  vRest = position; vRestN = normal; vInfo = aInfo;", "  vUv = uv; vRest = position; vRestN = normal; vInfo = aInfo;")
sub("varying float vAlpha; varying float vWet; varying float vWaterH; varying float vShade;\nvec4 voroV",
    "varying float vAlpha; varying float vWet; varying float vWaterH; varying float vShade; varying vec2 vUv;\n"
    "uniform sampler2D uMap; uniform float uHasTex;\nvec4 voroV")
sub("  else alb = colManta(part, vRest, vInfo, nl, gloss);\n",
    "  else alb = colManta(part, vRest, vInfo, nl, gloss);\n"
    "  if (uHasTex > 0.5) alb = texture2D(uMap, vUv).rgb;\n")

HERE.mkdir(exist_ok=True)
(HERE / "index.html").write_text(s)
(HERE / "models").mkdir(exist_ok=True)
for f in MODELS.glob("*.glb"):
    shutil.copy(f, HERE / "models" / f.name)
print("ok", HERE / "index.html", sorted(p.name for p in (HERE / "models").glob("*.glb")))
