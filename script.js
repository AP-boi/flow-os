'use strict';

/**
 * Flow OS — Coder & Crypter Workstation
 * Client-side cryptographic suite, interactive virtual shell, and desktop WM.
 * Dependency-free: all routines operate directly in client memory.
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
let matrixLoop = null;
let matrixResize = null;
let sysmonTimer = null;

// Desktop application registry
const APPS = [
  { id: 'welcome', title: 'Welcome', icon: 'flow' },
  { id: 'cipher', title: 'Cipher Lab', icon: 'key' },
  { id: 'vault', title: 'AES Vault', icon: 'lock' },
  { id: 'stego', title: 'Stego Lab', icon: 'image' },
  { id: 'terminal', title: 'rootshell', icon: 'terminal' },
  { id: 'hexdump', title: 'Hex & Entropy', icon: 'binary' },
  { id: 'devpad', title: 'DevPad', icon: 'code' },
  { id: 'sysmon', title: 'System Monitor', icon: 'pulse' },
];

const HACKER_LABELS = {
  welcome: 'readme.txt',
  cipher: 'crypt_suite.bin',
  vault: 'vault_gcm.enc',
  stego: 'stego_lsb.py',
  terminal: 'rootshell.elf',
  hexdump: 'hexdump.sh',
  devpad: 'scratchpad.log',
  sysmon: 'sysprobe.sh',
};

const ICON_PATHS = {
  flow: '<path d="M3 8c3-5 6-5 9 0s6 5 9 0"/><path d="M3 16c3-5 6-5 9 0s6 5 9 0"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M17 12v4M20 12v3"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  terminal: '<path d="M4 6l6 6-6 6"/><path d="M13 18h7"/>',
  binary: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  pulse: '<path d="M2 12h4l3-8 4 16 3-8h6"/>',
  start: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
  minim: '<path d="M5 17h14"/>',
  maxim: '<rect x="5" y="6" width="14" height="12" rx="1"/>',
  clos: '<path d="M6 6l12 12M18 6L6 18"/>',
};

const svgIcon = name =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] ?? ICON_PATHS.flow}</svg>`;

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
    win.el.style.left = `${clamp(70 + offset, 10, desk.width - w - 20)}px`;
    win.el.style.top = `${clamp(36 + offset, 10, desk.height - TASKBAR_HEIGHT - h - 16)}px`;
  }
  win.placed = true;
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/* ==========================================================================
   2. Desktop Shell: Icons, Taskbar, Start Menu, Clock, Themes
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
}

function buildStartMenu() {
  const list = document.getElementById('startApps');
  list.replaceChildren();

  for (const app of APPS) {
    const item = document.createElement('button');
    item.className = 'startItem';
    item.innerHTML = `${svgIcon(app.icon)}<span>${getAppTitle(app.id)}</span>`;
    item.addEventListener('click', () => openWindow(app.id));
    list.append(item);
  }

  // Update theme buttons active state
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === currentTheme);
  });
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
  const clockEl = document.getElementById('timeElement');
  if (clockEl) {
    clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

function setTheme(themeName) {
  currentTheme = themeName;
  document.body.className = '';

  if (themeName === 'hacker') {
    document.body.classList.add('hacker');
    startMatrix();
  } else if (themeName === 'amber') {
    document.body.classList.add('theme-amber');
    stopMatrix();
  } else if (themeName === 'cobalt') {
    document.body.classList.add('theme-cobalt');
    stopMatrix();
  } else {
    // obsidian default
    stopMatrix();
  }

  const indicator = document.getElementById('themeIndicator');
  if (indicator) {
    indicator.textContent = themeName.charAt(0).toUpperCase() + themeName.slice(1);
  }

  relabelIcons();
  syncTaskbar();
  buildStartMenu();
}

/* ==========================================================================
   3. Cryptographic Routines & Engines (Vanilla JS, Zero Dependencies)
   ========================================================================== */

// Caesar Shift
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
    const shifted = caesarTransform(text, s);
    rows.push({ shift: s, text: shifted });
  }
  return rows;
}

// ROT13 & ROT47
function rot13(text) {
  return caesarTransform(text, 13);
}

function rot47(text) {
  return text.replace(/[\x21-\x7e]/g, char => {
    return String.fromCharCode(33 + ((char.charCodeAt(0) - 33 + 47) % 94));
  });
}

// Base64 (UTF-8 Safe)
function base64Encode(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  let binaryStr = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binaryStr += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binaryStr);
}

