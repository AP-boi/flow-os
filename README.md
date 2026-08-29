# 🌊 Flow OS — Deep Work Desktop Operating System

> **A web-based desktop operating system engineered to protect your attention.**  
> Fusing macOS's menu bar and dock aesthetics with Windows 11's centered ergonomics and snap layouts, wrapped around a deep work soul neither has.

[![License: MIT](https://img.shields.io/badge/License-MIT-coral.svg)](LICENSE)
[![Zero Build Step](https://img.shields.io/badge/Build-Zero%20Build%20Step-ff7849.svg)]()
[![Single File OS](https://img.shields.io/badge/Architecture-Single%20HTML%20File-4e9b7a.svg)]()
[![Pure WebAudio](https://img.shields.io/badge/Audio-Synthesized%20WebAudio-6a9eb5.svg)]()

---

## 🌟 Philosophy & Positioning

Anyone can clone a dock. Nobody ships an OS that dims itself, holds notifications, synthesizes soothing focus soundscapes in real-time, and intercepts you when you try to open a distraction mid-flow.

**Flow OS** runs inside a **single, self-contained `index.html` file** with zero build steps, zero servers, zero telemetry, and zero audio assets. Everything computes locally in your browser at 60 frames per second.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                  FLOW OS                                  │
├──────────────────┬──────────────────┬──────────────────┬──────────────────┤
│      KERNEL      │      SHELL       │       SOUL       │       APPS       │
│  Window Manager  │     Menu Bar     │  Flow Sessions   │      Files       │
│  Pointer Engine  │  Fisheye Dock    │Distraction Shield│      Notes       │
│ Virtual Storage  │    Spotlight     │ Synthesized Audio│      Tasks       │
│ WebAudio Synthes │  Control Center  │ Focus Analytics  │     Terminal     │
│  Canvas Shaders  │ Notification Ctr │ Intention Ritual │ Calculator/Setts │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

## 🎯 The Soul: The Deep Work Engine

The differentiator of Flow OS is its dedicated deep work layer:

### 1. ⏱️ Flow Sessions (25 / 50 / 90 min)
- Launch from the **Focus menu**, the **Flow app**, or **Spotlight** (`start 25m flow`).
- **State Shift during Flow**:
  - The menu bar reveals a sleek mono countdown timer next to the clock.
  - The generative wallpaper canvas crossfades to a desaturated, slow-drift calm mode.
  - The dock dims non-essential apps to 35% opacity.
  - Notifications are queued silently in the background with a badge counter.
  - Synthesized ambient soundscapes start automatically.
- **Completion & Celebration**: Victorious WebAudio chord arpeggio, summary toast, and automatic logging to `flow.sessions`.

### 2. 🛡️ Distraction Shield
- Opening a non-essential app during an active flow session triggers an intervention screen:
  > *"28 minutes remaining in Deep Work · Working on: System Architecture"*
  - **`[Return to Flow Session (Recommended)]`**: Dismisses modal and refocuses your task.
  - **`[Open App Anyway]`**: Allows override while honestly recording the interruption.

### 3. 🎵 Synthesized WebAudio Soundscapes (Zero Audio Files)
All audio is mathematically generated in real-time using the WebAudio API:
- **🌧️ Rain**: Pink/white noise through a resonant lowpass filter + randomized high-frequency droplet transient blips.
- **☕ Café Murmur**: Bandpassed Brownian noise (300Hz-2.5kHz) + slow swelling harmonic vocal sine waves + periodic ceramic cup clinks.
- **🌊 Brown Noise**: Integrated Brownian random walk noise with gentle lowpass at 360Hz for deep focus warmth.
- **🍃 Wind**: Resonant bandpass filter swept by a slow 0.15Hz LFO oscillator for natural air currents.

### 4. 📊 Focus Analytics & 7-Day Canvas Chart
- Interactive HTML5 Canvas weekly bar chart displaying daily focus minutes.
- Real-time stat cards: **Total Focus Hours**, **Current Streak (Days)**, **Completed Sessions**, and **Distractions Resisted**.

### 5. ☀️ Daily Intention Ritual
- First boot of each calendar day presents a serene glass modal: *"What is your single focus today?"*
- Commits your core task directly to the Tasks app and binds it to upcoming Flow sessions.

---

## 🖥️ The Shell & Desktop Experience

### 🍎 macOS-Style Blurred Menu Bar (34px)
- **System Menu**: About Flow OS, System Settings, Lock Screen, Restart, Shutdown.
- **Contextual App Menu**: Dynamically updates actions based on the active window.
- **Window Menu**: Lists all open windows with 1-click focus, Tile Left & Right, and Minimize All.
- **Focus Menu**: Instant triggers for 25m, 50m, and 90m flow sessions.
- **Right Tray**: Live Flow countdown badge, Focus mode pill, Wi-Fi status, Simulated discharging battery, Control Center toggle, and live Clock.

### 🪟 Windows 11 Ergonomics & Window Manager Kernel
- **Unified Pointer Events**: Smooth mouse & touch dragging with `setPointerCapture` and 8-directional resizing.
- **Edge & Corner Snapping**: Drag to left/right/top edges or 4 corners for half, full, and quarter screen snap with a live translucent glass preview overlay.
- **Snap Layouts Flyout**: Hovering over the maximize/zoom traffic light reveals instant snap layout presets (50/50, 65/35, 4 Quarters, Full).
- **Genie Minimize Animation**: Windows smoothly scale and glide towards their corresponding dock icon.

### 🚀 Fisheye Magnification Glass Dock
- Centered floating pill with Gaussian magnification physics on cursor proximity.
- Active app indicator dots with glowing accent highlights.
- Right-click context menus for quick actions.

### 🔍 Spotlight Search (`⌘K` / `Ctrl+K`)
- Centered modal with fuzzy substring search and `<mark>` highlighted characters.
- Index searches:
  - Built-in Applications
  - System Actions (e.g. *Toggle Dark Mode*, *Play Rain Sound*, *Start 25m Flow*, *Lock Screen*)
  - Notes full-text content
  - Active Task titles

### 🎛️ Control Center & Notification Center
- **Control Center**: Quick tiles (Wi-Fi, Bluetooth, Dark Mode, DND), **Real Display Brightness Dimmer** (dims screen overlay down to 20%), Master Volume Slider, and Soundscape Selector.
- **Notification Center**: Real-time ticking **Analog Clock Canvas Widget**, interactive Monthly Calendar, live **System Stats** (Uptime, Active Windows, LocalStorage usage), and held notification stack.

---

## 📦 Built-in Applications

| Application | Description | Features |
|---|---|---|
| **Code Lab** | Multi-Language Playground | Write and run **JavaScript, TypeScript, React (TSX)** and live HTML in a sandboxed runtime with console capture; Ctrl/Cmd + Enter to run |
| **Cipher Vault** | Offline Cryptography Suite | AES-256-GCM encrypt/decrypt (PBKDF2), SHA-1/256/384/512, UTF-8-safe Base64, Caesar/Vigenere/Atbash, crypto-secure password forge |
| **📁 Files** | Virtual Hierarchical Filesystem | Breadcrumb navigation, quick sidebar, new folder, upload, file previews |
| **📝 Notes** | Distraction-Free Markdown Editor | Multi-note list, live search, autosave to `flow.notes`, timestamps |
| **✅ Tasks** | Today Intention Manager | Checkbox strike-through, priority tags, "Set as Flow Focus" binding |
| **🔥 Flow** | Focus Engine & Analytics | Circular SVG progress ring timer, duration presets, 7-day canvas chart |
| **💻 Terminal** | `aura-sh` System Shell | `help`, `neofetch`, `theme`, `wallpaper`, `flow`, `soundscape`, `clear`, `codelab`, `cypher`, `hash`, `b64`, `randpass` |
| **🔢 Calculator** | Standard & Scientific | Full keyboard support, calculation history tape, error recovery |
| **⚙️ Settings** | System Preferences | Dark/Light themes, accent color palette, live running mini canvas wallpapers, data reset |
| **ℹ️ About** | Hardware Specification Card | WebKernel build, memory footprint, browser environment details |

---

## 🎨 Design DNA: "Warm Glass Over Light"

- **Typography**: 
  - **UI**: [Sora](https://fonts.google.com/specimen/Sora) (geometric sans)
  - **Numbers / Clocks / Terminal**: [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) with tabular figure alignment
- **Themes**:
  - **Charcoal Dark Mode**: `#0e0f13` base with translucent glass surfaces (`rgba(255,255,255,0.06-0.12)`)
  - **Warm Paper Light Mode**: `#f4f1ea` base with soft tactile glass (`rgba(0,0,0,0.04-0.08)`)
- **Accent Color Palette**: Warm Coral (`#ff7849`), Amber Ochre (`#e5983b`), Sage Green (`#4e9b7a`), Terracotta (`#d9654d`), Dune Sand (`#d1a87b`), Nordic Frost (`#6a9eb5`).
- **Generative Wallpaper Canvas**: 4–6 orbital blobs running at 1/3 viewport resolution with additive blending and CSS upscale blur. Presets: *Calm Dawn*, *Deep Water*, and *Night Ember*.

---

## ⚡ Getting Started

### Method 1: Instant Browser Run
Simply double-click `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari, Brave).

### Method 2: Local Static Server
```bash
# Clone the repository
git clone https://github.com/your-username/flow-os.git
cd flow-os

# Start a local static server
python -m http.server 8080
# or
npx serve .
```
Open `http://localhost:8080` in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Spotlight Search |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | Lock Screen |
| <kbd>Esc</kbd> | Close Spotlight, Menus, or active Modal |
| <kbd>⌘</kbd> + <kbd>W</kbd> | Close Active Window |
| <kbd>⌘</kbd> + <kbd>M</kbd> | Minimize All Windows |
| <kbd>Enter</kbd> (on Lock Screen) | Unlock Flow OS |

---

## 🔒 Privacy & Persistence Guarantee

Flow OS runs **100% client-side**.
- **No external APIs**
- **No tracking or analytics**
- **No server connections**
- All settings, notes, tasks, and flow sessions persist securely in your browser's `localStorage` under namespaced keys:
  - `flow.settings`
  - `flow.notes`
  - `flow.tasks`
  - `flow.sessions`
  - `flow.codelab`
  - `flow.files`

---

## 📄 License

MIT License © 2026 Flow OS Contributors. Authored for deep work and human focus.

---

## Code Lab - Write & Run Real Code (NEW)

Open **Code Lab** from the dock (or Spotlight -> "Code Lab", or type `codelab` in the Terminal):

- **JavaScript** - instant execution in a sandboxed iframe with a live console bridge
- **TypeScript** - transpiled in your browser via Babel standalone (lazy-loaded from unpkg on first run)
- **React 18 (TSX)** - React UMD injected into the sandbox; define a component named `App` and it auto-mounts in the split preview pane
- **HTML Live** - instant visual preview of your HTML / CSS / JS
- Line-numbered editor, Tab indentation, `Ctrl/Cmd + Enter` to run, per-language sources autosaved to `flow.codelab`

## Cypher Mode - Offline Cryptography Workstation (NEW)

Arm it from the new **Cypher** menu in the menu bar, the Control Center tile, Settings, Spotlight, or type `cypher on` in the Terminal:

- System-wide state shift: green **matrix** wallpaper preset, ambient scanline overlay, glowing CYPHER tray badge (fully restored on disarm)
- **Cipher Vault** app (dock + Spotlight):
  - **AES-256-GCM** encrypt/decrypt with PBKDF2 (150,000 rounds) - payloads are portable `FV1.<base64>` strings
  - **SHA-1 / SHA-256 / SHA-384 / SHA-512** digests computed live as you type
  - **Base64** studio, UTF-8 safe
  - **Classical ciphers**: Caesar (shift slider incl. ROT13), Vigenere, Atbash
  - **Password Forge**: `crypto.getRandomValues` entropy, live strength meter, look-alike exclusion
- Terminal ops: `cypher on|off|status`, `hash <text>`, `b64 <encode|decode> <text>`, `randpass [len]`
- 100% offline: keys and plaintext never leave the device (WebCrypto only)

## Real Filesystem in Files (NEW)

The Files app now has a working hierarchical filesystem persisted to `flow.files`:

- **New Folder** and **New File** create real items in the current folder
- Double-click folders to navigate; breadcrumb and sidebar quick navigation
- Double-click files for an in-window text preview; hover an item for delete (folders delete recursively, with confirm)
- **Upload** imports local text files into the virtual disk
- Terminal `ls` now lists the real Home folder
