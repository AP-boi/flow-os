# Flow OS

A lightweight, web-based desktop environment built from scratch in vanilla JavaScript, HTML5 Canvas, and WebAudio API.

Flow OS is designed around distraction-free productivity. It combines a clean macOS-style menu bar and dock with Windows-style snap window tiling, a built-in focus timer, ambient sound generators, a terminal, and a sandboxed live code playground.

Everything runs entirely in the browser with zero dependencies, zero build steps, and zero backend servers.

---

## Why I Built This

I wanted to see how far I could push pure browser APIs (Canvas, WebAudio, WebCrypto, and DOM pointer events) to build a fast, responsive desktop environment in a single, portable file.

Instead of just cloning an existing OS interface, I built tools directly into the desktop that help me stay focused:
- **Focus Timer (Flow Sessions)**: Integrated 25m, 50m, and 90m interval timers that dim background distractions and track deep work streaks.
- **Synthesized Ambient Audio**: Generates brown noise, rain, café ambience, and wind directly in real-time using mathematical oscillators and noise buffers — no static MP3 files needed.
- **Code Lab**: An in-browser code editor and runner for JavaScript, TypeScript, React (TSX), and live HTML with an integrated console.
- **Cipher Vault**: An offline cryptography utility powered by the browser's native `window.crypto.subtle` API for AES-GCM encryption, hashing, and password generation.

---

## Core Features & Architecture

### 1. Window Management
- Custom pointer event handling (`setPointerCapture`) for smooth window dragging with physical inertia.
- 8-directional window resizing handles (`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`).
- Window snapping: Drag to top for full screen, left/right edges for 50/50 splits, or use the hover snap flyout on the green maximize button.
- Smooth genie-style minimization and restoration into the dock.

### 2. Live Code Lab (`Code Lab`)
- Write and run **JavaScript**, **TypeScript**, **React 18 (TSX)**, and **HTML**.
- Code runs in an isolated `<iframe>` sandbox with a postMessage console bridge that streams `console.log`, `console.warn`, and `console.error` directly to the output panel.
- Supports keyboard shortcut (`Ctrl + Enter` / `Cmd + Enter`) to run.

### 3. WebAudio Ambient Synthesizer
- **Rain**: Pink/white noise filtered through a lowpass biquad filter with randomized high-frequency water droplet blips.
- **Brown Noise**: Integrated Brownian random walk noise with a gentle lowpass curve at 360Hz.
- **Wind**: Resonant bandpass filter modulated by a slow 0.15Hz low-frequency oscillator (LFO).
- **Café**: Bandpassed Brownian noise with harmonic ambient tones.

### 4. Offline Cryptography (Cipher Vault)
- **AES-256-GCM** encryption and decryption using PBKDF2 key derivation (150,000 iterations).
- **SHA Hashing**: Real-time SHA-1, SHA-256, SHA-384, and SHA-512 digests.
- **Base64**: UTF-8 safe text encoding/decoding.
- **Password Generator**: Cryptographically secure random passwords using `crypto.getRandomValues`.

### 5. Desktop Shell & Utilities
- **Spotlight Search (`Cmd + K` / `Ctrl + K`)**: Quick launcher for apps, system actions, and searching stored notes.
- **Virtual Filesystem**: Create folders, files, import local text files, and manage files in localStorage.
- **Notes & Tasks**: Autosaving markdown notes and task checklists with priority tags.
- **Terminal (`aura-sh`)**: Command line interface with system commands (`help`, `ls`, `theme`, `flow`, `soundscape`, `neofetch`, `clear`, etc.).
- **Themes**: Charcoal dark mode and warm paper light mode with custom accent colors.

---

## Getting Started

No build process, bundler, or installation required.

### 1. Direct Browser Launch
Open `index.html` directly in any modern browser (Chrome, Firefox, Safari, Edge).

### 2. Running via a Local Server
If you prefer running through a local development server:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js
npx serve .
```

Then visit `http://localhost:8080` in your browser.

---

## Project Structure

```
flow-os/
├── index.html       # Monolithic client OS (CSS, HTML layout, Kernel & Apps)
├── components/      # Standalone React UI components & demos
│   ├── background-gradient-animation-demo.tsx
│   └── ui/
│       └── background-gradient-animation.tsx
├── lib/
│   └── utils.ts     # Classname merging utility (cn)
├── components.json  # shadcn/ui configuration
├── tsconfig.json    # TypeScript configuration
├── LICENSE          # MIT License
└── README.md
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Spotlight Search |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | Lock Screen |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Run Code in Code Lab |
| <kbd>Cmd</kbd> + <kbd>W</kbd> | Close active window |
| <kbd>Cmd</kbd> + <kbd>M</kbd> | Minimize all windows |
| <kbd>Esc</kbd> | Close open menus, Spotlight, or modals |

---

## Persistence & Privacy

All application data (notes, tasks, files, code snippets, settings) is stored locally in your browser via `localStorage` under namespaced keys (`flow.settings`, `flow.notes`, `flow.tasks`, `flow.files`, `flow.codelab`). No external telemetry, no remote servers.

---

## License

MIT License. Feel free to use, modify, and build upon this project.