function base64Decode(text) {
  const clean = text.trim();
  const binaryStr = atob(clean);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Base32 (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Encode(text) {
  const bytes = new TextEncoder().encode(text);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  while (output.length % 8 !== 0) output += '=';
  return output;
}

function base32Decode(text) {
  const clean = text.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
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

// Base58 (Bitcoin Alphabet)
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
  for (let k = digits.length - 1; k >= 0; k--) {
    str += BASE58_ALPHABET[digits[k]];
  }
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
  for (let k = 0; k < bytes.length; k++) {
    result[leadingOnes + k] = bytes[bytes.length - 1 - k];
  }
  return new TextDecoder().decode(result);
}

// Hex Conversions
function textToHex(text, delimiter = ' ') {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(delimiter);
}

function hexToText(hexStr) {
  const clean = hexStr.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) throw new Error('Hex string must have an even length.');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

// Binary <-> ASCII
function textToBinary(text) {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, b => b.toString(2).padStart(8, '0')).join(' ');
}

function binaryToText(binStr) {
  const tokens = binStr.trim().split(/\s+/);
  const bytes = new Uint8Array(tokens.length);
  for (let i = 0; i < tokens.length; i++) {
    bytes[i] = parseInt(tokens[i], 2);
  }
  return new TextDecoder().decode(bytes);
}

// XOR Transform
function xorTransform(text, key, isHexOutput = false) {
  if (!key) return text;
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const outBytes = new Uint8Array(textBytes.length);

  for (let i = 0; i < textBytes.length; i++) {
    outBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  if (isHexOutput) {
    return Array.from(outBytes, b => b.toString(16).padStart(2, '0')).join(' ');
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(outBytes);
}

// Vigenère Cipher
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

// Atbash
function atbash(text) {
  return text.replace(/[a-zA-Z]/g, char => {
    const isUpper = char <= 'Z';
    const base = isUpper ? 65 : 97;
    return String.fromCharCode(25 - (char.charCodeAt(0) - base) + base);
  });
}

// Morse Code
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

// Pure JS MD5 (RFC 1321)
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
  for (let j = 0; j < n - (i - 64); j++) {
    tail[j >> 2] |= txt[i - 64 + j] << ((j % 4) << 3);
  }
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
    for (let b = 0; b < 4; b++) {
      out += hexTab.charAt((state[j] >> (b * 8 + 4)) & 0x0F) + hexTab.charAt((state[j] >> (b * 8)) & 0x0F);
    }
  }
  return out;
}

// WebCrypto SHA Digests
async function subtleDigest(algorithm, text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// JWT Inspector
function parseJwt(token) {
  const parts = token.trim().split('.');
  if (parts.length < 2) throw new Error('JWT must contain at least Header and Payload separated by dot.');

  const decodeSegment = seg => {
    let base64 = seg.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0))));
  };

  const header = decodeSegment(parts[0]);
  const payload = decodeSegment(parts[1]);

  const formatTimestamp = ts => {
    if (!ts || typeof ts !== 'number') return ts;
    const d = new Date(ts * 1000);
    return `${ts} (${d.toISOString().replace('T', ' ').replace('.000Z', ' UTC')})`;
  };

  const enhancedPayload = { ...payload };
  if (enhancedPayload.exp) enhancedPayload.exp = formatTimestamp(enhancedPayload.exp);
  if (enhancedPayload.iat) enhancedPayload.iat = formatTimestamp(enhancedPayload.iat);
  if (enhancedPayload.nbf) enhancedPayload.nbf = formatTimestamp(enhancedPayload.nbf);

  return `HEADER:\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(enhancedPayload, null, 2)}\n\nSIGNATURE:\n${parts[2] ? parts[2] : '(no signature)'}`;
}

// Shannon Entropy Calculation
function calculateEntropy(str) {
  if (!str) return 0;
  const bytes = new TextEncoder().encode(str);
  const len = bytes.length;
  const freq = new Map();

  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    freq.set(b, (freq.get(b) || 0) + 1);
  }

  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/* ==========================================================================
   3B. AES-256-GCM / PBKDF2 Password Encryption & Decryption Engine
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
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptAesGcm(plaintext, passphrase) {
  if (!passphrase) throw new Error('Master passphrase cannot be empty.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt);
  const plainBytes = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plainBytes
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  // Packet structure: [16B salt] + [12B IV] + [Ciphertext + Auth Tag]
  const packet = new Uint8Array(salt.length + iv.length + cipherBytes.length);
  packet.set(salt, 0);
  packet.set(iv, salt.length);
  packet.set(cipherBytes, salt.length + iv.length);

  let binaryStr = '';
  for (let i = 0; i < packet.length; i++) binaryStr += String.fromCharCode(packet[i]);
  return `FLOWVAULT1:${btoa(binaryStr)}`;
}

async function decryptAesGcm(packetString, passphrase) {
  if (!passphrase) throw new Error('Master passphrase cannot be empty.');
  const clean = packetString.trim();
  const rawBase64 = clean.startsWith('FLOWVAULT1:') ? clean.slice(11) : clean;

  let binaryStr;
  try {
    binaryStr = atob(rawBase64);
  } catch (e) {
    throw new Error('Invalid Base64 armored packet format.');
  }

  const packet = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) packet[i] = binaryStr.charCodeAt(i);

  if (packet.length < 28) throw new Error('Armored packet is too short (corrupted).');

  const salt = packet.slice(0, 16);
  const iv = packet.slice(16, 28);
  const cipherBytes = packet.slice(28);

  const key = await deriveAesKey(passphrase, salt);

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );
    return new TextDecoder().decode(plainBuffer);
  } catch (err) {
    throw new Error('Authentication failure: incorrect passphrase or corrupted data packet.');
  }
}

/* ==========================================================================
   4. Cipher Lab Application Controller
   ========================================================================== */

