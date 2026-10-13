/*
 * enemies.js: Enemy models, spawning, damage and shared combat helpers.
 * Classic script (no modules): all files share one global scope, so load order in index.html matters.
 */

function buildEnemy(t) {
  const L = (c) => new THREE.MeshLambertMaterial({ color: c });
  const g = new THREE.Group();
  const glow = c => new THREE.MeshBasicMaterial({ color: c });
  const P3 = (geo, m, x, y, z, s) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    if (s)
      o.scale.set(s[0], s[1], s[2]);
    g.add(o);
    return o;
  };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const S = r => new THREE.SphereGeometry(r, 12, 10);
  const C = (r, h) => new THREE.CylinderGeometry(r, r, h, 10);
  let mat;
  if (t === 'grunt') {
    mat = L(0xe8943a);
    const skin = L(0x8a7a5a);
    const dark = L(0x2a2a30);
    P3(B(.7, .75, .5), mat, 0, .95, 0).rotation.x = .25;
    P3(S(.3), skin, 0, 1.5, .18, [1, .9, 1]);
    P3(B(.28, .2, .12), dark, 0, 1.42, .42);
    P3(S(.05), glow(0xffd24a), -.12, 1.58, .4);
    P3(S(.05), glow(0xffd24a), .12, 1.58, .4);
    [-.18, .18].forEach(x => {
      P3(B(.22, .6, .24), mat, x, .3, .05);
      P3(C(.13, .75), L(0x7fb6d9), x * .95, 1.0, -.38);
    });
    [-.5, .5].forEach(x => P3(B(.18, .55, .2), skin, x, .9, .1));
    P3(B(.1, .14, .3), glow(0x7dff6a), .5, .72, .35);
  }
  else if (t === 'jackal') {
    mat = L(0x4a5560);
    const skin = L(0x9a8f78);
    const sh = new THREE.MeshBasicMaterial({ color: 0x6fe0ff, transparent: true, opacity: .45, side: THREE.DoubleSide });
    P3(B(.45, .7, .35), mat, 0, 1.05, 0).rotation.x = .2;
    P3(S(.2), skin, 0, 1.7, .15, [.8, 1, 1.3]);
    P3(new THREE.ConeGeometry(.09, .4, 8), L(0xc9b98a), 0, 1.65, .5).rotation.x = Math.PI / 2;
    P3(S(.04), glow(0xff5030), -.1, 1.75, .38);
    P3(S(.04), glow(0xff5030), .1, 1.75, .38);
    [-.14, .14].forEach(x => P3(B(.12, .8, .14), skin, x, .4, 0));
    P3(B(.1, .55, .1), skin, .32, 1.1, .1);
    P3(B(.08, .12, .4), L(0x333333), .34, .95, .4);
    P3(C(.5, .06), sh, -.5, 1.2, .25).rotation.x = Math.PI / 2;
  }
  else if (t === 'elite') {
    mat = L(0x3b5bd6);
    const skin = L(0x3d3347);
    const metal = L(0x9aa3b5);
    P3(B(.8, .85, .5), mat, 0, 1.05, 0);
    P3(B(1.1, .25, .55), metal, 0, 1.45, 0);
    P3(S(.27), skin, 0, 1.75, .05, [.9, 1.1, 1.3]);
    [-1, 1].forEach(s => {
      P3(B(.06, .22, .06), skin, s * .1, 1.6, .38).rotation.z = s * .3;
      P3(B(.06, .2, .06), skin, s * .2, 1.68, .34).rotation.z = s * .7;
      P3(B(.2, .55, .25), mat, s * .22, .8, 0).rotation.x = -.4;
      P3(B(.15, .55, .2), skin, s * .22, .28, .12).rotation.x = .35;
      P3(B(.16, .7, .2), mat, s * .58, 1.05, 0);
    });
    P3(B(.12, .18, .7), L(0x555566), .58, .95, .5);
    P3(B(.05, .05, .5), glow(0xff7be0), .58, 1.05, .5);
  }
  else {
    mat = L(0xb5652c);
    const worm = L(0x3d6fd1);
    const dark = L(0x2b2b2b);
    P3(B(1, .9, .7), mat, 0, 1.1, 0);
    P3(B(.6, .5, .5), worm, 0, .55, 0);
    P3(S(.25), mat, 0, 1.75, .1, [1, .8, 1]);
    P3(B(.2, .05, .1), glow(0xffa040), 0, 1.78, .32);
    [-.3, .3].forEach(x => P3(B(.35, .6, .4), mat, x, .3, 0));
    P3(B(1.1, 1.5, .12), mat, -.85, 1.1, .35);
    P3(B(.08, 1.2, .14), glow(0x4fa8ff), -.85, 1.1, .4);
    P3(B(.3, .7, .3), mat, .65, 1.2, .1);
    P3(C(.18, .9), dark, .75, 1.1, .6).rotation.x = Math.PI / 2;
    P3(S(.12), glow(0x7dff6a), .75, 1.1, 1.05);
  }
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 10), new THREE.MeshBasicMaterial({ color: 0x78dcff, transparent: true, opacity: .2 }));
  aura.position.y = 1.05;
  g.add(aura);
  return { g, mat, aura };
}

