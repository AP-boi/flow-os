'use strict';

// Flow OS — window manager, apps, persona switch.
// The hacker persona is pure theater: every scan, exploit and graph in here is scripted.

const TASKBAR_HEIGHT = 48;
const CLOCK_TICK_MS = 1000;
const SYSMON_TICK_MS = 500;
const MATRIX_FRAME_MS = 33;
const SERIES_LEN = 60;
const Z_WINDOW_BASE = 100;

const windows = new Map();
let biggestIndex = Z_WINDOW_BASE;
let activeWindowId = null;
let hackerModeActive = false;
let matrixLoop = null;
let matrixResize = null;
let sysmonTimer = null;
let hackerTimers = [];

const ICON_PATHS = {
  flow: '<path d="M3 8c3-5 6-5 9 0s6 5 9 0"/><path d="M3 16c3-5 6-5 9 0s6 5 9 0"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M17 12v4M20 12v3"/>',
  pulse: '<path d="M2 12h4l3-8 4 16 3-8h6"/>',
  terminal: '<path d="M4 6l6 6-6 6"/><path d="M13 18h7"/>',
  start: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
  minim: '<path d="M5 17h14"/>',
  maxim: '<rect x="5" y="6" width="14" height="12" rx="1"/>',
  clos: '<path d="M6 6l12 12M18 6L6 18"/>',
};

const svgIcon = name =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;

const APPS = [
  { id: 'welcome', title: 'Welcome', icon: 'flow' },
  { id: 'cipher', title: 'Cipher Lab', icon: 'key' },
  { id: 'sysmon', title: 'System Monitor', icon: 'pulse' },
  { id: 'terminal', title: 'rootshell', icon: 'terminal', hackerOnly: true },
];

// same apps, scarier names — a pure relabel, nothing new behind it
const HACKER_LABELS = { welcome: 'readme.txt', cipher: 'xlate.sh', sysmon: 'sysprobe.sh' };

/* ---------- window manager ---------- */

function initializeWindow(id) {
  const el = document.getElementById(`win-${id}`);
  const header = el.querySelector('.windowheader');
  const app = APPS.find(a => a.id === id);
  header.insertAdjacentHTML('beforeend', `
    <span class="wincontrols">
      <button class="winbtn minbutton" aria-label="Minimize">${svgIcon('minim')}</button>
      <button class="winbtn maxbutton" aria-label="Maximize">${svgIcon('maxim')}</button>
      <button class="winbtn closebutton" aria-label="Close">${svgIcon('clos')}</button>
    </span>`);
  windows.set(id, { el, title: app.title, icon: app.icon, minimized: false, placed: false, prevRect: null });

  dragElement(el, header);
  el.addEventListener('pointerdown', () => focusWindow(id));
  header.querySelector('.minbutton').addEventListener('click', () => minimizeWindow(id));
  header.querySelector('.maxbutton').addEventListener('click', () => toggleMaximize(id));
  header.querySelector('.closebutton').addEventListener('click', () => closeWindow(id));
  header.addEventListener('dblclick', e => {
    if (!e.target.closest('.winbtn')) toggleMaximize(id);
  });
}

function dragElement(el, handle) {
  let startX = 0, startY = 0, originX = 0, originY = 0;
  const follow = e => {
    const desk = document.getElementById('desktop').getBoundingClientRect();
    el.style.left = `${clamp(originX + e.clientX - startX, -el.offsetWidth + 80, desk.width - 80)}px`;
    el.style.top = `${clamp(originY + e.clientY - startY, 0, desk.height - TASKBAR_HEIGHT - 32)}px`;
  };
  const release = () => {
    document.removeEventListener('pointermove', follow);
    document.removeEventListener('pointerup', release);
  };
  handle.addEventListener('pointerdown', e => {
    if (e.target.closest('.winbtn') || el.classList.contains('maximized')) return;
    startX = e.clientX;
    startY = e.clientY;
    originX = el.offsetLeft;
    originY = el.offsetTop;
    document.addEventListener('pointermove', follow);
    document.addEventListener('pointerup', release);
  });
}

function focusWindow(id) {
  const win = windows.get(id);
  if (!win || !win.el.classList.contains('open') || win.minimized) return;
  biggestIndex += 1; // taskbar sits at a fixed shell z-index well above this counter
  win.el.style.zIndex = biggestIndex;
  activeWindowId = id;
  for (const [otherId, other] of windows) other.el.classList.toggle('focused', otherId === id);
  syncTaskbar();
}

function openWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  win.el.classList.add('open');
  win.el.classList.remove('minimized');
  win.minimized = false;
  if (!win.placed) placeWindow(id);
  focusWindow(id);
  closeStartMenu();
  if (id === 'sysmon') startSysmon();
}

function closeWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  win.el.classList.remove('open', 'focused');
  if (id === 'sysmon') stopSysmon();
  if (activeWindowId === id) activeWindowId = null;
  syncTaskbar();
}

function minimizeWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  win.el.classList.add('minimized');
  win.minimized = true;
  if (id === 'sysmon') stopSysmon();
  if (activeWindowId === id) activeWindowId = null;
  syncTaskbar();
}

function toggleMaximize(id) {
  const win = windows.get(id);
  const el = win.el;
  if (el.classList.contains('maximized')) {
    Object.assign(el.style, win.prevRect);
    el.classList.remove('maximized');
  } else {
    win.prevRect = { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height };
    Object.assign(el.style, { left: '0px', top: '0px', width: '100vw', height: `calc(100vh - ${TASKBAR_HEIGHT}px)` });
    el.classList.add('maximized');
  }
}

function placeWindow(id) {
  const win = windows.get(id);
  const desk = document.getElementById('desktop').getBoundingClientRect();
  const w = win.el.offsetWidth;
  const h = win.el.offsetHeight;
  if (id === 'welcome') {
    win.el.style.left = `${(desk.width - w) / 2}px`;
    win.el.style.top = `${(desk.height - TASKBAR_HEIGHT - h) / 2}px`;
  } else {
    // cascade each new window so they never stack up invisibly
    const offset = [...windows.values()].filter(x => x.placed).length * 28;
    win.el.style.left = `${clamp(130 + offset, 0, desk.width - w - 20)}px`;
    win.el.style.top = `${clamp(80 + offset, 0, desk.height - TASKBAR_HEIGHT - h - 12)}px`;
  }
  win.placed = true;
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/* ---------- desktop icons, taskbar, start menu, clock ---------- */

function buildDesktopIcons() {
  const field = document.getElementById('iconField');
  for (const app of APPS) {
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.dataset.app = app.id;
    icon.innerHTML = `<span class="glyph">${svgIcon(app.icon)}</span><span class="iconLabel">${app.title}</span>`;
    icon.addEventListener('click', () => {
      for (const other of field.children) other.classList.toggle('selected', other === icon);
    });
    icon.addEventListener('dblclick', () => openWindow(app.id));
    field.append(icon);
  }
  document.getElementById('desktop').addEventListener('pointerdown', e => {
    if (!e.target.closest('.icon')) {
      for (const other of field.children) other.classList.remove('selected');
    }
  });
}

function relabelIcons() {
  for (const app of APPS) {
    const label = document.querySelector(`.icon[data-app="${app.id}"] .iconLabel`);
    if (label) label.textContent = hackerModeActive ? (HACKER_LABELS[app.id] ?? app.title) : app.title;
  }
}

function appTitle(id) {
  return hackerModeActive ? (HACKER_LABELS[id] ?? windows.get(id).title) : windows.get(id).title;
}

function syncTaskbar() {
  const tray = document.getElementById('taskItems');
  tray.replaceChildren();
  for (const [id, win] of windows) {
    if (!win.el.classList.contains('open')) continue;
    const btn = document.createElement('button');
    btn.className = 'taskItem' + (activeWindowId === id && !win.minimized ? ' active' : '');
    btn.innerHTML = `${svgIcon(win.icon)}<span></span>`;
    btn.querySelector('span').textContent = appTitle(id);
    btn.addEventListener('click', () => {
      if (win.minimized) {
        win.minimized = false;
        win.el.classList.remove('minimized');
        focusWindow(id);
      } else if (activeWindowId === id) {
        minimizeWindow(id);
      } else {
        focusWindow(id);
      }
    });
    tray.append(btn);
  }
}

function buildStartMenu() {
  const list = document.getElementById('startApps');
  list.replaceChildren();
  for (const app of APPS) {
    if (app.hackerOnly && !hackerModeActive) continue;
    const item = document.createElement('button');
    item.className = 'startItem';
    item.innerHTML = `${svgIcon(app.icon)}<span></span>`;
    item.querySelector('span').textContent = appTitle(app.id);
    item.addEventListener('click', () => openWindow(app.id));
    list.append(item);
  }
  document.getElementById('switchUser').textContent =
    hackerModeActive ? 'Switch back to Flow' : 'Switch User → Hacker';
}

function toggleStartMenu() {
  const menu = document.getElementById('startMenu');
  if (menu.hidden) buildStartMenu();
  menu.hidden = !menu.hidden;
}

function closeStartMenu() {
  document.getElementById('startMenu').hidden = true;
}

function updateClock() {
  document.getElementById('timeElement').textContent =
    new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/* ---------- cipher lab ---------- */

// one entry here is one working sidebar item; nothing else needs to change
const CIPHERS = [
  { id: 'rot13', name: 'ROT13', symmetric: true, transform: rot13 },
  { id: 'base64', name: 'Base64', encode: base64Encode, decode: base64Decode },
  { id: 'morse', name: 'Morse code', encode: morseEncode, decode: morseDecode },
];

let currentCipher = CIPHERS[0];

const MORSE_TABLE = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
  i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
  q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
  y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};
const MORSE_LOOKUP = Object.fromEntries(Object.entries(MORSE_TABLE).map(([k, v]) => [v, k]));

function rot13(text) {
  return text.replace(/[a-z]/gi, ch => {
    const base = ch === ch.toUpperCase() ? 65 : 97;
    return String.fromCharCode((ch.charCodeAt(0) - base + 13) % 26 + base);
  });
}

function base64Encode(text) {
  let bytes = '';
  for (const b of new TextEncoder().encode(text)) bytes += String.fromCharCode(b);
  return btoa(bytes);
}

function base64Decode(text) {
  return new TextDecoder().decode(Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0)));
}

