/*
 * data.js: Enemy stats (ET), the boon pool (BOONS) and global game state.
 * Classic script (no modules): all files share one global scope, so load order in index.html matters.
 */

const ET = {
  grunt: { hp: 18, sh: 0, sp: 3, sc: 1, col: 0xe8943a, fr: 2.2, bs: 13, bd: 6, burst: 1, pref: 11, panic: 1 },
  jackal: { hp: 16, sh: 35, sp: 5.5, sc: .95, col: 0x4fc3b0, fr: 1.5, bs: 19, bd: 7, burst: 1, pref: 14 },
  elite: { hp: 30, sh: 70, sp: 4.5, sc: 1.15, col: 0x7b86f0, fr: 1.9, bs: 21, bd: 8, burst: 3, pref: 12 },
  hunter: { hp: 200, sh: 0, sp: 2.6, sc: 1.7, col: 0x5fbf5f, fr: 2.4, bs: 15, bd: 12, burst: 3, spread: 1, armor: .5, pref: 9 },
  zealot: { model: 'elite', tint: 0xe0c060, bn: 'Zealot Commander', hp: 200, sh: 220, sp: 5.2, sc: 1.8, col: 0xffd060, fr: 1.3, bs: 24, bd: 9, burst: 3, pref: 11, sum: 1 },
  warlord: { model: 'hunter', tint: 0x8a2a2a, bn: 'Hunter Warlord', hp: 650, sh: 0, sp: 3.2, sc: 2.3, col: 0xff5a3a, fr: 2, bs: 17, bd: 11, burst: 5, spread: 1, armor: .5, pref: 9 },
  warden: { model: 'elite', tint: 0x30c8c0, bn: 'Forerunner Warden', hp: 450, sh: 300, sp: 4.4, sc: 2.2, col: 0x40ffe8, fr: 1.1, bs: 22, bd: 9, burst: 5, spread: 1, pref: 12, sum: 1 }
};
const BOONS = [
  {
    n: 'Overshield Capacitor', d: '+30 max shield', f: p => {
      p.maxSh += 30;
      p.sh += 30;
    }
  },
  {
    n: 'Quick Recharge', d: 'Shields recharge 1s sooner', f: p => p.shDelay = Math.max(.8, p.shDelay - 1)
  },
  {
    n: 'Hardened Rounds', d: '+30% rifle damage', f: p => p.dmg *= 1.3
  },
  {
    n: 'Tuned Trigger', d: '+25% fire rate', f: p => p.rate *= .8
  },
  {
    n: 'Extended Mag', d: '+16 magazine (scaled to weapon), refill', f: p => {
      p.mb = (p.mb || 0) + 16;
      recalcMag();
      p.ammo = p.magMax;
    }
  },
  {
    n: 'Grenade Bandolier', d: '+2 max grenades, refill', f: p => {
      p.nadeMax += 2;
      p.nades = p.nadeMax;
    }
  },
  {
    n: 'Bigger Boom', d: '+40% grenade radius and damage', f: p => p.nadeMul *= 1.4
  },
  {
    n: 'Thruster Pack', d: '+20% move speed', f: p => p.speed *= 1.2
  },
  {
    n: 'Medkit', d: 'Full health, +10 max health', f: p => {
      p.maxHp += 10;
      p.hp = p.maxHp;
    }
  },
  {
    n: 'Hardlight Strike', d: 'Melee damage x2', f: p => p.meleeMul *= 2
  },
  {
    n: 'Fast Hands', d: 'Reload 40% faster', f: p => p.reloadT *= .6
  },
  {
    w: 'br', n: 'BR55 Battle Rifle', d: 'WEAPON: precise and hard-hitting, headshots x2.2', f: p => setW(p, 'br')
  },
  {
    w: 'mg', n: 'M6D Magnum', d: 'WEAPON: heavy pistol, headshots x2.5', f: p => setW(p, 'mg')
  },
  {
    w: 'sg', n: 'M90 Shotgun', d: 'WEAPON: 9 pellets, devastating up close', f: p => setW(p, 'sg')
  },
  {
    w: 'sn', n: 'S2 AM Sniper Rifle', d: 'WEAPON: pierces 2 enemies, headshots x3. Right-click zooms', f: p => setW(p, 'sn')
  },
  {
    w: 'pr', n: 'Type-25 Plasma Rifle', d: 'WEAPON: rapid fire, shreds shields', f: p => setW(p, 'pr')
  },
  {
    w: 'rk', n: 'M41 Rocket Launcher', d: 'WEAPON: explosive rounds, 2 per magazine', f: p => setW(p, 'rk')
  },
  {
    w: 'nd', n: 'Type-33 Needler', d: 'WEAPON: homing needles; 7 stuck in one enemy supercombine and explode', f: p => setW(p, 'nd')
  },
  {
    sw: 1, n: 'Energy Sword', d: 'Melee x3 damage, longer reach, faster swing', f: p => {
      p.sword = true;
    }
  }
];
let state = 'title';
let P;
let enemies = [];
let shots = [];
let nades = [];
let fx = [];
let tracers = [];
let room = 0;
let kills = 0;
let best = 0;
let T = 0;
let yaw = 0;
let pitch = 0;
let choices = [];
let vig = 0;
let hitT = 0;
let hitCol = '';
try {
  best = +localStorage.getItem('spartan_fps_best') || 0;
}
catch (e) { }
const keys = {};
let down = false;
let locked = false;
let L = null;
let lroom = 0;
let pw = null;
let ptitle = 'ROOM CLEARED';
