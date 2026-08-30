let biggestIndex = 100;

function handleWindowTap(win) {
  if (typeof win === 'string') win = document.getElementById(win);
  if (!win) return;
  biggestIndex++;
  win.style.zIndex = biggestIndex;
  document.querySelectorAll('.window').forEach(w => w.classList.remove('active-window'));
  win.classList.add('active-window');
}

function openWindow(win) {
  if (typeof win === 'string') win = document.getElementById(win);
  if (!win) return;
  win.style.display = 'flex';
  handleWindowTap(win);
}

function closeWindow(win) {
  if (typeof win === 'string') win = document.getElementById(win);
  if (!win) return;
  win.style.display = 'none';
}

function toggleMaximize(win) {
  if (typeof win === 'string') win = document.getElementById(win);
  if (!win) return;

  if (win.dataset.maximized === 'true') {
    win.style.top = win.dataset.origTop || '60px';
    win.style.left = win.dataset.origLeft || '260px';
    win.style.width = win.dataset.origWidth || '500px';
    win.style.height = win.dataset.origHeight || '420px';
    win.dataset.maximized = 'false';
  } else {
    win.dataset.origTop = win.style.top;
    win.dataset.origLeft = win.style.left;
    win.dataset.origWidth = win.style.width;
    win.dataset.origHeight = win.style.height;
    win.style.top = '40px';
    win.style.left = '10px';
    win.style.width = 'calc(100vw - 20px)';
    win.style.height = 'calc(100vh - 86px)';
    win.dataset.maximized = 'true';
  }
}

function dragElement(elmnt) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;
  const header = elmnt.querySelector('.windowheader') || elmnt;

  header.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.window-controls')) return;

    isDragging = true;
    handleWindowTap(elmnt);
    header.setPointerCapture(e.pointerId);

    const rect = elmnt.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;

    e.preventDefault();
  });

  header.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newLeft = Math.max(0, Math.min(window.innerWidth - 80, initialLeft + dx));
    const newTop = Math.max(36, Math.min(window.innerHeight - 80, initialTop + dy));

    elmnt.style.left = newLeft + 'px';
    elmnt.style.top = newTop + 'px';
  });

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    try {
      header.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  header.addEventListener('pointerup', endDrag);
  header.addEventListener('pointercancel', endDrag);
}

function initializeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.addEventListener('pointerdown', () => handleWindowTap(win));
  dragElement(win);
}


// clock
function initClock() {
  const timeEl = document.getElementById('timeElement');
  if (!timeEl) return;

  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    timeEl.textContent = h + ':' + m + ':' + s + ' UTC';
  }
  tick();
  setInterval(tick, 1000);
}


// evidence vault data
const evidenceData = [
  {
    id: "#867",
    category: "Dronies",
    title: "Surveillance Specimen #867",
    date: "JAN 22, 2026",
    classification: "TOP SECRET",
    badge: "99.4% CONFIDENCE",
    summary: "Autonomous avian recon unit captured near sector 4 perimeter. Equipped with tactical optics and neural communication array.",
    analysis: "Hardware inspection indicates zero external network reliance. Memory buffer contains encrypted key logs and telemetry streams."
  },
  {
    id: "#3541",
    category: "Dronies",
    title: "Tactical Unit #3541",
    date: "FEB 14, 2026",
    classification: "CONFIDENTIAL",
    badge: "94.8% CONFIDENCE",
    summary: "Stealth sensor drone with low-frequency acoustic transceiver.",
    analysis: "Observed transmitting rhythmic binaural focus signals across short-range frequencies."
  },
  {
    id: "DDIA_INTEL",
    category: "Sightings",
    title: "Designing Data-Intensive Systems",
    date: "CLASSIFIED DOSSIER",
    classification: "CORE INTEL",
    badge: "RECOMMENDED",
    summary: "Seminal engineering manual on fault-tolerant distributed consensus and event-driven architectures.",
    analysis: "Critical reading for designing high-reliability, local-first operating platforms."
  },
  {
    id: "SAW_AUDIO",
    category: "Audio Recordings",
    title: "Ambient Synthesis Log 85-92",
    date: "OCT 1992",
    classification: "RESTRICTED",
    badge: "ANALOG TAPE",
    summary: "Pioneering intelligent electronic audio recordings featuring modular analog synthesizers.",
    analysis: "Primary acoustic reference for client-side WebAudio synthesis curves."
  }
];

let activeEvidenceIndex = 0;

function renderEvidenceTree() {
  const treeContainer = document.getElementById('evidenceTree');
  if (!treeContainer) return;

  treeContainer.innerHTML = '<div class="tree-folder">📁 Dronies</div>';

  evidenceData.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'tree-item' + (idx === activeEvidenceIndex ? ' active' : '');
    el.innerHTML = '<span>↳ ' + item.id + '</span>';
    el.onclick = () => {
      activeEvidenceIndex = idx;
      renderEvidenceTree();
      renderEvidenceDetail(idx);
    };
    treeContainer.appendChild(el);
  });

  // TODO: group these by category instead of hardcoding folder names
  var extraFolders = ["Sightings", "News Clippings", "Audio Recordings", "Video Transcripts"];
  extraFolders.forEach(f => {
    const folderEl = document.createElement('div');
    folderEl.className = 'tree-folder';
    folderEl.style.marginTop = '4px';
    folderEl.innerHTML = '📁 ' + f;
    treeContainer.appendChild(folderEl);
  });
}

