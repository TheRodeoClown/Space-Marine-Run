/*
 * weapons.js: Weapon table, viewmodels, firing, needler, rockets, grenades, melee and pickups.
 * Classic script (no modules): all files share one global scope, so load order in index.html matters.
 */

const W = {
  ar: { n: 'MA40 Assault Rifle', dmg: 8, rate: .09, mag: 32, rt: 1.3, sp: .012, pel: 1, hs: 1.5, mbs: 1, kick: .004 },
  br: { n: 'BR55 Battle Rifle', dmg: 22, rate: .32, mag: 36, rt: 1.5, sp: .003, pel: 1, hs: 2.2, mbs: 1, kick: .01 },
  mg: { n: 'M6D Magnum', dmg: 30, rate: .34, mag: 12, rt: 1.1, sp: .004, pel: 1, hs: 2.5, mbs: .4, kick: .016 },
  sg: { n: 'M90 Shotgun', dmg: 6, rate: .8, mag: 8, rt: 2.2, sp: .075, pel: 9, hs: 1.3, mbs: .3, kick: .03 },
  sn: { n: 'S2 AM Sniper Rifle', dmg: 80, rate: 1, mag: 4, rt: 2.4, sp: .0005, pel: 1, hs: 3, mbs: .2, kick: .04, pierce: 1 },
  pr: { n: 'Type-25 Plasma Rifle', dmg: 6, rate: .07, mag: 60, rt: 1.6, sp: .02, pel: 1, hs: 1.2, mbs: 1.5, kick: .002, sh: 1.8, hp: .75, col: 0x7dff9a },
  rk: { n: 'M41 Rocket Launcher', dmg: 100, rate: 1.1, mag: 2, rt: 2.6, rocket: 1, mbs: .1, kick: .035 },
  nd: { n: 'Type-33 Needler', dmg: 4, rate: .11, mag: 24, rt: 1.5, sp: .03, pel: 1, hs: 1, mbs: 1, kick: .003, needle: 1, col: 0xff5fd0 }
};
let drops = [];
let rockets = [];
let needles = [];
let debris = [];
let zoomOn = false;
let swapT = 0;
let lw = 0;

function wst() {
  const w = W[P.wpn];
  return Object.assign({}, w, { dmg: w.dmg * P.dmg / 8, rate: w.rate * P.rate / .09, rt: w.rt * P.reloadT / 1.3 });
}

function recalcMag() {
  const w = W[P.wpn];
  P.magMax = Math.max(1, Math.round(w.mag + (P.mb || 0) * w.mbs));
}

function setW(p, k, sl) {
  p.sa[p.cur] = p.ammo;
  const i = sl != null ? sl : (p.slots[1] ? p.cur : 1);
  p.slots[i] = k;
  p.cur = i;
  p.wpn = k;
  recalcMag();
  p.ammo = p.magMax;
  p.sa[i] = p.ammo;
  p.reload = 0;
  p.cd = .3;
  setGun(k);
  swapT = .3;
}

function swapTo(i) {
  if (state !== 'play' || i === P.cur || !P.slots[i])
    return;
  P.sa[P.cur] = P.ammo;
  P.cur = i;
  P.wpn = P.slots[i];
  recalcMag();
  P.ammo = P.sa[i];
  P.reload = 0;
  P.cd = .35;
  setGun(P.wpn);
  swapT = .3;
  sfx.swap();
  if (P.ammo <= 0)
    startReload();
}
const gun = new THREE.Group();
cam.add(gun);
scene.add(cam);
gun.position.set(.26, -.24, -.55);

function setGun(k) {
  while (gun.children.length)
    gun.remove(gun.children[0]);
  const add = (w, h, d, x, y, z, c) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c }));
    m.position.set(x, y, z);
    gun.add(m);
  };
  const c = { ar: 0x5a6a4a, br: 0x4d5a40, mg: 0x666a70, sg: 0x5a4a3a, sn: 0x40454d, pr: 0x6b3fa0, rk: 0x6a5a3a, nd: 0xc0408a }[k];
  if (k === 'mg') {
    add(.05, .07, .22, 0, 0, -.05, c);
    add(.04, .1, .05, 0, -.07, .04, 0x333333);
  }
  else if (k === 'pr') {
    add(.08, .09, .4, 0, 0, -.1, c);
    add(.03, .03, .3, 0, .07, -.15, 0x7dff9a);
  }
  else if (k === 'rk') {
    add(.13, .13, .7, 0, .02, -.15, c);
    add(.09, .09, .1, 0, .02, -.55, 0x222222);
  }
  else if (k === 'sn') {
    add(.05, .07, .75, 0, 0, -.2, c);
    add(.04, .04, .25, 0, .08, -.1, 0x111111);
  }
  else if (k === 'nd') {
    add(.07, .09, .38, 0, 0, -.1, c);
    add(.03, .05, .2, 0, .07, -.12, 0xff7be0);
  }
  else if (k === 'sg') {
    add(.06, .07, .55, 0, 0, -.15, c);
    add(.08, .05, .2, 0, -.05, -.1, 0x3a2a1a);
  }
  else {
    add(.06, .09, .5, 0, 0, -.1, c);
    add(.04, .12, .06, 0, -.09, .02, 0x222222);
    add(.03, .03, .2, 0, .07, -.2, 0x222222);
  }
}
setGun('ar');

