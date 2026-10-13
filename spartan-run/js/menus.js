/*
 * menus.js: Overlay screens: title, mission select, armory and the boon picker.
 * Classic script (no modules): all files share one global scope, so load order in index.html matters.
 */

const decor = ['grunt', 'jackal', 'elite', 'hunter'].map((t, i) => {
  const { g } = buildEnemy(t);
  g.children[g.children.length - 1].visible = false;
  g.scale.setScalar(ET[t].sc);
  g.position.set(-4.8 + i * 3.2, 0, 0);
  g.rotation.y = (1.5 - i) * .12;
  scene.add(g);
  return g;
});

function orbit(dt) {
  T += dt;
  const a = Math.sin(T * .25) * .9;
  cam.position.set(Math.sin(a) * 9, 2.2 + Math.sin(T * .4) * .3, Math.cos(a) * 9);
  cam.lookAt(0, 1.5, 0);
}

function showPick(title) {
  if (title)
    ptitle = title;
  pw = null;
  ov.style.display = 'flex';
  ov.style.background = '';
  ov.style.justifyContent = '';
  ov.innerHTML = '<h2>' + ptitle + '</h2><div>Choose a boon' + (P.slots[1] ? ' (weapon boons let you pick which gun to drop)' : '') + '</div><div class="cards">' + choices.map((c, i) => '<button class="card" onclick="pick(' + i + ')"><b>[' + (i + 1) + '] ' + c.n + '</b><small>' + c.d + '</small></button>').join('') + '</div>';
}

function afterPick() {
  if (P.pending) {
    P.pending = 0;
    missionMenu();
  }
  else
    nextRoom();
}

function dropW(s) {
  setW(P, pw.w, s);
  P.boons.push(pw.n);
  pw = null;
  afterPick();
}

function missionMenu() {
  state = 'menu';
  music.set(0);
  document.exitPointerLock && document.exitPointerLock();
  if (LV.every(l => P.done.includes(l.id))) {
    endRun(true);
    return;
  }
  ov.style.display = 'flex';
  ov.style.background = 'linear-gradient(rgba(8,10,6,.2),rgba(8,10,6,.9))';
  ov.style.justifyContent = 'flex-end';
  ov.innerHTML = '<h2>SELECT MISSION</h2><div>' + (P.done.length ? 'Cleared this run: ' + P.done.length + '/' + LV.length + '. Enemies grow stronger.' : 'Choose your first drop.') + '</div><div class="cards" style="margin-bottom:4%">' + LV.map((l, i) => {
    const lk = i > 0 && !S.done[LV[i - 1].id];
    const dn = P.done.includes(l.id);
    return '<button class="card" ' + (lk || dn ? 'disabled style="opacity:.45;cursor:default"' : 'onclick="startLevel(' + i + ')"') + '><b>' + l.n + '</b><small>' + l.sub + '</small><small>' + (dn ? 'CLEARED this run' : lk ? 'Locked: clear ' + LV[i - 1].n : l.rooms + ' rooms + boss: ' + ET[l.boss].bn) + '</small></button>';
  }).join('') + '</div>';
}

function armory() {
  state = 'title';
  ov.style.display = 'flex';
  ov.style.background = 'linear-gradient(rgba(8,10,6,.35),rgba(8,10,6,.93))';
  ov.style.justifyContent = 'flex-start';
  const u = UPS.map((x, i) => {
    const l = S.ups[x.id] || 0;
    const mx = l >= x.max;
    return '<button class="card" ' + (mx ? 'disabled style="opacity:.5"' : 'onclick="buyUp(' + i + ')"') + '><b>' + x.n + ' [' + l + '/' + x.max + ']</b><small>' + x.d + '</small><small>' + (mx ? 'MAX' : x.cost(l) + ' credits') + '</small></button>';
  }).join('');
  const o = LOADS.map((x, i) => {
    const own = S.own[x.id];
    const sel = S.sel === x.id;
    return '<button class="card" onclick="buyLoad(' + i + ')"' + (sel ? ' style="border-color:#9bc45a"' : '') + '><b>' + x.n + '</b><small>Starting sidearm</small><small>' + (sel ? 'EQUIPPED (click to unequip)' : own ? 'Owned: click to equip' : x.c + ' credits') + '</small></button>';
  }).join('');
  ov.innerHTML = '<h2>ARMORY</h2><div>Credits: ' + S.cr + '</div><div class="cards sm">' + u + '</div><div style="color:#99a28f;font-size:13px">STARTING LOADOUT</div><div class="cards sm">' + o + '</div><button class="card" style="text-align:center;width:auto" onclick="startTitle()">BACK</button>';
}

