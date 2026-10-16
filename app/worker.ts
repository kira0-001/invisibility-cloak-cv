export type HSV = { h: number; s: number; v: number };
export type HSVRange = {
  hCenter: number;
  hTol: number;
  sMin: number;
  vMin: number;
  vMax: number;
  sCenter: number;
  vCenter: number;
  sTol: number;
  vTol: number;
};
export type DetectionMode = "color" | "white" | "black";

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d === 0) h = 0;
  else if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function inRangeHSV(hsv: HSV, range: HSVRange): boolean {
  if (hueDist(hsv.h, range.hCenter) > range.hTol) return false;
  if (hsv.s < range.sMin || hsv.v < range.vMin || hsv.v > range.vMax) return false;
  if (Math.abs(hsv.s - range.sCenter) > range.sTol) return false;
  if (Math.abs(hsv.v - range.vCenter) > range.vTol) return false;
  return true;
}

function inRangeWithMode(hsv: HSV, range: HSVRange, mode: DetectionMode): boolean {
  if (mode === "color") {
    return inRangeHSV(hsv, range);
  }
  if (mode === "white") {
    const sOk = hsv.s <= Math.max(0.18, range.sTol);
    const vOk = hsv.v >= Math.max(0.75, range.vCenter - range.vTol * 0.5);
    return sOk && vOk;
  }
  // black
  const vOk = hsv.v <= Math.min(0.25, range.vCenter + range.vTol * 0.75);
  const sOk = hsv.s <= 0.35;
  return vOk && sOk;
}

function openMask(binary: Uint8Array, w: number, h: number, iter = 1) {
  const tmp = new Uint8Array(binary.length);
  const erode = (src: Uint8Array, dst: Uint8Array) => {
    for (let y = 1; y < h - 1; y++) {
      let i = y * w + 1;
      for (let x = 1; x < w - 1; x++, i++) {
        let keep = 1;
        for (let yy = -1; yy <= 1 && keep; yy++) {
          let j = (y + yy) * w + (x - 1);
          for (let xx = -1; xx <= 1; xx++, j++) {
            if (src[j] === 0) {
              keep = 0;
              break;
            }
          }
        }
        dst[i] = keep;
      }
    }
  };
  const dilate = (src: Uint8Array, dst: Uint8Array) => {
    for (let y = 1; y < h - 1; y++) {
      let i = y * w + 1;
      for (let x = 1; x < w - 1; x++, i++) {
        let on = 0;
        for (let yy = -1; yy <= 1 && !on; yy++) {
          let j = (y + yy) * w + (x - 1);
          for (let xx = -1; xx <= 1; xx++, j++) {
            if (src[j] === 1) {
              on = 1;
              break;
            }
          }
        }
        dst[i] = on;
      }
    }
  };
  const copyEdges = (dst: Uint8Array, src: Uint8Array) => {
    for (let x = 0; x < w; x++) {
      dst[x] = src[x];
      dst[(h - 1) * w + x] = src[(h - 1) * w + x];
    }
    for (let y = 0; y < h; y++) {
      dst[y * w] = src[y * w];
      dst[y * w + (w - 1)] = src[y * w + (w - 1)];
    }
  };

  const A = binary,
    B = tmp;
  for (let k = 0; k < iter; k++) {
    erode(A, B);
    copyEdges(B, A);
    erode(B, A);
    copyEdges(A, B);
  }
  for (let k = 0; k < iter; k++) {
    dilate(A, B);
    copyEdges(B, A);
    dilate(B, A);
    copyEdges(A, B);
  }
  if (A !== binary) binary.set(A);
}

