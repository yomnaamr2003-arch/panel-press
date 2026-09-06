const canvas = document.getElementById('meme-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const fileInput      = document.getElementById('file-input');
const templateGrid   = document.getElementById('template-grid');
const topTextInput   = document.getElementById('top-text');
const bottomTextInput= document.getElementById('bottom-text');
const fontSelect     = document.getElementById('font-select');
const colorSelect    = document.getElementById('color-select');
const sizeSelect     = document.getElementById('size-select');
const sizeValue      = document.getElementById('size-value');
const outlineToggle  = document.getElementById('outline-toggle');
const uppercaseToggle= document.getElementById('uppercase-toggle');
const downloadBtn    = document.getElementById('download-btn');
const downloadHint   = document.getElementById('download-hint');
const sfxStamp       = document.getElementById('sfx-stamp');

/* -----------------------------------------------------------
   State
----------------------------------------------------------- */
const state = {
  uploadedImage: null,   // HTMLImageElement | null
  template: 'blank',
};

/* -----------------------------------------------------------
   Original, hand-drawn canvas templates (no external assets,
   so exports never hit canvas tainting / CORS issues)
----------------------------------------------------------- */
const TEMPLATES = {
  blank: {
    label: 'Blank',
    draw(c) {
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, W, H);
    },
  },
  burst: {
    label: 'Halftone Burst',
    draw(c) {
      c.fillStyle = '#ffd23f';
      c.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      c.fillStyle = '#ff3d3d';
      const spikes = 14;
      c.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? Math.max(W, H) * 0.62 : Math.max(W, H) * 0.4;
        const a = (Math.PI * i) / spikes;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.closePath();
      c.fill();
      // halftone dots overlay
      c.fillStyle = 'rgba(23,22,28,0.12)';
      for (let y = 6; y < H; y += 16) {
        for (let x = 6; x < W; x += 16) {
          c.beginPath();
          c.arc(x, y, 2, 0, Math.PI * 2);
          c.fill();
        }
      }
    },
  },
  skyline: {
    label: 'Duotone Skyline',
    draw(c) {
      const grad = c.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#2f6fed');
      grad.addColorStop(1, '#1c4fc4');
      c.fillStyle = grad;
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#ffd23f';
      c.beginPath();
      c.arc(W * 0.76, H * 0.28, 60, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#17161c';
      const buildings = [
        [0, 260, 90, H], [90, 200, 160, H], [150, 300, 230, H],
        [220, 150, 300, H], [290, 260, 380, H], [360, 190, 460, H],
        [430, 320, 540, H], [520, 230, 640, H],
      ];
      buildings.forEach(([x1, y1, x2]) => c.fillRect(x1, y1, x2 - x1, H - y1));
    },
  },
  grid: {
    label: 'Grid Pop',
    draw(c) {
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#ff3d3d';
      const step = 40;
      for (let y = 0, row = 0; y < H; y += step, row++) {
        for (let x = 0; x < W; x += step) {
          if ((row + x / step) % 2 === 0) {
            c.beginPath();
            c.arc(x + step / 2, y + step / 2, 12, 0, Math.PI * 2);
            c.fill();
          }
        }
      }
    },
  },
};

/* -----------------------------------------------------------
   Build template picker thumbnails
----------------------------------------------------------- */
Object.entries(TEMPLATES).forEach(([key, tpl]) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'template-thumb' + (key === state.template ? ' active' : '');
  btn.setAttribute('role', 'option');
  btn.setAttribute('aria-label', tpl.label);
  btn.title = tpl.label;

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 80;
  thumbCanvas.height = 80;
  const tctx = thumbCanvas.getContext('2d');
  tctx.save();
  tctx.scale(80 / W, 80 / H);
  tpl.draw(tctx);
  tctx.restore();

  btn.appendChild(thumbCanvas);
  btn.addEventListener('click', () => {
    state.template = key;
    state.uploadedImage = null;
    fileInput.value = '';
    [...templateGrid.children].forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    render();
  });

  templateGrid.appendChild(btn);
});