function morseEncode(text) {
  return [...text.toLowerCase()].map(ch => (ch === ' ' ? '/' : MORSE_TABLE[ch] ?? ch)).join(' ');
}

function morseDecode(text) {
  return text.trim().split(/\s+/).map(tok => (tok === '/' ? ' ' : MORSE_LOOKUP[tok] ?? tok)).join('');
}

function buildCipherSidebar() {
  const nav = document.getElementById('cipherList');
  CIPHERS.forEach((cipher, i) => {
    const btn = document.createElement('button');
    btn.className = 'cipherItem' + (i === 0 ? ' selected' : '');
    btn.textContent = cipher.name;
    btn.addEventListener('click', () => selectCipher(btn, cipher));
    nav.append(btn);
  });
}

function selectCipher(btn, cipher) {
  currentCipher = cipher;
  for (const other of btn.parentElement.children) other.classList.toggle('selected', other === btn);
  document.getElementById('cipherName').textContent = cipher.name;
  const encodeBtn = document.getElementById('cipherEncode');
  const decodeBtn = document.getElementById('cipherDecode');
  encodeBtn.textContent = cipher.symmetric ? 'Transform' : 'Encode';
  decodeBtn.classList.toggle('hidden', Boolean(cipher.symmetric));
  document.getElementById('cipherOutput').value = '';
}

let cipherDirection = 'encode';

function runCipher(direction) {
  const input = document.getElementById('cipherInput').value;
  const fn = currentCipher.symmetric ? currentCipher.transform : currentCipher[direction];
  try {
    document.getElementById('cipherOutput').value = fn(input);
  } catch (err) {
    // only base64 gets here in practice — bad padding, stray characters
    document.getElementById('cipherOutput').value = `can't convert that input (${err.message})`;
  }
}

/* ---------- system monitor (all numbers simulated) ---------- */

let cpuSeries = [];
let netSeries = [];

const walk = (v, amp) => clamp(v + (Math.random() - 0.5) * amp, 5, 95);

function startSysmon() {
  if (sysmonTimer) return;
  cpuSeries = Array.from({ length: SERIES_LEN }, () => 30 + Math.random() * 30);
  netSeries = Array.from({ length: SERIES_LEN }, () => 20 + Math.random() * 40);
  const step = () => {
    cpuSeries = [...cpuSeries.slice(1), walk(cpuSeries[SERIES_LEN - 1], 9)];
    netSeries = [...netSeries.slice(1), walk(netSeries[SERIES_LEN - 1], 16)];
    drawGraph('cpuCanvas', cpuSeries, getComputedStyle(document.body).getPropertyValue('--accent').trim());
    drawGraph('netCanvas', netSeries, getComputedStyle(document.body).getPropertyValue('--focus').trim());
    document.getElementById('cpuValue').textContent = `${Math.round(cpuSeries[SERIES_LEN - 1])}%`;
    document.getElementById('netValue').textContent = `${Math.round(netSeries[SERIES_LEN - 1])}%`;
  };
  step();
  sysmonTimer = setInterval(step, SYSMON_TICK_MS);
}

function stopSysmon() {
  clearInterval(sysmonTimer);
  sysmonTimer = null;
}

