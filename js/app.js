let currentSeed = Math.floor(Math.random() * 1e9);
let animHandle = null;

const els = {
  canvas: document.getElementById('previewCanvas'),
  seedInput: document.getElementById('seedInput'),
  seedVal: document.getElementById('seedVal'),
  modeSelect: document.getElementById('modeSelect'),
  flowfieldFields: document.getElementById('flowfieldFields'),
  attractorFields: document.getElementById('attractorFields'),
  bloomFields: document.getElementById('bloomFields'),
  cellularFields: document.getElementById('cellularFields'),
  density: document.getElementById('density'),
  fieldScale: document.getElementById('fieldScale'),
  curl: document.getElementById('curl'),
  speed: document.getElementById('speed'),
  life: document.getElementById('life'),
  lineWidth: document.getElementById('lineWidth'),
  opacity: document.getElementById('opacity'),
  attractorType: document.getElementById('attractorType'),
  attractorTrails: document.getElementById('attractorTrails'),
  attractorSpeed: document.getElementById('attractorSpeed'),
  pointSize: document.getElementById('pointSize'),
  pointOpacity: document.getElementById('pointOpacity'),
  blobCount: document.getElementById('blobCount'),
  blobSize: document.getElementById('blobSize'),
  bloomSpeed: document.getElementById('bloomSpeed'),
  bloomOpacity: document.getElementById('bloomOpacity'),
  caRule: document.getElementById('caRule'),
  caCellSize: document.getElementById('caCellSize'),
  caDensity: document.getElementById('caDensity'),
  caOpacity: document.getElementById('caOpacity'),
  colorStart: document.getElementById('colorStart'),
  colorEnd: document.getElementById('colorEnd'),
  favoriteLabel: document.getElementById('favoriteLabel'),
  saveFavoriteBtn: document.getElementById('saveFavoriteBtn'),
  favoritesList: document.getElementById('favoritesList'),
  resSelect: document.getElementById('resSelect'),
  newPatternBtn: document.getElementById('newPatternBtn'),
  exportBtn: document.getElementById('exportBtn'),
  batchCount: document.getElementById('batchCount'),
  batchCountVal: document.getElementById('batchCountVal'),
  batchExportBtn: document.getElementById('batchExportBtn'),
  randomizeBtn: document.getElementById('randomizeBtn'),
  exportStatus: document.getElementById('exportStatus'),
  liveDot: document.getElementById('liveDot'),
  densityVal: document.getElementById('densityVal'),
  scaleVal: document.getElementById('scaleVal'),
  curlVal: document.getElementById('curlVal'),
  speedVal: document.getElementById('speedVal'),
  lifeVal: document.getElementById('lifeVal'),
  widthVal: document.getElementById('widthVal'),
  opacityVal: document.getElementById('opacityVal'),
  trailsVal: document.getElementById('trailsVal'),
  attractorSpeedVal: document.getElementById('attractorSpeedVal'),
  pointSizeVal: document.getElementById('pointSizeVal'),
  pointOpacityVal: document.getElementById('pointOpacityVal'),
  blobCountVal: document.getElementById('blobCountVal'),
  blobSizeVal: document.getElementById('blobSizeVal'),
  bloomSpeedVal: document.getElementById('bloomSpeedVal'),
  bloomOpacityVal: document.getElementById('bloomOpacityVal'),
  caCellSizeVal: document.getElementById('caCellSizeVal'),
  caDensityVal: document.getElementById('caDensityVal'),
  caOpacityVal: document.getElementById('caOpacityVal'),
};

function currentMode() {
  return els.modeSelect.value;
}