function spawn(t) {
  const d = ET[t];
  let x;
  let z;
  do {
    const a = R(0, 6.28);
    x = Math.cos(a) * R(14, 20);
    z = Math.sin(a) * R(14, 20);
  } while (Math.hypot(x - P.x, z - P.z) < 14);
  const { g, mat, aura } = buildEnemy(d.model || t);
  if (d.tint)
    mat.color.setHex(d.tint);
  g.scale.setScalar(d.sc);
  const dm = 1 + .35 * P.done.length;
  g.position.set(x, 0, z);
  scene.add(g);
  enemies.push({ ...d, t, x, z, g, mat, aura, hp: d.hp * dm, sh: d.sh * dm, maxhp: d.hp * dm, maxsh: d.sh * dm, boss: !!d.bn, sumT: 8, cd: R(1.2, 2.4), dir: Math.random() < .5 ? 1 : -1, dirT: R(1, 3), flash: 0 });
}

function hurt(d) {
  if (state !== 'play')
    return;
  P.last = T;
  vig = .7;
  sfx.hit(P.sh > 0);
  if (P.sh > 0) {
    P.sh -= d;
    if (P.sh < 0) {
      P.hp += P.sh;
      P.sh = 0;
    }
  }
  else
    P.hp -= d;
  if (P.hp <= 0 && P.revive > 0) {
    P.revive--;
    P.hp = P.maxHp * .6;
    P.sh = P.maxSh;
    banner('SECOND WIND');
  }
  else if (P.hp <= 0) {
    state = 'dead';
    sfx.dead();
    music.set(-1);
    endRun(false);
    document.exitPointerLock && document.exitPointerLock();
    if (room > best) {
      best = room;
      try {
        localStorage.setItem('spartan_fps_best', best);
      }
      catch (e) { }
    }
    ov.style.display = 'flex';
    ov.innerHTML = '<h2 style="color:#e5534b">KILLED IN ACTION</h2><div>Reached room ' + room + ' | ' + kills + ' kills | Best ' + best + ' | +' + P.cr + ' credits</div><div style="font-size:12px;color:#99a28f;max-width:520px">' + (P.boons.join(', ') || 'No boons') + '</div><div class="cards"><button class="card" onclick="newRun()"><b>New run</b></button><button class="card" onclick="armory()"><b>Armory</b></button></div>';
  }
}

function dmgE(e, d) {
  d *= 1 - (e.armor || 0);
  e.flash = .08;
  if (e.sh > 0) {
    e.sh -= d;
    if (e.sh <= 0) {
      e.hp += e.sh;
      e.sh = 0;
    }
  }
  else
    e.hp -= d;
  if (e.hp <= 0 && !e.dead) {
    e.dead = true;
    kills++;
    sfx.kill(e.t);
    dropMaybe(e);
    earn(e.boss ? 0 : 1);
    scene.remove(e.g);
  }
}

function flashFx(x, y, z, r, col) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .6 }));
  m.position.set(x, y, z);
  scene.add(m);
  fx.push({ m, r, life: .3 });
}

function fwd() {
  return new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
}

function wallT(o, d) {
  const tx = d.x > 0 ? (A - o.x) / d.x : d.x < 0 ? (-A - o.x) / d.x : 1e9;
  const tz = d.z > 0 ? (A - o.z) / d.z : d.z < 0 ? (-A - o.z) / d.z : 1e9;
  let t = Math.min(tx, tz, d.y < 0 ? -o.y / d.y : 1e9);
  pillars.forEach(b => {
    t = Math.min(t, rayBox(o.x, o.z, d.x, d.z, b));
  });
  return t;
}