const CIPHERS = [
  { id: 'caesar', name: 'Caesar Shift', hasKey: true, keyType: 'number', defaultKey: 3 },
  { id: 'rot13', name: 'ROT13', symmetric: true },
  { id: 'rot47', name: 'ROT47', symmetric: true },
  { id: 'base64', name: 'Base64' },
  { id: 'base32', name: 'Base32' },
  { id: 'base58', name: 'Base58' },
  { id: 'hex', name: 'Hexadecimal' },
  { id: 'binary', name: 'Binary ASCII' },
  { id: 'xor', name: 'XOR Stream', hasKey: true, keyType: 'text', defaultKey: 'key' },
  { id: 'vigenere', name: 'Vigenère', hasKey: true, keyType: 'text', defaultKey: 'CIPHER' },
  { id: 'atbash', name: 'Atbash', symmetric: true },
  { id: 'morse', name: 'Morse Code' },
  { id: 'md5', name: 'MD5 Hash', oneWay: true },
  { id: 'sha256', name: 'SHA-256 Hash', oneWay: true, async: true },
  { id: 'sha512', name: 'SHA-512 Hash', oneWay: true, async: true },
  { id: 'jwt', name: 'JWT Inspector', oneWay: true },
];

let currentCipher = CIPHERS[0];

function buildCipherSidebar() {
  const nav = document.getElementById('cipherList');
  nav.replaceChildren();

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
  for (const other of btn.parentElement.children) {
    other.classList.toggle('selected', other === btn);
  }

  document.getElementById('cipherName').textContent = cipher.name;
  renderCipherParams(cipher);

  const encodeBtn = document.getElementById('cipherEncode');
  const decodeBtn = document.getElementById('cipherDecode');

  if (cipher.oneWay) {
    encodeBtn.textContent = 'Compute';
    decodeBtn.classList.add('hidden');
  } else if (cipher.symmetric) {
    encodeBtn.textContent = 'Transform';
    decodeBtn.classList.add('hidden');
  } else {
    encodeBtn.textContent = 'Encode';
    decodeBtn.textContent = 'Decode';
    decodeBtn.classList.remove('hidden');
  }

  runActiveCipher();
}

function renderCipherParams(cipher) {
  const bar = document.getElementById('cipherParams');
  bar.replaceChildren();

  if (cipher.id === 'caesar') {
    bar.innerHTML = `
      <label for="caesarShiftInput">Shift Key (0-25):</label>
      <input type="number" id="caesarShiftInput" class="param-input" min="0" max="25" value="3" style="width: 60px;">
      <button id="btnCaesarBrute" class="toolbtn-small">Brute Force (All 26)</button>
    `;
    const input = document.getElementById('caesarShiftInput');
    input.addEventListener('input', () => runActiveCipher());
    document.getElementById('btnCaesarBrute').addEventListener('click', toggleCaesarBruteView);
  } else if (cipher.hasKey) {
    bar.innerHTML = `
      <label for="cipherKeyInput">Passphrase / Key:</label>
      <input type="text" id="cipherKeyInput" class="param-input" value="${cipher.defaultKey || ''}" placeholder="Key..." style="min-width: 160px;">
    `;
    document.getElementById('cipherKeyInput').addEventListener('input', () => runActiveCipher());
  } else {
    bar.innerHTML = `<span style="color: var(--text-muted); font-size: 11.5px;">Standard parameterless transformation.</span>`;
  }
}

