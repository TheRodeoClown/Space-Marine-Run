/*
 * main.js: Per-frame update, HUD and the main loop (boot).
 * Classic script (no modules): all files share one global scope, so load order in index.html matters.
 */

function update(dt) {
  T += dt;
  vig = Math.max(0, vig - dt * 1.5);
  hitT = Math.max(0, hitT - dt);
  const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const m = Math.hypot(f, s) || 1;
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  P.x = clamp(P.x + (-sy * f + cy * s) / m * P.speed * dt, -A + 1, A - 1);
  P.z = clamp(P.z + (-cy * f - sy * s) / m * P.speed * dt, -A + 1, A - 1);
  pushOut(P, .5);
  cam.position.set(P.x, 1.6, P.z);
  cam.rotation.set(pitch, yaw, 0);
  P.cd -= dt;
  P.mcd -= dt;
  if (P.reload > 0) {
    P.reload -= dt;
    if (P.reload <= 0) {
      P.ammo = P.magMax;
      sfx.cock();
    }
  }
  if (T - P.last > P.shDelay) {
    if (!P.rch && P.sh < P.maxSh) {
      P.rch = 1;
      sfx.recharge();
    }
    P.sh = Math.min(P.maxSh, P.sh + P.maxSh / 1.5 * dt);
  }
  else
    P.rch = 0;
  if (down && P.cd <= 0 && P.reload <= 0 && P.ammo > 0)
    fire();
  enemies.forEach(e => {
    e.flash -= dt;
    e.dirT -= dt;
    if (e.boss)
      bossAI(e, dt);
    if (e.dirT <= 0) {
      e.dir *= -1;
      e.dirT = R(1, 3);
    }
    const dx = P.x - e.x;
    const dz = P.z - e.z;
    const d = Math.hypot(dx, dz) || 1;
    const nx = dx / d;
    const nz = dz / d;
    const panic = e.panic && e.hp < e.maxhp * .4;
    const mv = panic ? -1.3 : d > e.pref + 3 ? 1 : d < e.pref - 3 ? -1 : 0;
    e.x = clamp(e.x + (nx * mv - nz * e.dir * .5) * e.sp * dt, -A + 1, A - 1);
    e.z = clamp(e.z + (nz * mv + nx * e.dir * .5) * e.sp * dt, -A + 1, A - 1);
    pushOut(e, .6 * e.sc);
    enemies.forEach(o => {
      if (o !== e) {
        const ox = e.x - o.x;
        const oz = e.z - o.z;
        const od = Math.hypot(ox, oz) || 1;
        const mn = .7 * (e.sc + o.sc);
        if (od < mn) {
          e.x += ox / od * (mn - od) * .5;
          e.z += oz / od * (mn - od) * .5;
        }
      }
    });
    e.g.position.set(e.x, Math.abs(Math.sin(T * 7 + e.x)) * .07 * (mv ? 1 : .2), e.z);
    e.g.rotation.y = Math.atan2(dx, dz);
    e.mat.emissive.setHex(e.flash > 0 ? 0xffffff : 0);
    e.aura.visible = e.sh > 0;
    e.aura.material.opacity = .1 + .3 * e.sh / (e.maxsh || 1);
    e.cd -= dt;
    if (e.cd <= 0 && !panic) {
      for (let k = 0; k < e.burst; k++) {
        const a = Math.atan2(nx, nz) + (e.spread ? (k - (e.burst - 1) / 2) * .14 : R(-.04, .04));
        const dir = new THREE.Vector3(Math.sin(a), (1.3 - 1.3 * e.sc) / d, Math.cos(a)).normalize();
        const mm = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), new THREE.MeshBasicMaterial({ color: e.col }));
        mm.position.set(e.x, 1.4 * e.sc, e.z);
        scene.add(mm);
        shots.push({ m: mm, v: dir.multiplyScalar(e.bs), dmg: e.bd, life: 4 });
      }
      sfx.plasma(d);
      e.cd = e.fr * R(.8, 1.2);
    }
  });
  enemies = enemies.filter(e => !e.dead);
  shots.forEach(b => {
    b.m.position.addScaledVector(b.v, dt);
    b.life -= dt;
    const p = b.m.position;
    if (Math.hypot(p.x - P.x, p.y - 1.3, p.z - P.z) < .7) {
      b.life = 0;
      hurt(b.dmg);
    }
    if (Math.abs(p.x) > A || Math.abs(p.z) > A || p.y < 0 || pillars.some(q => Math.abs(p.x - q.x) < 1.5 && Math.abs(p.z - q.z) < 1.5 && p.y < 3.5))
      b.life = 0;
    if (b.life <= 0)
      scene.remove(b.m);
  });
  shots = shots.filter(b => b.life > 0);
  nades.forEach(n => {
    n.v.y -= 18 * dt;
    const p = n.m.position;
    p.addScaledVector(n.v, dt);
    if (p.y < .15) {
      p.y = .15;
      n.v.y *= -.4;
      n.v.x *= .7;
      n.v.z *= .7;
    }
    if (Math.abs(p.x) > A - .5) {
      n.v.x *= -.5;
      p.x = clamp(p.x, -A + .5, A - .5);
    }
    if (Math.abs(p.z) > A - .5) {
      n.v.z *= -.5;
      p.z = clamp(p.z, -A + .5, A - .5);
    }
    pillars.forEach(q => {
      if (Math.abs(p.x - q.x) < 1.6 && Math.abs(p.z - q.z) < 1.6 && p.y < 3.5) {
        n.v.x *= -.4;
        n.v.z *= -.4;
        p.x += n.v.x * dt * 2;
        p.z += n.v.z * dt * 2;
      }
    });
    n.fuse -= dt;
    if (n.fuse <= 0) {
      const rad = 6 * Math.sqrt(P.nadeMul);
      const dm = 70 * P.nadeMul;
      enemies.forEach(e => {
        const d = Math.hypot(e.x - p.x, e.z - p.z, e.sc - p.y);
        if (d < rad)
          dmgE(e, dm * (1 - d / rad * .5));
      });
      if (Math.hypot(P.x - p.x, 1.6 - p.y, P.z - p.z) < rad)
        hurt(18);
      flashFx(p.x, p.y, p.z, rad, 0xffb040);
      sfx.boom();
      scene.remove(n.m);
    }
  });
  nades = nades.filter(n => n.fuse > 0);
  updDrops(dt);
  updRockets(dt);
  updNeedles(dt);
  enemies = enemies.filter(e => !e.dead);
  if (state === 'play' && lroom > L.rooms && !enemies.some(e => e.boss)) {
    enemies.forEach(e => {
      e.dead = true;
      scene.remove(e.g);
    });
    enemies = [];
    bossDown();
    return;
  }
  if (state === 'play' && !enemies.length) {
    state = 'pick';
    earn(8 + lroom * 2);
    music.set(0);
    sfx.clear();
    document.exitPointerLock && document.exitPointerLock();
    const pool = BOONS.filter(b => !(b.w && P.slots.includes(b.w)) && !(b.sw && P.sword)).sort(() => Math.random() - .5);
    const wp = pool.filter(b => b.w || b.sw);
    const ot = pool.filter(b => !b.w && !b.sw);
    choices = (room % 2 ? [wp[0], ot[0], ot[1]] : pool.slice(0, 3)).filter(Boolean);
    ov.style.display = 'flex';
    showPick('ROOM CLEARED');
  }
}

