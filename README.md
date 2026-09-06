# 🎨 Panel Press

A comic-book styled meme generator — upload a photo (or pick a hand-drawn starter panel), caption it top and bottom, style the text, and print it out as a PNG.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## ✨ Features

- **Image selection or upload** — drop in your own photo, or pick from four original hand-drawn canvas templates (Blank, Halftone Burst, Duotone Skyline, Grid Pop) if you don't have one handy
- **Editable top & bottom captions** — type and watch the text render live on the canvas
- **Text styling controls** — 4 fonts (Anton, Impact, Permanent Marker, Comic Neue), size slider, colour picker, black-outline toggle, and an uppercase toggle for the classic meme look
- **Auto-fit text** — long captions wrap and shrink automatically so nothing overflows the canvas
- **Download as image** — exports the finished panel as a PNG in one click, entirely in-browser — nothing is ever uploaded to a server

## 🎨 Design concept

A comic-print identity instead of another dark glass panel:

| Element | Choice |
|---|---|
| Palette | Cream paper background, ink black, pop yellow/red/blue |
| Type | Bangers (headline) + Baloo 2 (UI) + Anton/Impact/Permanent Marker/Comic Neue (captions) |
| Texture | Halftone dot backdrop, thick comic-panel borders, hard drop shadows |
| Frame | The canvas sits inside a black "print frame" with corner rivets |

## 🛠️ Built with

- HTML5 `<canvas>`
- CSS3 (custom properties, halftone texture, comic borders)
- Vanilla JavaScript (ES6+, Canvas 2D API, FileReader API)

## 📁 Project structure

```
panel-press/
├── index.html      # Markup & structure
├── style.css       # Comic-print theme, layout
├── script.js       # Canvas drawing, templates, upload, export
└── README.md
```

## 🚀 Running locally

No build step needed — it's plain HTML/CSS/JS.

1. Download the three files into one folder
2. Open `index.html` in a browser, **or** serve it locally:
   ```bash
   npx serve .
   ```

## 🌍 Deploying to GitHub Pages

1. Create a new repo, e.g. `panel-press`
2. Push `index.html`, `style.css`, and `script.js` to the `main` branch
3. Go to **Settings → Pages** → set source to `main` / root
4. Your site will be live at `https://yomnaamr2003-arch.github.io/panel-press/`

## 🔍 How it works

1. You either upload a photo (read via `FileReader`, drawn onto the canvas with `drawImage`) or click a starter template (drawn with plain Canvas 2D shapes — no image files involved)
2. Typing in the top/bottom fields re-renders the canvas immediately
3. A word-wrap + auto-shrink routine measures each line with `measureText()` and reduces the font size until every line fits inside the canvas width
4. Clicking **Print it** calls `canvas.toDataURL('image/png')` and triggers a download

> **Why no bundled meme templates?** All four starter backgrounds are drawn with Canvas 2D primitives rather than image files. That avoids copyright issues with real meme templates, and — just as important — avoids "tainting" the canvas with cross-origin images, which would otherwise silently break the export step.

## 💡 Possible next steps

- Draggable text positioning (not just fixed top/bottom)
- A sticker/emoji layer
- A small library of more starter panels

---

Built by **Yomna Amr** as part of the Veda Technology Web Development Internship.
