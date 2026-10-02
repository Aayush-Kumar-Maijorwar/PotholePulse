import { formatTimestamp } from './format';

// Deterministic PRNG (mulberry32) seeded from the report's numeric
// imageSeed, so the same report always redraws the same mock photo
// instead of a fresh random image on every open.
function seededRandom(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draws a plausible mock "captured frame" entirely in-browser: an
// asphalt road surface, a faded lane divider, a type-specific hazard
// shape, light noise texture, and a corner timestamp watermark.
export function drawMockPhoto(canvas, report) {
  if (!canvas || !report) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const seed = typeof report.imageSeed === 'number' ? report.imageSeed : 1;
  const rand = seededRandom(seed);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#75797D');
  grad.addColorStop(1, '#4F5255');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 650; i++) {
    const nx = rand() * w;
    const ny = rand() * h;
    const shade = Math.round(rand() * 40 - 20);
    const c = 128 + shade;
    ctx.fillStyle = `rgba(${c},${c},${c},${0.05 + rand() * 0.08})`;
    ctx.fillRect(nx, ny, 1.5, 1.5);
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(224,194,58,0.55)';
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  const topX = w * 0.54 + (rand() - 0.5) * 24;
  ctx.moveTo(topX, 0);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.restore();

  const cx = w * (0.38 + rand() * 0.24);
  const cy = h * (0.6 + rand() * 0.16);

  if (report.type === 'pothole') {
    const r = 20 + rand() * 16;
    ctx.beginPath();
    const pts = 10;
    for (let p = 0; p <= pts; p++) {
      const ang = (p / pts) * Math.PI * 2;
      const rr = r * (0.7 + rand() * 0.5);
      const px = cx + Math.cos(ang) * rr;
      const py = cy + Math.sin(ang) * rr * 0.7;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#1B1B1B';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.2, cy - r * 0.15, r * 0.35, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
  } else if (report.type === 'crack') {
    ctx.strokeStyle = '#161616';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let x = cx - 42;
    let y = cy + 18;
    ctx.moveTo(x, y);
    const segs = 8;
    for (let s = 0; s < segs; s++) {
      x += 84 / segs + (rand() - 0.5) * 10;
      y += (rand() - 0.5) * 18;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    let bx = cx - 6;
    let by = cy;
    ctx.moveTo(bx, by);
    for (let j = 0; j < 4; j++) {
      bx += 8 + rand() * 8;
      by += 10 + rand() * 10;
      ctx.lineTo(bx, by);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(40,44,48,0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy - 26, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 18);
    ctx.quadraticCurveTo(cx, cy - 22, cx + 10, cy - 18);
    ctx.lineTo(cx + 8, cy + 18);
    ctx.lineTo(cx - 8, cy + 18);
    ctx.closePath();
    ctx.fill();
  }

  const camId = 'CAM-0' + ((Math.abs(seed) % 4) + 1);
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textBaseline = 'bottom';
  ctx.fillText(camId + '   ' + formatTimestamp(report.timestamp), 8, h - 6);
}