function tick(dt) {
  animGun(dt);
  cam.fov += ((zoomOn ? (P && P.wpn === 'sn' ? 22 : 45) : 75) - cam.fov) * Math.min(1, dt * 12);
  cam.updateProjectionMatrix();
  tracers.forEach(t => {
    t.life -= dt;
    if (t.life <= 0) {
      scene.remove(t.m);
      t.m.geometry.dispose();
    }
  });
  tracers = tracers.filter(t => t.life > 0);
  fx.forEach(f => {
    f.life -= dt;
    const k = 1 - f.life / .3;
    f.m.scale.setScalar(Math.max(.01, f.r * k));
    f.m.material.opacity = .6 * (1 - k);
    if (f.life <= 0)
      scene.remove(f.m);
  });
  fx = fx.filter(f => f.life > 0);
}

function hud() {
  $('cross').style.display = state === 'play' ? 'block' : 'none';
  if (!P)
    return;
  $('sh').firstChild.style.width = 100 * P.sh / P.maxSh + '%';
  $('hp').firstChild.style.width = 100 * P.hp / P.maxHp + '%';
  $('info').textContent = P.slots.map((k, i) => k ? (i === P.cur ? '[' + W[k].n.split(' ')[0] + ']' : W[k].n.split(' ')[0]) : '-').join(' ') + '   ' + W[P.wpn].n + '   ' + (P.reload > 0 ? 'RELOADING' : 'Ammo ' + P.ammo + '/' + P.magMax) + '   Grenades ' + P.nades + '/' + P.nadeMax;
  const bs = enemies.find(e => e.boss);
  $('boss').style.display = bs ? 'block' : 'none';
  if (bs) {
    $('boss').firstChild.textContent = bs.bn;
    $('boss').lastChild.firstChild.style.width = 100 * Math.max(0, (bs.hp + bs.sh) / (bs.maxhp + bs.maxsh)) + '%';
  }
  $('room').textContent = (L ? L.n + ' | ' + (lroom > L.rooms ? 'BOSS' : 'Room ' + lroom + '/' + L.rooms) : '') + '  Kills ' + kills;
  $('vig').style.opacity = vig;
  $('cross').style.borderColor = hitT > 0 ? hitCol : 'rgba(155,196,90,.8)';
}
let last = performance.now();

function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  if (state === 'play')
    update(dt);
  else if (state === 'title' || state === 'menu')
    orbit(dt);
  tick(dt);
  hud();
  renderer.render(scene, cam);
  requestAnimationFrame(loop);
}
cam.position.set(0, 1.6, 14);
requestAnimationFrame(loop);