function temporalSmoothBinary(
  prev: Float32Array | null,
  nextBinary: Uint8Array,
  alpha: number
): { out: Uint8Array; prevAlpha: Float32Array } {
  let prevAlpha = prev;
  if (!prevAlpha || prevAlpha.length !== nextBinary.length) {
    prevAlpha = new Float32Array(nextBinary.length);
  }
  const out = new Uint8Array(nextBinary.length);
  const a = Math.min(Math.max(alpha, 0), 1);
  const inv = 1 - a;
  for (let i = 0; i < nextBinary.length; i++) {
    const target = nextBinary[i] ? 1 : 0;
    const blended = prevAlpha[i] * inv + target * a;
    prevAlpha[i] = blended;
    out[i] = blended > 0.5 ? 1 : 0;
  }
  return { out, prevAlpha };
}

function dilateOnce(binary: Uint8Array, w: number, h: number) {
  const out = new Uint8Array(binary.length);
  for (let y = 1; y < h - 1; y++) {
    let i = y * w + 1;
    for (let x = 1; x < w - 1; x++, i++) {
      let on = 0;
      for (let yy = -1; yy <= 1 && !on; yy++) {
        let j = (y + yy) * w + (x - 1);
        for (let xx = -1; xx <= 1; xx++, j++) {
          if (binary[j] === 1) {
            on = 1;
            break;
          }
        }
      }
      out[i] = on;
    }
  }
  for (let x = 0; x < w; x++) {
    out[x] = binary[x];
    out[(h - 1) * w + x] = binary[(h - 1) * w + x];
  }
  for (let y = 0; y < h; y++) {
    out[y * w] = binary[y * w];
    out[y * w + (w - 1)] = binary[y * w + (w - 1)];
  }
  binary.set(out);
}

// Global state for the worker
let bgData: Uint8ClampedArray | null = null;
let prevAlphaRef: Float32Array | null = null;
let width = 0;
let height = 0;

self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type === "SET_BACKGROUND") {
    bgData = new Uint8ClampedArray(payload.bgData);
    width = payload.width;
    height = payload.height;
    prevAlphaRef = null; // reset temporal state
    return;
  }

  if (type === "PROCESS_FRAME") {
    if (!bgData) return;

    const {
      frameData, // ArrayBuffer representing Uint8ClampedArray
      hsvRange,
      detMode,
      morphIter,
      temporalAlpha,
      showMask,
    } = payload;

    const data = new Uint8ClampedArray(frameData);
    const bdata = bgData;
    const w = width;
    const h = height;

    const mask = new Uint8Array(w * h);
    let onCount = 0;

    // 1) Build binary mask
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const hsv = rgbToHsv(r, g, b);
      const hit = inRangeWithMode(hsv, hsvRange, detMode) ? 1 : 0;
      mask[p] = hit;
      onCount += hit;
    }

    // 2) Morphological opening
    if (morphIter > 0) openMask(mask, w, h, morphIter);

    const coverage = onCount / (w * h);
    if (coverage < 0.02) {
      dilateOnce(mask, w, h);
    }

    // 3) Temporal smoothing
    const adaptiveAlpha = Math.min(
      0.9,
      Math.max(0.25, coverage < 0.02 ? temporalAlpha * 0.6 : coverage > 0.35 ? temporalAlpha * 1.1 : temporalAlpha)
    );
    
    const { out: smoothMask, prevAlpha } = temporalSmoothBinary(prevAlphaRef, mask, adaptiveAlpha);
    prevAlphaRef = prevAlpha;

    // 4) Composite
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      if (smoothMask[p]) {
        data[i] = bdata[i];
        data[i + 1] = bdata[i + 1];
        data[i + 2] = bdata[i + 2];
      }
    }

    if (showMask) {
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        if (smoothMask[p]) {
          data[i] = Math.min(255, data[i] * 0.5 + 80);
          data[i + 1] = Math.min(255, data[i + 1] * 0.9 + 120);
          data[i + 2] = Math.min(255, data[i + 2] * 0.5 + 80);
        }
      }
    }

    // Send the processed frame back, transferring the buffer for zero-copy performance!
    self.postMessage(
      { type: "FRAME_PROCESSED", payload: { frameData: data.buffer } },
      [data.buffer] // Transferable object
    );
  }
};
