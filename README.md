# Flow OS

A lightweight, browser-based desktop environment built for coders, cryptographers, and reverse-engineering enthusiasts. Everything runs 100% client-side in memory with zero external dependencies or server requirements.

## Overview

Flow OS is an offline workstation packaged into a single page. It bundles developer playgrounds, classic and modern cryptographic suites, in-browser execution environments, and desktop utilities into a responsive window manager.

### Features
- **Cryptography & Encoding**: AES-256-GCM vault with PBKDF2 key derivation, LSB image steganography, Shannon entropy analyzer (0.0 to 8.0 bits/byte), JWT inspector, and 16 ciphers/codecs (Caesar with 26-shift brute-force matrix, Base58/32/64, Hex, XOR, Vigenère, MD5, SHA digests).
- **Multi-Language Sandbox**: Interactive REPL and runner for JavaScript (ES2024), Python scripts, live HTML/CSS canvas preview, in-memory SQL queries, and a 30,000-cell Brainfuck interpreter.
- **Desktop Utilities**: Programmer calculator with synchronized Hex/Dec/Oct/Bin bases and bitwise operators, virtual filesystem tree (`/home/user`, `/scripts`, `/crypto_keys`), markdown notepad, and procedural audio focus synthesizer (pink noise rain, saw drones, 60Hz hum).
- **Customization & Themes**: Independent wallpaper presets (Cyber Grid, PCB CAD, Matrix rain stream, Starfield particles, CRT scanlines, Minimal slate) + custom image upload, plus 4 phosphor theme palettes.
- **Session Controls**: Passphrase lock screen, warm reboot console sequence, and system shutdown.

## Getting Started

No build step or npm installation required. Open `index.html` in any modern web browser.

To serve locally:
```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

## Hotkeys

| Key | Description |
|---|---|
| `Win + L` / `Ctrl + Alt + L` | Lock session screen |
| `Alt + Tab` | App switcher HUD |
| `Win` / `Ctrl + Space` | Toggle Start menu |
| `Ctrl + Alt + T` / `Ctrl + \`` | Open RootShell terminal |
| `Escape` | Close active menu or HUD |

## Credits

Designed and architected by [AP-boi](https://github.com/AP-boi), built in collaboration with Antigravity AI.

## License
MIT