function animGun(dt) {
  gun.visible = state !== 'title';
  let x = .26;
  let y = -.24;
  let rx = 0;
  let ry = 0;
  let rz = 0;
  if (P && state === 'play') {
    if (swapT > 0) {
      swapT = Math.max(0, swapT - dt);
      y -= .45 * swapT / .3;
      rx -= .6 * swapT / .3;
    }
    if (P.reload > 0) {
      const u = 1 - P.reload / wst().rt;
      const d = Math.sin(Math.PI * u);
      const k = P.wpn;
      y -= .16 * d;
      rx += .45 * d;
      rz -= .35 * d;
      if (k === 'sg') {
        rx = .3 + .12 * Math.sin(u * Math.PI * 10);
        y = -.34;
        rz = -.2;
      }
      else if (k === 'rk') {
        rz = -1.0 * d;
        x -= .1 * d;
      }
      else if (k === 'sn') {
        ry = .5 * Math.sin(u * Math.PI * 2);
        x += .1 * Math.sin(u * Math.PI * 2);
      }
      else if (k === 'pr') {
        x += Math.sin(u * 60) * .006 * d;
        rx = .2 * d;
      }
      else if (k === 'nd') {
        rz = -.8 * Math.sin(u * Math.PI * 2);
      }
      else if (k === 'mg') {
        rx = .7 * d;
        y -= .05 * d;
      }
    }
  }
  const a = Math.min(1, dt * 20);
  gun.position.x += (x - gun.position.x) * a;
  gun.position.y += (y - gun.position.y) * a;
  gun.position.z += (-.55 - gun.position.z) * Math.min(dt * 18, 1);
  gun.rotation.x += (rx - gun.rotation.x) * a;
  gun.rotation.y += (ry - gun.rotation.y) * a;
  gun.rotation.z += (rz - gun.rotation.z) * a;
  debris.forEach(d => {
    d.v.y -= 12 * dt;
    d.m.position.addScaledVector(d.v, dt);
    d.m.rotation.x += dt * 6;
    if (d.m.position.y < .06) {
      d.m.position.y = .06;
      d.v.set(0, 0, 0);
    }
    d.life -= dt;
    if (d.life <= 0)
      scene.remove(d.m);
  });
  debris = debris.filter(d => d.life > 0);
}

