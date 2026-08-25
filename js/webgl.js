// Shared WebGL quad-batch renderer used by all four generative modes. Every mode
// builds one big vertex buffer of colored quads (2 triangles each) per animation
// step and submits it in a single draw call — thick line segments, points, soft
// radial blobs and grid cells are all just differently-shaped/colored quads, so
// one shader pair covers every mode instead of each needing its own pipeline.
//
// The canvas is only cleared once up front (see clear()); repeated draw() calls
// accumulate on top of whatever is already in the color buffer, using standard
// alpha blending that matches canvas 2D's `source-over` compositing. That's what
// reproduces the old canvas-2D renderers' "layer many low-alpha shapes over many
// frames" look.

const VERTEX_SRC = `
attribute vec2 a_position;
attribute vec4 a_color;
attribute vec2 a_uv;
attribute float a_falloff;
uniform vec2 u_resolution;
varying vec4 vColor;
varying vec2 vUv;
varying float vFalloff;
void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vColor = a_color;
  vUv = a_uv;
  vFalloff = a_falloff;
}
`;

const FRAGMENT_SRC = `
precision mediump float;
varying vec4 vColor;
varying vec2 vUv;
varying float vFalloff;
void main() {
  float alpha = vColor.a;
  if (vFalloff > 0.5) {
    alpha *= smoothstep(1.0, 0.0, length(vUv));
  }
  gl_FragColor = vec4(vColor.rgb, alpha);
}
`;

function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compile error: ' + info);
  }
  return shader;
}

const FLOATS_PER_VERTEX = 9; // x, y, r, g, b, a, u, v, falloff
const STRIDE = FLOATS_PER_VERTEX * 4;

function createQuadRenderer(gl) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  const aPosition = gl.getAttribLocation(program, 'a_position');
  const aColor = gl.getAttribLocation(program, 'a_color');
  const aUv = gl.getAttribLocation(program, 'a_uv');
  const aFalloff = gl.getAttribLocation(program, 'a_falloff');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function resize(w, h) {
    gl.viewport(0, 0, w, h);
    gl.useProgram(program);
    gl.uniform2f(uResolution, w, h);
  }

  function clear() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  // vertexData: Float32Array laid out per FLOATS_PER_VERTEX, vertexCount: how many
  // vertices of it are populated (a batch's backing array may be larger than used).
  function draw(vertexData, vertexCount) {
    if (vertexCount === 0) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, STRIDE, 0);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, STRIDE, 8);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, STRIDE, 24);
    gl.enableVertexAttribArray(aFalloff);
    gl.vertexAttribPointer(aFalloff, 1, gl.FLOAT, false, STRIDE, 32);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  }

  return { resize, clear, draw };
}

// Accumulates quads (2 triangles / 6 vertices each) into a preallocated
// Float32Array so a whole frame's worth of shapes can go out in one draw call.
function createQuadBatch(maxQuads) {
  const data = new Float32Array(Math.max(1, maxQuads) * 6 * FLOATS_PER_VERTEX);
  let count = 0; // vertices written so far

  function pushVertex(x, y, r, g, b, a, u, v, falloff) {
    const o = count * FLOATS_PER_VERTEX;
    data[o] = x; data[o + 1] = y;
    data[o + 2] = r; data[o + 3] = g; data[o + 4] = b; data[o + 5] = a;
    data[o + 6] = u; data[o + 7] = v;
    data[o + 8] = falloff;
    count++;
  }

  // corners: [topLeft, topRight, bottomLeft, bottomRight], each [x, y].
  // uvs: matching per-corner [u, v] (defaults to hard-edge 0,0 — falloff ignores it).
  function pushQuad(corners, r, g, b, a, uvs, falloff) {
    const [p0, p1, p2, p3] = corners;
    const [uv0, uv1, uv2, uv3] = uvs || [[0, 0], [0, 0], [0, 0], [0, 0]];
    pushVertex(p0[0], p0[1], r, g, b, a, uv0[0], uv0[1], falloff);
    pushVertex(p1[0], p1[1], r, g, b, a, uv1[0], uv1[1], falloff);
    pushVertex(p2[0], p2[1], r, g, b, a, uv2[0], uv2[1], falloff);
    pushVertex(p1[0], p1[1], r, g, b, a, uv1[0], uv1[1], falloff);
    pushVertex(p3[0], p3[1], r, g, b, a, uv3[0], uv3[1], falloff);
    pushVertex(p2[0], p2[1], r, g, b, a, uv2[0], uv2[1], falloff);
  }

  // Hard-edged axis-aligned rectangle (used for attractor dots and CA cells).
  function pushRect(x, y, w, h, r, g, b, a) {
    pushQuad([[x, y], [x + w, y], [x, y + h], [x + w, y + h]], r, g, b, a, null, 0);
  }

  // Soft radial blob: a quad with uv spanning -1..1 so the fragment shader can
  // fade alpha to 0 at distance 1 from center (used for bloom).
  function pushCircle(cx, cy, radius, r, g, b, a) {
    pushQuad(
      [[cx - radius, cy - radius], [cx + radius, cy - radius], [cx - radius, cy + radius], [cx + radius, cy + radius]],
      r, g, b, a,
      [[-1, -1], [1, -1], [-1, 1], [1, 1]],
      1
    );
  }

  // Hard-edged quad extruded perpendicular to (x1,y1)-(x2,y2) by halfWidth on
  // each side — a variable-width line segment (used for flow field trails; WebGL's
  // native gl.lineWidth is clamped to 1px on most implementations, hence quads).
  function pushThickLine(x1, y1, x2, y2, halfWidth, r, g, b, a) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1e-6;
    const nx = (-dy / len) * halfWidth, ny = (dx / len) * halfWidth;
    pushQuad(
      [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x1 - nx, y1 - ny], [x2 - nx, y2 - ny]],
      r, g, b, a, null, 0
    );
  }

  return {
    pushRect,
    pushCircle,
    pushThickLine,
    get vertexCount() { return count; },
    get data() { return data; },
    reset() { count = 0; },
  };
}
