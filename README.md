# Flow OS — Coder & Crypter Workstation

Flow OS is a browser-native desktop workstation and cryptanalysis environment built entirely with zero external runtime dependencies. Every cryptographic primitive, virtual filesystem structure, multi-language sandbox evaluator, and audio synthesizer operates directly in client memory via standard Web APIs (`SubtleCrypto`, `Canvas`, `Web Audio API`).

## Authorship & Collaboration

This system was engineered through a 50/50 human-AI pair programming workflow:
- **Human Contribution (50%)**: System architecture, cryptographic domain specifications, application layout requirements, security review, and design direction by **[AP-boi](https://github.com/AP-boi)**.
- **AI Contribution (50%)**: Algorithm implementations, zero-dependency data structures, interactive UI components, test harness, and AGENTS.md humanization passes by **Antigravity AI**.

---

## Technical Architecture & Trade-Offs

Flow OS avoids bundling heavy Node/npm runtimes in the browser. Instead, all functionality relies on native browser primitives to ensure instant zero-latency startup and complete air-gapped security:

- **Cryptographic Suite**:
  - Authenticated AES-256-GCM encryption with PBKDF2 (100,000 iterations, SHA-256) deriving 256-bit symmetric keys with 128-bit random salts and 96-bit initialization vectors.
  - 16 classic and modern codecs/ciphers: Caesar shift with a full 26-shift brute-force matrix, ROT13/47, Base32, Base58 (Bitcoin alphabet), Hex, 8-bit Binary ASCII, XOR stream with dynamic keying, Vigenère polyalphabetic, Atbash, Morse code, MD5, SHA-256/512 digests, and structured JWT token inspection.
  - Lossless LSB Image Steganography embedding a 32-bit big-endian payload length header across RGB bit-planes with procedural carrier generation.
  - Shannon Entropy analysis calculating accurate $H(X) = -\sum P(x_i) \log_2 P(x_i)$ scores ($0.000 \dots 8.000$ bits/byte) with live buffer classification.

- **Developer Sandbox & Code Playground**:
  - JavaScript ES2024 runtime with custom standard output interceptor (`console.log`, `console.warn`, `console.error`) and object return inspector.
  - Python-style script interpreter for loops, functions, and data structures.
  - Live sandboxed HTML/CSS canvas iframe rendering.
  - In-memory SQL relational query engine supporting `CREATE TABLE`, `INSERT INTO`, and `SELECT ... WHERE` conditions.
  - Complete 30,000-cell Brainfuck bytecode interpreter.

- **Desktop Productivity Suite**:
  - Programmer Calculator featuring synchronized 4-base conversion (Hex, Dec, Oct, grouped 16-bit Bin) alongside bitwise ALUs (`AND`, `OR`, `XOR`, `NOT`, `LSH`, `RSH`, `MOD`).
  - Virtual File Explorer managing a hierarchical tree in localStorage (`/home/user`, `/documents`, `/crypto_keys`, `/scripts`, `/root`).
  - Web Audio API procedural soundboard generating pink noise rain, dual detuned sawtooth neon drones, and 60Hz mainframe hums.
  - Multi-wallpaper engine supporting geometric grid mesh, PCB CAD blueprint, matrix rain streams, interactive canvas starfield, CRT phosphor scanlines, and custom image uploads.

---

## Quickstart

Flow OS requires no build steps, bundlers, or package installations.

### Running Locally
Open `index.html` directly in any modern web browser, or serve via a local static server:

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Alt + Tab` | Window switcher HUD |
| `Win` or `Ctrl + Space` | Toggle Start Menu |
| `Ctrl + Alt + T` or `Ctrl + \`` | Open RootShell Terminal |
| `Escape` | Dismiss active HUD or Start Menu |

---

## Repository
- Source: [https://github.com/AP-boi/flow-os](https://github.com/AP-boi/flow-os)
- License: MIT
