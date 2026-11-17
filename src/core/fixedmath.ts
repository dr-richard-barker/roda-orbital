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
  if (t >= LUT_SIZE || t < 0) t = 0; // guard IEEE-754 rounding when a ~ -1e-16
  const i = Math.floor(t);
  const f = t - i;
  return SIN_LUT[i] + (SIN_LUT[i + 1] - SIN_LUT[i]) * f;
}
/** Deterministic cosine. */
export function dcos(a: number): number {
  return dsin(a + TAU / 4);
}

const TAN_PI_8 = 0.41421356237309503; // sqrt(2) - 1

function datanUnit(x: number): number {
  let offset = 0;
  let u = x;
  if (x > TAN_PI_8) {
    offset = Math.PI / 4;
    u = (x - 1) / (x + 1);
  }
  const u2 = u * u;
  // 10-term alternating odd Taylor series; max truncation error < 5e-10 on |u| <= tan(PI/8).
  let p = u;
  let sum = u;
  p *= u2; sum -= p / 3;
  p *= u2; sum += p / 5;
  p *= u2; sum -= p / 7;
  p *= u2; sum += p / 9;
  p *= u2; sum -= p / 11;
  p *= u2; sum += p / 13;
  p *= u2; sum -= p / 15;
  p *= u2; sum += p / 17;
  p *= u2; sum -= p / 19;
  return offset + sum;
}

/** Deterministic arctangent via polynomial series + octant reduction. */
export function datan(x: number): number {
  if (x < 0) return -datan(-x);
  if (x > 1) return Math.PI / 2 - datanUnit(1 / x);
  return datanUnit(x);
}

/** Deterministic two-argument arctangent (matches Math.atan2 quadrants). */
export function datan2(y: number, x: number): number {
  if (x > 0) return datan(y / x);
  if (x < 0) return y >= 0 ? datan(y / x) + Math.PI : datan(y / x) - Math.PI;
  if (y > 0) return Math.PI / 2;
  if (y < 0) return -Math.PI / 2;
  return 0;
}

/** Deterministic arcsine clamped to [-1, 1]. */
export function dasin(x: number): number {
  const c = x < -1 ? -1 : x > 1 ? 1 : x;
  return datan2(c, Math.sqrt(Math.max(0, 1 - c * c)));
}

/** Deterministic arccosine clamped to [-1, 1]. */
export function dacos(x: number): number {
  const c = x < -1 ? -1 : x > 1 ? 1 : x;
  return datan2(Math.sqrt(Math.max(0, 1 - c * c)), c);
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

/** Extract 'XYZ' Euler angles from a row-major 3x3 rotation matrix. */
export function m3toEulerXYZ(m: Mat3): Vec3 {
  const y = dasin(clamp(m[2], -1, 1));
  if (Math.abs(m[2]) < 0.999999) {
    return [datan2(-m[5], m[8]), y, datan2(-m[1], m[0])];
  }
  return [datan2(m[7], m[4]), y, 0];
}

// ---------- deterministic unit quaternions [x, y, z, w] ----------
export type Quat = [number, number, number, number];

export function qFromEulerXYZ(x: number, y: number, z: number): Quat {
  const sx = dsin(x * 0.5), cx = dcos(x * 0.5);
  const sy = dsin(y * 0.5), cy = dcos(y * 0.5);
  const sz = dsin(z * 0.5), cz = dcos(z * 0.5);
  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz,
  ];
}

export function qNorm(q: Quat): Quat {
  const len = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
  if (len <= 1e-12) return [0, 0, 0, 1];
  const inv = 1 / len;
  return [q[0] * inv, q[1] * inv, q[2] * inv, q[3] * inv];
}

export function qMul(a: Quat, b: Quat): Quat {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

/** Deterministic spherical linear interpolation along the shortest arc. */
export function qSlerp(a: Quat, b: Quat, t: number): Quat {
  let bx = b[0], by = b[1], bz = b[2], bw = b[3];
  let dot = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (dot < 0) {
    dot = -dot;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  if (dot > 0.9995) {
    return qNorm([
      a[0] + (bx - a[0]) * t,
      a[1] + (by - a[1]) * t,
      a[2] + (bz - a[2]) * t,
      a[3] + (bw - a[3]) * t,
    ]);
  }
  const theta0 = dacos(dot);
  const theta = theta0 * t;
  const sinTheta0 = Math.sqrt(Math.max(1e-12, 1 - dot * dot));
  const sinTheta = dsin(theta);
  const cosTheta = dcos(theta);
  const s0 = cosTheta - (dot * sinTheta) / sinTheta0;
  const s1 = sinTheta / sinTheta0;
  return qNorm([
    s0 * a[0] + s1 * bx,
    s0 * a[1] + s1 * by,
    s0 * a[2] + s1 * bz,
    s0 * a[3] + s1 * bw,
  ]);
}

export function qToMat3(q: Quat, out: Mat3 = new Float64Array(9)): Mat3 {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const xx = x * x, yy = y * y, zz = z * z;
  const xy = x * y, xz = x * z, yz = y * z;
  const wx = w * x, wy = w * y, wz = w * z;
  out[0] = 1 - 2 * (yy + zz);
  out[1] = 2 * (xy - wz);
  out[2] = 2 * (xz + wy);
  out[3] = 2 * (xy + wz);
  out[4] = 1 - 2 * (xx + zz);
  out[5] = 2 * (yz - wx);
  out[6] = 2 * (xz - wy);
  out[7] = 2 * (yz + wx);
  out[8] = 1 - 2 * (xx + yy);
  return out;
}

const _qScratchMat = new Float64Array(9);
export function qToEulerXYZ(q: Quat): Vec3 {
  return m3toEulerXYZ(qToMat3(q, _qScratchMat));
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
