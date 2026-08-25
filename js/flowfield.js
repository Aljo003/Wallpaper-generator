// Core flow-field particle simulation. Coordinates are normalized (x/w, y/h)
// before hitting the noise field, so the same seed + params look consistent
// at any canvas resolution — that's what makes the low-res preview and the
// full-res PNG export produce the same composition.

const BASE_W = 960, BASE_H = 540;

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function runFlowField(ctx, w, h, params, seed, opts) {
  opts = opts || {};
  const noise2D = buildNoise(seed);
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const linScale = w / BASE_W;

  const count = opts.overrideCount || params.density;
  const particles = new Array(count);
  for (let i = 0; i < count; i++) {
    particles[i] = {
      x: rand() * w,
      y: rand() * h,
      life: Math.floor(rand() * params.life),
    };
  }

  const { r, g, b } = hexToRgb(params.color);
  ctx.strokeStyle = `rgba(${r},${g},${b},${params.opacity})`;
  ctx.lineWidth = params.lineWidth * linScale;
  ctx.lineCap = 'round';

  const stepLen = params.speed * Math.min(w, h) * 0.0016;

  function stepOnce() {
    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const nx = pt.x / w, ny = pt.y / h;
      const n = noise2D(nx * params.fieldScale, ny * params.fieldScale);
      const angle = n * Math.PI * 2 * params.curl;
      const nxp = pt.x + Math.cos(angle) * stepLen;
      const nyp = pt.y + Math.sin(angle) * stepLen;

      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(nxp, nyp);
      ctx.stroke();

      pt.x = nxp; pt.y = nyp; pt.life++;

      if (pt.life > params.life || pt.x < 0 || pt.x > w || pt.y < 0 || pt.y > h) {
        pt.x = rand() * w;
        pt.y = rand() * h;
        pt.life = 0;
      }
    }
  }

  return stepOnce;
}
