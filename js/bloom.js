// "Bloom" generative mode: soft radial-gradient blobs drift slowly across the
// canvas along a noise field. Each frame layers them at low opacity onto the
// (never-cleared) canvas, so overlapping blobs build up into a soft nebula-like
// texture on the true-black background — the same "accumulate over many frames"
// idea flowfield.js and attractor.js use, just with soft circles instead of lines/dots.

function runBloom(ctx, w, h, params, seed, opts) {
  opts = opts || {};
  const noise2D = buildNoise(seed);
  const rand = mulberry32(seed ^ 0x2545f491);
  const minDim = Math.min(w, h);

  const count = opts.overrideCount || params.blobCount;
  const blobs = new Array(count);
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    blobs[i] = {
      x: rand() * w,
      y: rand() * h,
      radius: (params.blobSize / 100) * minDim * (0.6 + rand() * 0.8),
      noiseOffset: rand() * 1000,
      rgb: lerpRgb(params.colorStart, params.colorEnd, t),
    };
  }

  const drift = params.speed * minDim * 0.0006;

  function stepOnce() {
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const n = noise2D((b.x / w) * 2 + b.noiseOffset, (b.y / h) * 2 + b.noiseOffset);
      const angle = n * Math.PI * 2;
      b.x += Math.cos(angle) * drift;
      b.y += Math.sin(angle) * drift;

      if (b.x < -b.radius) b.x = w + b.radius;
      if (b.x > w + b.radius) b.x = -b.radius;
      if (b.y < -b.radius) b.y = h + b.radius;
      if (b.y > h + b.radius) b.y = -b.radius;

      const { r, g, b: bl } = b.rgb;
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      grad.addColorStop(0, `rgba(${r},${g},${bl},${params.opacity})`);
      grad.addColorStop(1, `rgba(${r},${g},${bl},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return stepOnce;
}