function dropMag() {
  const m = new THREE.Mesh(new THREE.BoxGeometry(.05, .12, .07), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
  const f = fwd();
  const r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  m.position.copy(cam.position).addScaledVector(f, .5).addScaledVector(r, .25);
  m.position.y -= .3;
  scene.add(m);
  debris.push({ m, v: new THREE.Vector3(R(-.5, .5) + r.x * .8, .5, R(-.5, .5) + r.z * .8), life: 1.2 });
}

function fireNeedle(w, o, right) {
  const f = new THREE.Vector3(R(-w.sp, w.sp), R(-w.sp, w.sp), -1).applyQuaternion(cam.quaternion).normalize();
  const m = new THREE.Mesh(new THREE.BoxGeometry(.03, .03, .35), new THREE.MeshBasicMaterial({ color: 0xff5fd0 }));
  m.position.copy(o).addScaledVector(f, .9).addScaledVector(right, .2);
  m.position.y -= .2;
  m.lookAt(m.position.clone().add(f));
  scene.add(m);
  needles.push({ m, v: f.multiplyScalar(36), life: 2.5, dmg: w.dmg });
}

function updNeedles(dt) {
  needles.forEach(n => {
    const p = n.m.position;
    const sp = n.v.length();
    let be = null;
    let bd = 1e9;
    enemies.forEach(e => {
      if (e.dead)
        return;
      const dx = e.x - p.x;
      const dy = 1.1 * e.sc - p.y;
      const dz = e.z - p.z;
      const d = Math.hypot(dx, dy, dz);
      if (d < 14 && (dx * n.v.x + dy * n.v.y + dz * n.v.z) / (d * sp) > .85 && d < bd) {
        bd = d;
        be = e;
      }
    });
    if (be)
      n.v.lerp(new THREE.Vector3(be.x - p.x, 1.1 * be.sc - p.y, be.z - p.z).normalize().multiplyScalar(sp), Math.min(1, dt * 4));
    p.addScaledVector(n.v, dt);
    n.m.lookAt(p.clone().add(n.v));
    n.life -= dt;
    for (const e of enemies) {
      if (e.dead)
        continue;
      if (Math.hypot(e.x - p.x, 1.1 * e.sc - p.y, e.z - p.z) < .8 * e.sc) {
        dmgE(e, n.dmg * P.dmg / 8);
        hitT = .08;
        hitCol = '#ff8ae0';
        e.nd = (e.nd || 0) + 1;
        e.ndl = e.ndl || [];
        n.m.position.set(R(-.3, .3), R(.7, 1.5), R(-.2, .2));
        n.m.rotation.set(R(0, 3), R(0, 3), 0);
        e.g.add(n.m);
        e.ndl.push(n.m);
        n.hooked = true;
        n.life = -1;
        if (e.nd >= 7 && !e.fuse)
          e.fuse = .7;
        break;
      }
    }
    if (!n.hooked && (n.life <= 0 || p.y < .05 || Math.abs(p.x) > A || Math.abs(p.z) > A || pillars.some(q => Math.abs(p.x - q.x) < 1.5 && Math.abs(p.z - q.z) < 1.5 && p.y < 3.5))) {
      n.life = -1;
      scene.remove(n.m);
    }
  });
  needles = needles.filter(n => n.life > 0);
  enemies.forEach(e => {
    if (e.fuse > 0 && !e.dead) {
      e.fuse -= dt;
      e.mat.emissive.setHex(Math.floor(T * 20) % 2 ? 0xff3fd0 : 0);
      if (e.fuse <= 0) {
        e.ndl.forEach(m => e.g.remove(m));
        e.nd = 0;
        e.fuse = 0;
        explode(e.x, 1.1 * e.sc, e.z, 4, 70 * P.dmg / 8, 10);
      }
    }
  });
}

function dropMaybe(e) {
  if (Math.random() > ({ grunt: .25, jackal: .2, elite: .35, hunter: 1 }[e.t]))
    return;
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0x7dff6a })), new THREE.Mesh(new THREE.TorusGeometry(.32, .03, 6, 16), new THREE.MeshBasicMaterial({ color: 0xd8ff9a })));
  g.position.set(e.x, .6, e.z);
  scene.add(g);
  drops.push({ m: g, x: e.x, z: e.z, life: 25 });
}

function updDrops(dt) {
  drops.forEach(d => {
    d.life -= dt;
    d.m.position.y = .6 + Math.sin(T * 3 + d.x) * .12;
    d.m.rotation.y += dt * 2;
    d.m.visible = d.life > 5 || Math.floor(T * 8) % 2 === 0;
    if (d.life > 0 && Math.hypot(P.x - d.x, P.z - d.z) < 1.3 && P.nades < P.nadeMax) {
      P.nades++;
      d.life = 0;
      sfx.grab();
    }
    if (d.life <= 0)
      scene.remove(d.m);
  });
  drops = drops.filter(d => d.life > 0);
}

function explode(x, y, z, rad, dm, selfD) {
  enemies.forEach(e => {
    const d = Math.hypot(e.x - x, e.z - z, e.sc - y);
    if (d < rad)
      dmgE(e, dm * (1 - d / rad * .5));
  });
  if (Math.hypot(P.x - x, 1.6 - y, P.z - z) < rad)
    hurt(selfD);
  flashFx(x, y, z, rad, 0xffb040);
  sfx.boom();
}

function updRockets(dt) {
  rockets.forEach(r => {
    const p = r.m.position;
    p.addScaledVector(r.v, dt);
    r.life -= dt;
    if (r.life <= 0 || p.y < .1 || Math.abs(p.x) > A || Math.abs(p.z) > A || pillars.some(q => Math.abs(p.x - q.x) < 1.5 && Math.abs(p.z - q.z) < 1.5 && p.y < 3.5) || enemies.some(e => !e.dead && Math.hypot(e.x - p.x, e.sc * 1.1 - p.y, e.z - p.z) < .9 * e.sc)) {
      r.life = -1;
      explode(p.x, p.y, p.z, 6 * Math.sqrt(P.nadeMul), W.rk.dmg * P.dmg / 8, 20);
      scene.remove(r.m);
    }
  });
  rockets = rockets.filter(r => r.life > 0);
}

