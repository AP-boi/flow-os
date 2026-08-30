'use strict';

/**
 * Flow OS — Coder & Crypter Workstation
 * Client-side cryptographic suite, multi-language code runner, desktop WM, and wallpaper engine.
 * Authorship: 50% Human (Architecture & Direction by AP-boi) / 50% AI (Implementation & Tooling by Antigravity AI).
 * Zero-dependency: all routines operate directly in client memory without external network calls.
 */

const TASKBAR_HEIGHT = 46;
const CLOCK_TICK_MS = 1000;
const SYSMON_TICK_MS = 600;
const MATRIX_FRAME_MS = 33;
const SERIES_LEN = 50;
const Z_WINDOW_BASE = 100;

const windows = new Map();
let biggestIndex = Z_WINDOW_BASE;
let activeWindowId = null;
let currentTheme = 'obsidian';
let currentWallpaper = 'mesh';

let matrixLoop = null;
let matrixResize = null;
let starfieldLoop = null;
let starfieldResize = null;
let sysmonTimer = null;

// Desktop application registry
const APPS = [
  { id: 'welcome', title: 'Flow OS Overview', icon: 'flow' },
  { id: 'cipher', title: 'Cipher Lab', icon: 'key' },
  { id: 'coderunner', title: 'Code Runner', icon: 'play' },
  { id: 'calc', title: 'Calculator', icon: 'calc' },
  { id: 'files', title: 'File Explorer', icon: 'folder' },
  { id: 'notepad', title: 'Notepad', icon: 'doc' },
  { id: 'vault', title: 'AES Vault', icon: 'lock' },
  { id: 'stego', title: 'Stego Lab', icon: 'image' },
  { id: 'terminal', title: 'rootshell', icon: 'terminal' },
  { id: 'hexdump', title: 'Hex & Entropy', icon: 'binary' },
  { id: 'devpad', title: 'DevPad', icon: 'code' },
  { id: 'media', title: 'Focus Audio', icon: 'music' },
  { id: 'settings', title: 'Settings', icon: 'settings' },
  { id: 'sysmon', title: 'System Monitor', icon: 'pulse' },
];

const PINNED_APP_IDS = ['cipher', 'coderunner', 'terminal', 'files', 'calc', 'notepad', 'vault', 'stego', 'media', 'settings'];

const HACKER_LABELS = {
  welcome: 'overview.man',
  cipher: 'crypt_suite.bin',
  coderunner: 'exec_sandbox.elf',
  calc: 'bitwise_math.asm',
  files: 'vfs_tree.db',
  notepad: 'scratch_pad.md',
  vault: 'vault_gcm.enc',
  stego: 'stego_lsb.py',
  terminal: 'rootshell.elf',
  hexdump: 'hexdump.sh',
  devpad: 'devpad.log',
  media: 'audio_synth.dsp',
  settings: 'sys_config.json',
  sysmon: 'sysprobe.sh',
};

const ICON_PATHS = {
  flow: '<path d="M3 8c3-5 6-5 9 0s6 5 9 0"/><path d="M3 16c3-5 6-5 9 0s6 5 9 0"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M17 12v4M20 12v3"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  terminal: '<path d="M4 6l6 6-6 6"/><path d="M13 18h7"/>',
  binary: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  pulse: '<path d="M2 12h4l3-8 4 16 3-8h6"/>',
  start: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
  minim: '<path d="M5 17h14"/>',
  maxim: '<rect x="5" y="6" width="14" height="12" rx="1"/>',
  clos: '<path d="M6 6l12 12M18 6L6 18"/>',
};

