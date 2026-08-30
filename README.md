# Flow OS

> **Live Demo:** [flowosv1.vercel.app](https://flowosv1.vercel.app)

A single-file browser desktop operating system built in vanilla JavaScript, HTML5 Canvas, and the WebAudio API.

Flow OS is structured as a dedicated deep-work workstation. It couples a unified window manager (window snapping, 8-directional pointer capture resizing, spring-damped dock magnification) with an integrated productivity suite: multi-track ambient soundscape synthesis, a global quick-capture scratchpad drawer, an in-browser Babel code playground with virtual filesystem integration, client-side WebCrypto cryptography tools, and focus session reflection auditing.

The entire operating system runs in the browser without node build steps, external runtime dependencies, or backend services.

---

## Architectural Decisions & Trade-offs

### 1. Single-File Vanilla Architecture vs. Component Bundlers
I chose a zero-framework architecture over a heavy React/Vite build pipeline to keep runtime initialization immediate (<12ms parse time) and allow the system to run directly from `file://` or any static host. Window state management, z-index elevation stacks, and drag physics are coordinated through a single authoritative event loop rather than distributed component lifecycles.

### 2. Multi-Track WebAudio Synthesis vs. Static Audio Assets
Instead of bundling multi-megabyte MP3 files that require network streaming, ambient soundscapes are synthesized directly on the audio thread using mathematical noise buffers (Brownian random walk and pink noise), biquad filters, LFO modulation, and dual-oscillator binaural beat generation (10Hz alpha focus frequency). This yields zero bandwidth cost, zero playback looping artifacts, and simultaneous multi-layer track mixing.

### 3. Pointer Capture Resizing & Friction-Compensated Snapping
Window dragging and resizing uses the HTML5 Pointer Events API (`setPointerCapture` and `releasePointerCapture`) to prevent cursor detachment during rapid mouse movement over iframe sandboxes or canvas surfaces. Snapping employs a screen-edge threshold detector with visual drop targets and hover flyout presets on window maximize controls.

---

## Feature Overview

### 1. Multi-Track Ambient Soundscape Mixer
- Concurrent multi-layer synthesis: Rain (lowpass noise + random droplet oscillators), Brownian noise (360Hz integrated random walk), Wind (bandpass filter modulated by a 0.15Hz LFO), Café ambiance, and Binaural Beats (216Hz left / 226Hz right alpha drone).
- Real-time track faders (0–100%) and quick presets (Cozy Rain, Café Work, Deep Zen, Storm) in both Control Center and System Settings.

### 2. Zen Quick-Capture HUD (Scratchpad Drawer)
- Global `Alt + Space` hotkey summons an elevated scratchpad drawer from the top of the screen.
- Auto-syncs ephemeral thoughts to `flow.scratchpad` in localStorage.
- Instant "Save as Note" action bridges scratchpad drafts directly into the persistent Notes app.

### 3. Code Lab & Virtual Filesystem Bridge
- Multi-mode code runner supporting plain JavaScript, TypeScript (browser-transpiled via Babel), React 18 (TSX with live component mounting), and HTML preview.
- Console bridge streams stdout/stderr from sandboxed execution iframes into a synchronized console pane.
- **Snippet Vault**: Direct bridge between Code Lab and the virtual filesystem (`/Home/Snippets`), allowing one-click saving, file browsing, and script execution.

### 4. Focus Session Reflection & Productivity Audit
- Deep work timers (25m sprint, 50m block, 90m ultradian) with Distraction Shield overlay.
- End-of-session reflection prompt: 5-star depth rating, interruption tracking, and accomplishment logging.
- Session Audit Log tab in Flow & Analytics with one-click **Markdown** and **JSON** export for external habit tracking.

### 5. Offline Cryptography Workstation (Cipher Vault)
- AES-256-GCM authenticated encryption/decryption using PBKDF2 key derivation (150,000 iterations).
- Real-time cryptographic digests (SHA-1, SHA-256, SHA-384, SHA-512) and password generation via `crypto.getRandomValues`.

### 6. Desktop Shell & File Management
- Spotlight Search (`Cmd + K` / `Ctrl + K`) indexer across installed apps, user notes, and system actions.
- Virtual hierarchical filesystem with folder navigation, breadcrumb pathing, and text file import/export.
- Dark (Charcoal Slate) and Light (Raw Linen) themes with custom accent palettes.

---

## Getting Started

No build process, package installation, or compiler toolchain is required.

### 1. Direct Browser Launch
Double-click `index.html` to open directly in any modern web browser (Chrome, Firefox, Safari, Edge).

### 2. Local Static Server
If running through a local development server:

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

Navigate to `http://localhost:8080`.

---

## Project Structure

```
flow-os/
├── index.html       # Monolithic desktop OS (CSS design system, DOM shell, Kernel & Apps)
├── components/      # Standalone UI components & React preview targets
│   ├── background-gradient-animation-demo.tsx
│   └── ui/
│       └── background-gradient-animation.tsx
├── lib/
│   └── utils.ts     # Classname merging utility
├── components.json  # Component configuration
├── tsconfig.json    # TypeScript configuration
├── LICENSE          # MIT License
└── README.md        # Technical documentation & usage instructions
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Alt</kbd> + <kbd>Space</kbd> | Toggle Zen Quick-Capture Scratchpad |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Spotlight Search |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | Lock Screen |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Run Code in Code Lab |
| <kbd>Cmd</kbd> + <kbd>W</kbd> | Close active window |
| <kbd>Cmd</kbd> + <kbd>M</kbd> | Minimize all windows |
| <kbd>Esc</kbd> | Dismiss modals, Spotlight, Scratchpad, and menus |

---

## Storage & Privacy

All user data (notes, tasks, virtual files, code snippets, mixer preferences, and audit logs) is persisted locally in the browser via `localStorage` under namespaced keys:
- `flow.settings`
- `flow.notes`
- `flow.tasks`
- `flow.files`
- `flow.codelab`
- `flow.sessions`
- `flow.scratchpad`

No telemetry or external network calls are made during core operation.

---

## License

MIT License. See [LICENSE](LICENSE) for full terms.