function fire() {
  const w = wst();
  const o = cam.position;
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  P.ammo--;
  P.cd = w.rate;
  pitch += w.kick;
  gun.position.z = -.46;
  sfx.shot(P.wpn);
  if (w.rocket) {
    const f = fwd();
    const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
    m.scale.set(1, 1, 3);
    m.position.copy(o).addScaledVector(f, .9).addScaledVector(right, .2);
    m.position.y -= .2;
    m.lookAt(m.position.clone().add(f));
    scene.add(m);
    rockets.push({ m, v: f.multiplyScalar(30), life: 4 });
  }
  else if (w.needle) {
    fireNeedle(w, o, right);
  }
  else
    for (let i = 0; i < w.pel; i++) {
      const d = new THREE.Vector3(R(-w.sp, w.sp), R(-w.sp, w.sp), -1).applyQuaternion(cam.quaternion).normalize();
      const hits = [];
      enemies.forEach(e => {
        if (e.dead)
          return;
        const dx = e.x - o.x;
        const dy = 1.1 * e.sc - o.y;
        const dz = e.z - o.z;
        const t = dx * d.x + dy * d.y + dz * d.z;
        if (t > 0 && dx * dx + dy * dy + dz * dz - t * t < (.8 * e.sc) ** 2)
          hits.push({ e, t });
      });
      hits.sort((a, b) => a.t - b.t);
      const wt = wallT(o, d);
      let end = Math.min(wt, 60);
      if (!w.pierce && hits.length && hits[0].t < wt)
        end = hits[0].t;
      hits.slice(0, w.pierce ? 2 : 1).forEach(h => {
        if (h.t < wt) {
          const head = o.y + d.y * h.t > 1.5 * h.e.sc;
          dmgE(h.e, w.dmg * (head ? w.hs : 1) * (h.e.sh > 0 ? (w.sh || 1) : (w.hp || 1)));
          hitT = .12;
          hitCol = head ? '#ffd24a' : '#fff';
          if (i === 0)
            sfx.tick(head);
        }
      });
      const s = o.clone().addScaledVector(right, .25).addScaledVector(d, .6);
      s.y -= .2;
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([s, o.clone().addScaledVector(d, end)]), new THREE.LineBasicMaterial({ color: w.col || 0xffe9a0 }));
      scene.add(l);
      tracers.push({ m: l, life: .05 });
    }
  if (P.ammo <= 0)
    startReload();
}

function startReload() {
  if (P.reload <= 0 && P.ammo < P.magMax) {
    P.reload = wst().rt;
    sfx.reload(P.wpn);
    if ('ar,br,mg,nd'.includes(P.wpn))
      dropMag();
  }
}

function throwNade() {
  if (P.nades <= 0 || state !== 'play')
    return;
  P.nades--;
  sfx.throw();
  const f = fwd();
  const m = new THREE.Mesh(new THREE.SphereGeometry(.15, 10, 8), new THREE.MeshBasicMaterial({ color: 0x6fbf4a }));
  m.position.copy(cam.position).addScaledVector(f, .8);
  scene.add(m);
  nades.push({ m, v: f.clone().multiplyScalar(15).add(new THREE.Vector3(0, 4, 0)), fuse: 1.5 });
}

function melee() {
  if (P.mcd > 0 || state !== 'play')
    return;
  P.mcd = P.sword ? .5 : .7;
  if (P.sword)
    sfx.sword();
  else
    sfx.melee();
  const f = fwd();
  vig = Math.max(vig, .0);
  enemies.forEach(e => {
    const dx = e.x - P.x;
    const dz = e.z - P.z;
    const d = Math.hypot(dx, dz);
    const rc = P.sword ? 4.2 : 2.8;
    if (d < rc + e.sc * .4 && (dx * f.x + dz * f.z) / d > (P.sword ? .3 : .5)) {
      dmgE(e, 45 * P.meleeMul * (P.sword ? 3 : 1));
      e.x += dx / d * 1.8;
      e.z += dz / d * 1.8;
    }
  });
  flashFx(cam.position.x + f.x * 1.2, 1.2, cam.position.z + f.z * 1.2, .7, 0x8ce6ff);
}