const svgIcon = name =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] ?? ICON_PATHS.flow}</svg>`;

const escapeHtml = str =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ==========================================================================
   1. Window Manager Engine
   ========================================================================== */

function initializeWindow(id) {
  const el = document.getElementById(`win-${id}`);
  if (!el) return;

  const header = el.querySelector('.windowheader');
  const app = APPS.find(a => a.id === id);

  if (!header.querySelector('.wincontrols')) {
    header.insertAdjacentHTML('beforeend', `
      <span class="wincontrols">
        <button class="winbtn minbutton" aria-label="Minimize">${svgIcon('minim')}</button>
        <button class="winbtn maxbutton" aria-label="Maximize">${svgIcon('maxim')}</button>
        <button class="winbtn closebutton" aria-label="Close">${svgIcon('clos')}</button>
      </span>`);
  }

  windows.set(id, {
    el,
    title: app ? app.title : id,
    icon: app ? app.icon : 'flow',
    minimized: false,
    placed: false,
    prevRect: null,
  });

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
    const targetLeft = originX + e.clientX - startX;
    const targetTop = originY + e.clientY - startY;
    el.style.left = `${clamp(targetLeft, -el.offsetWidth + 80, desk.width - 80)}px`;
    el.style.top = `${clamp(targetTop, 0, desk.height - TASKBAR_HEIGHT - 32)}px`;
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

  biggestIndex += 1;
  win.el.style.zIndex = biggestIndex;
  activeWindowId = id;

  for (const [otherId, other] of windows) {
    other.el.classList.toggle('focused', otherId === id);
  }
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
  if (id === 'hexdump') triggerHexUpdate();
  if (id === 'stego') ensureStegoCarrier();
  if (id === 'terminal') {
    const input = document.getElementById('termInput');
    if (input) setTimeout(() => input.focus(), 50);
  }
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
  if (!win) return;
  const el = win.el;

  if (el.classList.contains('maximized')) {
    Object.assign(el.style, win.prevRect);
    el.classList.remove('maximized');
  } else {
    win.prevRect = {
      left: el.style.left,
      top: el.style.top,
      width: el.style.width,
      height: el.style.height,
    };
    Object.assign(el.style, {
      left: '0px',
      top: '0px',
      width: '100vw',
      height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
    });
    el.classList.add('maximized');
  }
}

function placeWindow(id) {
  const win = windows.get(id);
  const desk = document.getElementById('desktop').getBoundingClientRect();
  const w = win.el.offsetWidth || 520;
  const h = win.el.offsetHeight || 400;

  if (id === 'welcome') {
    win.el.style.left = `${Math.max(20, (desk.width - w) / 2)}px`;
    win.el.style.top = `${Math.max(20, (desk.height - TASKBAR_HEIGHT - h) / 2)}px`;
  } else {
    const placedCount = [...windows.values()].filter(x => x.placed).length;
    const offset = (placedCount % 8) * 26;
    win.el.style.left = `${clamp(60 + offset, 10, desk.width - w - 20)}px`;
    win.el.style.top = `${clamp(30 + offset, 10, desk.height - TASKBAR_HEIGHT - h - 16)}px`;
  }
  win.placed = true;
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/* ==========================================================================
   2. Desktop Shell: Icons, Quick Access Dock, Taskbar, Start Menu, Clock, Themes
   ========================================================================== */

function buildDesktopIcons() {
  const field = document.getElementById('iconField');
  field.replaceChildren();

  for (const app of APPS) {
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.dataset.app = app.id;
    icon.innerHTML = `<span class="glyph">${svgIcon(app.icon)}</span><span class="iconLabel">${getAppTitle(app.id)}</span>`;

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

function buildQuickLaunch() {
  const bar = document.getElementById('quickLaunch');
  if (!bar) return;
  bar.replaceChildren();

  for (const id of PINNED_APP_IDS) {
    const app = APPS.find(a => a.id === id);
    if (!app) continue;

    const btn = document.createElement('button');
    btn.className = 'quick-launch-btn';
    btn.dataset.app = id;
    btn.title = app.title;
    btn.innerHTML = svgIcon(app.icon);

    btn.addEventListener('click', () => {
      const win = windows.get(id);
      if (!win || !win.el.classList.contains('open')) {
        openWindow(id);
      } else if (win.minimized) {
        win.minimized = false;
        win.el.classList.remove('minimized');
        focusWindow(id);
      } else if (activeWindowId === id) {
        minimizeWindow(id);
      } else {
        focusWindow(id);
      }
    });

    bar.append(btn);
  }
}

function syncQuickLaunch() {
  const bar = document.getElementById('quickLaunch');
  if (!bar) return;

  for (const btn of bar.children) {
    const id = btn.dataset.app;
    const win = windows.get(id);
    const isOpen = win && win.el.classList.contains('open') && !win.minimized;
    const isActive = activeWindowId === id && isOpen;

    btn.classList.toggle('open', Boolean(isOpen));
    btn.classList.toggle('active', Boolean(isActive));
  }
}

function getAppTitle(id) {
  const isHacker = currentTheme === 'hacker' || document.body.classList.contains('hacker');
  return isHacker ? (HACKER_LABELS[id] ?? windows.get(id)?.title ?? id) : (windows.get(id)?.title ?? id);
}

function relabelIcons() {
  for (const app of APPS) {
    const label = document.querySelector(`.icon[data-app="${app.id}"] .iconLabel`);
    if (label) label.textContent = getAppTitle(app.id);
  }
}

function syncTaskbar() {
  const container = document.getElementById('taskItems');
  container.replaceChildren();

  for (const [id, win] of windows) {
    if (!win.el.classList.contains('open')) continue;

    const btn = document.createElement('button');
    btn.className = 'taskItem' + (activeWindowId === id && !win.minimized ? ' active' : '');
    btn.innerHTML = `${svgIcon(win.icon)}<span></span>`;
    btn.querySelector('span').textContent = getAppTitle(id);

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
    container.append(btn);
  }

  syncQuickLaunch();
}

function buildStartMenu(searchQuery = '') {
  const list = document.getElementById('startApps');
  list.replaceChildren();

  const query = searchQuery.toLowerCase().trim();
  const filtered = query
    ? APPS.filter(a => a.title.toLowerCase().includes(query) || (HACKER_LABELS[a.id] || '').toLowerCase().includes(query))
    : APPS;

  if (filtered.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.style.padding = '8px';
    emptyDiv.style.color = 'var(--text-muted)';
    emptyDiv.style.fontSize = '11.5px';
    emptyDiv.textContent = 'No matching applications found.';
    list.append(emptyDiv);
  } else {
    for (const app of filtered) {
      const item = document.createElement('button');
      item.className = 'startItem';
      item.innerHTML = `${svgIcon(app.icon)}<span>${getAppTitle(app.id)}</span>`;
      item.addEventListener('click', () => openWindow(app.id));
      list.append(item);
    }
  }

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === currentTheme);
  });
}

function toggleStartMenu() {
  const menu = document.getElementById('startMenu');
  if (menu.hidden) {
    const searchInput = document.getElementById('startSearchInput');
    if (searchInput) searchInput.value = '';
    buildStartMenu();
    menu.hidden = false;
    if (searchInput) setTimeout(() => searchInput.focus(), 50);
  } else {
    menu.hidden = true;
  }
}

function closeStartMenu() {
  document.getElementById('startMenu').hidden = true;
}

function updateClock() {
  const clockEl = document.getElementById('timeElement');
  if (clockEl) {
    clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/* ==========================================================================
   2B. Wallpaper Engine (Mesh, Blueprint, Matrix, Starfield, CRT, Slate)
   ========================================================================== */

function setWallpaper(name, customUrl = '') {
  currentWallpaper = name;
  const desktop = document.getElementById('desktop');

  // Remove existing wallpaper classes
  const classes = [...document.body.classList].filter(c => !c.startsWith('wallpaper-'));
  document.body.className = classes.join(' ');
  document.body.classList.add(`wallpaper-${name}`);

  stopStarfield();
  if (name !== 'matrix') stopMatrix();

  if (name === 'custom' && customUrl) {
    desktop.style.backgroundImage = `url("${customUrl}")`;
    desktop.style.backgroundSize = 'cover';
  } else {
    desktop.style.backgroundImage = '';
    desktop.style.backgroundSize = '';
  }

  if (name === 'starfield') startStarfield();
  if (name === 'matrix') startMatrix();

  document.querySelectorAll('.wallpaper-card').forEach(card => {
    card.classList.toggle('active', card.dataset.wallpaper === name);
  });

  localStorage.setItem('flow_os_wallpaper', name);
  if (customUrl) localStorage.setItem('flow_os_wallpaper_custom', customUrl);
}

function startStarfield() {
  const canvas = document.getElementById('wallpaperCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];

  starfieldResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
      dx: (Math.random() - 0.5) * 0.15,
      dy: (Math.random() - 0.5) * 0.15,
    }));
  };

  starfieldResize();
  window.addEventListener('resize', starfieldResize);

  const loop = () => {
    starfieldLoop = requestAnimationFrame(loop);
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#dbe1f1';
    stars.forEach(s => {
      s.x = (s.x + s.dx + canvas.width) % canvas.width;
      s.y = (s.y + s.dy + canvas.height) % canvas.height;
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };
  starfieldLoop = requestAnimationFrame(loop);
}

function stopStarfield() {
  if (starfieldLoop) {
    cancelAnimationFrame(starfieldLoop);
    starfieldLoop = null;
  }
  if (starfieldResize) {
    window.removeEventListener('resize', starfieldResize);
    starfieldResize = null;
  }
  const canvas = document.getElementById('wallpaperCanvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

function setTheme(themeName) {
  currentTheme = themeName;
  const bodyClasses = [...document.body.classList].filter(c => c.startsWith('wallpaper-'));
  document.body.className = bodyClasses.join(' ');

  if (themeName === 'hacker') {
    document.body.classList.add('hacker');
  } else if (themeName === 'amber') {
    document.body.classList.add('theme-amber');
  } else if (themeName === 'cobalt') {
    document.body.classList.add('theme-cobalt');
  }

  const indicator = document.getElementById('themeIndicator');
  if (indicator) {
    indicator.textContent = themeName.charAt(0).toUpperCase() + themeName.slice(1);
  }

  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === themeName);
  });

  relabelIcons();
  syncTaskbar();
  buildStartMenu();
}

/* ==========================================================================
   2C. Desktop Context Menu
   ========================================================================== */

function initDesktopContextMenu() {
  const menu = document.getElementById('desktopContextMenu');
  const desktop = document.getElementById('desktop');
  if (!menu || !desktop) return;

  desktop.addEventListener('contextmenu', e => {
    if (e.target.closest('.window') || e.target.closest('#taskbar') || e.target.closest('#startMenu')) return;
    e.preventDefault();
    menu.style.left = `${Math.min(e.clientX, window.innerWidth - 180)}px`;
    menu.style.top = `${Math.min(e.clientY, window.innerHeight - 180)}px`;
    menu.hidden = false;
  });

  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('#desktopContextMenu')) menu.hidden = true;
  });

  menu.querySelectorAll('.context-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      menu.hidden = true;
      if (action === 'wallpaper' || action === 'settings') openWindow('settings');
      else if (action === 'terminal') openWindow('terminal');
      else if (action === 'calc') openWindow('calc');
      else if (action === 'newnote') openWindow('notepad');
    });
  });
}

/* ==========================================================================
   3. Cryptographic Engines & Cipher Lab
   ========================================================================== */

function caesarTransform(text, shift) {
  const normalizedShift = ((shift % 26) + 26) % 26;
  return text.replace(/[a-zA-Z]/g, char => {
    const baseCode = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - baseCode + normalizedShift) % 26) + baseCode);
  });
}

function caesarBruteForce(text) {
  const rows = [];
  for (let s = 0; s < 26; s++) {
    rows.push({ shift: s, text: caesarTransform(text, s) });
  }
  return rows;
}

function rot13(text) { return caesarTransform(text, 13); }
function rot47(text) {
  return text.replace(/[\x21-\x7e]/g, char => String.fromCharCode(33 + ((char.charCodeAt(0) - 33 + 47) % 94)));
}

function base64Encode(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  let binaryStr = '';
  for (let i = 0; i < utf8Bytes.length; i++) binaryStr += String.fromCharCode(utf8Bytes[i]);
  return btoa(binaryStr);
}

function base64Decode(text) {
  const binaryStr = atob(text.trim());
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(text) {
  const bytes = new TextEncoder().encode(text);
  let bits = 0, value = 0, output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += '=';
  return output;
}

function base32Decode(text) {
  const clean = text.toUpperCase().replace(/=+$/, '');
  let bits = 0, value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(text) {
  const bytes = new TextEncoder().encode(text);
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros++;
  let str = '1'.repeat(leadingZeros);
  for (let k = digits.length - 1; k >= 0; k--) str += BASE58_ALPHABET[digits[k]];
  return str;
}

function base58Decode(text) {
  const clean = text.trim();
  const bytes = [0];
  for (let i = 0; i < clean.length; i++) {
    const value = BASE58_ALPHABET.indexOf(clean[i]);
    if (value === -1) throw new Error(`Invalid Base58 character: "${clean[i]}"`);
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 255;
      carry = carry >> 8;
    }
    while (carry > 0) {
      bytes.push(carry & 255);
      carry = carry >> 8;
    }
  }
  let leadingOnes = 0;
  while (leadingOnes < clean.length && clean[leadingOnes] === '1') leadingOnes++;
  const result = new Uint8Array(leadingOnes + bytes.length);
  for (let k = 0; k < bytes.length; k++) result[leadingOnes + k] = bytes[bytes.length - 1 - k];
  return new TextDecoder().decode(result);
}

function textToHex(text, delimiter = ' ') {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(delimiter);
}

function hexToText(hexStr) {
  const clean = hexStr.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) throw new Error('Hex string must have an even length.');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  return new TextDecoder().decode(bytes);
}

function textToBinary(text) {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, b => b.toString(2).padStart(8, '0')).join(' ');
}

function binaryToText(binStr) {
  const tokens = binStr.trim().split(/\s+/);
  const bytes = new Uint8Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) bytes[i] = parseInt(tokens[i], 2);
  return new TextDecoder().decode(bytes);
}

function xorTransform(text, key, isHexOutput = false) {
  if (!key) return text;
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const outBytes = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) outBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  if (isHexOutput) return Array.from(outBytes, b => b.toString(16).padStart(2, '0')).join(' ');
  return new TextDecoder('utf-8', { fatal: false }).decode(outBytes);
}

function vigenereCipher(text, key, decrypt = false) {
  if (!key) return text;
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey) return text;
  let keyIndex = 0;
  return text.replace(/[a-zA-Z]/g, char => {
    const isUpper = char <= 'Z';
    const base = isUpper ? 65 : 97;
    const charCode = char.charCodeAt(0) - base;
    const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
    keyIndex++;
    const finalShift = decrypt ? (charCode - shift + 26) % 26 : (charCode + shift) % 26;
    return String.fromCharCode(finalShift + base);
  });
}

function atbash(text) {
  return text.replace(/[a-zA-Z]/g, char => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(25 - (char.charCodeAt(0) - base) + base);
  });
}

const MORSE_TABLE = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
  i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
  q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
  y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};
const MORSE_LOOKUP = Object.fromEntries(Object.entries(MORSE_TABLE).map(([k, v]) => [v, k]));

function morseEncode(text) {
  return [...text.toLowerCase()].map(ch => (ch === ' ' ? '/' : MORSE_TABLE[ch] ?? ch)).join(' ');
}

function morseDecode(text) {
  return text.trim().split(/\s+/).map(tok => (tok === '/' ? ' ' : MORSE_LOOKUP[tok] ?? tok)).join('');
}

function md5(string) {
  function md5cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }
  function cmn(q, a, b, x, s, t) { return add32((a = add32(add32(a, q), add32(x, t))) << s | a >>> (32 - s), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  function add32(a, b) { return (a + b) & 0xFFFFFFFF; }

  const txt = new TextEncoder().encode(string);
  const n = txt.length;
  let state = [1732584193, -271733879, -1732584194, 271733878];
  let i;
  for (i = 64; i <= n; i += 64) {
    const k = [];
    for (let j = 0; j < 16; j++) {
      const idx = i - 64 + j * 4;
      k[j] = txt[idx] | (txt[idx + 1] << 8) | (txt[idx + 2] << 16) | (txt[idx + 3] << 24);
    }
    md5cycle(state, k);
  }
  const tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
  for (let j = 0; j < n - (i - 64); j++) tail[j >> 2] |= txt[i - 64 + j] << ((j % 4) << 3);
  tail[(n - (i - 64)) >> 2] |= 0x80 << (((n - (i - 64)) % 4) << 3);
  if ((n - (i - 64)) > 55) {
    md5cycle(state, tail);
    for (let j = 0; j < 16; j++) tail[j] = 0;
  }
  tail[14] = (n * 8) & 0xFFFFFFFF;
  tail[15] = Math.floor((n * 8) / 0x100000000);
  md5cycle(state, tail);

  const hexTab = '0123456789abcdef';
  let out = '';
  for (let j = 0; j < 4; j++) {
    for (let b = 0; b < 4; b++) out += hexTab.charAt((state[j] >> (b * 8 + 4)) & 0x0F) + hexTab.charAt((state[j] >> (b * 8)) & 0x0F);
  }
  return out;
}

async function subtleDigest(algorithm, text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseJwt(token) {
  const parts = token.trim().split('.');
  if (parts.length < 2) throw new Error('JWT must contain Header and Payload segments.');
  const decodeSegment = seg => {
    let base64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0))));
  };
  const header = decodeSegment(parts[0]);
  const payload = decodeSegment(parts[1]);
  return `HEADER:\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(payload, null, 2)}\n\nSIGNATURE:\n${parts[2] || '(none)'}`;
}

function calculateEntropy(str) {
  if (!str) return 0;
  const bytes = new TextEncoder().encode(str);
  const len = bytes.length;
  const freq = new Map();
  for (let i = 0; i < len; i++) freq.set(bytes[i], (freq.get(bytes[i]) || 0) + 1);
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/* ==========================================================================
   3B. AES-256-GCM / PBKDF2 Vault Engine
   ========================================================================== */

async function deriveAesKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptAesGcm(plaintext, passphrase) {
  if (!passphrase) throw new Error('Passphrase cannot be empty.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt);
  const plainBytes = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBytes);
  const cipherBytes = new Uint8Array(cipherBuffer);

  const packet = new Uint8Array(salt.length + iv.length + cipherBytes.length);
  packet.set(salt, 0);
  packet.set(iv, salt.length);
  packet.set(cipherBytes, salt.length + iv.length);

  let binaryStr = '';
  for (let i = 0; i < packet.length; i++) binaryStr += String.fromCharCode(packet[i]);
  return `FLOWVAULT1:${btoa(binaryStr)}`;
}

async function decryptAesGcm(packetString, passphrase) {
  if (!passphrase) throw new Error('Passphrase cannot be empty.');
  const clean = packetString.trim();
  const rawBase64 = clean.startsWith('FLOWVAULT1:') ? clean.slice(11) : clean;
  let binaryStr;
  try { binaryStr = atob(rawBase64); } catch (e) { throw new Error('Invalid Base64 packet format.'); }
  const packet = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) packet[i] = binaryStr.charCodeAt(i);
  if (packet.length < 28) throw new Error('Armored packet is too short.');

  const salt = packet.slice(0, 16);
  const iv = packet.slice(16, 28);
  const cipherBytes = packet.slice(28);
  const key = await deriveAesKey(passphrase, salt);

  try {
    const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
    return new TextDecoder().decode(plainBuffer);
  } catch (err) {
    throw new Error('Authentication failure: incorrect passphrase or corrupted data.');
  }
}

/* ==========================================================================
   3C. Cipher Suite Registry & UI Coordinator
   ========================================================================== */

const CIPHERS = [
  { id: 'caesar', name: 'Caesar Shift', hasKey: false, hasShift: true, hasAux: true },
  { id: 'rot13', name: 'ROT13', hasKey: false, hasShift: false },
  { id: 'rot47', name: 'ROT47', hasKey: false, hasShift: false },
  { id: 'base64', name: 'Base64 (UTF-8)', hasKey: false, hasShift: false },
  { id: 'base32', name: 'Base32 (RFC 4648)', hasKey: false, hasShift: false },
  { id: 'base58', name: 'Base58 (Bitcoin)', hasKey: false, hasShift: false },
  { id: 'hex', name: 'Hexadecimal (Bytes)', hasKey: false, hasShift: false },
  { id: 'binary', name: 'Binary ASCII (8-bit)', hasKey: false, hasShift: false },
  { id: 'xor', name: 'XOR Stream Cipher', hasKey: true, hasShift: false, keyPlaceholder: 'Secret XOR Key...' },
  { id: 'vigenere', name: 'Vigenère Polyalphabetic', hasKey: true, hasShift: false, keyPlaceholder: 'Alpha Passphrase...' },
  { id: 'atbash', name: 'Atbash Substitution', hasKey: false, hasShift: false },
  { id: 'morse', name: 'Morse Code', hasKey: false, hasShift: false },
  { id: 'md5', name: 'MD5 Hash', isOneWay: true },
  { id: 'sha256', name: 'SHA-256 Digest', isOneWay: true },
  { id: 'sha512', name: 'SHA-512 Digest', isOneWay: true },
  { id: 'jwt', name: 'JWT Token Inspector', isInspector: true }
];

let activeCipher = CIPHERS[0];

function buildCipherSidebar() {
  const list = document.getElementById('cipherList');
  if (!list) return;
  list.replaceChildren();

  CIPHERS.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'cipherItem' + (idx === 0 ? ' selected' : '');
    btn.textContent = c.name;
    btn.addEventListener('click', () => selectCipher(btn, c));
    list.append(btn);
  });
}

function selectCipher(btn, cipher) {
  activeCipher = cipher;
  document.querySelectorAll('.cipherItem').forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');

  document.getElementById('cipherName').textContent = cipher.name;
  renderCipherParams(cipher);

  const encodeBtn = document.getElementById('cipherEncode');
  const decodeBtn = document.getElementById('cipherDecode');
  if (cipher.isOneWay) {
    encodeBtn.textContent = 'Compute Hash';
    decodeBtn.classList.add('hidden');
  } else if (cipher.isInspector) {
    encodeBtn.textContent = 'Inspect Token';
    decodeBtn.classList.add('hidden');
  } else {
    encodeBtn.textContent = 'Encode';
    decodeBtn.textContent = 'Decode';
    decodeBtn.classList.remove('hidden');
  }

  runActiveCipher();
}

function renderCipherParams(cipher) {
  const paramsBar = document.getElementById('cipherParams');
  paramsBar.replaceChildren();

  if (cipher.hasShift) {
    paramsBar.innerHTML = `
      <label for="cipherShiftInput">Shift Offset (1-25):</label>
      <input type="number" id="cipherShiftInput" class="param-input" min="0" max="25" value="3" style="width:60px;">
      <input type="range" id="cipherShiftSlider" min="0" max="25" value="3" style="accent-color:var(--accent);">
    `;
    const num = document.getElementById('cipherShiftInput');
    const range = document.getElementById('cipherShiftSlider');
    num.addEventListener('input', () => { range.value = num.value; runActiveCipher(); });
    range.addEventListener('input', () => { num.value = range.value; runActiveCipher(); });
  } else if (cipher.hasKey) {
    paramsBar.innerHTML = `
      <label for="cipherKeyInput">Cipher Key / Pass:</label>
      <input type="text" id="cipherKeyInput" class="param-input" placeholder="${cipher.keyPlaceholder || 'Secret key...'}" value="SECRETKEY" style="flex:1;">
    `;
    document.getElementById('cipherKeyInput').addEventListener('input', runActiveCipher);
  } else if (cipher.id === 'hex') {
    paramsBar.innerHTML = `
      <label for="hexDelimiter">Delimiter:</label>
      <select id="hexDelimiter" class="param-input">
        <option value=" ">Space (0xAA 0xBB)</option>
        <option value="">None (AABB)</option>
        <option value=":">Colon (AA:BB)</option>
        <option value="-">Hyphen (AA-BB)</option>
      </select>
    `;
    document.getElementById('hexDelimiter').addEventListener('change', runActiveCipher);
  } else {
    paramsBar.innerHTML = `<span style="font-size:11.5px; color:var(--text-muted);">Standard parameters active.</span>`;
  }
}

function updateIoStats() {
  const inVal = document.getElementById('cipherInput')?.value || '';
  const outVal = document.getElementById('cipherOutput')?.value || '';
  const inStats = document.getElementById('inputStats');
  const outStats = document.getElementById('outputStats');
  if (inStats) inStats.textContent = `${inVal.length} chars`;
  if (outStats) outStats.textContent = `${outVal.length} chars`;
}

async function runCipher(mode = 'encode') {
  const input = document.getElementById('cipherInput')?.value || '';
  const outEl = document.getElementById('cipherOutput');
  const auxEl = document.getElementById('cipherAuxView');
  if (!outEl) return;

  try {
    let result = '';
    const id = activeCipher.id;

    if (id === 'caesar') {
      const shift = parseInt(document.getElementById('cipherShiftInput')?.value || '3', 10);
      result = caesarTransform(input, mode === 'encode' ? shift : -shift);

      if (auxEl) {
        auxEl.hidden = false;
        const matrix = caesarBruteForce(input);
        let tableHtml = '<table class="aux-table"><thead><tr><th>Shift</th><th>Candidate Plaintext</th></tr></thead><tbody>';
        matrix.forEach(r => {
          tableHtml += `<tr><td class="aux-shift-val">ROT+${r.shift}</td><td>${escapeHtml(r.text)}</td></tr>`;
        });
        tableHtml += '</tbody></table>';
        auxEl.innerHTML = tableHtml;
      }
    } else {
      if (auxEl) auxEl.hidden = true;
      if (id === 'rot13') result = rot13(input);
      else if (id === 'rot47') result = rot47(input);
      else if (id === 'base64') result = mode === 'encode' ? base64Encode(input) : base64Decode(input);
      else if (id === 'base32') result = mode === 'encode' ? base32Encode(input) : base32Decode(input);
      else if (id === 'base58') result = mode === 'encode' ? base58Encode(input) : base58Decode(input);
      else if (id === 'hex') {
        const delim = document.getElementById('hexDelimiter')?.value || ' ';
        result = mode === 'encode' ? textToHex(input, delim) : hexToText(input);
      } else if (id === 'binary') result = mode === 'encode' ? textToBinary(input) : binaryToText(input);
      else if (id === 'xor') {
        const key = document.getElementById('cipherKeyInput')?.value || '';
        result = xorTransform(input, key);
      } else if (id === 'vigenere') {
        const key = document.getElementById('cipherKeyInput')?.value || '';
        result = vigenereCipher(input, key, mode === 'decode');
      } else if (id === 'atbash') result = atbash(input);
      else if (id === 'morse') result = mode === 'encode' ? morseEncode(input) : morseDecode(input);
      else if (id === 'md5') result = md5(input);
      else if (id === 'sha256') result = await subtleDigest('SHA-256', input);
      else if (id === 'sha512') result = await subtleDigest('SHA-512', input);
      else if (id === 'jwt') result = parseJwt(input);
    }

    outEl.value = result;
  } catch (err) {
    outEl.value = `[Error: ${err.message}]`;
  }
  updateIoStats();
}

function runActiveCipher() {
  const liveToggle = document.getElementById('cipherLiveToggle');
  if (liveToggle && liveToggle.checked) runCipher('encode');
  else updateIoStats();
}

/* ==========================================================================
   3D. AES-256 Vault App Controller
   ========================================================================== */

function initVault() {
  const passInput = document.getElementById('vaultPassphrase');
  const togglePassBtn = document.getElementById('btnToggleVaultPass');
  const plainArea = document.getElementById('vaultPlaintext');
  const cipherArea = document.getElementById('vaultCiphertext');
  const statusEl = document.getElementById('vaultStatusMessage');

  togglePassBtn?.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    togglePassBtn.textContent = isPass ? 'Hide' : 'Show';
  });

  document.getElementById('btnVaultEncrypt')?.addEventListener('click', async () => {
    const pass = passInput.value;
    const plain = plainArea.value;
    if (!pass) { statusEl.textContent = 'Error: Passphrase required.'; return; }
    if (!plain) { statusEl.textContent = 'Error: Plaintext message cannot be empty.'; return; }
    try {
      statusEl.textContent = 'Deriving PBKDF2 key (100,000 rounds)...';
      const packet = await encryptAesGcm(plain, pass);
      cipherArea.value = packet;
      statusEl.textContent = 'Payload encrypted with AES-256-GCM successfully.';
    } catch (e) {
      statusEl.textContent = `Encryption error: ${e.message}`;
    }
  });

  document.getElementById('btnVaultDecrypt')?.addEventListener('click', async () => {
    const pass = passInput.value;
    const packet = cipherArea.value;
    if (!pass) { statusEl.textContent = 'Error: Passphrase required.'; return; }
    if (!packet) { statusEl.textContent = 'Error: Ciphertext packet cannot be empty.'; return; }
    try {
      statusEl.textContent = 'Authenticating and decrypting...';
      const recovered = await decryptAesGcm(packet, pass);
      plainArea.value = recovered;
      statusEl.textContent = 'Decryption & authentication verified.';
    } catch (e) {
      statusEl.textContent = `Decryption failure: ${e.message}`;
    }
  });

  document.getElementById('btnVaultCopyCipher')?.addEventListener('click', () => {
    if (cipherArea && cipherArea.value) {
      navigator.clipboard.writeText(cipherArea.value).then(() => {
        statusEl.textContent = 'Armored packet copied to clipboard.';
      });
    }
  });
}

/* ==========================================================================
   3E. Steganography Lab Controller
   ========================================================================== */

function ensureStegoCarrier() {
  const canvas = document.getElementById('stegoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.floor(20 + Math.random() * 40);
    data[i + 1] = Math.floor(30 + Math.random() * 50);
    data[i + 2] = Math.floor(40 + Math.random() * 70);
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const prompt = document.getElementById('stegoDropPrompt');
  if (prompt) prompt.style.display = 'none';
}

function initStego() {
  document.querySelectorAll('.stego-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stego-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.stego-tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(`stego-tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  document.getElementById('btnGenerateCarrier')?.addEventListener('click', ensureStegoCarrier);

  const dropZone = document.getElementById('stegoDropZone');
  const fileInput = document.getElementById('stegoFileInput');
  dropZone?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('stegoCanvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        document.getElementById('stegoDropPrompt').style.display = 'none';
        const cap = Math.floor((img.width * img.height * 3) / 8) - 4;
        document.getElementById('stegoImageStats').textContent = `Carrier: ${img.width}x${img.height} (Capacity: ~${(cap / 1024).toFixed(1)} KB)`;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnStegoEncode')?.addEventListener('click', () => {
    const canvas = document.getElementById('stegoCanvas');
    const msg = document.getElementById('stegoPayloadInput').value;
    const status = document.getElementById('stegoEncodeStatus');
    const downloadBtn = document.getElementById('btnDownloadStego');
    if (!msg) { status.textContent = 'Error: Message cannot be empty.'; return; }

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const payloadBytes = new TextEncoder().encode(msg);
    const len = payloadBytes.length;
    const maxBytes = Math.floor((canvas.width * canvas.height * 3) / 8) - 4;
    if (len > maxBytes) { status.textContent = `Payload too large for carrier (${len} > ${maxBytes} bytes).`; return; }

    const fullBytes = new Uint8Array(4 + len);
    fullBytes[0] = (len >>> 24) & 255;
    fullBytes[1] = (len >>> 16) & 255;
    fullBytes[2] = (len >>> 8) & 255;
    fullBytes[3] = len & 255;
    fullBytes.set(payloadBytes, 4);

    let byteIdx = 0, bitIdx = 0;
    for (let i = 0; i < data.length && byteIdx < fullBytes.length; i++) {
      if (i % 4 === 3) continue;
      const bit = (fullBytes[byteIdx] >>> (7 - bitIdx)) & 1;
      data[i] = (data[i] & 0xFE) | bit;
      bitIdx++;
      if (bitIdx === 8) { bitIdx = 0; byteIdx++; }
    }

    ctx.putImageData(imgData, 0, 0);
    downloadBtn.href = canvas.toDataURL('image/png');
    downloadBtn.style.display = 'inline-flex';
    status.textContent = `Concealed ${len} bytes in LSB planes.`;
  });

  const decodeDrop = document.getElementById('stegoDecodeDropZone');
  const decodeFileInput = document.getElementById('stegoDecodeFileInput');
  decodeDrop?.addEventListener('click', () => decodeFileInput?.click());
  decodeFileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('stegoDecodeCanvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        document.getElementById('stegoDecodeDropPrompt').style.display = 'none';
        document.getElementById('stegoDecodeStatus').textContent = `Carrier loaded (${img.width}x${img.height}). Ready to extract.`;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnStegoDecode')?.addEventListener('click', () => {
    const canvas = document.getElementById('stegoDecodeCanvas');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const outArea = document.getElementById('stegoExtractedOutput');
    const status = document.getElementById('stegoDecodeStatus');

    let len = 0;
    let byteVal = 0;
    let bitIdx = 0;
    let channelIdx = 0;

    for (; channelIdx < data.length && bitIdx < 32; channelIdx++) {
      if (channelIdx % 4 === 3) continue;
      const bit = data[channelIdx] & 1;
      byteVal = (byteVal << 1) | bit;
      bitIdx++;
      if (bitIdx % 8 === 0) {
        len = (len << 8) | byteVal;
        byteVal = 0;
      }
    }

    if (len <= 0 || len > (data.length / 4)) {
      status.textContent = 'No valid LSB stego header detected in image.';
      return;
    }

    const payload = new Uint8Array(len);
    let pByteIdx = 0;
    byteVal = 0;
    bitIdx = 0;

    for (; channelIdx < data.length && pByteIdx < len; channelIdx++) {
      if (channelIdx % 4 === 3) continue;
      const bit = data[channelIdx] & 1;
      byteVal = (byteVal << 1) | bit;
      bitIdx++;
      if (bitIdx === 8) {
        payload[pByteIdx++] = byteVal;
        byteVal = 0;
        bitIdx = 0;
      }
    }

    try {
      outArea.value = new TextDecoder().decode(payload);
      status.textContent = `Extracted ${len} bytes plaintext successfully.`;
    } catch (e) {
      status.textContent = 'Decoded bytes are not valid UTF-8 text.';
    }
  });

  const fileInspectDrop = document.getElementById('fileInspectDropZone');
  const fileInspectInput = document.getElementById('fileInspectInput');
  fileInspectDrop?.addEventListener('click', () => fileInspectInput?.click());
  fileInspectInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const meta = document.getElementById('fileInspectMeta');
    const out = document.getElementById('fileInspectOutput');
    meta.textContent = `Name: ${file.name} | Size: ${file.size} bytes | Type: ${file.type || 'application/octet-stream'}`;
    const reader = new FileReader();
    reader.onload = ev => { out.value = ev.target.result; };
    reader.readAsDataURL(file);
  });
}