function readParams() {
  const colorStart = els.colorStart.value;
  const colorEnd = els.colorEnd.value;
  const mode = currentMode();
  if (mode === 'attractor') {
    return {
      colorStart,
      colorEnd,
      attractorType: els.attractorType.value,
      density: +els.attractorTrails.value,
      speed: +els.attractorSpeed.value,
      pointSize: +els.pointSize.value,
      opacity: +els.pointOpacity.value,
    };
  }
  if (mode === 'bloom') {
    return {
      colorStart,
      colorEnd,
      blobCount: +els.blobCount.value,
      blobSize: +els.blobSize.value,
      speed: +els.bloomSpeed.value,
      opacity: +els.bloomOpacity.value,
    };
  }
  if (mode === 'cellular') {
    return {
      colorStart,
      colorEnd,
      rule: +els.caRule.value,
      cellSize: +els.caCellSize.value,
      seedDensity: +els.caDensity.value,
      opacity: +els.caOpacity.value,
    };
  }
  return {
    colorStart,
    colorEnd,
    density: +els.density.value,
    fieldScale: +els.fieldScale.value,
    curl: +els.curl.value,
    speed: +els.speed.value,
    life: +els.life.value,
    lineWidth: +els.lineWidth.value,
    opacity: +els.opacity.value,
  };
}

function writeParams(mode, params) {
  // Favorites saved before the two-color gradient shipped only have `color`.
  els.colorStart.value = params.colorStart || params.color;
  els.colorEnd.value = params.colorEnd || params.color;
  if (mode === 'attractor') {
    els.attractorType.value = params.attractorType;
    els.attractorTrails.value = params.density;
    els.attractorSpeed.value = params.speed;
    els.pointSize.value = params.pointSize;
    els.pointOpacity.value = params.opacity;
  } else if (mode === 'bloom') {
    els.blobCount.value = params.blobCount;
    els.blobSize.value = params.blobSize;
    els.bloomSpeed.value = params.speed;
    els.bloomOpacity.value = params.opacity;
  } else if (mode === 'cellular') {
    els.caRule.value = params.rule;
    els.caCellSize.value = params.cellSize;
    els.caDensity.value = params.seedDensity;
    els.caOpacity.value = params.opacity;
  } else {
    els.density.value = params.density;
    els.fieldScale.value = params.fieldScale;
    els.curl.value = params.curl;
    els.speed.value = params.speed;
    els.life.value = params.life;
    els.lineWidth.value = params.lineWidth;
    els.opacity.value = params.opacity;
  }
}

const FAVORITES_KEY = 'flowfield-wallpaper:favorites';

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavoritesList(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function renderFavorites() {
  const list = loadFavorites();
  els.favoritesList.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'favorites-empty';
    empty.textContent = 'Ni shranjenih vzorcev';
    els.favoritesList.appendChild(empty);
    return;
  }
  list.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'favorite-item';

    const name = document.createElement('span');
    name.className = 'favorite-name';
    name.textContent = entry.label;
    name.title = `${entry.mode} · seed ${entry.seed}`;

    const loadBtn = document.createElement('button');
    loadBtn.className = 'favorite-load';
    loadBtn.textContent = '↺';
    loadBtn.title = 'Naloži';
    loadBtn.addEventListener('click', () => applyFavorite(entry));

    const delBtn = document.createElement('button');
    delBtn.className = 'favorite-delete';
    delBtn.textContent = '×';
    delBtn.title = 'Izbriši';
    delBtn.addEventListener('click', () => removeFavorite(entry.id));

    row.appendChild(name);
    row.appendChild(loadBtn);
    row.appendChild(delBtn);
    els.favoritesList.appendChild(row);
  });
}

const MODE_LABELS = {
  flowfield: 'Flow field',
  attractor: 'Attractor',
  bloom: 'Bloom',
  cellular: 'Cellular automata',
};

function addFavorite() {
  const label = els.favoriteLabel.value.trim() ||
    `${MODE_LABELS[currentMode()]} #${currentSeed}`;
  const list = loadFavorites();
  list.unshift({
    id: Date.now(),
    label,
    mode: currentMode(),
    seed: currentSeed,
    params: readParams(),
  });
  saveFavoritesList(list.slice(0, 30));
  els.favoriteLabel.value = '';
  renderFavorites();
}

function applyFavorite(entry) {
  els.modeSelect.value = entry.mode;
  applyModeVisibility();
  writeParams(entry.mode, entry.params);
  regenerate(entry.seed);
}

