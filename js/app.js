let currentSeed = Math.floor(Math.random() * 1e9);
let animHandle = null;

const els = {
  canvas: document.getElementById('previewCanvas'),
  seedInput: document.getElementById('seedInput'),
  seedVal: document.getElementById('seedVal'),
  modeSelect: document.getElementById('modeSelect'),
  flowfieldFields: document.getElementById('flowfieldFields'),
  attractorFields: document.getElementById('attractorFields'),
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
  accentColor: document.getElementById('accentColor'),
  favoriteLabel: document.getElementById('favoriteLabel'),
  saveFavoriteBtn: document.getElementById('saveFavoriteBtn'),
  favoritesList: document.getElementById('favoritesList'),
  resSelect: document.getElementById('resSelect'),
  newPatternBtn: document.getElementById('newPatternBtn'),
  exportBtn: document.getElementById('exportBtn'),
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
};

function currentMode() {
  return els.modeSelect.value;
}

function readParams() {
  const color = els.accentColor.value;
  if (currentMode() === 'attractor') {
    return {
      color,
      attractorType: els.attractorType.value,
      density: +els.attractorTrails.value,
      speed: +els.attractorSpeed.value,
      pointSize: +els.pointSize.value,
      opacity: +els.pointOpacity.value,
    };
  }
  return {
    color,
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
  els.accentColor.value = params.color;
  if (mode === 'attractor') {
    els.attractorType.value = params.attractorType;
    els.attractorTrails.value = params.density;
    els.attractorSpeed.value = params.speed;
    els.pointSize.value = params.pointSize;
    els.pointOpacity.value = params.opacity;
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

function addFavorite() {
  const label = els.favoriteLabel.value.trim() ||
    `${currentMode() === 'attractor' ? 'Attractor' : 'Flow field'} #${currentSeed}`;
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
  const isAttractor = currentMode() === 'attractor';
  els.flowfieldFields.classList.toggle('hidden', isAttractor);
  els.attractorFields.classList.toggle('hidden', !isAttractor);
}

function updateReadouts() {
  const p = readParams();
  els.seedVal.textContent = currentSeed;
  els.seedInput.value = currentSeed;
  if (currentMode() === 'attractor') {
    els.trailsVal.textContent = p.density;
    els.attractorSpeedVal.textContent = p.speed;
    els.pointSizeVal.textContent = p.pointSize.toFixed(1);
    els.pointOpacityVal.textContent = p.opacity.toFixed(2);
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
  const stepOnce = mode === 'attractor'
    ? runAttractor(ctx, canvas.width, canvas.height, params, currentSeed)
    : runFlowField(ctx, canvas.width, canvas.height, params, currentSeed);

  let frame = 0;
  const totalFrames = mode === 'attractor' ? 220 : 260;
  const subStepsPerFrame = mode === 'attractor' ? Math.max(1, Math.round(params.speed)) : 2;
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

function exportPNG() {
  const [w, h] = els.resSelect.value.split('x').map(Number);
  els.exportStatus.textContent = 'Renderam ' + w + '×' + h + ' ...';
  els.exportBtn.disabled = true;

  setTimeout(() => {
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const ctx = off.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const mode = currentMode();
    const params = readParams();
    const areaScale = (w * h) / (BASE_W * BASE_H);

    let stepOnce, totalSteps;
    if (mode === 'attractor') {
      const overrideCount = Math.min(1600, Math.round(params.density * Math.sqrt(areaScale)));
      stepOnce = runAttractor(ctx, w, h, params, currentSeed, { overrideCount });
      totalSteps = Math.min(6000, 220 * Math.max(1, Math.round(params.speed)));
    } else {
      const overrideCount = Math.min(7000, Math.round(params.density * Math.sqrt(areaScale)));
      stepOnce = runFlowField(ctx, w, h, params, currentSeed, { overrideCount });
      totalSteps = params.life * 3;
    }
    for (let i = 0; i < totalSteps; i++) stepOnce();

    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mode}-${currentSeed}-${w}x${h}.png`;
      a.click();
      URL.revokeObjectURL(url);
      els.exportStatus.textContent = 'Shranjeno ✓';
      els.exportBtn.disabled = false;
      setTimeout(() => { els.exportStatus.textContent = ''; }, 2500);
    }, 'image/png');
  }, 30);
}

['density', 'fieldScale', 'curl', 'speed', 'life', 'lineWidth', 'opacity'].forEach((id) => {
  els[id].addEventListener('input', updateReadouts);
  els[id].addEventListener('change', () => regenerate());
});
['attractorTrails', 'attractorSpeed', 'pointSize', 'pointOpacity'].forEach((id) => {
  els[id].addEventListener('input', updateReadouts);
  els[id].addEventListener('change', () => regenerate());
});
els.attractorType.addEventListener('change', () => regenerate());
els.accentColor.addEventListener('input', () => regenerate());
els.seedInput.addEventListener('change', () => {
  const v = parseInt(els.seedInput.value, 10);
  if (!Number.isNaN(v)) regenerate(v);
});
els.randomizeBtn.addEventListener('click', () => regenerate(Math.floor(Math.random() * 1e9)));
els.newPatternBtn.addEventListener('click', () => regenerate(Math.floor(Math.random() * 1e9)));
els.exportBtn.addEventListener('click', exportPNG);
els.modeSelect.addEventListener('change', () => {
  applyModeVisibility();
  regenerate();
});
els.saveFavoriteBtn.addEventListener('click', addFavorite);

applyModeVisibility();
renderFavorites();
regenerate(currentSeed);