function renderEvidenceDetail(idx) {
  const preview = document.getElementById('evidencePreview');
  if (!preview) return;

  const item = evidenceData[idx];
  preview.innerHTML =
    '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-dim); padding-bottom: 6px;">' +
      '<div>' +
        '<span class="evidence-badge-tag">' + item.classification + '</span>' +
        '<h3 style="font-size: 13px; color: var(--neon-green); margin-top: 4px;">' + item.title + '</h3>' +
      '</div>' +
      '<div style="font-size: 10px; color: var(--text-muted); text-align: right;">' +
        '<div>' + item.date + '</div>' +
        '<div style="color: var(--neon-green); font-weight: 700;">' + item.badge + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="evidence-card-body">' +
      '<div style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 2px;">Field Summary:</div>' +
      '<div>' + item.summary + '</div>' +
    '</div>' +
    '<div class="evidence-card-body" style="border-left: 2px solid var(--neon-green);">' +
      '<div style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; margin-bottom: 2px;">Intelligence Analysis:</div>' +
      '<div>' + item.analysis + '</div>' +
    '</div>';
}


// synth engine
let audioCtx = null;
let masterGain = null;
let biquadFilter = null;
let analyser = null;
let isVisualizerRunning = false;

const SYNTH_PADS = [
  { label: 'ALPHA 110Hz',   freq: 110.00, key: '1' },
  { label: 'BETA 220Hz',    freq: 220.00, key: '2' },
  { label: 'GAMMA 330Hz',   freq: 330.00, key: '3' },
  { label: 'DELTA 440Hz',   freq: 440.00, key: '4' },
  { label: 'THETA 550Hz',   freq: 550.00, key: '5' },
  { label: 'TACTICAL 660Hz', freq: 660.00, key: '6' },
  { label: 'CARRIER 770Hz', freq: 770.00, key: '7' },
  { label: 'BEACON 880Hz',  freq: 880.00, key: '8' }
];

function initAudio() {
  if (audioCtx) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AC();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.25;

  biquadFilter = audioCtx.createBiquadFilter();
  biquadFilter.type = 'lowpass';
  biquadFilter.frequency.value = 2200;

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  biquadFilter.connect(analyser);
  analyser.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  startVisualizer();
}

function playFrequency(freq) {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  var waveEl = document.getElementById('synthWave');
  var waveType = waveEl ? waveEl.value : 'sawtooth';
  var osc = audioCtx.createOscillator();
  var noteGain = audioCtx.createGain();

  osc.type = waveType;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  var now = audioCtx.currentTime;
  noteGain.gain.setValueAtTime(0.001, now);
  noteGain.gain.exponentialRampToValueAtTime(0.35, now + 0.03);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  osc.connect(noteGain);
  noteGain.connect(biquadFilter);

  osc.start(now);
  osc.stop(now + 0.65);
}

function renderSynthPads() {
  const container = document.getElementById('synthPadsRow');
  if (!container) return;

  container.innerHTML = '';
  SYNTH_PADS.forEach(pad => {
    const btn = document.createElement('div');
    btn.className = 'synth-btn';
    btn.id = 'synth-' + pad.key;
    btn.innerHTML =
      '<div class="pad-freq">' + pad.label + '</div>' +
      '<div class="pad-shortcut">[KEY ' + pad.key + ']</div>';

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      playFrequency(pad.freq);
      btn.classList.add('active');
      setTimeout(() => btn.classList.remove('active'), 120);
    });

    container.appendChild(btn);
  });

  const cutoffInput = document.getElementById('synthCutoff');
  if (cutoffInput) {
    cutoffInput.addEventListener('input', (e) => {
      if (biquadFilter && audioCtx) {
        biquadFilter.frequency.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime);
      }
    });
  }
}

function startVisualizer() {
  if (isVisualizerRunning) return;
  isVisualizerRunning = true;

  const canvas = document.getElementById('synthCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = '#04070a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#00ff66';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ff66';
    ctx.beginPath();

    const sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * canvas.height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  draw();
}

// mainframe auth
function unlockMainframe() {
  const input = document.getElementById('mainframePassInput');
  const status = document.getElementById('mainframeStatus');
  if (!input || !status) return;

  status.textContent = "AUTHENTICATING...";
  status.style.color = "var(--neon-amber)";

  setTimeout(() => {
    status.textContent = "ACCESS GRANTED // LEVEL 4 MAIN ACCESS UNLOCKED";
    status.style.color = "var(--neon-green)";
    openWindow('imageViewerWindow');
  }, 400);
}


// boot
document.addEventListener('DOMContentLoaded', () => {
  initClock();

  ['dossierWindow', 'evidenceWindow', 'imageViewerWindow', 'mainframeWindow', 'synthWindow'].forEach(initializeWindow);

  renderEvidenceTree();
  renderEvidenceDetail(0);
  renderSynthPads();

  window.addEventListener('keydown', (e) => {
    var pad = SYNTH_PADS.find(p => p.key === e.key);
    if (pad) {
      playFrequency(pad.freq);
      var btn = document.getElementById('synth-' + pad.key);
      if (btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 120);
      }
    }

    if (e.altKey && e.key === '1') openWindow('dossierWindow');
    if (e.altKey && e.key === '2') openWindow('evidenceWindow');
    if (e.altKey && e.key === '3') openWindow('synthWindow');
    if (e.altKey && e.key === '4') openWindow('mainframeWindow');
  });
});