function removeFavorite(id) {
  saveFavoritesList(loadFavorites().filter((e) => e.id !== id));
  renderFavorites();
}

function applyModeVisibility() {
  const mode = currentMode();
  els.flowfieldFields.classList.toggle('hidden', mode !== 'flowfield');
  els.attractorFields.classList.toggle('hidden', mode !== 'attractor');
  els.bloomFields.classList.toggle('hidden', mode !== 'bloom');
  els.cellularFields.classList.toggle('hidden', mode !== 'cellular');
}

function updateReadouts() {
  const p = readParams();
  const mode = currentMode();
  els.seedVal.textContent = currentSeed;
  els.seedInput.value = currentSeed;
  if (mode === 'attractor') {
    els.trailsVal.textContent = p.density;
    els.attractorSpeedVal.textContent = p.speed;
    els.pointSizeVal.textContent = p.pointSize.toFixed(1);
    els.pointOpacityVal.textContent = p.opacity.toFixed(2);
  } else if (mode === 'bloom') {
    els.blobCountVal.textContent = p.blobCount;
    els.blobSizeVal.textContent = p.blobSize;
    els.bloomSpeedVal.textContent = p.speed.toFixed(1);
    els.bloomOpacityVal.textContent = p.opacity.toFixed(3);
  } else if (mode === 'cellular') {
    els.caCellSizeVal.textContent = p.cellSize;
    els.caDensityVal.textContent = p.seedDensity.toFixed(2);
    els.caOpacityVal.textContent = p.opacity.toFixed(2);
  } else {
    els.densityVal.textContent = p.density;
    els.scaleVal.textContent = p.fieldScale.toFixed(1);
    els.curlVal.textContent = p.curl.toFixed(1);
    els.speedVal.textContent = p.speed.toFixed(1);
    els.lifeVal.textContent = p.life;
    els.widthVal.textContent = p.lineWidth.toFixed(1);
    els.opacityVal.textContent = p.opacity.toFixed(2);
  }
}

function startPreview() {
  if (animHandle) cancelAnimationFrame(animHandle);
  const canvas = els.canvas;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const mode = currentMode();
  const params = readParams();
  let stepOnce, totalFrames, subStepsPerFrame;
  if (mode === 'attractor') {
    stepOnce = runAttractor(ctx, canvas.width, canvas.height, params, currentSeed);
    totalFrames = 220;
    subStepsPerFrame = Math.max(1, Math.round(params.speed));
  } else if (mode === 'bloom') {
    stepOnce = runBloom(ctx, canvas.width, canvas.height, params, currentSeed);
    totalFrames = 200;
    subStepsPerFrame = 1;
  } else if (mode === 'cellular') {
    stepOnce = runCellular(ctx, canvas.width, canvas.height, params, currentSeed);
    totalFrames = 250;
    subStepsPerFrame = 1;
  } else {
    stepOnce = runFlowField(ctx, canvas.width, canvas.height, params, currentSeed);
    totalFrames = 260;
    subStepsPerFrame = 2;
  }
  let frame = 0;
  els.liveDot.classList.add('live');

  function loop() {
    for (let s = 0; s < subStepsPerFrame; s++) stepOnce();
    frame++;
    if (frame < totalFrames) {
      animHandle = requestAnimationFrame(loop);
    } else {
      els.liveDot.classList.remove('live');
    }
  }
  animHandle = requestAnimationFrame(loop);
}

function regenerate(newSeed) {
  if (newSeed !== undefined) currentSeed = newSeed;
  updateReadouts();
  startPreview();
}

