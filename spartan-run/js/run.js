/*
 * run.js: Run flow: new run, rooms, bosses, mission start and end.
 * Classic script (no modules): all files share one global scope, so load order in index.html matters.
 */

function newRun() {
  audio.init();
  enemies.forEach(e => scene.remove(e.g));
  shots.forEach(s => scene.remove(s.m));
  nades.forEach(n => scene.remove(n.m));
  drops.forEach(d => scene.remove(d.m));
  drops = [];
  rockets.forEach(r => scene.remove(r.m));
  rockets = [];
  L = null;
  decor.forEach(g => scene.remove(g));
  needles.forEach(n => scene.remove(n.m));
  needles = [];
  debris.forEach(d => scene.remove(d.m));
  debris = [];
  enemies = [];
  shots = [];
  nades = [];
  room = 0;
  kills = 0;
  yaw = 0;
  pitch = 0;
  P = { x: 0, z: 14, hp: 40, maxHp: 40, sh: 60, maxSh: 60, shDelay: 3, last: -99, speed: 6, dmg: 8, rate: .09, cd: 0, magMax: 32, ammo: 32, reload: 0, wpn: 'ar', slots: ['ar', null], sa: [32, 0], cur: 0, mb: 0, sword: false, reloadT: 1.3, nades: 2, nadeMax: 3, nadeMul: 1, mcd: 0, meleeMul: 1, boons: [], done: [], cr: 0, revive: 0 };
  UPS.forEach(x => {
    const l = S.ups[x.id] || 0;
    if (l)
      x.f(P, l);
  });
  if (S.sel && S.own[S.sel]) {
    P.slots[1] = S.sel;
    P.sa[1] = W[S.sel].mag;
  }
  setGun('ar');
  nextRoom();
}

function nextRoom() {
  if (!L) {
    missionMenu();
    return;
  }
  room++;
  lroom++;
  state = 'play';
  ov.style.display = 'none';
  ov.style.background = '';
  ov.style.justifyContent = '';
  sfx.room();
  music.set(1);
  P.nades = Math.min(P.nadeMax, P.nades + 1);
  P.hp = Math.min(P.maxHp, P.hp + 6);
  const n = Math.min(3 + lroom * 2 + P.done.length * 2, 14);
  if (lroom > L.rooms) {
    spawn(L.boss);
    for (let i = 0; i < 3; i++)
      spawn(L.mix[0]);
  }
  else
    for (let i = 0; i < n; i++) {
      const mx = L.mix;
      let t = mx[0];
      const r = Math.random();
      if (lroom >= 2 && r < .45)
        t = mx[1];
      if (lroom >= 3 && r > .8)
        t = mx[2];
      spawn(t);
    }
  if (lroom === L.rooms)
    spawn('hunter');
  banner(lroom > L.rooms ? 'BOSS: ' + ET[L.boss].bn : L.n + ' - ROOM ' + lroom + '/' + L.rooms);
  lock();
}

function bossAI(e, dt) {
  if (!e.rage && e.hp < e.maxhp * .5) {
    e.rage = 1;
    e.sp *= 1.35;
    e.fr *= .65;
    banner('ENRAGED!');
    sfx.room();
  }
  if (e.sum) {
    e.sumT -= dt;
    if (e.sumT <= 0 && enemies.length < 14) {
      e.sumT = 14;
      for (let i = 0; i < 2; i++)
        spawn(L.mix[0]);
      sfx.room();
    }
  }
}

function bossDown() {
  earn(100 + 50 * P.done.length);
  S.done[L.id] = 1;
  P.done.push(L.id);
  save();
  state = 'pick';
  P.pending = 1;
  music.set(0);
  sfx.clear();
  document.exitPointerLock && document.exitPointerLock();
  choices = LEG.slice().sort(() => Math.random() - .5).slice(0, 3);
  showPick('MISSION COMPLETE: ' + ET[L.boss].bn + ' DEFEATED');
}

function startLevel(i) {
  L = LV[i];
  lroom = 0;
  buildLevel(L);
  P.x = 0;
  P.z = 14;
  yaw = 0;
  pitch = 0;
  nextRoom();
}

function endRun(v) {
  S.cr += P.cr + (v ? 250 : 0);
  save();
  if (room > best) {
    best = room;
    try {
      localStorage.setItem('spartan_fps_best', best);
    }
    catch (e) { }
  }
  ov.style.background = '';
  ov.style.justifyContent = '';
  if (v) {
    state = 'dead';
    ov.style.display = 'flex';
    ov.innerHTML = '<h2>RUN COMPLETE</h2><div>All missions cleared. +' + (P.cr + 250) + ' credits banked</div><div class="cards"><button class="card" onclick="newRun()"><b>New run</b></button><button class="card" onclick="armory()"><b>Armory</b></button></div>';
  }
}