/* ==========================================================================
   4. Multi-Language Code Playground / Runner
   ========================================================================== */

const CODE_TEMPLATES = {
  javascript: `// JavaScript ES2024 Sandbox
console.log("Flow OS Code Runner initialized.");

function findPrimes(max) {
  const primes = [];
  for (let i = 2; i <= max; i++) {
    if (primes.every(p => i % p !== 0)) primes.push(i);
  }
  return primes;
}

const primes = findPrimes(50);
console.log("Primes up to 50:", primes);
return { totalPrimes: primes.length, largest: primes.at(-1) };`,

  python: `# Python-like script evaluator
def fibonacci(n):
    a, b = 0, 1
    seq = []
    for _ in range(n):
        seq.append(a)
        a, b = b, a + b
    return seq

print("Generating Fibonacci numbers:")
result = fibonacci(10)
print("Result:", result)
`,

  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #0c101d; color: #39ff6a; font-family: monospace; padding: 20px; }
    .neon-box { border: 1px solid #39ff6a; padding: 15px; border-radius: 4px; box-shadow: 0 0 15px rgba(57,255,106,0.25); }
  </style>
</head>
<body>
  <div class="neon-box">
    <h2>Flow OS Web Sandbox</h2>
    <p>Live sandboxed HTML/CSS/JS canvas preview.</p>
    <button onclick="alert('Sandbox alert dispatch')">Click Interactive</button>
  </div>
</body>
</html>`,

  sql: `-- In-Memory SQL Engine
CREATE TABLE coders (id INT, name TEXT, specialty TEXT, level INT);
INSERT INTO coders VALUES (1, 'Alice', 'Cryptography', 95);
INSERT INTO coders VALUES (2, 'Bob', 'Reverse Engineering', 88);
INSERT INTO coders VALUES (3, 'Cipher0x', 'Binary Exploits', 99);

SELECT * FROM coders WHERE level > 90;`,

  brainfuck: `++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.`
};

function initCodeRunner() {
  const langSelect = document.getElementById('codeLangSelect');
  const sourceArea = document.getElementById('codeSourceInput');
  const consoleEl = document.getElementById('codeConsoleOutput');
  const iframeEl = document.getElementById('webPreviewFrame');
  const fileNameTab = document.getElementById('editorFileName');
  const charStats = document.getElementById('codeCharCount');
  const timerEl = document.getElementById('execTimer');

  if (!langSelect || !sourceArea) return;

  const updateStats = () => {
    const lines = sourceArea.value.split('\n').length;
    charStats.textContent = `${lines} lines | ${sourceArea.value.length} chars`;
  };
  sourceArea.addEventListener('input', updateStats);

  const switchLanguage = lang => {
    sourceArea.value = CODE_TEMPLATES[lang] || '';
    fileNameTab.textContent = lang === 'javascript' ? 'main.js' : lang === 'python' ? 'script.py' : lang === 'html' ? 'index.html' : lang === 'sql' ? 'query.sql' : 'program.bf';
    updateStats();
    if (lang === 'html') {
      consoleEl.style.display = 'none';
      iframeEl.style.display = 'block';
    } else {
      consoleEl.style.display = 'flex';
      iframeEl.style.display = 'none';
    }
  };

  langSelect.addEventListener('change', () => switchLanguage(langSelect.value));
  document.getElementById('btnLoadTemplate')?.addEventListener('click', () => switchLanguage(langSelect.value));
  document.getElementById('btnClearConsole')?.addEventListener('click', () => { consoleEl.replaceChildren(); });

  switchLanguage('javascript');

  document.getElementById('btnRunCode')?.addEventListener('click', () => {
    const lang = langSelect.value;
    const code = sourceArea.value;
    consoleEl.replaceChildren();
    const t0 = performance.now();

    try {
      if (lang === 'javascript') {
        const logs = [];
        const customConsole = {
          log: (...a) => logs.push({ type: 'log', text: a.map(String).join(' ') }),
          warn: (...a) => logs.push({ type: 'error', text: '[WARN] ' + a.map(String).join(' ') }),
          error: (...a) => logs.push({ type: 'error', text: '[ERR] ' + a.map(String).join(' ') }),
        };
        const runFn = new Function('console', code);
        const ret = runFn(customConsole);

        logs.forEach(l => {
          const div = document.createElement('div');
          div.className = `console-entry ${l.type}`;
          div.textContent = l.text;
          consoleEl.append(div);
        });

        if (ret !== undefined) {
          const retDiv = document.createElement('div');
          retDiv.className = 'console-entry return';
          retDiv.textContent = '◀ ' + (typeof ret === 'object' ? JSON.stringify(ret, null, 2) : String(ret));
          consoleEl.append(retDiv);
        }
      } else if (lang === 'python') {
        runPythonLikeScript(code, consoleEl);
      } else if (lang === 'html') {
        iframeEl.srcdoc = code;
      } else if (lang === 'sql') {
        runInMemorySql(code, consoleEl);
      } else if (lang === 'brainfuck') {
        const out = runBrainfuck(code);
        const div = document.createElement('div');
        div.className = 'console-entry return';
        div.textContent = 'Output: ' + out;
        consoleEl.append(div);
      }
    } catch (e) {
      const errDiv = document.createElement('div');
      errDiv.className = 'console-entry error';
      errDiv.textContent = `Runtime Exception: ${e.message}`;
      consoleEl.append(errDiv);
    }

    const duration = (performance.now() - t0).toFixed(1);
    if (timerEl) timerEl.textContent = `${duration} ms`;
  });
}

function runPythonLikeScript(code, consoleEl) {
  const lines = code.split('\n');
  const variables = {};

  const printOut = msg => {
    const div = document.createElement('div');
    div.className = 'console-entry log';
    div.textContent = msg;
    consoleEl.append(div);
  };

  let jsCode = '';
  lines.forEach(line => {
    let l = line.trim();
    if (l.startsWith('#') || !l) return;
    if (l.startsWith('print(')) {
      jsCode += l.replace('print(', 'pyPrint(') + ';\n';
    } else if (l.startsWith('def ')) {
      jsCode += l.replace('def ', 'function ').replace(':', ' {') + '\n';
    } else if (l.startsWith('return ')) {
      jsCode += l + ';\n';
    } else if (l.includes('range(')) {
      jsCode += l.replace(/for\s+(\w+)\s+in\s+range\((\w+)\):/, 'for(let $1=0; $1<$2; $1++) {') + '\n';
    } else {
      jsCode += l + (l.endsWith(':') ? ' {' : ';') + '\n';
    }
  });

  const openCount = (jsCode.match(/\{/g) || []).length;
  const closeCount = (jsCode.match(/\}/g) || []).length;
  jsCode += '}'.repeat(Math.max(0, openCount - closeCount));

  const runner = new Function('pyPrint', 'vars', jsCode);
  runner(printOut, variables);
}

function runInMemorySql(sql, consoleEl) {
  const tables = {};
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean);

  statements.forEach(stmt => {
    if (stmt.toUpperCase().startsWith('CREATE TABLE')) {
      const match = stmt.match(/CREATE\s+TABLE\s+(\w+)\s*\(([^)]+)\)/i);
      if (match) {
        const tableName = match[1];
        const cols = match[2].split(',').map(c => c.trim().split(/\s+/)[0]);
        tables[tableName] = { cols, rows: [] };
      }
    } else if (stmt.toUpperCase().startsWith('INSERT INTO')) {
      const match = stmt.match(/INSERT\s+INTO\s+(\w+)\s+VALUES\s*\(([^)]+)\)/i);
      if (match) {
        const tableName = match[1];
        if (tables[tableName]) {
          const vals = match[2].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
          tables[tableName].rows.push(vals);
        }
      }
    } else if (stmt.toUpperCase().startsWith('SELECT')) {
      const match = stmt.match(/SELECT\s+(.+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
      if (match && tables[match[2]]) {
        const tbl = tables[match[2]];
        let results = tbl.rows;
        if (match[3]) {
          const whereParts = match[3].split(/\s*(=|>|<)\s*/);
          if (whereParts.length === 3) {
            const colIdx = tbl.cols.indexOf(whereParts[0]);
            const op = whereParts[1];
            const targetVal = whereParts[2].replace(/^['"]|['"]$/g, '');
            if (colIdx !== -1) {
              results = results.filter(r => op === '=' ? r[colIdx] == targetVal : op === '>' ? Number(r[colIdx]) > Number(targetVal) : Number(r[colIdx]) < Number(targetVal));
            }
          }
        }

        let tableText = tbl.cols.map(c => c.padEnd(14)).join('| ') + '\n' + '-'.repeat(tbl.cols.length * 16) + '\n';
        results.forEach(r => {
          tableText += r.map(c => String(c).padEnd(14)).join('| ') + '\n';
        });
        const div = document.createElement('div');
        div.className = 'console-entry info';
        div.textContent = `Query Result (${results.length} rows):\n${tableText}`;
        consoleEl.append(div);
      }
    }
  });
}

function runBrainfuck(code) {
  const memory = new Uint8Array(30000);
  let ptr = 0;
  let pc = 0;
  let output = '';
  const cleanCode = code.replace(/[^><+\-.,[\]]/g, '');

  while (pc < cleanCode.length) {
    const cmd = cleanCode[pc];
    if (cmd === '>') ptr = (ptr + 1) % 30000;
    else if (cmd === '<') ptr = (ptr - 1 + 30000) % 30000;
    else if (cmd === '+') memory[ptr]++;
    else if (cmd === '-') memory[ptr]--;
    else if (cmd === '.') output += String.fromCharCode(memory[ptr]);
    else if (cmd === '[') {
      if (memory[ptr] === 0) {
        let depth = 1;
        while (depth > 0 && ++pc < cleanCode.length) {
          if (cleanCode[pc] === '[') depth++;
          else if (cleanCode[pc] === ']') depth--;
        }
      }
    } else if (cmd === ']') {
      if (memory[ptr] !== 0) {
        let depth = 1;
        while (depth > 0 && --pc >= 0) {
          if (cleanCode[pc] === ']') depth++;
          else if (cleanCode[pc] === '[') depth--;
        }
      }
    }
    pc++;
  }
  return output;
}

/* ==========================================================================
   5. Programmer & Standard Calculator
   ========================================================================== */

let calcValue = '0';
let calcFormula = '';
let calcMode = 'programmer';

function initCalculator() {
  const display = document.getElementById('calcDisplay');
  const formulaEl = document.getElementById('calcFormula');
  const keypad = document.getElementById('calcKeypad');
  if (!keypad) return;

  const updateBases = val => {
    const num = parseInt(val, 10) || 0;
    document.getElementById('baseHex').textContent = (num >>> 0).toString(16).toUpperCase();
    document.getElementById('baseDec').textContent = num.toString(10);
    document.getElementById('baseOct').textContent = (num >>> 0).toString(8);
    const binStr = (num >>> 0).toString(2).padStart(16, '0');
    document.getElementById('baseBin').textContent = binStr.match(/.{1,4}/g)?.join(' ') || binStr;
  };

  const renderKeypad = () => {
    keypad.replaceChildren();
    const keys = calcMode === 'programmer'
      ? ['AND', 'OR', 'XOR', 'NOT', 'LSH', 'RSH', 'MOD', 'C', '7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '+/-', '=', '+']
      : ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '+/-', '='];

    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'calc-btn' + (['=', 'AND', 'OR', 'XOR', 'NOT', 'LSH', 'RSH', 'MOD', '/', '*', '-', '+'].includes(k) ? (k === '=' ? ' eq' : ' op') : '');
      btn.textContent = k;
      btn.addEventListener('click', () => handleCalcKey(k));
      keypad.append(btn);
    });
  };

  const handleCalcKey = k => {
    if (k === 'C') {
      calcValue = '0';
      calcFormula = '';
    } else if (k === '+/-') {
      calcValue = String(-Number(calcValue));
    } else if (k === '=') {
      try {
        let expr = (calcFormula + calcValue)
          .replace(/AND/g, '&')
          .replace(/OR/g, '|')
          .replace(/XOR/g, '^')
          .replace(/NOT/g, '~')
          .replace(/LSH/g, '<<')
          .replace(/RSH/g, '>>')
          .replace(/MOD/g, '%');
        // eslint-disable-next-line no-eval
        calcValue = String(window.eval(expr));
        calcFormula = '';
      } catch (e) {
        calcValue = 'Error';
      }
    } else if (['+', '-', '*', '/', 'AND', 'OR', 'XOR', 'LSH', 'RSH', 'MOD'].includes(k)) {
      calcFormula += ` ${calcValue} ${k} `;
      calcValue = '0';
    } else {
      if (calcValue === '0' || calcValue === 'Error') calcValue = k;
      else calcValue += k;
    }

    display.textContent = calcValue;
    formulaEl.textContent = calcFormula;
    updateBases(calcValue);
  };

  document.querySelectorAll('.calc-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.calc-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calcMode = btn.dataset.mode;
      document.getElementById('programmerBases').style.display = calcMode === 'programmer' ? 'flex' : 'none';
      renderKeypad();
    });
  });

  renderKeypad();
  updateBases(0);
}

/* ==========================================================================
   6. Virtual File Explorer
   ========================================================================== */

let currentDirPath = '/home/user';
const VFS_DEFAULT = {
  '/home/user': [
    { name: 'documents', type: 'dir' },
    { name: 'crypto_keys', type: 'dir' },
    { name: 'scripts', type: 'dir' },
    { name: 'readme.txt', type: 'file', content: 'Welcome to Flow OS File Manager.\nStore your developer notes and crypto payloads here.' }
  ],
  '/home/user/documents': [
    { name: 'manifesto.md', type: 'file', content: '# Flow OS\nBuilt for deep work, cryptanalysis, and code testing.' }
  ],
  '/home/user/crypto_keys': [
    { name: 'rsa_pub.pem', type: 'file', content: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----' }
  ],
  '/home/user/scripts': [
    { name: 'cipher_scan.js', type: 'file', content: 'console.log("Scanning bitwise patterns...");' }
  ],
  '/root': [
    { name: 'system.cfg', type: 'file', content: 'arch=x86_64\nkernel=FlowOS-2026\nwm=flow_compositor' }
  ]
};

function initFileExplorer() {
  const pathBar = document.getElementById('filesCurrentPath');
  const grid = document.getElementById('filesListGrid');
  const statusBar = document.getElementById('filesStatusBar');

  const renderDir = path => {
    currentDirPath = path;
    pathBar.textContent = path;
    grid.replaceChildren();

    const items = VFS_DEFAULT[path] || [];
    statusBar.textContent = `${items.length} items`;

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'file-item-card';
      card.innerHTML = `
        <span class="file-icon-glyph">${item.type === 'dir' ? '📁' : '📄'}</span>
        <span class="file-name-label">${item.name}</span>
      `;

      card.addEventListener('click', () => {
        for (const c of grid.children) c.classList.remove('selected');
        card.classList.add('selected');
      });

      card.addEventListener('dblclick', () => {
        if (item.type === 'dir') {
          renderDir(path === '/' ? `/${item.name}` : `${path}/${item.name}`);
        } else {
          openWindow('notepad');
          const noteArea = document.getElementById('notepadTextarea');
          const noteTitle = document.getElementById('notepadDocTitle');
          if (noteArea) noteArea.value = item.content || '';
          if (noteTitle) noteTitle.textContent = item.name;
        }
      });

      grid.append(card);
    });
  };

  document.querySelectorAll('.files-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.files-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDir(btn.dataset.path);
    });
  });

  document.getElementById('btnFileUp')?.addEventListener('click', () => {
    if (currentDirPath !== '/') {
      const parent = currentDirPath.split('/').slice(0, -1).join('/') || '/';
      renderDir(parent);
    }
  });

  document.getElementById('btnNewFile')?.addEventListener('click', () => {
    const name = prompt('Enter new filename:', 'new_file.txt');
    if (name) {
      if (!VFS_DEFAULT[currentDirPath]) VFS_DEFAULT[currentDirPath] = [];
      VFS_DEFAULT[currentDirPath].push({ name, type: 'file', content: '' });
      renderDir(currentDirPath);
    }
  });

  document.getElementById('btnNewFolder')?.addEventListener('click', () => {
    const name = prompt('Enter new folder name:', 'new_folder');
    if (name) {
      if (!VFS_DEFAULT[currentDirPath]) VFS_DEFAULT[currentDirPath] = [];
      VFS_DEFAULT[currentDirPath].push({ name, type: 'dir' });
      VFS_DEFAULT[`${currentDirPath}/${name}`] = [];
      renderDir(currentDirPath);
    }
  });

  renderDir(currentDirPath);
}

/* ==========================================================================
   7. Notepad / Markdown Editor
   ========================================================================== */

function initNotepad() {
  const textarea = document.getElementById('notepadTextarea');
  const stats = document.getElementById('notepadStats');

  textarea?.addEventListener('input', () => {
    const lines = textarea.value.split('\n').length;
    stats.textContent = `Lines: ${lines} | ${textarea.value.length} characters`;
  });

  document.getElementById('btnNotepadNew')?.addEventListener('click', () => {
    if (textarea) textarea.value = '';
    document.getElementById('notepadDocTitle').textContent = 'untitled.txt';
  });

  document.getElementById('btnNotepadDownload')?.addEventListener('click', () => {
    if (!textarea) return;
    const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.getElementById('notepadDocTitle')?.textContent || 'document.txt';
    a.click();
  });
}

/* ==========================================================================
   8. Web Audio Procedural Focus Soundscapes
   ========================================================================== */

let audioCtx = null;
let soundNodes = [];
let isAudioPlaying = false;

function initSoundscape() {
  const toggleBtn = document.getElementById('btnToggleAudio');
  const volSlider = document.getElementById('audioVolume');

  const startTrack = trackName => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    stopAudio();

    const masterGain = audioCtx.createGain();
    masterGain.gain.value = (volSlider.value / 100) * 0.3;
    masterGain.connect(audioCtx.destination);
    soundNodes.push(masterGain);

    if (trackName === 'rain') {
      const bufferSize = audioCtx.sampleRate * 2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      soundNodes.push(noise);
    } else if (trackName === 'neon' || trackName === 'terminal') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.value = trackName === 'neon' ? 110 : 60;
      osc2.frequency.value = trackName === 'neon' ? 110.8 : 60.5;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);
      osc1.start();
      osc2.start();
      soundNodes.push(osc1, osc2);
    } else {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 220;
      osc.connect(masterGain);
      osc.start();
      soundNodes.push(osc);
    }

    isAudioPlaying = true;
    toggleBtn.textContent = '⏹ Stop Audio';
  };

  const stopAudio = () => {
    soundNodes.forEach(n => {
      try { n.stop?.(); n.disconnect?.(); } catch (e) {}
    });
    soundNodes = [];
    isAudioPlaying = false;
    toggleBtn.textContent = '▶ Play Audio';
  };

  toggleBtn?.addEventListener('click', () => {
    if (isAudioPlaying) stopAudio();
    else startTrack(document.querySelector('.sound-track-btn.active')?.dataset.track || 'rain');
  });

  document.querySelectorAll('.sound-track-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sound-track-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (isAudioPlaying) startTrack(btn.dataset.track);
    });
  });
}

/* ==========================================================================
   9. System Settings Controller & Wallpaper Picker
   ========================================================================== */

function initSettings() {
  document.querySelectorAll('.wallpaper-card').forEach(card => {
    card.addEventListener('click', () => {
      setWallpaper(card.dataset.wallpaper);
    });
  });

  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      setTheme(card.dataset.theme);
    });
  });

  const uploadBtn = document.getElementById('btnUploadWallpaper');
  const fileInput = document.getElementById('wallpaperFileInput');
  uploadBtn?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setWallpaper('custom', ev.target.result);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnResetWallpaper')?.addEventListener('click', () => {
    setWallpaper('mesh');
  });

  document.getElementById('btnResetLocalStorage')?.addEventListener('click', () => {
    if (confirm('Reset virtual disk, scratchpad notes, and restore factory OS settings?')) {
      localStorage.clear();
      window.location.reload();
    }
  });
}

/* ==========================================================================
   10. Interactive Virtual Terminal ("RootShell")
   ========================================================================== */

const CLI_HISTORY = [];
let cliHistoryIndex = -1;

function initTerminal() {
  const termInput = document.getElementById('termInput');
  const termScreen = document.getElementById('termScreen');
  if (!termInput || !termScreen) return;

  printTermLine('Flow OS RootShell [v3.0.0-workstation]', 'term-accent');
  printTermLine('Type "help" to list available cryptographic and shell commands.', 'term-dim');
  printTermLine('');

  termInput.addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
      const rawCmd = termInput.value.trim();
      termInput.value = '';
      if (!rawCmd) return;

      CLI_HISTORY.push(rawCmd);
      cliHistoryIndex = CLI_HISTORY.length;

      printTermLine(`crypter@flow-os:~$ ${rawCmd}`, 'prompt-echo');
      await executeCliCommand(rawCmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cliHistoryIndex > 0) {
        cliHistoryIndex--;
        termInput.value = CLI_HISTORY[cliHistoryIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cliHistoryIndex < CLI_HISTORY.length - 1) {
        cliHistoryIndex++;
        termInput.value = CLI_HISTORY[cliHistoryIndex] || '';
      } else {
        cliHistoryIndex = CLI_HISTORY.length;
        termInput.value = '';
      }
    }
  });

  document.getElementById('win-terminal')?.addEventListener('click', () => {
    termInput.focus();
  });
}

function printTermLine(text, cls = '') {
  const screen = document.getElementById('termScreen');
  if (!screen) return;
  const div = document.createElement('div');
  div.className = `term-line ${cls}`;
  div.textContent = text;
  screen.append(div);
  screen.scrollTop = screen.scrollHeight;
}

async function executeCliCommand(cmdLine) {
  const [cmd, ...args] = cmdLine.split(/\s+/);
  const text = args.join(' ');

  switch (cmd.toLowerCase()) {
    case 'help':
    case '?':
      printTermLine('Available Utilities:', 'term-accent');
      printTermLine('  caesar <shift> <text>  : Caesar shift encode/decode');
      printTermLine('  rot13 <text>           : Symmetrical ROT13 substitution');
      printTermLine('  base64 [-d] <text>     : Base64 encode or decode (-d)');
      printTermLine('  hex [-d] <text>        : Hexadecimal representation');
      printTermLine('  xor <key> <text>       : XOR transform text with key');
      printTermLine('  hash <algo> <text>     : Hashes: md5, sha1, sha256, sha512');
      printTermLine('  vault <enc|dec> <p> <t>: AES-256-GCM encryption helper');
      printTermLine('  jwt <token>            : Decode JWT header & payload');
      printTermLine('  entropy <text>         : Calculate Shannon Entropy score');
      printTermLine('  eval <js-code>         : Evaluate client-side JS expression');
      printTermLine('  wallpaper <name>       : mesh | blueprint | matrix | starfield | crt | slate');
      printTermLine('  theme <name>           : obsidian | hacker | amber | cobalt');
      printTermLine('  neofetch               : System banner & specs');
      printTermLine('  clear / cls            : Clear terminal buffer');
      break;

    case 'caesar':
      if (args.length < 2) printTermLine('Usage: caesar <shift> <text>', 'term-error');
      else printTermLine(caesarTransform(args.slice(1).join(' '), parseInt(args[0], 10)), 'term-success');
      break;

    case 'rot13':
      if (!text) printTermLine('Usage: rot13 <text>', 'term-error');
      else printTermLine(rot13(text), 'term-success');
      break;

    case 'base64':
      if (!args.length) printTermLine('Usage: base64 [-d] <text>', 'term-error');
      else if (args[0] === '-d') {
        try { printTermLine(base64Decode(args.slice(1).join(' ')), 'term-success'); }
        catch (e) { printTermLine(`Error: ${e.message}`, 'term-error'); }
      } else printTermLine(base64Encode(text), 'term-success');
      break;

    case 'hex':
      if (!args.length) printTermLine('Usage: hex [-d] <text>', 'term-error');
      else if (args[0] === '-d') {
        try { printTermLine(hexToText(args.slice(1).join(' ')), 'term-success'); }
        catch (e) { printTermLine(`Error: ${e.message}`, 'term-error'); }
      } else printTermLine(textToHex(text), 'term-success');
      break;

    case 'xor':
      if (args.length < 2) printTermLine('Usage: xor <key> <text>', 'term-error');
      else printTermLine(xorTransform(args.slice(1).join(' '), args[0]), 'term-success');
      break;

    case 'vault':
      if (args.length < 3) printTermLine('Usage: vault <enc|dec> <passphrase> <text/packet>', 'term-error');
      else {
        try {
          if (args[0] === 'enc') printTermLine(await encryptAesGcm(args.slice(2).join(' '), args[1]), 'term-success');
          else printTermLine(await decryptAesGcm(args.slice(2).join(' '), args[1]), 'term-success');
        } catch (e) { printTermLine(`Vault Error: ${e.message}`, 'term-error'); }
      }
      break;

    case 'hash':
      if (args.length < 2) printTermLine('Usage: hash <md5|sha1|sha256|sha512> <text>', 'term-error');
      else {
        const algo = args[0].toLowerCase();
        const payload = args.slice(1).join(' ');
        if (algo === 'md5') printTermLine(md5(payload), 'term-success');
        else if (algo === 'sha1') printTermLine(await subtleDigest('SHA-1', payload), 'term-success');
        else if (algo === 'sha256') printTermLine(await subtleDigest('SHA-256', payload), 'term-success');
        else if (algo === 'sha512') printTermLine(await subtleDigest('SHA-512', payload), 'term-success');
        else printTermLine(`Unknown algorithm "${algo}".`, 'term-error');
      }
      break;

    case 'jwt':
      if (!text) printTermLine('Usage: jwt <token>', 'term-error');
      else {
        try { printTermLine(parseJwt(text), 'term-success'); }
        catch (e) { printTermLine(`JWT Error: ${e.message}`, 'term-error'); }
      }
      break;

    case 'entropy':
      if (!text) printTermLine('Usage: entropy <text>', 'term-error');
      else {
        const score = calculateEntropy(text);
        printTermLine(`Shannon Entropy: ${score.toFixed(4)} / 8.0000 bits/byte`, 'term-success');
      }
      break;

    case 'eval':
      if (!text) printTermLine('Usage: eval <js-code>', 'term-error');
      else {
        try {
          // eslint-disable-next-line no-eval
          printTermLine(String(window.eval(text)), 'term-success');
        } catch (e) { printTermLine(`Error: ${e.message}`, 'term-error'); }
      }
      break;

    case 'wallpaper':
      if (['mesh', 'blueprint', 'matrix', 'starfield', 'crt', 'slate'].includes(args[0]?.toLowerCase())) {
        setWallpaper(args[0].toLowerCase());
        printTermLine(`Wallpaper switched to "${args[0]}".`, 'term-success');
      } else printTermLine('Usage: wallpaper <mesh|blueprint|matrix|starfield|crt|slate>', 'term-error');
      break;

    case 'theme':
      if (['obsidian', 'hacker', 'amber', 'cobalt'].includes(args[0]?.toLowerCase())) {
        setTheme(args[0].toLowerCase());
        printTermLine(`Theme updated to "${args[0]}".`, 'term-success');
      } else printTermLine('Usage: theme <obsidian|hacker|amber|cobalt>', 'term-error');
      break;

    case 'neofetch':
      printTermLine('        /\\        OS: Flow OS Coder Edition x86_64', 'term-accent');
      printTermLine('       /  \\       Host: Browser WebWorker Sandbox', 'term-accent');
      printTermLine('      / /\\ \\      Kernel: JavaScript ES2024 / WebCrypto', 'term-accent');
      printTermLine('     / /__\\ \\     Shell: RootShell 3.0.0', 'term-accent');
      break;

    case 'clear':
    case 'cls':
      document.getElementById('termScreen').replaceChildren();
      break;

    default:
      printTermLine(`Command not found: "${cmd}". Type "help" for a list.`, 'term-error');
      break;
  }
}

/* ==========================================================================
   11. HexDump & Shannon Entropy Inspector
   ========================================================================== */

function triggerHexUpdate() {
  const inputEl = document.getElementById('hexSourceInput');
  const dumpEl = document.getElementById('hexDumpOutput');
  const byteCountEl = document.getElementById('hexByteCount');
  const entropyScoreEl = document.getElementById('hexEntropyScore');
  const barFillEl = document.getElementById('entropyBarFill');
  const classificationEl = document.getElementById('entropyClassification');

  if (!inputEl || !dumpEl) return;
  const rawText = inputEl.value;
  const bytes = new TextEncoder().encode(rawText);
  const len = bytes.length;

  if (byteCountEl) byteCountEl.textContent = `${len} B`;

  if (len === 0) {
    dumpEl.textContent = '00000000:  (empty buffer)';
    if (entropyScoreEl) entropyScoreEl.textContent = '0.000 / 8.000';
    if (barFillEl) barFillEl.style.width = '0%';
    if (classificationEl) {
      classificationEl.textContent = 'Empty';
      classificationEl.style.color = 'var(--text-muted)';
    }
    return;
  }

  const entropy = calculateEntropy(rawText);
  if (entropyScoreEl) entropyScoreEl.textContent = `${entropy.toFixed(3)} / 8.000`;
  const pct = Math.min(100, Math.round((entropy / 8.0) * 100));
  if (barFillEl) barFillEl.style.width = `${pct}%`;

  if (classificationEl) {
    if (entropy < 3.8) {
      classificationEl.textContent = 'Repetitive / Sparse';
      classificationEl.style.color = 'var(--text-dim)';
    } else if (entropy < 5.2) {
      classificationEl.textContent = 'Plaintext / Code';
      classificationEl.style.color = 'var(--accent)';
    } else if (entropy < 6.8) {
      classificationEl.textContent = 'Dense / Structured';
      classificationEl.style.color = 'var(--focus)';
    } else {
      classificationEl.textContent = 'Encrypted / Compressed';
      classificationEl.style.color = 'var(--danger)';
    }
  }

  const lines = [];
  for (let i = 0; i < len; i += 16) {
    const offset = i.toString(16).padStart(8, '0');
    const chunk = bytes.slice(i, i + 16);
    let hexPart = '';
    let asciiPart = '';

    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        hexPart += chunk[j].toString(16).padStart(2, '0') + ' ';
        const ch = chunk[j];
        asciiPart += ch >= 32 && ch <= 126 ? String.fromCharCode(ch) : '.';
      } else {
        hexPart += '   ';
      }
      if (j === 7) hexPart += ' ';
    }
    lines.push(`${offset}:  ${hexPart} |${asciiPart}|`);
  }
  dumpEl.textContent = lines.join('\n');
}

/* ==========================================================================
   12. DevPad: JSON & Regex Tools
   ========================================================================== */

function initDevPad() {
  document.querySelectorAll('.devpad-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.devpad-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.devpad-tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPane = document.getElementById(`devpad-tab-${btn.dataset.tab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  document.getElementById('btnJsonPrettify')?.addEventListener('click', () => {
    const input = document.getElementById('jsonInput');
    const status = document.getElementById('jsonStatus');
    try {
      input.value = JSON.stringify(JSON.parse(input.value), null, 2);
      if (status) status.textContent = 'Valid JSON (Formatted)';
    } catch (e) { if (status) status.textContent = `Error: ${e.message}`; }
  });

  document.getElementById('btnJsonMinify')?.addEventListener('click', () => {
    const input = document.getElementById('jsonInput');
    const status = document.getElementById('jsonStatus');
    try {
      input.value = JSON.stringify(JSON.parse(input.value));
      if (status) status.textContent = 'Minified';
    } catch (e) { if (status) status.textContent = `Error: ${e.message}`; }
  });

  const regexPattern = document.getElementById('regexPattern');
  const regexFlags = document.getElementById('regexFlags');
  const regexTestText = document.getElementById('regexTestText');

  const runRegex = () => {
    const pattern = regexPattern?.value || '';
    const flags = regexFlags?.value || '';
    const testText = regexTestText?.value || '';
    const resPanel = document.getElementById('regexMatchResults');
    const matchCountEl = document.getElementById('regexMatchCount');

    if (!pattern || !testText) {
      if (resPanel) resPanel.textContent = 'No pattern or test text.';
      if (matchCountEl) matchCountEl.textContent = '0 matches';
      return;
    }

    try {
      const re = new RegExp(pattern, flags);
      const matches = [...testText.matchAll(re)];
      if (matchCountEl) matchCountEl.textContent = `${matches.length} matches`;
      if (matches.length === 0) {
        if (resPanel) resPanel.textContent = 'Zero matches found.';
        return;
      }

      let html = '';
      matches.forEach((m, idx) => {
        const groups = m.slice(1).map((g, gi) => `Group ${gi + 1}: "${escapeHtml(g || '')}"`).join(', ');
        html += `<div class="regex-match-pill"><strong>Match ${idx + 1}</strong>: "${escapeHtml(m[0])}" (idx: ${m.index})${groups ? `<div style="font-size:10.5px; color:var(--text-muted);">${groups}</div>` : ''}</div>`;
      });
      if (resPanel) resPanel.innerHTML = html;
    } catch (e) {
      if (resPanel) resPanel.textContent = `RegExp Error: ${e.message}`;
    }
  };

  regexPattern?.addEventListener('input', runRegex);
  regexFlags?.addEventListener('input', runRegex);
  regexTestText?.addEventListener('input', runRegex);

  const notesArea = document.getElementById('notesContent');
  if (notesArea) {
    notesArea.value = localStorage.getItem('flow_os_scratch_notes') || '';
    notesArea.addEventListener('input', () => {
      localStorage.setItem('flow_os_scratch_notes', notesArea.value);
    });
  }
}

/* ==========================================================================
   13. System Monitor Telemetry
   ========================================================================== */

let cpuSeries = [];
let netSeries = [];

function startSysmon() {
  if (sysmonTimer) return;
  cpuSeries = Array.from({ length: SERIES_LEN }, () => 25 + Math.random() * 20);
  netSeries = Array.from({ length: SERIES_LEN }, () => 15 + Math.random() * 30);

  const step = () => {
    const lastCpu = cpuSeries[cpuSeries.length - 1];
    const nextCpu = clamp(lastCpu + (Math.random() - 0.48) * 12, 8, 92);
    cpuSeries = [...cpuSeries.slice(1), nextCpu];

    const lastNet = netSeries[netSeries.length - 1];
    const nextNet = clamp(lastNet + (Math.random() - 0.5) * 18, 4, 88);
    netSeries = [...netSeries.slice(1), nextNet];

    const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    const focusColor = getComputedStyle(document.body).getPropertyValue('--focus').trim();

    drawGraph('cpuCanvas', cpuSeries, accentColor);
    drawGraph('netCanvas', netSeries, focusColor);

    const cpuVal = document.getElementById('cpuValue');
    const netVal = document.getElementById('netValue');
    if (cpuVal) cpuVal.textContent = `${Math.round(nextCpu)}%`;
    if (netVal) netVal.textContent = `${Math.round(nextNet)}%`;
  };

  step();
  sysmonTimer = setInterval(step, SYSMON_TICK_MS);
}

function stopSysmon() {
  if (sysmonTimer) {
    clearInterval(sysmonTimer);
    sysmonTimer = null;
  }
}

function drawGraph(canvasId, series, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,.05)';
  ctx.lineWidth = 1;
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
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

/* ==========================================================================
   14. Matrix Rain Wallpaper Layer
   ========================================================================== */

function startMatrix() {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF';
  const fontSize = 14;
  let drops = [];

  matrixResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drops = Array.from({ length: Math.ceil(canvas.width / fontSize) }, () => Math.floor((Math.random() * canvas.height) / fontSize));
    ctx.fillStyle = '#05080f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  matrixResize();
  window.addEventListener('resize', matrixResize);

  let lastFrame = 0;
  const frame = ts => {
    matrixLoop = requestAnimationFrame(frame);
    if (ts - lastFrame < MATRIX_FRAME_MS) return;
    lastFrame = ts;

    ctx.fillStyle = 'rgba(5,8,15,.14)';
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
  if (matrixLoop) {
    cancelAnimationFrame(matrixLoop);
    matrixLoop = null;
  }
  if (matrixResize) {
    window.removeEventListener('resize', matrixResize);
    matrixResize = null;
  }
  const canvas = document.getElementById('matrixCanvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/* ==========================================================================
   15. Desktop Keyboard Shortcuts Engine
   ========================================================================== */

let isAltTabActive = false;
let altTabSelectedIndex = 0;
let openWindowsCache = [];

function initKeyboardShortcuts() {
  window.addEventListener('keydown', e => {
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
      handleAltTabPress(e.shiftKey ? -1 : 1);
      return;
    }
    if (e.key === 'Meta' || (e.ctrlKey && e.code === 'Space')) {
      e.preventDefault();
      toggleStartMenu();
      return;
    }
    if ((e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') || (e.ctrlKey && e.key === '`')) {
      e.preventDefault();
      openWindow('terminal');
      return;
    }
    if (e.key === 'Escape') {
      const switcher = document.getElementById('appSwitcher');
      if (!switcher.hidden) {
        switcher.hidden = true;
        isAltTabActive = false;
        return;
      }
      closeStartMenu();
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'Alt' && isAltTabActive) commitAltTabSelection();
  });
}

function handleAltTabPress(direction) {
  const switcher = document.getElementById('appSwitcher');

  if (!isAltTabActive) {
    isAltTabActive = true;
    openWindowsCache = [...windows.entries()]
      .filter(([_, win]) => win.el.classList.contains('open'))
      .map(([id, win]) => ({ id, win }));

    if (openWindowsCache.length === 0) {
      openWindowsCache = APPS.slice(0, 5).map(app => ({ id: app.id, win: windows.get(app.id) }));
    }
    altTabSelectedIndex = 0;
    renderAltTabList();
    switcher.hidden = false;
  }

  altTabSelectedIndex = (altTabSelectedIndex + direction + openWindowsCache.length) % openWindowsCache.length;
  updateAltTabHighlight();
}

function renderAltTabList() {
  const list = document.getElementById('appSwitcherList');
  list.replaceChildren();

  openWindowsCache.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'switcher-item' + (idx === altTabSelectedIndex ? ' active' : '');
    div.innerHTML = `${svgIcon(entry.win?.icon || 'flow')}<span>${getAppTitle(entry.id)}</span>`;
    list.append(div);
  });
}

function updateAltTabHighlight() {
  const list = document.getElementById('appSwitcherList');
  Array.from(list.children).forEach((child, idx) => {
    child.classList.toggle('active', idx === altTabSelectedIndex);
  });
}

function commitAltTabSelection() {
  const switcher = document.getElementById('appSwitcher');
  switcher.hidden = true;
  isAltTabActive = false;
  if (openWindowsCache[altTabSelectedIndex]) {
    const selectedId = openWindowsCache[altTabSelectedIndex].id;
    openWindow(selectedId);
    focusWindow(selectedId);
  }
}

/* ==========================================================================
   16. System Boot Sequence
   ========================================================================== */

function boot() {
  for (const app of APPS) initializeWindow(app.id);

  buildDesktopIcons();
  buildQuickLaunch();
  buildCipherSidebar();
  selectCipher(document.querySelector('.cipherItem'), CIPHERS[0]);
  initCodeRunner();
  initCalculator();
  initFileExplorer();
  initNotepad();
  initSoundscape();
  initSettings();
  initVault();
  initStego();
  initTerminal();
  initDevPad();
  initKeyboardShortcuts();
  initDesktopContextMenu();

  // Restore saved wallpaper & theme
  const savedWallpaper = localStorage.getItem('flow_os_wallpaper') || 'mesh';
  const savedCustomUrl = localStorage.getItem('flow_os_wallpaper_custom') || '';
  setWallpaper(savedWallpaper, savedCustomUrl);

  document.getElementById('startButton')?.addEventListener('click', toggleStartMenu);
  const startBtn = document.getElementById('startButton');
  if (startBtn) startBtn.innerHTML = svgIcon('start');

  const searchInput = document.getElementById('startSearchInput');
  searchInput?.addEventListener('input', e => buildStartMenu(e.target.value));

  const brandGlyph = document.querySelector('.brandglyph');
  if (brandGlyph) brandGlyph.innerHTML = svgIcon('flow');

  document.addEventListener('pointerdown', e => {
    const menu = document.getElementById('startMenu');
    if (menu && !menu.hidden && !menu.contains(e.target) && !e.target.closest('#startButton')) {
      closeStartMenu();
    }
  });

  document.getElementById('switchUser')?.addEventListener('click', () => {
    setTheme(currentTheme === 'hacker' ? 'obsidian' : 'hacker');
  });

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });

  document.getElementById('cipherEncode')?.addEventListener('click', () => runCipher('encode'));
  document.getElementById('cipherDecode')?.addEventListener('click', () => runCipher('decode'));
  document.getElementById('cipherInput')?.addEventListener('input', runActiveCipher);

  document.getElementById('cipherClear')?.addEventListener('click', () => {
    document.getElementById('cipherInput').value = '';
    document.getElementById('cipherOutput').value = '';
    updateIoStats();
  });

  document.getElementById('cipherSwap')?.addEventListener('click', () => {
    const inEl = document.getElementById('cipherInput');
    const outEl = document.getElementById('cipherOutput');
    const temp = inEl.value;
    inEl.value = outEl.value;
    outEl.value = temp;
    runActiveCipher();
  });

  document.getElementById('cipherCopy')?.addEventListener('click', () => {
    const outEl = document.getElementById('cipherOutput');
    const copyBtn = document.getElementById('cipherCopy');
    if (outEl && outEl.value) {
      navigator.clipboard.writeText(outEl.value).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1000);
      });
    }
  });

  document.getElementById('hexSourceInput')?.addEventListener('input', triggerHexUpdate);

  document.getElementById('link-open-ciphers')?.addEventListener('click', e => { e.preventDefault(); openWindow('cipher'); });
  document.getElementById('link-open-coderunner')?.addEventListener('click', e => { e.preventDefault(); openWindow('coderunner'); });
  document.getElementById('link-open-files')?.addEventListener('click', e => { e.preventDefault(); openWindow('files'); });
  document.getElementById('link-open-calc')?.addEventListener('click', e => { e.preventDefault(); openWindow('calc'); });
  document.getElementById('link-open-vault')?.addEventListener('click', e => { e.preventDefault(); openWindow('vault'); });
  document.getElementById('link-open-term')?.addEventListener('click', e => { e.preventDefault(); openWindow('terminal'); });

  updateClock();
  setInterval(updateClock, CLOCK_TICK_MS);

  openWindow('welcome');
}

document.addEventListener('DOMContentLoaded', boot);