function renderFullResBlob(seed, mode, params, w, h) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const ctx = off.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const areaScale = (w * h) / (BASE_W * BASE_H);
    let stepOnce, totalSteps;
    if (mode === 'attractor') {
      const overrideCount = Math.min(1600, Math.round(params.density * Math.sqrt(areaScale)));
      stepOnce = runAttractor(ctx, w, h, params, seed, { overrideCount });
      totalSteps = Math.min(6000, 220 * Math.max(1, Math.round(params.speed)));
    } else if (mode === 'bloom') {
      stepOnce = runBloom(ctx, w, h, params, seed);
      totalSteps = 200;
    } else if (mode === 'cellular') {
      stepOnce = runCellular(ctx, w, h, params, seed);
      totalSteps = 2000;
    } else {
      const overrideCount = Math.min(7000, Math.round(params.density * Math.sqrt(areaScale)));
      stepOnce = runFlowField(ctx, w, h, params, seed, { overrideCount });
      totalSteps = params.life * 3;
    }
    for (let i = 0; i < totalSteps; i++) stepOnce();

    off.toBlob(resolve, 'image/png');
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function exportPNG() {
  const [w, h] = els.resSelect.value.split('x').map(Number);
  const mode = currentMode();
  const params = readParams();
  els.exportStatus.textContent = 'Renderam ' + w + '×' + h + ' ...';
  els.exportBtn.disabled = true;

  await wait(30);
  const blob = await renderFullResBlob(currentSeed, mode, params, w, h);
  downloadBlob(blob, `${mode}-${currentSeed}-${w}x${h}.png`);
  els.exportStatus.textContent = 'Shranjeno ✓';
  els.exportBtn.disabled = false;
  setTimeout(() => { els.exportStatus.textContent = ''; }, 2500);
}

async function batchExport() {
  const [w, h] = els.resSelect.value.split('x').map(Number);
  const mode = currentMode();
  const params = readParams();
  const count = +els.batchCount.value;

  els.batchExportBtn.disabled = true;
  els.exportBtn.disabled = true;

  for (let i = 0; i < count; i++) {
    const seed = Math.floor(Math.random() * 1e9);
    els.exportStatus.textContent = `Batch ${i + 1}/${count} ...`;
    await wait(30);
    const blob = await renderFullResBlob(seed, mode, params, w, h);
    downloadBlob(blob, `${mode}-${seed}-${w}x${h}.png`);
    await wait(400);
  }

  els.exportStatus.textContent = `Batch končan (${count}) ✓`;
  els.batchExportBtn.disabled = false;
  els.exportBtn.disabled = false;
  setTimeout(() => { els.exportStatus.textContent = ''; }, 3000);
}

['density', 'fieldScale', 'curl', 'speed', 'life', 'lineWidth', 'opacity'].forEach((id) => {
  els[id].addEventListener('input', updateReadouts);
  els[id].addEventListener('change', () => regenerate());
});
['attractorTrails', 'attractorSpeed', 'pointSize', 'pointOpacity'].forEach((id) => {
  els[id].addEventListener('input', updateReadouts);
  els[id].addEventListener('change', () => regenerate());
});
['blobCount', 'blobSize', 'bloomSpeed', 'bloomOpacity'].forEach((id) => {
  els[id].addEventListener('input', updateReadouts);
  els[id].addEventListener('change', () => regenerate());
});
['caCellSize', 'caDensity', 'caOpacity'].forEach((id) => {
  els[id].addEventListener('input', updateReadouts);
  els[id].addEventListener('change', () => regenerate());
});
els.caRule.addEventListener('change', () => regenerate());
els.attractorType.addEventListener('change', () => regenerate());
els.colorStart.addEventListener('input', () => regenerate());
els.colorEnd.addEventListener('input', () => regenerate());
els.seedInput.addEventListener('change', () => {
  const v = parseInt(els.seedInput.value, 10);
  if (!Number.isNaN(v)) regenerate(v);
});
els.randomizeBtn.addEventListener('click', () => regenerate(Math.floor(Math.random() * 1e9)));
els.newPatternBtn.addEventListener('click', () => regenerate(Math.floor(Math.random() * 1e9)));
els.exportBtn.addEventListener('click', exportPNG);
els.batchCount.addEventListener('input', () => {
  els.batchCountVal.textContent = els.batchCount.value;
});
els.batchExportBtn.addEventListener('click', batchExport);
els.modeSelect.addEventListener('change', () => {
  applyModeVisibility();
  regenerate();
});
els.saveFavoriteBtn.addEventListener('click', addFavorite);

applyModeVisibility();
renderFavorites();
regenerate(currentSeed);
