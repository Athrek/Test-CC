// A tiny pixel buffer used to compose sprites before blitting them to a canvas.
import { hexToRgb } from './util.js';

export class PixelBuffer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.px = new Array(w * h).fill(null);
  }

  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.px[y * this.w + x];
  }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  // Filled ellipse. `fn(x, y, nx, ny)` may return a color per pixel for shading.
  ellipse(cx, cy, rx, ry, c, fn) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / (rx + 0.5), ny = (y - cy) / (ry + 0.5);
        if (nx * nx + ny * ny <= 1) this.set(x, y, fn ? fn(x, y, nx, ny) : c);
      }
    }
  }

  line(x0, y0, x1, y1, c, t = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps, y = y0 + ((y1 - y0) * i) / steps;
      if (t === 1) this.set(x, y, c);
      else this.rect(Math.round(x - (t - 1) / 2), Math.round(y - (t - 1) / 2), t, t, c);
    }
  }

  // Polyline through points, with thickness.
  path(pts, c, t = 1) {
    for (let i = 0; i < pts.length - 1; i++) this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c, t);
  }

  // Scanline polygon fill.
  poly(pts, c) {
    const ys = pts.map((p) => p[1]);
    const minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
    for (let y = minY; y <= maxY; y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) {
          xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i < xs.length - 1; i += 2) {
        for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) this.set(x, y, c);
      }
    }
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      this.line(ax, ay, bx, by, c);
    }
  }

  // Adds a 1px outline around every filled region (empty pixels touching filled ones).
  outline(c) {
    const add = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
      }
    }
    for (const [x, y] of add) this.set(x, y, c);
  }

  // Replace every pixel with a single color (used for silhouettes / flashes).
  fillAll(c) {
    for (let i = 0; i < this.px.length; i++) if (this.px[i]) this.px[i] = c;
  }

  toCanvas() {
    const cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    const cache = {};
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i];
      if (!c) continue;
      const rgb = cache[c] || (cache[c] = hexToRgb(c));
      img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

// Draws a small bitmap described by strings ('.' = empty, other chars map through `pal`).
export function bitmap(rows, pal) {
  const pb = new PixelBuffer(rows[0].length, rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') pb.set(x, y, pal[ch]); }));
  return pb.toCanvas();
}