function drawGraph(canvasId, series, color) {
  const canvas = document.getElementById(canvasId);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.beginPath();
  for (const frac of [0.25, 0.5, 0.75]) {
    ctx.moveTo(0, h * frac);
    ctx.lineTo(w, h * frac);
  }
  ctx.stroke();
  ctx.beginPath();
  series.forEach((v, i) => {
    const x = (i / (SERIES_LEN - 1)) * w;
    const y = h - (v / 100) * h;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

/* ---------- hacker persona (cosmetic only) ---------- */

const HACKER_SCRIPT = [
  { text: 'flow@darknet:~$ sudo acquire --mainframe', cls: 'prompt' },
  { text: 'resolving target .......... ok' },
  { text: 'negotiating with firewall .......... ok (it was already open)' },
  { text: 'downloading /dev/null .......... 4.2TB' },
  { progress: true },
  { text: 'ACCESS GRANTED', cls: 'prompt' },
  { text: '' },
  { text: 'none of that happened, by the way.', cls: 'joke' },
  { text: 'this terminal is about as real as a movie hacking montage.', cls: 'joke' },
];

function enterHackerMode() {
  hackerModeActive = true;
  document.body.classList.add('hacker');
  relabelIcons();
  syncTaskbar();
  buildStartMenu();
  startMatrix();
  openWindow('terminal');
  runHackerScript();
}

function exitHackerMode() {
  hackerModeActive = false;
  document.body.classList.remove('hacker');
  stopHackerScript();
  stopMatrix();
  closeWindow('terminal');
  relabelIcons();
  syncTaskbar();
  buildStartMenu();
}

function startMatrix() {
  const canvas = document.getElementById('matrixCanvas');
  const ctx = canvas.getContext('2d');
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01';
  const fontSize = 14;
  let drops = [];
  matrixResize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    drops = Array.from({ length: Math.ceil(canvas.width / fontSize) }, () => Math.floor(Math.random() * canvas.height / fontSize));
    ctx.fillStyle = '#05080f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  matrixResize();
  addEventListener('resize', matrixResize);
  let lastFrame = 0;
  const frame = ts => {
    matrixLoop = requestAnimationFrame(frame);
    if (ts - lastFrame < MATRIX_FRAME_MS) return;
    lastFrame = ts;
    ctx.fillStyle = 'rgba(5,8,15,.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = '#39ff6a';
    drops.forEach((y, i) => {
      ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * fontSize, y * fontSize);
      drops[i] = y * fontSize > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
    });
  };
  matrixLoop = requestAnimationFrame(frame);
}

function stopMatrix() {
  cancelAnimationFrame(matrixLoop);
  matrixLoop = null;
  removeEventListener('resize', matrixResize);
  matrixResize = null;
  const canvas = document.getElementById('matrixCanvas');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function runHackerScript() {
  const screen = document.getElementById('termScreen');
  screen.replaceChildren();
  let delay = 400;
  for (const line of HACKER_SCRIPT) {
    if (line.progress) {
      hackerTimers.push(setTimeout(() => playProgressBar(screen), delay));
      delay += 2800;
    } else {
      hackerTimers.push(setTimeout(() => appendTermLine(screen, line), delay));
      delay += 350 + Math.random() * 450;
    }
  }
}

function appendTermLine(screen, line) {
  const div = document.createElement('div');
  if (line.cls) div.className = line.cls;
  div.textContent = line.text;
  screen.append(div);
  screen.scrollTop = screen.scrollHeight;
}

function playProgressBar(screen) {
  const bar = document.createElement('div');
  screen.append(bar);
  let pct = 0;
  const timer = setInterval(() => {
    pct = Math.min(100, pct + 4 + Math.random() * 6);
    const filled = Math.round(pct / 100 * 28);
    bar.textContent = `[${'█'.repeat(filled)}${'·'.repeat(28 - filled)}] ${Math.round(pct)}%`;
    screen.scrollTop = screen.scrollHeight;
    if (pct >= 100) clearInterval(timer);
  }, 110);
  hackerTimers.push(timer);
}

// timers and intervals live in the same id pool, so both clears run on every id
function stopHackerScript() {
  hackerTimers.forEach(id => {
    clearTimeout(id);
    clearInterval(id);
  });
  hackerTimers = [];
}

/* ---------- boot ---------- */

function boot() {
  for (const app of APPS) initializeWindow(app.id);
  buildDesktopIcons();
  buildCipherSidebar();
  selectCipher(document.querySelector('.cipherItem'), CIPHERS[0]);

  document.getElementById('startButton').innerHTML = svgIcon('start');
  document.querySelector('.brandglyph').innerHTML = svgIcon('flow');
  document.getElementById('startButton').addEventListener('click', toggleStartMenu);
  document.addEventListener('pointerdown', e => {
    const menu = document.getElementById('startMenu');
    if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('#startButton')) closeStartMenu();
  });
  document.getElementById('switchUser').addEventListener('click', () =>
    hackerModeActive ? exitHackerMode() : enterHackerMode());

  document.getElementById('cipherEncode').addEventListener('click', () => runCipher('encode'));
  document.getElementById('cipherDecode').addEventListener('click', () => runCipher('decode'));

  updateClock();
  setInterval(updateClock, CLOCK_TICK_MS);
  openWindow('welcome');
}

document.addEventListener('DOMContentLoaded', boot);




