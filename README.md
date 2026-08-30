# VesperOS

A browser-based desktop environment built with vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no npm.

The window manager uses Pointer Events (`setPointerCapture` / `releasePointerCapture`) for drag operations because basic mouse events detach when the cursor leaves an element boundary during fast movement. Audio synthesis runs entirely on the WebAudio API thread — no pre-recorded assets, no streaming dependencies.

---

### Running it

Open `index.html` directly, or serve statically:

```bash
python -m http.server 8080
# or
npx serve .
```

### What's in the box

- **Window system** — draggable, closable, maximizable windows with z-index stacking and pointer capture
- **Evidence vault** — tree sidebar + detail preview, driven by a JS data array
- **Frequency synth** — 8-pad WebAudio oscillator with selectable waveforms, lowpass filter cutoff, and live canvas oscilloscope
- **Terminal auth** — password gate that unlocks the surveillance feed window
- **Keyboard shortcuts** — `Alt+1` through `Alt+4` open windows, number keys `1`-`8` trigger synth pads

### Structure

```
├── index.html
├── style.css
├── script.js
└── assets/
    ├── wallpapers/
    └── icons/
```

### Shortcuts

| Key | Action |
|:----|:-------|
| Alt + 1 | Open Dossier |
| Alt + 2 | Open Evidence |
| Alt + 3 | Open Synth |
| Alt + 4 | Open Terminal |
| 1–8 | Trigger synth pads |

---

MIT License. See [LICENSE](LICENSE).
