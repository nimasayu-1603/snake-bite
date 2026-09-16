// ============================================================
// SNAKE BITE - by. niems
// Konversi dari Python/Pygame ke JavaScript/Canvas
// ============================================================

// === KONSTANTA UKURAN DASAR ===
let BW = 1200, BH = 600;
let SCALE = 1.0;
let WIDTH = BW, HEIGHT = BH;

// === PALET WARNA UI ===
const BG        = [20, 18, 24];
const BG_GAME   = [26, 24, 30];
const KARTU     = [42, 40, 50];
const BORDER    = [75, 72, 85];
const CREAM     = [252, 244, 228];
const PINK      = [250, 180, 195];
const MINT      = [180, 225, 205];
const LAV       = [205, 190, 235];
const PEACH     = [250, 210, 185];
const YEL       = [250, 228, 180];
const BLUE      = [185, 200, 235];
const TEXT_MID  = [180, 175, 185];
const TEXT_DIM  = [120, 115, 130];

// === PALET WARNA SEGMEN ULAR ===
const U_COL = [
  [252,210,195],[250,195,205],[245,180,205],
  [220,190,230],[180,215,215],[250,225,190]
];
const RAINBOW = [
  [250,180,195],[180,225,205],[205,190,235],[250,210,185],
  [250,228,180],[185,200,235],[250,195,205],[200,225,215]
];

// === VEKTOR ARAH ===
const ATAS  = [0,-1];
const BAWAH = [0, 1];
const KIRI  = [-1,0];
const KANAN = [1, 0];

// === DATA 8 JENIS BUAH ===
const BUAH = [
  {b:"apel",      w:[245,140,160]},
  {b:"pisang",    w:[248,220,140]},
  {b:"anggur",    w:[190,155,220]},
  {b:"semangka",  w:[180,220,180]},
  {b:"jeruk",     w:[250,185,140]},
  {b:"stroberi",  w:[240,130,155]},
  {b:"lemon",     w:[250,230,150]},
  {b:"blueberry", w:[170,175,235]},
];

// === DATA NOTIF PUJIAN ===
const PUJIAN = [
  [3,"Good!",MINT],[6,"Great!",PINK],[9,"Nice!",LAV],
  [12,"Awesome!",PEACH],[15,"Excellent!",MINT],[18,"Amazing!",PINK],
  [21,"Perfect!",YEL],[24,"Legend!",PINK]
];

// === KONFIG LAYOUT & GAMEPLAY ===
let HEADER_H = 95;
let GRID = 28;
const TOPBAR_H = 40;
let GAME_X = 0, GAME_Y = 0, GAME_W = 0, GAME_H = 0;
const JUMLAH_BUAH = 8;
const RAINBOW_DURASI = 6.0;
const FPS_MAX = 20;   // <-- batas maksimal speed (sebelumnya 15)

// === STATE GLOBAL ===
let canvas = null;
let ctx = null;
let touch_mode = false;
let joy_visible = false;
let exit_btn_rect = null;
let mouse_pos = {x:0, y:0};

// === STATE JOYSTICK ===
let JOY_FIXED_RADIUS = 55;
let joy_c = {x:0, y:0};
let joy_p = {x:0, y:0};
let joy_dir = null;
let joy_pressed = false;
let joy_dragging = false;

// === UTILITY ===
function sc(n) { return Math.max(1, Math.floor(n * SCALE)); }

