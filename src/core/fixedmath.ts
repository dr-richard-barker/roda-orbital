// Deterministic math helpers.
// The simulation must produce bit-identical results on every browser/OS so that
// replays, training resets and rollback netplay stay in sync. IEEE-754 guarantees
// + - * / and sqrt are exactly rounded, but Math.sin/cos/atan2 are NOT specified
// precisely and differ between engines — so the sim uses these LUT-based versions.

const LUT_BITS = 12;
const LUT_SIZE = 1 << LUT_BITS; // 4096 entries per full turn
const TAU = 6.283185307179586;
const SIN_LUT = new Float64Array(LUT_SIZE + 1);

// Build the table with a Taylor series using only + - * / so the table itself is
// identical everywhere (Math.sin could differ in the last ulp between engines).
function taylorSin(x: number): number {
  // reduce to [-PI, PI]
  while (x > Math.PI) x -= TAU;
  while (x < -Math.PI) x += TAU;
  let term = x;
  let sum = x;
  const x2 = x * x;
  for (let n = 1; n < 20; n++) {
    term = (-term * x2) / ((2 * n) * (2 * n + 1));
    sum += term;
  }
  return sum;
}
for (let i = 0; i <= LUT_SIZE; i++) SIN_LUT[i] = taylorSin((i / LUT_SIZE) * TAU);

/** Deterministic sine (linear-interpolated LUT, max error ~3e-7). */
export function dsin(a: number): number {
  let t = (a / TAU) * LUT_SIZE;
  t = t - Math.floor(t / LUT_SIZE) * LUT_SIZE; // wrap into [0, LUT_SIZE)
  const i = Math.floor(t);
  const f = t - i;
  return SIN_LUT[i] + (SIN_LUT[i + 1] - SIN_LUT[i]) * f;
}
/** Deterministic cosine. */
export function dcos(a: number): number {
  return dsin(a + TAU / 4);
}

export const PI = Math.PI;
export const DEG = PI / 180;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
/** smoothstep easing (deterministic, polynomial). */
export function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

// ---------- vectors (plain tuples so state is JSON-serialisable) ----------
export type Vec3 = [number, number, number];

export const v3 = (x = 0, y = 0, z = 0): Vec3 => [x, y, z];
export const vadd = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const vsub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vscale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const vdot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const vlen = (a: Vec3): number => Math.sqrt(vdot(a, a));
export function vnorm(a: Vec3): Vec3 {
  const l = vlen(a);
  return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 0, 0];
}

// ---------- 3x3 rotation matrices, row-major flat arrays ----------
export type Mat3 = Float64Array; // length 9

export function m3identity(out: Mat3 = new Float64Array(9)): Mat3 {
  out.fill(0);
  out[0] = out[4] = out[8] = 1;
  return out;
}

export function m3mul(a: Mat3, b: Mat3, out: Mat3 = new Float64Array(9)): Mat3 {
  const r = new Float64Array(9);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  out.set(r);
  return out;
}

export function m3apply(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/**
 * Euler rotation matrix with Three.js 'XYZ' order semantics: M = Rx * Ry * Rz.
 * Using the same convention keeps authored poses identical in sim and renderer.
 */
export function m3euler(x: number, y: number, z: number, out: Mat3 = new Float64Array(9)): Mat3 {
  const a = dcos(x), b = dsin(x);
  const c = dcos(y), d = dsin(y);
  const e = dcos(z), f = dsin(z);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  out[0] = c * e;
  out[1] = -c * f;
  out[2] = d;
  out[3] = af + be * d;
  out[4] = ae - bf * d;
  out[5] = -b * c;
  out[6] = bf - ae * d;
  out[7] = be + af * d;
  out[8] = a * c;
  return out;
}

/** Yaw matrix from a facing unit vector on the XZ plane (rest forward = +Z). */
export function m3yawFromDir(fx: number, fz: number, out: Mat3 = new Float64Array(9)): Mat3 {
  // rotation about Y by angle t where sin t = fx, cos t = fz
  out[0] = fz; out[1] = 0; out[2] = fx;
  out[3] = 0; out[4] = 1; out[5] = 0;
  out[6] = -fx; out[7] = 0; out[8] = fz;
  return out;
}

// ---------- deterministic PRNG (xorshift32), state stored as a number ----------
export function rngNext(seed: number): [value: number, nextSeed: number] {
  let x = seed | 0 || 0x9e3779b9;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  x |= 0;
  return [(x >>> 0) / 4294967296, x];
}

// ---------- capsule geometry ----------
/** Squared distance between segments p1-q1 and p2-q2 (Ericson, RTCD 5.1.9). */
export function segSegDist2(p1: Vec3, q1: Vec3, p2: Vec3, q2: Vec3): number {
  const d1 = vsub(q1, p1), d2 = vsub(q2, p2), r = vsub(p1, p2);
  const a = vdot(d1, d1), e = vdot(d2, d2), f = vdot(d2, r);
  let s: number, t: number;
  const EPS = 1e-9;
  if (a <= EPS && e <= EPS) return vdot(r, r);
  if (a <= EPS) {
    s = 0;
    t = clamp(f / e, 0, 1);
  } else {
    const c = vdot(d1, r);
    if (e <= EPS) {
      t = 0;
      s = clamp(-c / a, 0, 1);
    } else {
      const b = vdot(d1, d2);
      const denom = a * e - b * b;
      s = denom !== 0 ? clamp((b * f - c * e) / denom, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); }
      else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
    }
  }
  const c1 = vadd(p1, vscale(d1, s));
  const c2 = vadd(p2, vscale(d2, t));
  const dd = vsub(c1, c2);
  return vdot(dd, dd);
}