function toggleCaesarBruteView() {
  const aux = document.getElementById('cipherAuxView');
  const input = document.getElementById('cipherInput').value;
  if (!input) {
    aux.hidden = true;
    return;
  }

  if (!aux.hidden) {
    aux.hidden = true;
    return;
  }

  const shifts = caesarBruteForce(input);
  let html = `<table class="aux-table"><thead><tr><th>Shift</th><th>Plaintext Candidate</th></tr></thead><tbody>`;
  shifts.forEach(row => {
    html += `<tr><td class="aux-shift-val">ROT-${row.shift.toString().padStart(2, '0')}</td><td>${escapeHtml(row.text)}</td></tr>`;
  });
  html += `</tbody></table>`;
  aux.innerHTML = html;
  aux.hidden = false;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function runCipher(direction = 'encode') {
  const input = document.getElementById('cipherInput').value;
  const outEl = document.getElementById('cipherOutput');
  const aux = document.getElementById('cipherAuxView');
  aux.hidden = true;

  if (!input) {
    outEl.value = '';
    updateIoStats();
    return;
  }

  try {
    let result = '';
    const id = currentCipher.id;

    if (id === 'caesar') {
      const shift = parseInt(document.getElementById('caesarShiftInput')?.value || '3', 10);
      result = direction === 'decode' ? caesarTransform(input, -shift) : caesarTransform(input, shift);
    } else if (id === 'rot13') {
      result = rot13(input);
    } else if (id === 'rot47') {
      result = rot47(input);
    } else if (id === 'base64') {
      result = direction === 'decode' ? base64Decode(input) : base64Encode(input);
    } else if (id === 'base32') {
      result = direction === 'decode' ? base32Decode(input) : base32Encode(input);
    } else if (id === 'base58') {
      result = direction === 'decode' ? base58Decode(input) : base58Encode(input);
    } else if (id === 'hex') {
      result = direction === 'decode' ? hexToText(input) : textToHex(input);
    } else if (id === 'binary') {
      result = direction === 'decode' ? binaryToText(input) : textToBinary(input);
    } else if (id === 'xor') {
      const key = document.getElementById('cipherKeyInput')?.value || 'key';
      result = xorTransform(input, key);
    } else if (id === 'vigenere') {
      const key = document.getElementById('cipherKeyInput')?.value || 'KEY';
      result = vigenereCipher(input, key, direction === 'decode');
    } else if (id === 'atbash') {
      result = atbash(input);
    } else if (id === 'morse') {
      result = direction === 'decode' ? morseDecode(input) : morseEncode(input);
    } else if (id === 'md5') {
      result = md5(input);
    } else if (id === 'sha256') {
      result = await subtleDigest('SHA-256', input);
    } else if (id === 'sha512') {
      result = await subtleDigest('SHA-512', input);
    } else if (id === 'jwt') {
      result = parseJwt(input);
    }

    outEl.value = result;
  } catch (err) {
    outEl.value = `[Transform Error]: ${err.message}`;
  }

  updateIoStats();
}

function runActiveCipher() {
  const isLive = document.getElementById('cipherLiveToggle')?.checked ?? true;
  if (isLive) runCipher('encode');
}

function updateIoStats() {
  const inVal = document.getElementById('cipherInput')?.value || '';
  const outVal = document.getElementById('cipherOutput')?.value || '';
  const inStats = document.getElementById('inputStats');
  const outStats = document.getElementById('outputStats');

  if (inStats) inStats.textContent = `${inVal.length} chars (${new TextEncoder().encode(inVal).length} B)`;
  if (outStats) outStats.textContent = `${outVal.length} chars (${new TextEncoder().encode(outVal).length} B)`;
}

/* ==========================================================================
   4B. Secret Vault (AES-256-GCM) Controller
   ========================================================================== */

function initVault() {
  const passInput = document.getElementById('vaultPassphrase');
  const togglePassBtn = document.getElementById('btnToggleVaultPass');
  const plainArea = document.getElementById('vaultPlaintext');
  const cipherArea = document.getElementById('vaultCiphertext');
  const statusEl = document.getElementById('vaultStatusMessage');

  togglePassBtn?.addEventListener('click', () => {
    if (passInput.type === 'password') {
      passInput.type = 'text';
      togglePassBtn.textContent = 'Hide';
    } else {
      passInput.type = 'password';
      togglePassBtn.textContent = 'Show';
    }
  });

  document.getElementById('btnVaultEncrypt')?.addEventListener('click', async () => {
    const plain = plainArea.value;
    const pass = passInput.value;
    if (!plain) {
      statusEl.textContent = 'Error: Plaintext buffer is empty.';
      statusEl.style.color = 'var(--danger)';
      return;
    }
    if (!pass) {
      statusEl.textContent = 'Error: Master passphrase is required.';
      statusEl.style.color = 'var(--danger)';
      passInput.focus();
      return;
    }

    try {
      statusEl.textContent = 'Deriving PBKDF2 key (100,000 rounds) & encrypting...';
      const packet = await encryptAesGcm(plain, pass);
      cipherArea.value = packet;
      statusEl.textContent = '✔ Encrypted successfully. AES-GCM tag authenticated.';
      statusEl.style.color = 'var(--success)';
    } catch (e) {
      statusEl.textContent = `Encryption failed: ${e.message}`;
      statusEl.style.color = 'var(--danger)';
    }
  });

  document.getElementById('btnVaultDecrypt')?.addEventListener('click', async () => {
    const cipher = cipherArea.value;
    const pass = passInput.value;
    if (!cipher) {
      statusEl.textContent = 'Error: Ciphertext packet buffer is empty.';
      statusEl.style.color = 'var(--danger)';
      return;
    }
    if (!pass) {
      statusEl.textContent = 'Error: Master passphrase is required.';
      statusEl.style.color = 'var(--danger)';
      passInput.focus();
      return;
    }

    try {
      statusEl.textContent = 'Verifying authentication tag & decrypting...';
      const plain = await decryptAesGcm(cipher, pass);
      plainArea.value = plain;
      statusEl.textContent = '✔ Decrypted successfully. Authenticated plaintext recovered.';
      statusEl.style.color = 'var(--success)';
    } catch (e) {
      statusEl.textContent = `✖ ${e.message}`;
      statusEl.style.color = 'var(--danger)';
    }
  });

  document.getElementById('btnVaultCopyCipher')?.addEventListener('click', () => {
    if (cipherArea.value) {
      navigator.clipboard.writeText(cipherArea.value).then(() => {
        const btn = document.getElementById('btnVaultCopyCipher');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy Packet'; }, 1000);
      });
    }
  });
}

/* ==========================================================================
   4C. Steganography Lab & File Inspector Controller
   ========================================================================== */

function ensureStegoCarrier() {
  const canvas = document.getElementById('stegoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Check if blank
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let isBlank = true;
  for (let i = 0; i < imgData.data.length; i += 4) {
    if (imgData.data[i + 3] !== 0) { isBlank = false; break; }
  }
  if (isBlank) generateProceduralCarrier();
}

function generateProceduralCarrier() {
  const canvas = document.getElementById('stegoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Generate cyber matrix gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0e1e24');
  grad.addColorStop(0.5, '#16382b');
  grad.addColorStop(1, '#0b1622');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Add noise grain
  const imgData = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    imgData.data[i] = clamp(imgData.data[i] + noise, 0, 255);
    imgData.data[i + 1] = clamp(imgData.data[i + 1] + noise, 0, 255);
    imgData.data[i + 2] = clamp(imgData.data[i + 2] + noise, 0, 255);
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const stats = document.getElementById('stegoImageStats');
  const capBytes = Math.floor((w * h * 3) / 8) - 4;
  if (stats) stats.textContent = `Carrier: ${w}x${h} (Capacity: ~${(capBytes / 1024).toFixed(1)} KB)`;
}

function initStego() {
  // Tabs
  document.querySelectorAll('.stego-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stego-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.stego-tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(`stego-tab-${btn.dataset.tab}`);
      if (pane) pane.classList.add('active');
    });
  });

  // Carrier generation
  document.getElementById('btnGenerateCarrier')?.addEventListener('click', generateProceduralCarrier);

  // File Upload Handlers
  const fileInput = document.getElementById('stegoFileInput');
  const dropZone = document.getElementById('stegoDropZone');
  dropZone?.addEventListener('click', () => fileInput.click());

  fileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) loadStegoImage(file, 'stegoCanvas', 'stegoImageStats');
  });

  // Decode Upload Handlers
  const decodeFileInput = document.getElementById('stegoDecodeFileInput');
  const decodeDropZone = document.getElementById('stegoDecodeDropZone');
  decodeDropZone?.addEventListener('click', () => decodeFileInput.click());

  decodeFileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) loadStegoImage(file, 'stegoDecodeCanvas', null);
  });

  // Stego Encode Button
  document.getElementById('btnStegoEncode')?.addEventListener('click', () => {
    const canvas = document.getElementById('stegoCanvas');
    const msg = document.getElementById('stegoPayloadInput').value;
    const status = document.getElementById('stegoEncodeStatus');
    const downloadBtn = document.getElementById('btnDownloadStego');

    if (!msg) {
      status.textContent = 'Error: Secret payload is empty.';
      status.style.color = 'var(--danger)';
      return;
    }

    try {
      const payloadBytes = new TextEncoder().encode(msg);
      const len = payloadBytes.length;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const totalPixels = canvas.width * canvas.height;
      const maxBytes = Math.floor((totalPixels * 3) / 8) - 4;

      if (len > maxBytes) {
        status.textContent = `Payload (${len} B) exceeds carrier capacity (${maxBytes} B).`;
        status.style.color = 'var(--danger)';
        return;
      }

      // Convert length (32-bit big endian) + payload bytes into bit array
      const bits = [];
      for (let b = 31; b >= 0; b--) {
        bits.push((len >>> b) & 1);
      }
      for (let i = 0; i < payloadBytes.length; i++) {
        for (let b = 7; b >= 0; b--) {
          bits.push((payloadBytes[i] >>> b) & 1);
        }
      }

      // Embed into LSB of RGB channels
      let bitIdx = 0;
      for (let i = 0; i < imgData.data.length && bitIdx < bits.length; i += 4) {
        for (let c = 0; c < 3 && bitIdx < bits.length; c++) {
          imgData.data[i + c] = (imgData.data[i + c] & 0xFE) | bits[bitIdx];
          bitIdx++;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      status.textContent = `✔ Embedded ${len} bytes into pixel LSBs. Lossless PNG ready.`;
      status.style.color = 'var(--success)';

      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        downloadBtn.style.display = 'inline-flex';
      }, 'image/png');
    } catch (e) {
      status.textContent = `Stego Encode Error: ${e.message}`;
      status.style.color = 'var(--danger)';
    }
  });

  // Stego Decode Button
  document.getElementById('btnStegoDecode')?.addEventListener('click', () => {
    const canvas = document.getElementById('stegoDecodeCanvas');
    const outArea = document.getElementById('stegoExtractedOutput');
    const status = document.getElementById('stegoDecodeStatus');

    try {
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const totalPixels = canvas.width * canvas.height;
      const maxPossibleBytes = Math.floor((totalPixels * 3) / 8);

      // Extract first 32 bits for length prefix
      let bitIdx = 0;
      const rawBits = [];
      for (let i = 0; i < imgData.data.length && bitIdx < 32; i += 4) {
        for (let c = 0; c < 3 && bitIdx < 32; c++) {
          rawBits.push(imgData.data[i + c] & 1);
          bitIdx++;
        }
      }

      let payloadLen = 0;
      for (let i = 0; i < 32; i++) {
        payloadLen = (payloadLen << 1) | rawBits[i];
      }

      if (payloadLen <= 0 || payloadLen > maxPossibleBytes) {
        status.textContent = '✖ No valid steganographic header detected in carrier.';
        status.style.color = 'var(--danger)';
        outArea.value = '';
        return;
      }

      // Read payload bytes
      const totalBitsNeeded = 32 + (payloadLen * 8);
      const allBits = [];
      let bCount = 0;

      for (let i = 0; i < imgData.data.length && bCount < totalBitsNeeded; i += 4) {
        for (let c = 0; c < 3 && bCount < totalBitsNeeded; c++) {
          if (bCount >= 32) {
            allBits.push(imgData.data[i + c] & 1);
          }
          bCount++;
        }
      }

      const outBytes = new Uint8Array(payloadLen);
      for (let i = 0; i < payloadLen; i++) {
        let byteVal = 0;
        for (let b = 0; b < 8; b++) {
          byteVal = (byteVal << 1) | allBits[i * 8 + b];
        }
        outBytes[i] = byteVal;
      }

      const recoveredText = new TextDecoder().decode(outBytes);
      outArea.value = recoveredText;
      status.textContent = `✔ Extracted ${payloadLen} bytes of hidden payload.`;
      status.style.color = 'var(--success)';
    } catch (e) {
      status.textContent = `Extraction Error: ${e.message}`;
      status.style.color = 'var(--danger)';
    }
  });

  // File / Base64 Inspector Drop Zone
  const fileDrop = document.getElementById('fileInspectDropZone');
  const fileDropInput = document.getElementById('fileInspectInput');
  fileDrop?.addEventListener('click', () => fileDropInput.click());

  const handleInspectFile = file => {
    if (!file) return;
    const metaEl = document.getElementById('fileInspectMeta');
    const outArea = document.getElementById('fileInspectOutput');

    metaEl.textContent = `File: ${file.name} | Size: ${(file.size / 1024).toFixed(2)} KB (${file.size} B) | MIME: ${file.type || 'application/octet-stream'}`;

    const reader = new FileReader();
    reader.onload = e => {
      outArea.value = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  fileDropInput?.addEventListener('change', e => handleInspectFile(e.target.files?.[0]));

  fileDrop?.addEventListener('dragover', e => { e.preventDefault(); });
  fileDrop?.addEventListener('drop', e => {
    e.preventDefault();
    handleInspectFile(e.dataTransfer?.files?.[0]);
  });
}

function loadStegoImage(file, canvasId, statsId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const reader = new FileReader();

  reader.onload = ev => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (statsId) {
        const stats = document.getElementById(statsId);
        const capBytes = Math.floor((img.width * img.height * 3) / 8) - 4;
        if (stats) stats.textContent = `Carrier: ${img.width}x${img.height} (Capacity: ~${(capBytes / 1024).toFixed(1)} KB)`;
      }
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

/* ==========================================================================
   5. Interactive Virtual Terminal ("RootShell")
   ========================================================================== */

const CLI_HISTORY = [];
let cliHistoryIndex = -1;

function initTerminal() {
  const termInput = document.getElementById('termInput');
  const termScreen = document.getElementById('termScreen');
  if (!termInput || !termScreen) return;

  // Print welcome banner
  printTermLine('Flow OS RootShell [v2.5.0-coder-workstation]', 'term-accent');
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
      printTermLine('  theme <name>           : obsidian | hacker | amber | cobalt');
      printTermLine('  neofetch               : System banner & specs');
      printTermLine('  clear / cls            : Clear terminal buffer');
      break;

    case 'caesar':
      if (args.length < 2) {
        printTermLine('Usage: caesar <shift-number> <text>', 'term-error');
      } else {
        const shift = parseInt(args[0], 10);
        const payload = args.slice(1).join(' ');
        printTermLine(caesarTransform(payload, shift), 'term-success');
      }
      break;

    case 'rot13':
      if (!text) printTermLine('Usage: rot13 <text>', 'term-error');
      else printTermLine(rot13(text), 'term-success');
      break;

    case 'base64':
      if (!args.length) {
        printTermLine('Usage: base64 [-d] <text>', 'term-error');
      } else if (args[0] === '-d') {
        try {
          printTermLine(base64Decode(args.slice(1).join(' ')), 'term-success');
        } catch (e) {
          printTermLine(`Base64 decode error: ${e.message}`, 'term-error');
        }
      } else {
        printTermLine(base64Encode(text), 'term-success');
      }
      break;

    case 'hex':
      if (!args.length) {
        printTermLine('Usage: hex [-d] <text>', 'term-error');
      } else if (args[0] === '-d') {
        try {
          printTermLine(hexToText(args.slice(1).join(' ')), 'term-success');
        } catch (e) {
          printTermLine(`Hex decode error: ${e.message}`, 'term-error');
        }
      } else {
        printTermLine(textToHex(text), 'term-success');
      }
      break;

    case 'xor':
      if (args.length < 2) {
        printTermLine('Usage: xor <key> <text>', 'term-error');
      } else {
        const key = args[0];
        const payload = args.slice(1).join(' ');
        printTermLine(xorTransform(payload, key), 'term-success');
      }
      break;

    case 'vault':
      if (args.length < 3) {
        printTermLine('Usage: vault <enc|dec> <passphrase> <text/packet>', 'term-error');
      } else {
        const action = args[0].toLowerCase();
        const pass = args[1];
        const payload = args.slice(2).join(' ');
        try {
          if (action === 'enc') {
            const out = await encryptAesGcm(payload, pass);
            printTermLine(out, 'term-success');
          } else {
            const out = await decryptAesGcm(payload, pass);
            printTermLine(out, 'term-success');
          }
        } catch (e) {
          printTermLine(`Vault Error: ${e.message}`, 'term-error');
        }
      }
      break;

    case 'hash':
      if (args.length < 2) {
        printTermLine('Usage: hash <md5|sha1|sha256|sha512> <text>', 'term-error');
      } else {
        const algo = args[0].toLowerCase();
        const payload = args.slice(1).join(' ');
        if (algo === 'md5') {
          printTermLine(md5(payload), 'term-success');
        } else if (algo === 'sha1') {
          printTermLine(await subtleDigest('SHA-1', payload), 'term-success');
        } else if (algo === 'sha256') {
          printTermLine(await subtleDigest('SHA-256', payload), 'term-success');
        } else if (algo === 'sha512') {
          printTermLine(await subtleDigest('SHA-512', payload), 'term-success');
        } else {
          printTermLine(`Unknown algorithm "${algo}". Supported: md5, sha1, sha256, sha512`, 'term-error');
        }
      }
      break;

    case 'jwt':
      if (!text) {
        printTermLine('Usage: jwt <token>', 'term-error');
      } else {
        try {
          printTermLine(parseJwt(text), 'term-success');
        } catch (e) {
          printTermLine(`JWT Error: ${e.message}`, 'term-error');
        }
      }
      break;

    case 'entropy':
      if (!text) {
        printTermLine('Usage: entropy <text>', 'term-error');
      } else {
        const score = calculateEntropy(text);
        printTermLine(`Shannon Entropy: ${score.toFixed(4)} / 8.0000 bits per byte`, 'term-success');
      }
      break;

    case 'eval':
      if (!text) {
        printTermLine('Usage: eval <js-expression>', 'term-error');
      } else {
        try {
          // eslint-disable-next-line no-eval
          const out = window.eval(text);
          printTermLine(String(out), 'term-success');
        } catch (e) {
          printTermLine(`Evaluation Error: ${e.message}`, 'term-error');
        }
      }
      break;

    case 'theme':
      if (['obsidian', 'hacker', 'amber', 'cobalt'].includes(args[0]?.toLowerCase())) {
        setTheme(args[0].toLowerCase());
        printTermLine(`Theme updated to "${args[0]}".`, 'term-success');
      } else {
        printTermLine('Usage: theme <obsidian | hacker | amber | cobalt>', 'term-error');
      }
      break;

    case 'neofetch':
      printTermLine('        /\\        OS: Flow OS Coder Edition x86_64', 'term-accent');
      printTermLine('       /  \\       Host: Browser WebWorker Sandbox', 'term-accent');
      printTermLine('      / /\\ \\      Kernel: JavaScript ES2024 / WebCrypto', 'term-accent');
      printTermLine('     / /__\\ \\     Shell: RootShell 2.5.0', 'term-accent');
      printTermLine('    /________\\    Palette: 4 Themes Active', 'term-accent');
      break;

    case 'clear':
    case 'cls':
      document.getElementById('termScreen').replaceChildren();
      break;

    default:
      printTermLine(`Command not found: "${cmd}". Type "help" for a command listing.`, 'term-error');
      break;
  }
}

/* ==========================================================================
   6. HexDump & Shannon Entropy Inspector
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

  // Calculate Entropy
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

  // Generate Hex Grid
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
   7. DevPad: JSON Beautifier, Regex Tester & Persistent Notes
   ========================================================================== */

function initDevPad() {
  // Tab Switching
  document.querySelectorAll('.devpad-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.devpad-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.devpad-tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`devpad-tab-${btn.dataset.tab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // JSON Tools
  document.getElementById('btnJsonPrettify')?.addEventListener('click', () => {
    const input = document.getElementById('jsonInput');
    const status = document.getElementById('jsonStatus');
    try {
      const parsed = JSON.parse(input.value);
      input.value = JSON.stringify(parsed, null, 2);
      if (status) status.textContent = 'Valid JSON (Formatted)';
    } catch (e) {
      if (status) status.textContent = `Error: ${e.message}`;
    }
  });

  document.getElementById('btnJsonMinify')?.addEventListener('click', () => {
    const input = document.getElementById('jsonInput');
    const status = document.getElementById('jsonStatus');
    try {
      const parsed = JSON.parse(input.value);
      input.value = JSON.stringify(parsed);
      if (status) status.textContent = 'Minified';
    } catch (e) {
      if (status) status.textContent = `Error: ${e.message}`;
    }
  });

  document.getElementById('btnJsonValidate')?.addEventListener('click', () => {
    const input = document.getElementById('jsonInput');
    const status = document.getElementById('jsonStatus');
    try {
      JSON.parse(input.value);
      if (status) status.textContent = 'Valid JSON Payload';
    } catch (e) {
      if (status) status.textContent = `Syntax Error: ${e.message}`;
    }
  });

  // Regex Tester
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
      if (resPanel) resPanel.textContent = 'No active pattern or test text.';
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
        html += `
          <div class="regex-match-pill">
            <strong>Match ${idx + 1}</strong>: "${escapeHtml(m[0])}" (idx: ${m.index})
            ${groups ? `<div style="font-size:10.5px; color:var(--text-muted);">${groups}</div>` : ''}
          </div>
        `;
      });
      if (resPanel) resPanel.innerHTML = html;
    } catch (e) {
      if (resPanel) resPanel.textContent = `RegExp Error: ${e.message}`;
      if (matchCountEl) matchCountEl.textContent = 'Error';
    }
  };

  regexPattern?.addEventListener('input', runRegex);
  regexFlags?.addEventListener('input', runRegex);
  regexTestText?.addEventListener('input', runRegex);

  // Notes Local Storage
  const notesArea = document.getElementById('notesContent');
  if (notesArea) {
    notesArea.value = localStorage.getItem('flow_os_scratch_notes') || '';
    notesArea.addEventListener('input', () => {
      localStorage.setItem('flow_os_scratch_notes', notesArea.value);
      const indicator = document.getElementById('notesSavedIndicator');
      if (indicator) {
        indicator.textContent = 'Saving...';
        setTimeout(() => { indicator.textContent = 'Saved'; }, 400);
      }
    });
  }
}

