/*
 * levels.js: Level definitions (LV) and the sci-fi arena builder.
 * Classic script (no modules): all files share one global scope, so load order in index.html matters.
 */

const LV = [
  {
    id: 'ob', n: 'Outpost Delta', sub: 'UNSC forward base. Cold steel and blue light.', rooms: 4, boss: 'zealot', mix: ['grunt', 'jackal', 'elite'], fog: 0x0a1018, floor: 0x1c2430, wall: 0x2a3442, pil: 0x3a4656, trim: 0x4fa8ff, grid: 0x232c39, sty: 'ob', lay: [[-8, -6], [8, -6], [-8, 8], [8, 8], [0, 1], [0, -14]]
  },
  {
    id: 'cc', n: 'Covenant Cruiser', sub: 'Violet corridors and alien monoliths.', rooms: 5, boss: 'warlord', mix: ['grunt', 'jackal', 'elite'], fog: 0x120a1e, floor: 0x241a34, wall: 0x2f2142, pil: 0x3d2d55, trim: 0xb06bff, grid: 0x2f2142, sty: 'cc', lay: [[-10, -2], [10, -2], [0, -9], [-5, 3], [5, 3], [-14, -12], [14, -12]]
  },
  {
    id: 'fr', n: 'Forerunner Ring', sub: 'Ancient halls lit with gold.', rooms: 6, boss: 'warden', mix: ['jackal', 'elite', 'grunt'], fog: 0x15120a, floor: 0x2a2418, wall: 0x3a3220, pil: 0x4a4028, trim: 0xffb347, grid: 0x3a3220, sty: 'fr', lay: [[-6, -8], [6, -8], [-12, 0], [12, 0], [0, -2], [-6, 6], [6, 6]]
  }
];

function buildLevel(lv, empty) {
  while (envG.children.length)
    envG.remove(envG.children[0]);
  pillars.length = 0;
  scene.background.setHex(lv.fog);
  scene.fog.color.setHex(lv.fog);
  floor.material.color.setHex(lv.floor);
  const M = c => new THREE.MeshLambertMaterial({ color: c });
  const G = c => new THREE.MeshBasicMaterial({ color: c });
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const add = (geo, m, x, y, z) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    envG.add(o);
    return o;
  };
  envG.add(new THREE.GridHelper(A * 2, 22, lv.trim, lv.grid));
  [[0, -A, A * 2 + 2, 1], [0, A, A * 2 + 2, 1], [-A, 0, 1, A * 2 + 2], [A, 0, 1, A * 2 + 2]].forEach(([x, z, w, d]) => {
    add(B(w, 6, d), M(lv.wall), x, 3, z);
    const ix = x ? -Math.sign(x) * .55 : 0;
    const iz = z ? -Math.sign(z) * .55 : 0;
    [.3, 5.2].forEach(y => add(B(w > 2 ? w - 1 : .1, .14, d > 2 ? d - 1 : .1), G(lv.trim), x + ix, y, z + iz));
    for (let k = -3; k <= 3; k++) {
      const p = k * 6;
      add(B(w > 2 ? .3 : .1, 3.2, d > 2 ? .3 : .1), G(lv.trim), w > 2 ? p : x + ix, 2.8, d > 2 ? p : z + iz);
    }
  });
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => add(new THREE.CylinderGeometry(.5, .5, 6, 8), G(lv.trim), a * 20.7, 3, b * 20.7));
  const ce = add(new THREE.PlaneGeometry(A * 2, A * 2), M(lv.wall), 0, 6, 0);
  ce.rotation.x = Math.PI / 2;
  [-12, 0, 12].forEach(x => add(B(.5, .1, A * 2 - 4), G(lv.trim), x, 5.9, 0));
  [8, 14].forEach(r => {
    const o = add(new THREE.RingGeometry(r, r + .12, 48), G(lv.trim), 0, .03, 0);
    o.rotation.x = -Math.PI / 2;
  });
  add(B(.1, .02, A * 2 - 2), G(lv.trim), 0, .03, 0);
  add(B(A * 2 - 2, .02, .1), G(lv.trim), 0, .03, 0);
  const pl = new THREE.PointLight(lv.trim, .8, 40);
  pl.position.set(0, 5, 0);
  envG.add(pl);
  if (!empty)
    lv.lay.forEach(([x, z]) => {
      pillars.push({ x, z });
      if (lv.sty === 'fr') {
        add(new THREE.CylinderGeometry(1.7, 1.7, 3.5, 6), M(lv.pil), x, 1.75, z);
        [.6, 1.75, 2.9].forEach(y => add(new THREE.CylinderGeometry(1.76, 1.76, .12, 6), G(lv.trim), x, y, z));
        add(new THREE.OctahedronGeometry(.45), G(lv.trim), x, 4.4, z);
      }
      else if (lv.sty === 'cc') {
        add(B(3, 3.5, 3), M(lv.pil), x, 1.75, z);
        add(new THREE.ConeGeometry(.7, 1.8, 5), G(lv.trim), x, 4.4, z);
        [.4, 3.1].forEach(y => add(B(3.04, .12, 3.04), G(lv.trim), x, y, z));
      }
      else {
        add(B(3, 3.5, 3), M(lv.pil), x, 1.75, z);
        [.5, 3].forEach(y => add(B(3.04, .12, 3.04), G(lv.trim), x, y, z));
        add(B(1.4, .8, 1.4), M(0x4d5a40), x, 3.9, z);
      }
    });
}
buildLevel(LV[0], true);
