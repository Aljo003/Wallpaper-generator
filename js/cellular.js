// Cellular automata generative mode: an elementary 1D Wolfram CA, stacked
// row-by-row into a 2D texture. Each generation is computed from the previous
// row via an 8-bit rule number and drawn once (no accumulation blending needed),
// so a given seed + rule + params always reproduce the same texture regardless
// of resolution — cell size scales with canvas width like the other modes.
// Each row's live cells go out as one WebGL quad-batch draw call (webgl.js).

function runCellular(renderer, w, h, params, seed) {
  const rand = mulberry32(seed);
  const cellSize = Math.max(2, params.cellSize * (w / BASE_W));
  const cols = Math.max(3, Math.round(w / cellSize));
  const rows = Math.max(1, Math.round(h / cellSize));

  let row = new Uint8Array(cols);
  if (params.seedDensity <= 0) {
    row[Math.floor(cols / 2)] = 1;
  } else {
    for (let i = 0; i < cols; i++) row[i] = rand() < params.seedDensity ? 1 : 0;
  }

  const rule = params.rule & 0xff;
  function ruleOutput(l, c, r) {
    const idx = (l << 2) | (c << 1) | r;
    return (rule >> idx) & 1;
  }

  const rampSteps = 32;
  const ramp = buildRgbRamp(params.colorStart, params.colorEnd, rampSteps);
  const batch = createQuadBatch(cols);

  let gen = 0;

  function stepOnce() {
    if (gen >= rows) return;

    const y = gen * cellSize;
    const { r: cr, g: cg, b: cb } = ramp[rampIndex(gen / Math.max(1, rows - 1), rampSteps)];
    batch.reset();
    for (let x = 0; x < cols; x++) {
      if (row[x]) batch.pushRect(x * cellSize, y, cellSize, cellSize, cr / 255, cg / 255, cb / 255, params.opacity);
    }
    renderer.draw(batch.data, batch.vertexCount);

    const next = new Uint8Array(cols);
    for (let x = 0; x < cols; x++) {
      const l = row[(x - 1 + cols) % cols];
      const c = row[x];
      const r = row[(x + 1) % cols];
      next[x] = ruleOutput(l, c, r);
    }
    row = next;
    gen++;
  }

  return stepOnce;
}