function buyUp(i) {
  const x = UPS[i];
  const l = S.ups[x.id] || 0;
  const c = x.cost(l);
  if (l >= x.max || S.cr < c)
    return;
  S.cr -= c;
  S.ups[x.id] = l + 1;
  save();
  sfx.pick();
  armory();
}

function buyLoad(i) {
  const x = LOADS[i];
  if (S.own[x.id])
    S.sel = S.sel === x.id ? null : x.id;
  else if (S.cr >= x.c) {
    S.cr -= x.c;
    S.own[x.id] = 1;
    S.sel = x.id;
  }
  else
    return;
  save();
  sfx.pick();
  armory();
}

function pick(i) {
  const c = choices[i];
  if (!c)
    return;
  sfx.pick();
  if (c.w && P.slots[1]) {
    pw = c;
    ov.innerHTML = '<h2>REPLACE WHICH WEAPON?</h2><div>Taking the ' + c.n + '</div><div class="cards">' + P.slots.map((k, s) => '<button class="card" onclick="dropW(' + s + ')"><b>[' + (s + 1) + '] Drop ' + W[k].n + '</b><small>Slot ' + (s + 1) + (s === P.cur ? ' (held)' : '') + '</small></button>').join('') + '<button class="card" onclick="showPick()"><b>Back</b><small>Choose a different boon</small></button></div>';
    return;
  }
  c.f(P);
  P.boons.push(c.n);
  afterPick();
}

function lock() {
  try {
    const r = cv.requestPointerLock();
    if (r && r.catch)
      r.catch(() => { });
  }
  catch (e) { }
}

function banner(s) {
  const b = $('ban');
  b.textContent = s;
  b.style.transition = 'none';
  b.style.opacity = 1;
  setTimeout(() => {
    b.style.transition = 'opacity 1.5s';
    b.style.opacity = 0;
  }, 50);
}

function showTitle() {
  ov.style.background = 'linear-gradient(rgba(8,10,6,.1),rgba(8,10,6,.9))';
  ov.style.justifyContent = 'flex-end';
  ov.innerHTML = '<h2 style="font-size:clamp(28px,7vw,64px);letter-spacing:.25em;text-shadow:0 0 24px #5ec8f2">SPARTAN RUN</h2><div style="letter-spacing:.2em;font-size:12px;color:#99a28f">A HALO-INSPIRED ROGUE-LITE</div><button class="card" style="text-align:center;width:auto;padding:10px 28px;margin-bottom:5%" onclick="startTitle()">PRESS START</button>';
}

function startTitle() {
  audio.init();
  music.set(2);
  state = 'title';
  buildLevel(LV[0], true);
  decor.forEach(g => scene.add(g));
  ov.style.display = 'flex';
  ov.style.background = 'linear-gradient(rgba(8,10,6,.1),rgba(8,10,6,.9))';
  ov.style.justifyContent = 'flex-end';
  ov.innerHTML = '<h2 style="font-size:clamp(28px,7vw,64px);letter-spacing:.25em;text-shadow:0 0 24px #5ec8f2">SPARTAN RUN</h2><div style="letter-spacing:.2em;font-size:12px;color:#99a28f">A HALO-INSPIRED ROGUE-LITE</div><div>Credits: ' + S.cr + '</div><div class="cards"><button class="card" style="text-align:center" onclick="newRun()"><b>DEPLOY</b><small>Start a new run</small></button><button class="card" style="text-align:center" onclick="armory()"><b>ARMORY</b><small>Spend credits on permanent upgrades</small></button></div><div style="font-size:12px;color:#99a28f;margin-bottom:4%">' + (best ? 'Best room: ' + best + ' | ' : '') + 'M mutes all sound, N mutes music</div>';
}
showTitle();