function rgb(c, a) {
  if (a === undefined) return `rgb(${c[0]},${c[1]},${c[2]})`;
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

function darker(c, f=0.8) {
  return [Math.max(0,Math.floor(c[0]*f)), Math.max(0,Math.floor(c[1]*f)), Math.max(0,Math.floor(c[2]*f))];
}

function roundRect(x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

function mouse_in(rect) {
  return mouse_pos.x >= rect.x && mouse_pos.x <= rect.x + rect.w &&
         mouse_pos.y >= rect.y && mouse_pos.y <= rect.y + rect.h;
}

function pointIn(x, y, r) { return x >= r.x && x <= r.x+r.w && y >= r.y && y <= r.y+r.h; }

// === LAYOUT ===
function layout() {
  WIDTH = canvas.clientWidth;
  HEIGHT = canvas.clientHeight;
  SCALE = Math.min(WIDTH / BW, HEIGHT / BH);

  HEADER_H = Math.max(95, Math.floor(108 * SCALE));
  GRID = Math.max(20, Math.floor(28 * SCALE));
  const m = Math.max(10, Math.floor(20 * SCALE));
  GAME_Y = HEADER_H + m;

  GAME_W = Math.max(GRID*4, Math.floor((WIDTH - m*2) / GRID) * GRID);
  GAME_H = Math.max(GRID*4, Math.floor((HEIGHT - GAME_Y - m) / GRID) * GRID);
  GAME_X = Math.floor((WIDTH - GAME_W) / 2);

  JOY_FIXED_RADIUS = sc(55);
  const JOY_MARGIN_X = sc(15);
  const JOY_MARGIN_Y = sc(80);
  joy_c = {
    x: GAME_X + GAME_W - JOY_FIXED_RADIUS - JOY_MARGIN_X,
    y: GAME_Y + GAME_H - JOY_FIXED_RADIUS - JOY_MARGIN_Y
  };
  joy_p = {x: joy_c.x, y: joy_c.y};
}

// === FONT ===
function font(sz, bold=true) {
  return `${bold ? "bold " : ""}${sc(sz)}px "Comic Sans MS", "Segoe UI", Arial, sans-serif`;
}

function fonts() {
  return {
    lbl:   font(12),
    val:   font(22),
    sml:   font(14),
    ttl:   font(80),
    bite:  font(52),
    tag:   font(15),
    kr:    font(11, false),
    go:    font(42),
    btn:   font(18),
    play:  font(30),
    notif: font(26),
  };
}

// === SHADOW ===
function shadow(x, y, w, h, rad=14, off=3, a=90) {
  ctx.save();
  ctx.globalAlpha = a / 255;
  ctx.fillStyle = "#000";
  roundRect(x + 4, y + 4 + off, w, h, rad);
  ctx.fill();
  ctx.restore();
}

// === GAMBAR WAJAH BUAH ===
function wajah_buah(cx, cy, r, blink=false) {
  const er = Math.max(1, Math.floor(r/5));
  const edx = Math.max(2, Math.floor(r/3));
  const edy = Math.max(1, Math.floor(r/8));
  for (const sisi of [-1,1]) {
    const ex = cx + sisi*edx, ey = cy - edy;
    if (blink) {
      ctx.strokeStyle = rgb([50,42,48]);
      ctx.lineWidth = Math.max(1, er);
      ctx.beginPath();
      ctx.moveTo(ex-er, ey); ctx.lineTo(ex+er, ey); ctx.stroke();
    } else {
      ctx.fillStyle = rgb([50,42,48]);
      ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.strokeStyle = rgb([50,42,48]);
  ctx.lineWidth = Math.max(1, Math.floor(r/10));
  ctx.beginPath();
  ctx.arc(cx, cy - r/8, r/1.5, Math.PI*1.1, Math.PI*1.9);
  ctx.stroke();
  ctx.fillStyle = rgb([255,150,165]);
  for (const sisi of [-1,1]) {
    ctx.beginPath();
    ctx.arc(cx + sisi*(r/2), cy + r/5, Math.max(1, Math.floor(r/5)), 0, Math.PI*2);
    ctx.fill();
  }
}

// === GAMBAR BUAH ===
function buah(x, y, w, h, tipe, t=0) {
  const cx = x + w/2, cy = y + h/2;
  const rad = Math.floor(w/2) - sc(2);
  const wobble = Math.floor(Math.sin(t*3 + cx*0.05) * sc(1));
  const cyW = cy + wobble;
  const blink = Math.sin(t*3 + cx*0.1) > 0.95;
  const b = tipe.b, wc = tipe.w;

  ctx.save();
  ctx.globalAlpha = 70/255;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cx, cyW + rad - sc(2), rad+2, Math.floor(rad/2), 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = rgb(wc);

  if (b === "apel") {
    ctx.beginPath(); ctx.arc(cx, cyW, rad, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = rgb([110,80,80]); ctx.lineWidth = sc(2);
    ctx.beginPath();
    ctx.moveTo(cx, cyW-rad+sc(2)); ctx.lineTo(cx+sc(1), cyW-rad-sc(4)); ctx.stroke();
    ctx.fillStyle = rgb(MINT);
    ctx.beginPath(); ctx.ellipse(cx, cyW-rad-sc(2), sc(4), sc(2), 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx-rad/3, cyW-rad/3, Math.max(1, Math.floor(rad/5)), 0, Math.PI*2); ctx.fill();
  } else if (b === "pisang") {
    ctx.beginPath(); ctx.arc(cx, cyW, rad, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = rgb(BG);
    ctx.beginPath(); ctx.arc(cx+sc(4), cyW-sc(2), rad-sc(1), 0, Math.PI*2); ctx.fill();
  } else if (b === "anggur") {
    const off = [[-sc(3),-sc(2)],[sc(3),-sc(2)],[-sc(3),sc(3)],[sc(3),sc(3)],[0,sc(1)]];
    for (const [ox,oy] of off) {
      ctx.beginPath(); ctx.arc(cx+ox, cyW+oy, Math.floor(rad/2), 0, Math.PI*2); ctx.fill();
    }
  } else if (b === "semangka") {
    ctx.beginPath(); ctx.arc(cx, cyW, rad, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = rgb([252,244,228]);
    ctx.beginPath(); ctx.arc(cx, cyW, rad-sc(3), 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = rgb(PINK);
    ctx.beginPath(); ctx.arc(cx, cyW, rad-sc(5), 0, Math.PI*2); ctx.fill();
  } else if (b === "jeruk") {
    ctx.beginPath(); ctx.arc(cx, cyW, rad, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx-rad/3, cyW-rad/3, Math.max(1, Math.floor(rad/4)), 0, Math.PI*2); ctx.fill();
  } else if (b === "stroberi") {
    ctx.beginPath(); ctx.arc(cx, cyW+sc(1), rad, 0, Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx-rad+sc(2), cyW);
    ctx.lineTo(cx+rad-sc(2), cyW);
    ctx.lineTo(cx, cyW+rad);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = rgb(MINT);
    ctx.beginPath(); ctx.ellipse(cx, cyW-rad-sc(1), sc(4), sc(2), 0, 0, Math.PI*2); ctx.fill();
    for (const [ox,oy] of [[-3,0],[3,0],[0,2]]) {
      ctx.beginPath(); ctx.arc(cx+ox, cyW+oy, Math.max(1, sc(1)), 0, Math.PI*2); ctx.fill();
    }
  } else if (b === "lemon") {
    ctx.beginPath();
    ctx.ellipse(cx, cyW+sc(1), rad, rad-sc(2), 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx-rad/3, cyW-rad/3, Math.max(1, Math.floor(rad/4)), 0, Math.PI*2); ctx.fill();
  } else if (b === "blueberry") {
    ctx.beginPath(); ctx.arc(cx, cyW, rad, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(cx-rad/3, cyW-rad/3, Math.max(1, Math.floor(rad/5)), 0, Math.PI*2); ctx.fill();
  }

  wajah_buah(cx, cyW, rad, blink);
}

// === GAMBAR SEGMEN WORM (loading/menu) ===
function gambar_segmen_worm(cx, cy, rad, warna, angle, is_head=false, idx=0, total=1) {
  if (is_head) {
    const head_rad = Math.floor(rad * 0.95);
    ctx.fillStyle = rgb(warna);
    ctx.beginPath(); ctx.arc(cx, cy, head_rad, 0, Math.PI*2); ctx.fill();
    const er = Math.max(1, Math.floor(head_rad/3));
    const fwd_x = Math.cos(angle), fwd_y = Math.sin(angle);
    const perp_x = -fwd_y, perp_y = fwd_x;
    const eye_fwd = head_rad * 0.35, eye_side = head_rad * 0.40;
    for (const sign of [-1,1]) {
      const ex = cx + fwd_x*eye_fwd + perp_x*eye_side*sign;
      const ey = cy + fwd_y*eye_fwd + perp_y*eye_side*sign;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI*2); ctx.fill();
      const pr = Math.max(1, Math.floor(er/2));
      ctx.fillStyle = rgb([30,25,30]);
      ctx.beginPath(); ctx.arc(ex+fwd_x*pr*0.6, ey+fwd_y*pr*0.6, pr, 0, Math.PI*2); ctx.fill();
    }
  } else {
    const p = total > 1 ? idx/(total-1) : 0;
    const grid = rad*2;
    const seg_size = Math.max(2, Math.floor(grid * (0.92 - 0.22*p)));
    const corner = Math.max(2, Math.floor(seg_size/5));
    ctx.fillStyle = rgb(warna);
    roundRect(cx - seg_size/2, cy - seg_size/2, seg_size, seg_size, corner);
    ctx.fill();
  }
}

// === GAMBAR SELURUH BADAN ULAR (arena) ===
function ular(rect, w, is_head=false, arah=null, idx=0, total=1, rainbow=false, prev_rect=null) {
  const cx = rect.x + rect.w/2, cy = rect.y + rect.h/2;
  const grid = rect.w;
  const base_rad = Math.floor(grid/2);

  if (rainbow) w = RAINBOW[idx % RAINBOW.length];

  let angle = 0;
  if (is_head) {
    angle = arah ? Math.atan2(arah[1], arah[0]) : 0;
  } else if (prev_rect) {
    angle = Math.atan2(
      (prev_rect.y + prev_rect.h/2) - cy,
      (prev_rect.x + prev_rect.w/2) - cx
    );
  }

  if (is_head) {
    const head_rad = Math.floor(base_rad * 0.95);
    ctx.fillStyle = rgb(w);
    ctx.beginPath(); ctx.arc(cx, cy, head_rad, 0, Math.PI*2); ctx.fill();

    const er = Math.max(1, Math.floor(head_rad/3));
    const fwd_x = Math.cos(angle), fwd_y = Math.sin(angle);
    const perp_x = -fwd_y, perp_y = fwd_x;
    const eye_fwd = head_rad * 0.35, eye_side = head_rad * 0.40;
    for (const sign of [-1,1]) {
      const ex = cx + fwd_x*eye_fwd + perp_x*eye_side*sign;
      const ey = cy + fwd_y*eye_fwd + perp_y*eye_side*sign;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI*2); ctx.fill();
      const pr = Math.max(1, Math.floor(er/2));
      ctx.fillStyle = rgb([30,25,30]);
      ctx.beginPath(); ctx.arc(ex+fwd_x*pr*0.6, ey+fwd_y*pr*0.6, pr, 0, Math.PI*2); ctx.fill();
    }
  } else {
    const p = total > 1 ? idx/(total-1) : 0;
    let seg_size = Math.floor(grid * (0.92 - 0.22*p));
    seg_size += Math.max(1, sc(1));
    const corner = Math.max(2, Math.floor(seg_size/5));
    ctx.fillStyle = rgb(w);
    roundRect(cx - seg_size/2, cy - seg_size/2, seg_size, seg_size, corner);
    ctx.fill();
  }
}

// === SPARKLE ===
function sparkle(x, y, sz, clr, a) {
  ctx.save();
  ctx.globalAlpha = a/255;
  ctx.strokeStyle = rgb(clr);
  ctx.lineWidth = sc(2);
  ctx.beginPath();
  ctx.moveTo(x, y-sz); ctx.lineTo(x, y+sz); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x-sz, y); ctx.lineTo(x+sz, y); ctx.stroke();
  ctx.fillStyle = rgb(clr);
  ctx.beginPath(); ctx.arc(x, y, sc(2), 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// === JOYSTICK ===
function gambar_joystick() {
  joy_visible = true;
  const alpha_mul = (joy_pressed || joy_dragging) ? 1.0 : 0.35;
  const R = JOY_FIXED_RADIUS, kr = sc(24);

  const a_fill = Math.floor((joy_pressed ? 70 : 40) * alpha_mul);
  const a_line = Math.floor((joy_pressed ? 150 : 90) * alpha_mul);

  ctx.fillStyle = `rgba(255,255,255,${a_fill/255})`;
  ctx.beginPath(); ctx.arc(joy_c.x, joy_c.y, R, 0, Math.PI*2); ctx.fill();

  ctx.strokeStyle = `rgba(255,255,255,${a_line/255})`;
  ctx.lineWidth = sc(3);
  ctx.beginPath(); ctx.arc(joy_c.x, joy_c.y, R, 0, Math.PI*2); ctx.stroke();

  ctx.lineWidth = sc(2);
  ctx.beginPath();
  ctx.moveTo(joy_c.x, joy_c.y - R/2); ctx.lineTo(joy_c.x, joy_c.y + R/2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(joy_c.x - R/2, joy_c.y); ctx.lineTo(joy_c.x + R/2, joy_c.y); ctx.stroke();

  if (joy_pressed && joy_dir) {
    const gc = joy_dir === ATAS ? MINT : joy_dir === BAWAH ? PINK : joy_dir === KIRI ? LAV : PEACH;
    const grad = ctx.createRadialGradient(joy_p.x, joy_p.y, 0, joy_p.x, joy_p.y, kr*2);
    grad.addColorStop(0, `rgba(${gc[0]},${gc[1]},${gc[2]},0.4)`);
    grad.addColorStop(1, `rgba(${gc[0]},${gc[1]},${gc[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(joy_p.x, joy_p.y, kr*2, 0, Math.PI*2); ctx.fill();
  }

  const ka = (joy_pressed ? 250 : 210) * alpha_mul;
  ctx.fillStyle = `rgba(252,244,228,${ka/255})`;
  ctx.beginPath(); ctx.arc(joy_p.x, joy_p.y, kr, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = `rgba(255,255,255,${alpha_mul})`;
  ctx.lineWidth = sc(2);
  ctx.beginPath(); ctx.arc(joy_p.x, joy_p.y, kr, 0, Math.PI*2); ctx.stroke();

  const arrows = [[0, KANAN], [Math.PI, KIRI], [Math.PI/2, BAWAH], [-Math.PI/2, ATAS]];
  for (const [d_ang, nama] of arrows) {
    const ax = joy_c.x + Math.cos(d_ang) * (R + sc(14));
    const ay = joy_c.y + Math.sin(d_ang) * (R + sc(14));
    const aktif = (joy_dir === nama && joy_pressed);
    const siz = aktif ? sc(9) : sc(6);
    if (aktif) ctx.fillStyle = rgb(PINK);
    else ctx.fillStyle = `rgba(200,200,210,${150*alpha_mul/255})`;

    let pts;
    if (nama === KANAN) pts = [[ax+siz,ay],[ax-siz,ay-siz],[ax-siz,ay+siz]];
    else if (nama === KIRI) pts = [[ax-siz,ay],[ax+siz,ay-siz],[ax+siz,ay+siz]];
    else if (nama === ATAS) pts = [[ax,ay-siz],[ax-siz,ay+siz],[ax+siz,ay+siz]];
    else pts = [[ax,ay+siz],[ax-siz,ay-siz],[ax+siz,ay-siz]];

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath(); ctx.fill();
  }
}

function joystick_hit(mx, my) {
  const R = JOY_FIXED_RADIUS + sc(20);
  const dx = mx - joy_c.x, dy = my - joy_c.y;
  return (dx*dx + dy*dy) <= R*R;
}

function update_joy_from_pos(mx, my) {
  const R = JOY_FIXED_RADIUS;
  let dx = mx - joy_c.x, dy = my - joy_c.y;
  let d = Math.hypot(dx, dy);
  if (d > R) { dx = dx/d*R; dy = dy/d*R; d = R; }
  joy_p = {x: joy_c.x + dx, y: joy_c.y + dy};
  if (d > sc(15)) {
    if (Math.abs(dx) > Math.abs(dy)) joy_dir = dx > 0 ? KANAN : KIRI;
    else joy_dir = dy > 0 ? BAWAH : ATAS;
  } else {
    joy_dir = null;
  }
}

// === CLASS NOTIF ===
class Notif {
  constructor(teks, warna) {
    this.teks = teks; this.warna = warna;
    this.umur = 1.5; this.sisa = 1.5;
  }
  update(dt) { this.sisa -= dt; return this.sisa > 0; }
  draw(f, cx, cy) {
    const p = 1 - (this.sisa / this.umur);
    let a = Math.floor(255 * (1 - Math.max(0, p - 0.4) / 0.6));
    a = Math.max(0, Math.min(255, a));
    const oy = Math.floor(-sc(30) * p);
    ctx.save();
    ctx.globalAlpha = a/255;
    ctx.font = f.notif;
    ctx.fillStyle = rgb(this.warna);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.teks, cx, cy + oy);
    ctx.restore();
  }
}

// === LOGIKA ===
function kosong(ul, mk) {
  const k = Math.max(1, Math.floor(GAME_W / GRID));
  const b = Math.max(1, Math.floor(GAME_H / GRID));
  const ter = [...ul.map(x => x.r), ...mk.map(x => x.r)];
  for (let i = 0; i < 600; i++) {
    const x = Math.floor(Math.random() * k) * GRID;
    const y = Math.floor(Math.random() * b) * GRID;
    let ok = true;
    for (const o of ter) {
      if (x < o.x + o.w && x + GRID > o.x && y < o.y + o.h && y + GRID > o.y) { ok = false; break; }
    }
    if (ok) return {x, y, w:GRID, h:GRID};
  }
  return {x:0, y:0, w:GRID, h:GRID};
}

function mk_biasa(ul, mk) {
  const r = kosong(ul, mk);
  const t = {...BUAH[Math.floor(Math.random() * BUAH.length)]};
  return {r, t};
}

function mk_semua(ul) {
  const mk = []; const dipakai = new Set();
  const semua = [...BUAH].sort(() => Math.random() - 0.5);
  for (let i = 0; i < JUMLAH_BUAH; i++) {
    const r = kosong(ul, mk);
    let pilih = null;
    for (const t of semua) {
      if (!dipakai.has(t.b)) { pilih = t; break; }
    }
    if (!pilih) pilih = BUAH[Math.floor(Math.random() * BUAH.length)];
    dipakai.add(pilih.b);
    mk.push({r, t:{...pilih}});
  }
  return mk;
}

function seg(x, y, w) { return {r:{x, y, w:GRID, h:GRID}, w}; }

function reset() {
  const cx = Math.floor(GAME_W/2/GRID)*GRID;
  const cy = Math.floor(GAME_H/2/GRID)*GRID;
  const ul = [];
  for (let i = 0; i < 3; i++) ul.push(seg(cx - GRID*i, cy, U_COL[i % U_COL.length]));
  return {
    ul, arah: KANAN, next: KANAN, mk: mk_semua(ul),
    skor: 0, fps: 5, notif: [], makan_counter: 0, rainbow_sisa: 0.0
  };
}

function update(st, dt) {
  const ul = st.ul;
  st.arah = st.next;
  const head = ul[0].r;
  const kp = {x: head.x + st.arah[0]*GRID, y: head.y + st.arah[1]*GRID, w:GRID, h:GRID};

  if (kp.x < 0 || kp.x >= GAME_W || kp.y < 0 || kp.y >= GAME_H) return true;
  for (const s of ul) {
    if (kp.x < s.r.x + s.r.w && kp.x + kp.w > s.r.x &&
        kp.y < s.r.y + s.r.h && kp.y + kp.h > s.r.y) return true;
  }

  let makan = null;
  for (const m of st.mk) {
    if (kp.x < m.r.x + m.r.w && kp.x + kp.w > m.r.x &&
        kp.y < m.r.y + m.r.h && kp.y + kp.h > m.r.y) { makan = m; break; }
  }

  if (makan) {
    ul.unshift(seg(kp.x, kp.y, makan.t.w));
    st.skor++;
    st.makan_counter++;
    st.mk = st.mk.filter(x => x !== makan);
    st.mk.push(mk_biasa(ul, st.mk));
    // Speed naik seiring skor, dibatasi FPS_MAX (20)
    st.fps = Math.min(5 + st.skor, FPS_MAX);
    for (const [n, teks, warna] of PUJIAN) {
      if (st.makan_counter === n) { st.notif.push(new Notif(teks, warna)); break; }
    }
    if (st.skor > 0 && st.skor % 10 === 0) st.rainbow_sisa = RAINBOW_DURASI;
  } else {
    ul.unshift({r: kp, w: ul[0].w});
    ul.pop();
  }
  return false;
}

// === BACKGROUND ===
function bg() { ctx.fillStyle = rgb(BG); ctx.fillRect(0, 0, WIDTH, HEIGHT); }

let _bintangSeed = 42;
function seededRandom() {
  _bintangSeed = (_bintangSeed * 9301 + 49297) % 233280;
  return _bintangSeed / 233280;
}
function bintang(t) {
  _bintangSeed = 42;
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(seededRandom() * WIDTH);
    const y = Math.floor(seededRandom() * HEIGHT);
    let a = Math.floor(120 + 100 * Math.sin((t*2 + i*0.7) % (Math.PI*2)));
    a = Math.max(40, Math.min(220, a));
    const sz = (i % 5 === 0) ? sc(2) : sc(1);
    ctx.fillStyle = `rgba(255,255,255,${a/255})`;
    ctx.beginPath(); ctx.arc(x, y, sz, 0, Math.PI*2); ctx.fill();
  }
}

// === AREA GAME ===
function area_game() {
  shadow(GAME_X, GAME_Y, GAME_W, GAME_H, sc(20), sc(4), 120);
  ctx.fillStyle = rgb(BG_GAME);
  roundRect(GAME_X, GAME_Y, GAME_W, GAME_H, sc(20));
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.235)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= GAME_W; x += GRID) {
    ctx.beginPath(); ctx.moveTo(GAME_X+x, GAME_Y); ctx.lineTo(GAME_X+x, GAME_Y+GAME_H); ctx.stroke();
  }
  for (let y = 0; y <= GAME_H; y += GRID) {
    ctx.beginPath(); ctx.moveTo(GAME_X, GAME_Y+y); ctx.lineTo(GAME_X+GAME_W, GAME_Y+y); ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = rgb(PINK);
  ctx.lineWidth = sc(2);
  roundRect(GAME_X, GAME_Y, GAME_W, GAME_H, sc(20));
  ctx.stroke();
}

// === TOP BAR ===
function top_bar(f) {
  const bar_h = Math.floor(TOPBAR_H * SCALE) + sc(14);
  ctx.fillStyle = rgb(BG_GAME);
  ctx.fillRect(0, 0, WIDTH, bar_h);
  ctx.strokeStyle = rgb(BORDER);
  ctx.lineWidth = sc(1);
  ctx.beginPath(); ctx.moveTo(0, bar_h-1); ctx.lineTo(WIDTH, bar_h-1); ctx.stroke();

  const f_title = font(20);
  ctx.font = f_title;
  ctx.textBaseline = "middle";
  const pasangan = [
    [PINK,"S"],[MINT,"N"],[YEL,"A"],[LAV,"K"],[PEACH,"E"],
    [[180,175,185]," "],
    [PINK,"B"],[MINT,"I"],[YEL,"T"],[LAV,"E"]
  ];
  const spacing = sc(1);
  const widths = pasangan.map(([c, ch]) => ctx.measureText(ch).width);
  const title_w = widths.reduce((a,b)=>a+b,0) + spacing*(pasangan.length-1);

  ctx.font = font(13, false);
  const cr_w = ctx.measureText("by. niems").width;
  const gap = sc(10);
  const total_w = title_w + gap + cr_w;
  let tx = Math.floor((WIDTH - total_w) / 2);
  const ty = Math.floor(bar_h/2) + sc(3);

  ctx.font = f_title;
  for (let i = 0; i < pasangan.length; i++) {
    const [clr, ch] = pasangan[i];
    ctx.fillStyle = rgb(clr);
    ctx.textAlign = "left";
    ctx.fillText(ch, tx, ty);
    tx += widths[i] + spacing;
  }
  tx += gap - spacing;
  ctx.font = font(13, false);
  ctx.fillStyle = rgb(TEXT_MID);
  ctx.fillText("by. niems", tx, ty + sc(1));

  ctx.fillStyle = rgb(PINK);
  ctx.beginPath(); ctx.arc(sc(19), Math.floor(bar_h/2), sc(9), 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = rgb([80,60,60]); ctx.lineWidth = sc(1);
  ctx.beginPath();
  ctx.moveTo(sc(19), Math.floor(bar_h/2)-sc(8));
  ctx.lineTo(sc(20), Math.floor(bar_h/2)-sc(11)); ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(sc(17), Math.floor(bar_h/2)-sc(2), sc(2), 0, Math.PI*2); ctx.fill();

  const ebw = sc(34), ebh = sc(26);
  const ebx = WIDTH - sc(10) - ebw;
  const eby = Math.floor(bar_h/2 - ebh/2);
  exit_btn_rect = {x: ebx, y: eby, w: ebw, h: ebh};
  const hover = mouse_in(exit_btn_rect);
  ctx.fillStyle = rgb(hover ? darker(KARTU, 1.3) : KARTU);
  roundRect(ebx, eby, ebw, ebh, sc(8)); ctx.fill();
  ctx.strokeStyle = rgb(BORDER); ctx.lineWidth = sc(1);
  roundRect(ebx, eby, ebw, ebh, sc(8)); ctx.stroke();

  const icx = ebx + ebw/2 - sc(4), icy = eby + ebh/2;
  const si = sc(5);
  ctx.strokeStyle = rgb(CREAM); ctx.lineWidth = sc(2);
  ctx.beginPath(); ctx.moveTo(icx-si, icy-si); ctx.lineTo(icx-si, icy+si); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(icx-si, icy-si); ctx.lineTo(icx, icy-si); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(icx-si, icy+si); ctx.lineTo(icx, icy+si); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(icx-sc(1), icy); ctx.lineTo(icx+si+sc(2), icy); ctx.stroke();
  ctx.fillStyle = rgb(CREAM);
  ctx.beginPath();
  ctx.moveTo(icx+si+sc(2), icy-sc(3));
  ctx.lineTo(icx+si+sc(2), icy+sc(3));
  ctx.lineTo(icx+si+sc(6), icy);
  ctx.closePath(); ctx.fill();
}

// === HUD ===
function hud(f, skor, pjg, fps) {
  const cw = Math.floor(WIDTH/3);
  const items = [
    ["Speed", `${fps}.0x`, "speed"],
    ["Length", pjg, "length"],
    ["Score", skor, "score"]
  ];
  const bar_h = Math.floor(TOPBAR_H * SCALE) + sc(14);

  for (let i = 0; i < 3; i++) {
    const [lbl, val, ico] = items[i];
    const pw = sc(210), ph = sc(50);
    const px = cw*i + Math.floor((cw-pw)/2);
    const py = bar_h + sc(10);

    shadow(px, py, pw, ph, sc(12), sc(3), 100);
    ctx.fillStyle = rgb(KARTU);
    roundRect(px, py, pw, ph, sc(12)); ctx.fill();
    ctx.strokeStyle = rgb(BORDER); ctx.lineWidth = sc(2);
    roundRect(px, py, pw, ph, sc(12)); ctx.stroke();

    const icx = px + sc(26), icy = py + ph/2;

    if (ico === "speed") {
      const ri = sc(11);
      ctx.strokeStyle = rgb(CREAM); ctx.lineWidth = sc(2);
      ctx.beginPath();
      ctx.arc(icx, icy, ri, Math.PI*0.75, Math.PI*2.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(icx, icy+sc(2)); ctx.lineTo(icx+sc(6), icy-sc(4)); ctx.stroke();
      ctx.fillStyle = rgb(CREAM);
      ctx.beginPath(); ctx.arc(icx, icy+sc(2), sc(2), 0, Math.PI*2); ctx.fill();
    } else if (ico === "length") {
      ctx.fillStyle = rgb(CREAM);
      ctx.beginPath(); ctx.arc(icx-sc(6), icy, sc(5), 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(icx+sc(3), icy, sc(5), 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = rgb([26,24,30]);
      ctx.beginPath(); ctx.arc(icx-sc(8), icy-sc(2), sc(1), 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(icx-sc(4), icy-sc(2), sc(1), 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = rgb(PINK);
      ctx.beginPath(); ctx.arc(icx, icy, sc(10), 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = rgb([80,60,60]); ctx.lineWidth = sc(2);
      ctx.beginPath();
      ctx.moveTo(icx, icy-sc(9)); ctx.lineTo(icx+sc(1), icy-sc(13)); ctx.stroke();
      ctx.fillStyle = rgb(MINT);
      ctx.beginPath(); ctx.ellipse(icx+sc(1), icy-sc(12), sc(3), sc(2), 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(icx-sc(3), icy-sc(3), sc(2), 0, Math.PI*2); ctx.fill();
    }

    ctx.font = f.lbl;
    ctx.fillStyle = rgb(TEXT_MID);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(lbl, px + sc(52), py + sc(8));

    ctx.font = f.val;
    ctx.fillStyle = rgb(CREAM);
    ctx.textBaseline = "top";
    ctx.fillText(String(val), px + sc(52), py + sc(22));
  }
}

// === LAYAR LOADING ===
function layar_loading() {
  return new Promise(resolve => {
    let el = 0, last = performance.now();
    function frame(now) {
      const dt = (now - last) / 1000; last = now;
      el += dt;
      const prog = Math.min(1, el/2.0);
      const f = fonts();
      bg(); bintang(el);
      const cx = Math.floor(WIDTH/2);
      const base_y = Math.floor(HEIGHT*0.35);

      const n_seg = 7;
      for (let i = 0; i < n_seg; i++) {
        const p = n_seg > 1 ? i/(n_seg-1) : 0;
        const arc_x = cx - sc(90) + i*sc(25);
        const arc_y = base_y + Math.floor(Math.sin(p*Math.PI) * sc(15));
        const ds = sc(26) - i*sc(1);
        let ang;
        if (i === 0) ang = Math.PI;
        else {
          const prev_x = cx - sc(90) + (i-1)*sc(25);
          const prev_y = base_y + Math.floor(Math.sin((i-1)/(n_seg-1)*Math.PI)*sc(15));
          ang = Math.atan2(prev_y - arc_y, prev_x - arc_x);
        }
        gambar_segmen_worm(arc_x, arc_y, Math.floor(ds/2), U_COL[i % U_COL.length], ang,
          i===0, i, n_seg);
      }

      ctx.font = f.sml;
      ctx.fillStyle = rgb(TEXT_MID);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const sub_y = base_y + sc(80);
      ctx.fillText("Loading...", cx, sub_y);

      const bw = sc(300), bh = sc(20);
      const bx = cx - bw/2, by = sub_y + sc(36);
      ctx.strokeStyle = rgb(CREAM); ctx.lineWidth = sc(2);
      roundRect(bx, by, bw, bh, bh/2); ctx.stroke();
      const fw = Math.floor((bw - sc(8)) * prog);
      if (fw > 0) {
        ctx.fillStyle = rgb(PINK);
        roundRect(bx + sc(4), by + sc(4), fw, bh - sc(8), (bh - sc(8))/2);
        ctx.fill();
      }

      if (el >= 2.0) { resolve(); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

// === JUDUL SNAKE ===
function judul_snake(cx, y, sz) {
  const f = font(sz);
  ctx.font = f;
  const pasangan = [
    [[250,180,195],"S"],[[180,225,205],"N"],[[250,228,180],"A"],
    [[205,190,235],"K"],[[250,210,185],"E"]
  ];
  const spacing = sc(2);
  const widths = pasangan.map(([c, ch]) => ctx.measureText(ch).width);
  const tw = widths.reduce((a,b)=>a+b,0) + spacing*(pasangan.length-1);
  let x = cx - tw/2;
  ctx.textBaseline = "top";
  for (let i = 0; i < pasangan.length; i++) {
    const [clr, ch] = pasangan[i];
    ctx.fillStyle = rgb(clr);
    ctx.textAlign = "left";
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  }
}

// === MENU UTAMA ===
function layar_start() {
  return new Promise(resolve => {
    let t = 0, last = performance.now();
    let klik = false;

    function onDown(e) {
      klik = true;
      const rect = canvas.getBoundingClientRect();
      const src = (e.touches && e.touches[0]) ? e.touches[0] : e;
      mouse_pos = {x: src.clientX - rect.left, y: src.clientY - rect.top};
    }
    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const src = (e.touches && e.touches[0]) ? e.touches[0] : e;
      mouse_pos = {x: src.clientX - rect.left, y: src.clientY - rect.top};
    }
    function onKey() { klik = true; }

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchstart", onDown, {passive:true});
    canvas.addEventListener("touchmove", onMove, {passive:true});
    window.addEventListener("keydown", onKey);

    function cleanup() {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      window.removeEventListener("keydown", onKey);
    }

    function frame(now) {
      const dt = (now - last) / 1000; last = now;
      t += dt;
      const f = fonts();
      const cx = Math.floor(WIDTH/2);
      const y_j = Math.floor(HEIGHT*0.05);
      const y_b = y_j + sc(95);
      const y_t = y_b + sc(75);
      const y_k = y_t + sc(45);
      const y_u = Math.floor(HEIGHT*0.55);
      const y_p = Math.floor(HEIGHT*0.85);
      const y_h = HEIGHT - sc(22);

      bg(); bintang(t);
      judul_snake(cx, y_j, 80);

      ctx.font = f.bite; ctx.fillStyle = rgb(CREAM);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText("bite", cx, y_b);

      ctx.font = f.tag;
      ctx.fillText("small bites, bigger snake!", cx, y_t);

      ctx.font = f.kr; ctx.fillStyle = rgb(TEXT_DIM);
      ctx.fillText("by. niems", cx, y_k);

      const n = 5, ds = sc(38), gap = sc(0);
      const tw = ds*n + gap*(n-1);
      const sx = cx - tw/2;
      for (let i = 0; i < n; i++) {
        const bx = sx + i*(ds+gap) + ds/2;
        const ay = y_u + ds/2;
        const warna_idx = (n-1-i) % U_COL.length;
        const is_head = (i === n-1);
        gambar_segmen_worm(bx, ay, Math.floor(ds/2), U_COL[warna_idx], 0,
          is_head, n-1-i, n);
      }

      const sparks = [
        [cx-sc(200), y_j+sc(25)],[cx-sc(175), y_j+sc(85)],
        [cx+sc(195), y_j+sc(15)],[cx+sc(215), y_j+sc(75)],
        [cx-sc(155), y_b+sc(35)],[cx+sc(170), y_b+sc(45)]
      ];
      for (let i = 0; i < sparks.length; i++) {
        const [sx_, sy_] = sparks[i];
        let a = Math.floor(140 + 100*Math.sin((t*3+i)%3));
        a = Math.max(80, Math.min(240, a));
        const sz = (i%2===0) ? sc(7) : sc(5);
        const clr = (i%2===0) ? YEL : CREAM;
        sparkle(sx_, sy_, sz, clr, a);
      }

      buah(sc(25), Math.floor(HEIGHT*0.60), sc(38), sc(38), BUAH[5], t);
      buah(WIDTH-sc(25)-sc(38), Math.floor(HEIGHT*0.60), sc(38), sc(38), BUAH[0], t);
      buah(sc(30), Math.floor(HEIGHT*0.75), sc(38), sc(38), BUAH[1], t);
      buah(WIDTH-sc(30)-sc(38), Math.floor(HEIGHT*0.75), sc(38), sc(38), BUAH[0], t);

      const bp = {x: cx-sc(130), y: y_p-sc(30), w: sc(260), h: sc(60)};
      const hover = mouse_in(bp);

      shadow(bp.x, bp.y, bp.w, bp.h, bp.h/2, sc(4), 120);
      ctx.fillStyle = rgb(hover ? [255,205,215] : PINK);
      roundRect(bp.x, bp.y, bp.w, bp.h, bp.h/2); ctx.fill();

      const tri = sc(14);
      const tcx = bp.x + bp.w/2 - sc(42), tcy = bp.y + bp.h/2;
      ctx.fillStyle = rgb([26,24,30]);
      ctx.beginPath();
      ctx.moveTo(tcx-tri/2, tcy-tri);
      ctx.lineTo(tcx-tri/2, tcy+tri);
      ctx.lineTo(tcx+tri, tcy);
      ctx.closePath(); ctx.fill();

      ctx.font = f.play; ctx.fillStyle = rgb([26,24,30]);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Play", bp.x + bp.w/2 + sc(18), bp.y + bp.h/2);

      ctx.font = f.sml; ctx.fillStyle = rgb(TEXT_DIM);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText("Klik tombol Play / tekan tombol apa saja", cx, y_h);

      if (klik) {
        klik = false;
        cleanup();
        resolve();
        return;
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

// === GAME OVER ===
function layar_game_over(skor, panjang, fps) {
  return new Promise(resolve => {
    let t = 0, last = performance.now();
    let pending_klik = false;

    function onDown(e) {
      pending_klik = true;
      const rect = canvas.getBoundingClientRect();
      const src = (e.touches && e.touches[0]) ? e.touches[0] : e;
      mouse_pos = {x: src.clientX - rect.left, y: src.clientY - rect.top};
    }
    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const src = (e.touches && e.touches[0]) ? e.touches[0] : e;
      mouse_pos = {x: src.clientX - rect.left, y: src.clientY - rect.top};
    }
    function onKey(e) {
      const k = e.key.toLowerCase();
      if (k === "r") { cleanup(); resolve("u"); }
      else if (k === "escape" || k === " ") { cleanup(); resolve("k"); }
    }

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchstart", onDown, {passive:true});
    canvas.addEventListener("touchmove", onMove, {passive:true});
    window.addEventListener("keydown", onKey);

    function cleanup() {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      window.removeEventListener("keydown", onKey);
    }

    function draw_tombol(r, txt, clr, hover, ico, f) {
      const c = hover ? darker(clr, 0.92) : clr;
      shadow(r.x, r.y, r.w, r.h, r.h/2, sc(3), 100);
      ctx.fillStyle = rgb(c);
      roundRect(r.x, r.y, r.w, r.h, r.h/2); ctx.fill();
      let off = 0;
      if (ico === "r") {
        const icx = r.x + sc(32), icy = r.y + r.h/2, ri = sc(11);
        ctx.strokeStyle = rgb([26,24,30]); ctx.lineWidth = sc(3);
        ctx.beginPath(); ctx.arc(icx, icy, ri, Math.PI*0.2, Math.PI*1.7); ctx.stroke();
        ctx.fillStyle = rgb([26,24,30]);
        ctx.beginPath();
        ctx.moveTo(icx+ri-sc(2), icy-ri+sc(2));
        ctx.lineTo(icx+ri+sc(5), icy-sc(1));
        ctx.lineTo(icx+ri-sc(2), icy+sc(4));
        ctx.closePath(); ctx.fill();
        off = sc(14);
      } else if (ico === "e") {
        const icx = r.x + sc(32), icy = r.y + r.h/2, si = sc(8);
        ctx.strokeStyle = rgb([26,24,30]); ctx.lineWidth = sc(3);
        ctx.beginPath(); ctx.moveTo(icx-si, icy-si); ctx.lineTo(icx-si, icy+si); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(icx-si, icy-si); ctx.lineTo(icx, icy-si); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(icx-si, icy+si); ctx.lineTo(icx, icy+si); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(icx-sc(2), icy); ctx.lineTo(icx+si+sc(3), icy); ctx.stroke();
        ctx.fillStyle = rgb([26,24,30]);
        ctx.beginPath();
        ctx.moveTo(icx+si+sc(3), icy-sc(4));
        ctx.lineTo(icx+si+sc(3), icy+sc(4));
        ctx.lineTo(icx+si+sc(8), icy);
        ctx.closePath(); ctx.fill();
        off = sc(14);
      }
      ctx.font = f.btn; ctx.fillStyle = rgb([26,24,30]);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, r.x + r.w/2 + off, r.y + r.h/2);
    }

    function frame(now) {
      const dt = (now - last) / 1000; last = now;
      t += dt;
      const f = fonts();
      const cx = Math.floor(WIDTH/2), cy = Math.floor(HEIGHT/2);
      const pw = sc(480), ph = sc(500);
      const panel = {x: cx - pw/2, y: cy - ph/2, w: pw, h: ph};
      const y_t = panel.y + sc(45);
      const y_u = panel.y + sc(115);
      const y_s = panel.y + sc(195);
      const y_btn = panel.y + sc(350);

      const b1 = {x: panel.x + pw/2 - sc(100) - sc(90), y: y_btn - sc(30), w: sc(180), h: sc(60)};
      const b2 = {x: panel.x + pw/2 + sc(100) - sc(90), y: y_btn - sc(30), w: sc(180), h: sc(60)};
      const h1 = mouse_in(b1), h2 = mouse_in(b2);

      bg(); bintang(t);
      shadow(panel.x, panel.y, panel.w, panel.h, sc(26), sc(5), 140);
      ctx.fillStyle = rgb(KARTU);
      roundRect(panel.x, panel.y, panel.w, panel.h, sc(26)); ctx.fill();
      ctx.strokeStyle = rgb(BORDER); ctx.lineWidth = sc(2);
      roundRect(panel.x, panel.y, panel.w, panel.h, sc(26)); ctx.stroke();

      ctx.font = f.go; ctx.fillStyle = rgb(CREAM);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      const j_w = ctx.measureText("Game Over").width;
      const jx = panel.x + panel.w/2 - j_w/2;
      ctx.fillText("Game Over", panel.x + panel.w/2, y_t);

      for (const sx_ of [jx-sc(30), jx+j_w+sc(18)]) {
        for (const d of [-1,1]) {
          ctx.strokeStyle = rgb(YEL); ctx.lineWidth = sc(2);
          ctx.beginPath();
          ctx.moveTo(sx_+d*sc(4), y_t+sc(18));
          ctx.lineTo(sx_+d*sc(7), y_t+sc(8));
          ctx.stroke();
        }
      }

      const n = 5, ds = sc(30), gap = sc(2);
      const tw = ds*n + gap*(n-1);
      const sx = panel.x + panel.w/2 - tw/2;
      const base_y = y_u + sc(14);
      for (let i = 0; i < n; i++) {
        const bx = sx + i*(ds+gap) + ds/2;
        const ay = base_y + Math.floor(Math.sin((i/(n-1))*Math.PI)*sc(6));
        const warna = U_COL[i % U_COL.length];
        if (i === 0) {
          const head_rad = Math.floor(ds/2 * 0.95);
          ctx.fillStyle = rgb(warna);
          ctx.beginPath(); ctx.arc(bx, ay, head_rad, 0, Math.PI*2); ctx.fill();
          const er_x = Math.max(1, Math.floor(head_rad/3));
          for (const eo of [-head_rad/3, head_rad/3]) {
            const ex = bx+eo, ey = ay-head_rad/5;
            ctx.strokeStyle = rgb([50,42,48]); ctx.lineWidth = sc(2);
            ctx.beginPath(); ctx.moveTo(ex-er_x, ey-er_x); ctx.lineTo(ex+er_x, ey+er_x); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ex-er_x, ey+er_x); ctx.lineTo(ex+er_x, ey-er_x); ctx.stroke();
          }
          ctx.strokeStyle = rgb([50,42,48]); ctx.lineWidth = sc(2);
          ctx.beginPath();
          ctx.arc(bx, ay+head_rad*0.5, head_rad*0.4, Math.PI*1.15, Math.PI*1.85);
          ctx.stroke();
        } else {
          const p = i/(n-1);
          let seg_size = Math.floor(ds * (0.92 - 0.22*p));
          seg_size += Math.max(1, sc(1));
          const corner = Math.max(2, Math.floor(seg_size/5));
          ctx.fillStyle = rgb(warna);
          roundRect(bx - seg_size/2, ay - seg_size/2, seg_size, seg_size, corner);
          ctx.fill();
        }
      }

      const cw = sc(185), ch = sc(92);
      const col_w = Math.floor(pw/2);
      const card1 = {x: panel.x + Math.floor(col_w/2 - cw/2 - sc(5)), y: y_s, w: cw, h: ch};
      ctx.fillStyle = rgb([48,46,56]);
      roundRect(card1.x, card1.y, card1.w, card1.h, sc(14)); ctx.fill();
      ctx.strokeStyle = rgb(BORDER); ctx.lineWidth = sc(2);
      roundRect(card1.x, card1.y, card1.w, card1.h, sc(14)); ctx.stroke();

      buah(card1.x + sc(15), card1.y + sc(24), sc(32), sc(32), BUAH[5], t);

      ctx.font = f.lbl; ctx.fillStyle = rgb(CREAM);
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("Score", card1.x + sc(62), card1.y + sc(22));
      ctx.font = f.val;
      ctx.fillText(String(skor), card1.x + sc(62), card1.y + sc(44));

      const card2 = {x: panel.x + col_w + Math.floor(col_w/2 - cw/2 + sc(5)), y: y_s, w: cw, h: ch};
      ctx.fillStyle = rgb([48,46,56]);
      roundRect(card2.x, card2.y, card2.w, card2.h, sc(14)); ctx.fill();
      ctx.strokeStyle = rgb(BORDER); ctx.lineWidth = sc(2);
      roundRect(card2.x, card2.y, card2.w, card2.h, sc(14)); ctx.stroke();

      const ccx = card2.x + sc(38), ccy = card2.y + sc(42), sc_ = sc(12);
      ctx.fillStyle = rgb(YEL);
      ctx.beginPath();
      ctx.moveTo(ccx-sc_, ccy+sc_/2);
      ctx.lineTo(ccx-sc_/2, ccy-sc_/2);
      ctx.lineTo(ccx-sc_/4, ccy+sc_/4);
      ctx.lineTo(ccx, ccy-sc_/2);
      ctx.lineTo(ccx+sc_/4, ccy+sc_/4);
      ctx.lineTo(ccx+sc_/2, ccy-sc_/2);
      ctx.lineTo(ccx+sc_, ccy+sc_/2);
      ctx.closePath(); ctx.fill();

      ctx.font = f.lbl; ctx.fillStyle = rgb(CREAM);
      ctx.fillText("Best Score", card2.x + sc(62), card2.y + sc(22));
      ctx.font = f.val;
      ctx.fillText("37", card2.x + sc(62), card2.y + sc(44));

      draw_tombol(b1, "Restart", PINK, h1, "r", f);
      draw_tombol(b2, "Exit", BLUE, h2, "e", f);

      ctx.font = f.sml; ctx.fillStyle = rgb(TEXT_MID);
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText("(R)", b1.x + b1.w/2, b1.y + b1.h + sc(18));
      ctx.fillText("(Space)", b2.x + b2.w/2, b2.y + b2.h + sc(18));

      if (pending_klik) {
        pending_klik = false;
        if (h1) { cleanup(); resolve("u"); return; }
        if (h2) { cleanup(); resolve("k"); return; }
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

// === GAMEPLAY LOOP ===
function layar_gameplay() {
  return new Promise(resolve => {
    let st = reset();
    joy_pressed = false; joy_dragging = false; joy_dir = null;
    joy_p = {x: joy_c.x, y: joy_c.y};
    joy_visible = true;
    let ke_menu = false;

    function handleKey(e) {
      const k = e.key.toLowerCase();
      if (k === "escape") { ke_menu = true; return; }
      const a = st.arah;
      if ((k === "arrowup" || k === "w") && a !== BAWAH) st.next = ATAS;
      else if ((k === "arrowdown" || k === "s") && a !== ATAS) st.next = BAWAH;
      else if ((k === "arrowleft" || k === "a") && a !== KANAN) st.next = KIRI;
      else if ((k === "arrowright" || k === "d") && a !== KIRI) st.next = KANAN;
    }

    function onMouseDown(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      mouse_pos = {x: mx, y: my};
      if (exit_btn_rect && pointIn(mx, my, exit_btn_rect)) { ke_menu = true; return; }
      if (joystick_hit(mx, my)) {
        joy_pressed = true; joy_dragging = true;
        update_joy_from_pos(mx, my);
      }
    }
    function onMouseUp() {
      if (joy_pressed) {
        joy_pressed = false; joy_dragging = false; joy_dir = null;
        joy_p = {x: joy_c.x, y: joy_c.y};
      }
    }
    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse_pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
      if (joy_dragging) update_joy_from_pos(mouse_pos.x, mouse_pos.y);
    }

    function onTouchStart(e) {
      e.preventDefault();
      touch_mode = true;
      const rect = canvas.getBoundingClientRect();
      const t0 = e.touches[0];
      const fx = t0.clientX - rect.left, fy = t0.clientY - rect.top;
      mouse_pos = {x: fx, y: fy};
      if (exit_btn_rect && pointIn(fx, fy, exit_btn_rect)) { ke_menu = true; return; }
      if (joystick_hit(fx, fy)) {
        joy_pressed = true; joy_dragging = true;
        update_joy_from_pos(fx, fy);
      }
    }
    function onTouchEnd() {
      if (joy_pressed) {
        joy_pressed = false; joy_dragging = false; joy_dir = null;
        joy_p = {x: joy_c.x, y: joy_c.y};
      }
    }
    function onTouchMove(e) {
      e.preventDefault();
      if (joy_dragging && e.touches[0]) {
        const rect = canvas.getBoundingClientRect();
        const fx = e.touches[0].clientX - rect.left;
        const fy = e.touches[0].clientY - rect.top;
        update_joy_from_pos(fx, fy);
      }
    }

    window.addEventListener("keydown", handleKey);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchstart", onTouchStart, {passive:false});
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchmove", onTouchMove, {passive:false});

    function cleanup() {
      window.removeEventListener("keydown", handleKey);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchmove", onTouchMove);
    }

    let last = performance.now();
    let acc = 0;

    function frame(now) {
      const dt_real = (now - last) / 1000; last = now;
      const dt = Math.min(dt_real, 0.1);
      const t = now / 1000;
      const f = fonts();

      if (st.rainbow_sisa > 0) st.rainbow_sisa -= dt;
      const rainbow = st.rainbow_sisa > 0;

      if (joy_dir) {
        const a = st.arah;
        if (joy_dir === ATAS && a !== BAWAH) st.next = ATAS;
        else if (joy_dir === BAWAH && a !== ATAS) st.next = BAWAH;
        else if (joy_dir === KIRI && a !== KANAN) st.next = KIRI;
        else if (joy_dir === KANAN && a !== KIRI) st.next = KANAN;
      }

      acc += dt;
      const step = 1 / st.fps;
      let game_over = false;
      while (acc >= step) {
        acc -= step;
        game_over = update(st, dt);
        st.notif = st.notif.filter(n => n.update(dt));
        if (game_over) break;
      }

      bg(); bintang(t); area_game();
      top_bar(f);
      hud(f, st.skor, st.ul.length, st.fps);

      for (const m of st.mk) {
        buah(GAME_X + m.r.x, GAME_Y + m.r.y, m.r.w, m.r.h, m.t, t);
      }

      const ul = st.ul;
      for (let i = ul.length - 1; i >= 0; i--) {
        const s_ = ul[i];
        const rect = {x: GAME_X + s_.r.x, y: GAME_Y + s_.r.y, w: s_.r.w, h: s_.r.h};
        let prev_rect = null;
        if (i > 0) {
          const pr = ul[i-1].r;
          prev_rect = {x: GAME_X + pr.x, y: GAME_Y + pr.y, w: pr.w, h: pr.h};
        }
        ular(rect, s_.w, i === 0, i === 0 ? st.arah : null, i, ul.length, rainbow, prev_rect);
      }

      for (const n of st.notif) n.draw(f, GAME_X + GAME_W/2, GAME_Y + sc(30));

      if (rainbow) {
        const bw = sc(150), bh = sc(6);
        const bx = WIDTH/2 - bw/2, by = GAME_Y - sc(20);
        ctx.fillStyle = rgb(KARTU);
        roundRect(bx, by, bw, bh, bh/2); ctx.fill();
        const fw = Math.floor(bw * (st.rainbow_sisa / RAINBOW_DURASI));
        ctx.fillStyle = rgb(LAV);
        roundRect(bx, by, fw, bh, bh/2); ctx.fill();
      }

      gambar_joystick();

      if (ke_menu) {
        cleanup();
        resolve("m");
        return;
      }
      if (game_over) {
        cleanup();
        resolve({type:"over", skor: st.skor, panjang: ul.length, fps: st.fps});
        return;
      }
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  });
}

// === ENTRY POINT ===
async function main() {
  canvas = document.getElementById("game-canvas");
  if (!canvas) { console.error("Canvas #game-canvas tidak ditemukan!"); return; }
  ctx = canvas.getContext("2d");

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  await layar_loading();

  while (true) {
    await layar_start();

    let keluar = false;
    while (!keluar) {
      const hasil = await layar_gameplay();
      if (hasil === "m") {
        keluar = true;
        break;
      }
      if (hasil && hasil.type === "over") {
        const pilihan = await layar_game_over(hasil.skor, hasil.panjang, hasil.fps);
        if (pilihan === "k") {
          keluar = true;
          break;
        }
      }
    }
  }
}

window.addEventListener("load", main);