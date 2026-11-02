/*! @license Gull geometry and flapping shader adapted from Athenaion (src/modules/birds.js).
MIT License

Copyright (c) 2026 Leon Lin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import * as THREE from 'three';

// Seagulls shared by all groups: one InstancedMesh, one draw call, wings flapped in the vertex shader from the water
// clock. Flight paths are this project's own closed curves. Each bird is an empty Group under `extra-birds` holding
// its pose (scripts read those positions); the mesh is the last child and copies their matrices every frame.
function gullGeometry() {
  const P = [], N = [], C = [], F = [], I = [];
  const add = (p, n, c, f) => { P.push(...p); N.push(...n); C.push(...c); F.push(...f); return P.length / 3 - 1; };
  const WHITE = [0.86, 0.87, 0.88], MANTLE = [0.50, 0.53, 0.57], BLACK = [0.03, 0.03, 0.035], BILL = [0.86, 0.62, 0.10], EYE = [0.05, 0.05, 0.05];

  // body: spindle along Z, slightly flattened
  const prof = [[-0.34, 0.0], [-0.27, 0.035], [-0.14, 0.07], [0.0, 0.082], [0.13, 0.068], [0.2, 0.05], [0.25, 0.052], [0.3, 0.04], [0.335, 0.0]];
  const seg = 8, ring0 = [];
  for (let r = 0; r < prof.length; r++) {
    const [z, rad] = prof[r];
    const row = [];
    for (let s = 0; s < seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad * 0.88 + (z > 0.18 ? 0.025 : 0);
      const nx = Math.cos(a), ny = Math.sin(a);
      const back = ny > 0.35 && z < 0.15 && z > -0.2; // pale grey back between the wings
      row.push(add([x, y, z], [nx, ny, 0], back ? MANTLE : WHITE, [0, 0]));
    }
    ring0.push(row);
  }
  for (let r = 0; r < prof.length - 1; r++) for (let s = 0; s < seg; s++) {
    const a = ring0[r][s], b = ring0[r][(s + 1) % seg], c = ring0[r + 1][s], d = ring0[r + 1][(s + 1) % seg];
    I.push(a, b, c, b, d, c); // Winding flipped from Athenaion, where body, tail and wing faces pointed the wrong way.
  }
  // bill (cone)
  const tip = add([0, 0.018, 0.40], [0, 0, 1], BILL, [0, 0]);
  const bb = [];
  for (let s = 0; s < 5; s++) { const a = (s / 5) * Math.PI * 2; bb.push(add([Math.cos(a) * 0.014, 0.022 + Math.sin(a) * 0.012, 0.315], [Math.cos(a), Math.sin(a), 0.3], BILL, [0, 0])); }
  for (let s = 0; s < 5; s++) I.push(bb[s], bb[(s + 1) % 5], tip);
  // eyes
  for (const sx of [-1, 1]) {
    const e0 = add([sx * 0.036, 0.05, 0.27], [sx, 0.2, 0.2], EYE, [0, 0]), e1 = add([sx * 0.038, 0.058, 0.262], [sx, 0.2, 0.2], EYE, [0, 0]), e2 = add([sx * 0.036, 0.05, 0.254], [sx, 0.2, 0.2], EYE, [0, 0]);
    I.push(...(sx > 0 ? [e0, e1, e2] : [e0, e2, e1]));
  }
  // tail fan (double sided via two faces)
  const tl = [[-0.055, -0.22], [0.055, -0.22], [0.075, -0.39], [-0.075, -0.39]];
  for (const up of [1, -1]) {
    const v = tl.map(([x, z]) => add([x, 0.012 * up, z], [0, up, 0], up > 0 ? WHITE : WHITE, [0, 0]));
    if (up > 0) I.push(v[0], v[1], v[2], v[0], v[2], v[3]); else I.push(v[0], v[2], v[1], v[0], v[3], v[2]);
  }
  // wings: span stations (x, leading z, trailing z, segment, colour rule)
  const span = [
    [0.05, 0.085, -0.13, 1], [0.18, 0.09, -0.15, 1], [0.32, 0.08, -0.15, 1],      // arm (shoulder → wrist)
    [0.44, 0.045, -0.15, 2], [0.56, 0.0, -0.14, 2], [0.66, -0.05, -0.12, 2], [0.73, -0.1, -0.11, 2], // hand
  ];
  const chordN = 3;
  for (const side of [-1, 1]) {
    for (const up of [1, -1]) {
      const grid = [];
      for (let si = 0; si < span.length; si++) {
        const [x, zl, zt, sg] = span[si];
        const sNorm = (x - 0.05) / 0.68;
        const row = [];
        for (let ci = 0; ci <= chordN; ci++) {
          const u = ci / chordN; // 0 leading, 1 trailing
          const z = zl + (zt - zl) * u;
          // airfoil: thicker near the leading edge, thin trailing edge; camber
          const th = 0.012 * (1 - u) * (1 - sNorm * 0.7);
          const y = 0.01 * Math.sin(Math.PI * Math.min(1, u * 1.2)) * (1 - sNorm * 0.5) + th * up;
          let col;
          if (up < 0) col = sNorm > 0.72 ? [0.30, 0.30, 0.32] : WHITE;             // underside white, dusky tip
          else {
            col = MANTLE;
            if (u > 0.85 && sNorm < 0.7) col = [0.8, 0.81, 0.82];                  // white trailing edge
            if (sNorm > 0.66) col = BLACK;                                          // black primaries
            if (sNorm > 0.86 && u > 0.2 && u < 0.7) col = [0.82, 0.82, 0.83];     // white mirror near the tip
          }
          row.push(add([x * side, y, z], [0, up, 0], col, [sNorm, sg]));
        }
        grid.push(row);
      }
      for (let si = 0; si < span.length - 1; si++) for (let ci = 0; ci < chordN; ci++) {
        const a = grid[si][ci], b = grid[si][ci + 1], c = grid[si + 1][ci], d = grid[si + 1][ci + 1];
        const flip = (side * up) > 0;
        if (flip) I.push(a, c, b, b, c, d); else I.push(a, b, c, b, d, c);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(F, 2));
  g.setIndex(I);
  g.computeBoundingSphere();
  g.boundingSphere.radius = 1.0;
  return g;
}

// ------------------------------------------------------------------ material (flapping in the vertex shader)
function gullMaterial(clock) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0, side: THREE.FrontSide });
  mat.name = 'gull';
  mat.userData.shaderKey = 'gull-v1';
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uBirdTime = clock;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uBirdTime;
        attribute vec2 aWing;
        varying float vUnder;
        attribute vec3 aBird; // x: phase seed, y: flap rate (Hz), z: flap duty
        vec2 gRot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(v.x * c - v.y * s, v.x * s + v.y * c); }
        void gullPose(inout vec3 p, inout vec3 n){
          if (aWing.y < 0.5) return;
          float ph = uBirdTime * 6.2831853 * aBird.y + aBird.x * 40.0;
          // flapping bursts alternate with glides
          float env = smoothstep(0.15, 0.55, sin(uBirdTime * 0.55 + aBird.x * 17.0) * 0.5 + 0.5 - (1.0 - aBird.z) * 0.5);
          float a1 = mix(0.17, 0.10 + 0.62 * sin(ph), env);
          float a2 = mix(-0.30, -0.06 + 0.42 * sin(ph - 0.8), env);
          float sd = sign(p.x);
          vec2 xy = vec2(abs(p.x), p.y), nn = vec2(abs(n.x) * (n.x * sd >= 0.0 ? 1.0 : -1.0), n.y);
          if (aWing.y > 1.5) { vec2 w = vec2(0.32, 0.0); xy = w + gRot(xy - w, a2); nn = gRot(nn, a2); }
          vec2 s0 = vec2(0.05, 0.0); xy = s0 + gRot(xy - s0, a1); nn = gRot(nn, a1);
          p.x = xy.x * sd; p.y = xy.y; n.x = nn.x * sd; n.y = nn.y;
        }`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        { vec3 pp = position; gullPose(pp, objectNormal); vUnder = max(0.0, -normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal).y); }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { vec3 nn = normal; gullPose(transformed, nn); }`);
    // This scene's hemisphere light is sand-brown from below, which turned the white undersides brown. Add the sea and
    // sky bounce plus the sun through the feathers, on this material only.
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vUnder;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * vec3(0.50, 0.58, 0.66) * vUnder;`);
  };
  return mat;
}

// x: phase seed, y: flap rate (Hz), z: flap duty. Fixed, so every load and recording is the same.
const SEEDS = [[0.13, 2.8, 0.45], [0.58, 3.1, 0.6], [0.37, 2.7, 0.4], [0.82, 3.3, 0.7]];

export function createBirds(scene, clock) {
  const root = new THREE.Group(); root.name = 'extra-birds'; scene.add(root);
  const birds = SEEDS.map(() => { const b = new THREE.Group(); root.add(b); return b; });
  const geo = gullGeometry();
  geo.setAttribute('aBird', new THREE.InstancedBufferAttribute(new Float32Array(SEEDS.flat()), 3));
  const mesh = new THREE.InstancedMesh(geo, gullMaterial(clock), birds.length);
  mesh.name = 'gulls'; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(mesh);
  function pose(i, t, out) {
    const a = t * (.035 + i * .006) + i * 1.7, r = 20 + i * 9;
    out.set(-8 + Math.cos(a) * r, 18 + i * 5 + Math.sin(a * 2) * 2, -62 + Math.sin(a) * (r * .7));
    if (i === 0) out.y -= 16 * Math.pow(Math.max(0, Math.sin(a)), 8);
    return out;
  }
  const next = new THREE.Vector3();
  return {
    count: birds.length,
    update(t) {
      birds.forEach((b, i) => {
        pose(i, t, b.position); pose(i, t + .05, next); b.lookAt(next); b.rotateZ(.12 * Math.sin(t * .7 + i * 1.9));
        b.updateMatrix(); mesh.setMatrixAt(i, b.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
