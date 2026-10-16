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

export function rgbToHsv(r: number, g: number, b: number): HSV {
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

export function classifyPick(pick: HSV): DetectionMode {
  if (pick.s <= 0.12 && pick.v >= 0.85) return "white";
  if (pick.v <= 0.15) return "black";
  return "color";
}

export function buildRangeFromPick(pick: HSV, shadeCoverage: number, baseTolDeg: number): HSVRange {
  const hTol = baseTolDeg + shadeCoverage * 22; 
  const sTol = 0.12 + shadeCoverage * 0.28;
  const vTol = 0.18 + shadeCoverage * 0.35;
  const sMin = Math.max(0, Math.min(pick.s - 0.15, 0.35 - shadeCoverage * 0.25));
  const vMin = Math.max(0.05, Math.min(pick.v - 0.25, 0.25 - shadeCoverage * 0.2));
  const vMax = Math.min(1, Math.max(pick.v + 0.25, 0.8));
  return {
    hCenter: pick.h,
    hTol,
    sMin,
    vMin,
    vMax,
    sCenter: pick.s,
    vCenter: pick.v,
    sTol,
    vTol,
  };
}