/* ==========================================================================
   8. System Monitor Telemetry
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

  // Background Gridlines
  ctx.strokeStyle = 'rgba(255,255,255,.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const frac of [0.25, 0.5, 0.75]) {
    ctx.moveTo(0, h * frac);
    ctx.lineTo(w, h * frac);
  }
  ctx.stroke();

  // Draw Graph Line
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

  // Area Fill
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

/* ==========================================================================
   9. Matrix Rain Effect
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
  if (canvas) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
}

/* ==========================================================================
   10. Desktop Keyboard Shortcuts Engine (Alt+Tab, Win Key, Shortcuts)
   ========================================================================== */

let isAltTabActive = false;
let altTabSelectedIndex = 0;
let openWindowsCache = [];

function initKeyboardShortcuts() {
  window.addEventListener('keydown', e => {
    // 1. Alt + Tab window switcher
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
      handleAltTabPress(e.shiftKey ? -1 : 1);
      return;
    }

    // 2. Windows / Super Key or Ctrl + Space for Start Menu
    if (e.key === 'Meta' || (e.ctrlKey && e.code === 'Space')) {
      e.preventDefault();
      toggleStartMenu();
      return;
    }

    // 3. Ctrl + Alt + T or Ctrl + ` for RootShell Terminal
    if ((e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') || (e.ctrlKey && e.key === '`')) {
      e.preventDefault();
      openWindow('terminal');
      return;
    }

    // 4. Escape to close top modals / Start Menu
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
    // Release Alt key confirms selection in Alt+Tab switcher
    if (e.key === 'Alt' && isAltTabActive) {
      commitAltTabSelection();
    }
  });
}

function handleAltTabPress(direction) {
  const switcher = document.getElementById('appSwitcher');
  const list = document.getElementById('appSwitcherList');

  if (!isAltTabActive) {
    isAltTabActive = true;
    openWindowsCache = [...windows.entries()]
      .filter(([_, win]) => win.el.classList.contains('open'))
      .map(([id, win]) => ({ id, win }));

    if (openWindowsCache.length === 0) {
      // If no windows open, include default primary apps
      openWindowsCache = APPS.slice(0, 4).map(app => ({ id: app.id, win: windows.get(app.id) }));
    }

    altTabSelectedIndex = 0;
    renderAltTabList();
    switcher.hidden = false;
  }

  // Cycle index
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
   11. System Initialization & Boot Sequence
   ========================================================================== */

function boot() {
  // Initialize all windows in registry
  for (const app of APPS) {
    initializeWindow(app.id);
  }

  buildDesktopIcons();
  buildCipherSidebar();
  selectCipher(document.querySelector('.cipherItem'), CIPHERS[0]);
  initVault();
  initStego();
  initTerminal();
  initDevPad();
  initKeyboardShortcuts();

  // Desktop chrome bindings
  document.getElementById('startButton')?.addEventListener('click', toggleStartMenu);
  const startBtn = document.getElementById('startButton');
  if (startBtn) startBtn.innerHTML = svgIcon('start');

  const brandGlyph = document.querySelector('.brandglyph');
  if (brandGlyph) brandGlyph.innerHTML = svgIcon('flow');

  document.addEventListener('pointerdown', e => {
    const menu = document.getElementById('startMenu');
    if (menu && !menu.hidden && !menu.contains(e.target) && !e.target.closest('#startButton')) {
      closeStartMenu();
    }
  });

  // Persona Switcher
  document.getElementById('switchUser')?.addEventListener('click', () => {
    setTheme(currentTheme === 'hacker' ? 'obsidian' : 'hacker');
  });

  // Theme Picker Buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(btn.dataset.theme);
    });
  });

  // Cipher Action Buttons
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

  // HexDump Input Binding
  document.getElementById('hexSourceInput')?.addEventListener('input', triggerHexUpdate);

  // Quick Launch Links on Welcome Screen
  document.getElementById('link-open-ciphers')?.addEventListener('click', e => {
    e.preventDefault();
    openWindow('cipher');
  });
  document.getElementById('link-open-vault')?.addEventListener('click', e => {
    e.preventDefault();
    openWindow('vault');
  });
  document.getElementById('link-open-stego')?.addEventListener('click', e => {
    e.preventDefault();
    openWindow('stego');
  });
  document.getElementById('link-open-term')?.addEventListener('click', e => {
    e.preventDefault();
    openWindow('terminal');
  });

  // Clock
  updateClock();
  setInterval(updateClock, CLOCK_TICK_MS);

  // Open default window
  openWindow('welcome');
}

document.addEventListener('DOMContentLoaded', boot);
