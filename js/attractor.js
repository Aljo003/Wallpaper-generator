// Strange-attractor generative mode: iterates a 2D chaotic map (Clifford / De Jong /
// Svensson) and plots every visited point. Attractor coordinates come out in the map's
// own natural range, so runAttractor() first samples the trajectory to find its bounding
// box, then scales/centers it to fill the canvas — the attractor equivalent of flowfield.js
// normalizing particle coordinates to canvas size.

const ATTRACTOR_FORMULAS = {
  clifford: {
    label: 'Clifford',
    range: 3,
    fallback: [-1.4, 1.6, 1.0, 0.7],
    step(x, y, a, b, c, d) {
      return [
        Math.sin(a * y) + c * Math.cos(a * x),
        Math.sin(b * x) + d * Math.cos(b * y),
      ];
    },
  },
  dejong: {
    label: 'De Jong',
    range: 3,
    fallback: [1.4, -2.3, 2.4, -2.1],
    step(x, y, a, b, c, d) {
      return [
        Math.sin(a * y) - Math.cos(b * x),
        Math.sin(c * x) - Math.cos(d * y),
      ];
    },
  },
  svensson: {
    label: 'Svensson',
    range: 3,
    fallback: [1.4, 1.56, 1.4, -6.56],
    step(x, y, a, b, c, d) {
      return [
        d * Math.sin(a * x) - Math.sin(b * y),
        c * Math.cos(a * x) + Math.cos(b * y),
      ];
    },
  },
};

// Random (a, b, c, d) combos frequently diverge, or collapse onto a fixed point / tiny
// limit cycle instead of tracing a full chaotic attractor. Sample from the seed's RNG
// stream until one stays bounded AND spreads across a large enough area to make an
// interesting wallpaper; fall back to known-good constants if none does within the budget.
// The bounding box found here is reused directly to scale/center the attractor to canvas.
const MIN_ATTRACTOR_AREA = 3;

function pickAttractorParams(rand, formula) {
  const maxTries = 40;
  let fallbackBounds = null;
  for (let t = 0; t < maxTries; t++) {
    const a = (rand() * 2 - 1) * formula.range;
    const b = (rand() * 2 - 1) * formula.range;
    const c = (rand() * 2 - 1) * formula.range;
    const d = (rand() * 2 - 1) * formula.range;

    let x = 0, y = 0, bounded = true;
    for (let i = 0; i < 300; i++) {
      [x, y] = formula.step(x, y, a, b, c, d);
      if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e4 || Math.abs(y) > 1e4) {
        bounded = false;
        break;
      }
    }
    if (!bounded) continue;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < 4000; i++) {
      [x, y] = formula.step(x, y, a, b, c, d);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const bounds = { minX, maxX, minY, maxY };
    if ((maxX - minX) * (maxY - minY) >= MIN_ATTRACTOR_AREA) {
      return { a, b, c, d, bounds };
    }
    if (!fallbackBounds) fallbackBounds = { a, b, c, d, bounds };
  }
  // Nothing cleared the area bar within the budget — use the least-degenerate
  // bounded candidate found, or the formula's known-good constants as a last resort.
  if (fallbackBounds) return fallbackBounds;
  const [a, b, c, d] = formula.fallback;
  return { a, b, c, d, bounds: null };
}

function runAttractor(ctx, w, h, params, seed, opts) {
  opts = opts || {};
  const rand = mulberry32(seed);
  const formula = ATTRACTOR_FORMULAS[params.attractorType] || ATTRACTOR_FORMULAS.clifford;
  const { a, b, c, d, bounds } = pickAttractorParams(rand, formula);

  // pickAttractorParams already sampled a bounding box while vetting the params; only
  // the last-resort fallback constants need it computed fresh here.
  let minX, maxX, minY, maxY;
  if (bounds) {
    ({ minX, maxX, minY, maxY } = bounds);
  } else {
    let x = 0, y = 0;
    for (let i = 0; i < 200; i++) [x, y] = formula.step(x, y, a, b, c, d);
    minX = Infinity; maxX = -Infinity; minY = Infinity; maxY = -Infinity;
    for (let i = 0; i < 4000; i++) {
      [x, y] = formula.step(x, y, a, b, c, d);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  const pad = 0.92;
  const scale = Math.min((w * pad) / spanX, (h * pad) / spanY);
  const offX = w / 2 - ((minX + maxX) / 2) * scale;
  const offY = h / 2 - ((minY + maxY) / 2) * scale;

  // Multiple independent trails converge onto the same attractor set from different
  // phases, filling the shape faster and more evenly than a single long trajectory.
  const count = opts.overrideCount || params.density;
  const points = new Array(count);
  for (let i = 0; i < count; i++) {
    let sx = (rand() * 2 - 1) * 0.5;
    let sy = (rand() * 2 - 1) * 0.5;
    const kick = Math.floor(rand() * 200);
    for (let k = 0; k < kick; k++) [sx, sy] = formula.step(sx, sy, a, b, c, d);
    points[i] = { x: sx, y: sy };
  }

  const rampSteps = 32;
  const ramp = buildColorRamp(params.colorStart, params.colorEnd, params.opacity, rampSteps);
  const dot = Math.max(0.5, params.pointSize * (w / BASE_W));

  function stepOnce() {
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const [nx, ny] = formula.step(pt.x, pt.y, a, b, c, d);
      pt.x = nx; pt.y = ny;
      const cx = nx * scale + offX;
      const cy = ny * scale + offY;
      ctx.fillStyle = ramp[rampIndex((nx - minX) / spanX, rampSteps)];
      ctx.fillRect(cx - dot / 2, cy - dot / 2, dot, dot);
    }
  }

  return stepOnce;
}