/* -----------------------------------------------------------
   Upload handling
----------------------------------------------------------- */
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    downloadHint.textContent = 'That file isn\u2019t an image \u2014 try a JPG, PNG, or WEBP.';
    return;
  }

  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      state.uploadedImage = img;
      [...templateGrid.children].forEach((el) => el.classList.remove('active'));
      render();
    };
    img.onerror = () => {
      downloadHint.textContent = 'Couldn\u2019t read that image. Try a different file.';
    };
    img.src = evt.target.result;
  };
  reader.onerror = () => {
    downloadHint.textContent = 'Couldn\u2019t read that file. Please try again.';
  };
  reader.readAsDataURL(file);
});

/* -----------------------------------------------------------
   Draw an uploaded photo scaled + cropped to cover the canvas
----------------------------------------------------------- */
function drawImageCover(img) {
  const canvasRatio = W / H;
  const imgRatio = img.width / img.height;
  let sx, sy, sw, sh;

  if (imgRatio > canvasRatio) {
    sh = img.height;
    sw = sh * canvasRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / canvasRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
}

/* -----------------------------------------------------------
   Text rendering: word-wrap + auto-shrink to fit canvas width
----------------------------------------------------------- */
function wrapText(text, maxWidth, font) {
  ctx.font = font;
  const words = text.split(' ');
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function fitFontSize(text, maxWidth, family, startSize) {
  let size = startSize;
  while (size > 14) {
    const lines = wrapText(text, maxWidth, `${size}px ${family}`);
    const longest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (longest <= maxWidth && lines.length <= 3) return { size, lines };
    size -= 2;
  }
  return { size, lines: wrapText(text, maxWidth, `${size}px ${family}`) };
}

function drawCaption(text, family, baseSize, color, outline, uppercase, position) {
  if (!text.trim()) return;
  const display = uppercase ? text.toUpperCase() : text;
  const maxWidth = W - 48;
  const { size, lines } = fitFontSize(display, maxWidth, family, baseSize);

  ctx.font = `${size}px ${family}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const lineHeight = size * 1.15;
  const totalHeight = lineHeight * lines.length;
  let y = position === 'top'
    ? 20 + size
    : H - 20 - totalHeight + size;

  lines.forEach((line) => {
    if (outline) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(2, size / 12);
      ctx.strokeText(line, W / 2, y);
    }
    ctx.fillText(line, W / 2, y);
    y += lineHeight;
  });
}

/* -----------------------------------------------------------
   Main render
----------------------------------------------------------- */
function render() {
  ctx.clearRect(0, 0, W, H);

  if (state.uploadedImage) {
    drawImageCover(state.uploadedImage);
  } else {
    TEMPLATES[state.template].draw(ctx);
  }

  const family = fontSelect.value;
  const size = parseInt(sizeSelect.value, 10);
  const color = colorSelect.value;
  const outline = outlineToggle.checked;
  const uppercase = uppercaseToggle.checked;

  drawCaption(topTextInput.value, family, size, color, outline, uppercase, 'top');
  drawCaption(bottomTextInput.value, family, size, color, outline, uppercase, 'bottom');
}

/* -----------------------------------------------------------
   Live control bindings
----------------------------------------------------------- */
[topTextInput, bottomTextInput, fontSelect, colorSelect, outlineToggle, uppercaseToggle].forEach((el) => {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
});

sizeSelect.addEventListener('input', () => {
  sizeValue.textContent = `${sizeSelect.value}px`;
  render();
});

/* -----------------------------------------------------------
   Download / export
----------------------------------------------------------- */
downloadBtn.addEventListener('click', () => {
  try {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'panel-press-meme.png';
    document.body.appendChild(a);
    a.click();
    a.remove();

    downloadHint.textContent = 'Saved to your downloads folder.';
    sfxStamp.classList.remove('show');
    void sfxStamp.offsetWidth;
    sfxStamp.classList.add('show');
    setTimeout(() => sfxStamp.classList.remove('show'), 1400);
  } catch (err) {
    console.error(err);
    downloadHint.textContent = 'Export failed \u2014 please try a different image.';
  }
});

/* -----------------------------------------------------------
   Init
----------------------------------------------------------- */
render();
