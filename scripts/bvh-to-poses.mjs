#!/usr/bin/env node
/**
 * Retargets standard Biovision Hierarchy (.bvh) motion-capture clips into
 * PoseSpec keyframe Tracks for the 21-bone Capoeira on the Moon rig (60 Hz).
 *
 * Usage:
 *   node scripts/bvh-to-poses.mjs <input.bvh> [--name TRACK_MY_MOVE] [--step 4] [--scale 0.01]
 */
import fs from 'node:fs';
import path from 'node:path';

const JOINT_MAP = {
  Hips: 'root',
  pelvis: 'root',
  Spine: 'spine',
  LowerBack: 'spine',
  Spine1: 'chest',
  Spine2: 'chest',
  Chest: 'chest',
  Neck: 'neck',
  Head: 'head',
  LeftShoulder: 'clavicleL',
  clavicleL: 'clavicleL',
  LeftArm: 'upperArmL',
  upperArmL: 'upperArmL',
  LeftForeArm: 'foreArmL',
  foreArmL: 'foreArmL',
  LeftHand: 'handL',
  handL: 'handL',
  RightShoulder: 'clavicleR',
  clavicleR: 'clavicleR',
  RightArm: 'upperArmR',
  upperArmR: 'upperArmR',
  RightForeArm: 'foreArmR',
  foreArmR: 'foreArmR',
  RightHand: 'handR',
  handR: 'handR',
  LeftUpLeg: 'thighL',
  thighL: 'thighL',
  LeftLeg: 'shinL',
  shinL: 'shinL',
  LeftFoot: 'footL',
  footL: 'footL',
  LeftToeBase: 'toeL',
  toeL: 'toeL',
  RightUpLeg: 'thighR',
  thighR: 'thighR',
  RightLeg: 'shinR',
  shinR: 'shinR',
  RightFoot: 'footR',
  footR: 'footR',
  RightToeBase: 'toeR',
  toeR: 'toeR',
};

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function rotAxisMat(axis, rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  if (axis === 'X') return [1, 0, 0, 0, c, -s, 0, s, c];
  if (axis === 'Y') return [c, 0, s, 0, 1, 0, -s, 0, c];
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function mul3(a, b) {
  const o = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      o[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
    }
  }
  return o;
}

function matToEulerXYZDeg(m) {
  const sy = Math.max(-1, Math.min(1, m[2]));
  const y = Math.asin(sy);
  let x = 0;
  let z = 0;
  if (Math.abs(sy) < 0.99999) {
    x = Math.atan2(-m[5], m[8]);
    z = Math.atan2(-m[1], m[0]);
  } else {
    x = Math.atan2(m[7], m[4]);
  }
  return [
    Math.round(x * RAD2DEG * 10) / 10,
    Math.round(y * RAD2DEG * 10) / 10,
    Math.round(z * RAD2DEG * 10) / 10,
  ];
}

function parseBVH(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  const joints = [];
  const stack = [];
  let totalChannels = 0;

  while (i < lines.length) {
    const line = lines[i++].trim();
    if (!line) continue;
    if (line === 'MOTION') break;
    const tok = line.split(/\s+/);
    if (tok[0] === 'ROOT' || tok[0] === 'JOINT') {
      const joint = { name: tok[1], channels: [], offsetIdx: totalChannels };
      joints.push(joint);
      stack.push(joint);
    } else if (tok[0] === 'End') {
      stack.push({ name: 'EndSite', channels: [] });
    } else if (tok[0] === 'CHANNELS') {
      const n = Number(tok[1]);
      const cur = stack[stack.length - 1];
      cur.offsetIdx = totalChannels;
      cur.channels = tok.slice(2, 2 + n);
      totalChannels += n;
    } else if (tok[0] === '}') {
      stack.pop();
    }
  }

  let framesCount = 0;
  let frameTime = 1 / 60;
  const frames = [];
  while (i < lines.length) {
    const line = lines[i++].trim();
    if (!line) continue;
    if (line.startsWith('Frames:')) framesCount = Number(line.split(':')[1].trim());
    else if (line.startsWith('Frame Time:')) frameTime = Number(line.split(':')[1].trim());
    else frames.push(line.split(/\s+/).map(Number));
  }

  return { joints, totalChannels, framesCount: framesCount || frames.length, frameTime, frames };
}

function extractFramePoseSpec(bvh, frameIdx, posScale, rootOrigin) {
  const row = bvh.frames[frameIdx];
  const root = { dx: 0, dy: 0, dz: 0, rx: 0, ry: 0, rz: 0 };
  const bones = {};

  for (const j of bvh.joints) {
    const target = JOINT_MAP[j.name];
    if (!target || j.channels.length === 0) continue;

    let tx = 0, ty = 0, tz = 0;
    let m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    for (let c = 0; c < j.channels.length; c++) {
      const ch = j.channels[c];
      const v = row[j.offsetIdx + c] || 0;
      if (ch === 'Xposition') tx = v * posScale;
      else if (ch === 'Yposition') ty = v * posScale;
      else if (ch === 'Zposition') tz = v * posScale;
      else if (ch === 'Xrotation') m = mul3(m, rotAxisMat('X', v * DEG2RAD));
      else if (ch === 'Yrotation') m = mul3(m, rotAxisMat('Y', v * DEG2RAD));
      else if (ch === 'Zrotation') m = mul3(m, rotAxisMat('Z', v * DEG2RAD));
    }

    const [rx, ry, rz] = matToEulerXYZDeg(m);
    if (target === 'root') {
      root.dx = Math.round((tx - rootOrigin[0]) * 1000) / 1000;
      root.dy = Math.round((ty - rootOrigin[1]) * 1000) / 1000;
      root.dz = Math.round((tz - rootOrigin[2]) * 1000) / 1000;
      root.rx = rx;
      root.ry = ry;
      root.rz = rz;
    } else if (Math.abs(rx) + Math.abs(ry) + Math.abs(rz) > 0.4) {
      bones[target] = [rx, ry, rz];
    }
  }
  return { root, bones };
}

export function convertBVHToTrackSource(bvhText, opts = {}) {
  const bvh = parseBVH(bvhText);
  if (bvh.frames.length === 0) throw new Error('No MOTION frames found in BVH file');

  const trackName = opts.name || 'TRACK_MOCAP_IMPORT';
  const posScale = opts.scale ?? 0.01;
  const keyStride = Math.max(1, opts.step ?? 4);
  const fpsOut = 60;
  const totalSec = (bvh.frames.length - 1) * bvh.frameTime;
  const totalFramesOut = Math.max(2, Math.round(totalSec * fpsOut));

  // Capture initial root position as local origin
  const origin = [0, 0, 0];
  const rootJoint = bvh.joints.find((j) => JOINT_MAP[j.name] === 'root');
  if (rootJoint) {
    for (let c = 0; c < rootJoint.channels.length; c++) {
      const ch = rootJoint.channels[c];
      const v = (bvh.frames[0][rootJoint.offsetIdx + c] || 0) * posScale;
      if (ch === 'Xposition') origin[0] = v;
      if (ch === 'Yposition') origin[1] = v;
      if (ch === 'Zposition') origin[2] = v;
    }
  }

  const keys = [];
  for (let fOut = 0; fOut <= totalFramesOut; fOut += keyStride) {
    const tSec = fOut / fpsOut;
    const rawIdx = Math.min(bvh.frames.length - 1, Math.round(tSec / bvh.frameTime));
    const spec = extractFramePoseSpec(bvh, rawIdx, posScale, origin);
    keys.push({ f: fOut, spec });
  }
  if (keys[keys.length - 1].f !== totalFramesOut) {
    keys.push({
      f: totalFramesOut,
      spec: extractFramePoseSpec(bvh, bvh.frames.length - 1, posScale, origin),
    });
  }

  const lines = [`export const ${trackName}: Track = {`, '  keys: ['];
  for (const k of keys) {
    const bonesStr = Object.entries(k.spec.bones)
      .map(([b, v]) => `${b}: [${v[0]}, ${v[1]}, ${v[2]}]`)
      .join(', ');
    lines.push(
      `    { f: ${k.f}, pose: makePose(POSE_NEUTRAL, { root: { dx: ${k.spec.root.dx}, dy: ${k.spec.root.dy}, dz: ${k.spec.root.dz}, rx: ${k.spec.root.rx}, ry: ${k.spec.root.ry}, rz: ${k.spec.root.rz} }, bones: { ${bonesStr} } }) },`,
    );
  }
  lines.push('  ],', '};');
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (!args[0] || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/bvh-to-poses.mjs <input.bvh> [--name TRACK_NAME] [--step 4] [--scale 0.01]');
    process.exit(args[0] ? 0 : 1);
  }
  const inputPath = path.resolve(args[0]);
  const getFlag = (flag, fallback) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
  };
  const bvhText = fs.readFileSync(inputPath, 'utf8');
  const out = convertBVHToTrackSource(bvhText, {
    name: getFlag('--name', 'TRACK_MOCAP_IMPORT'),
    step: Number(getFlag('--step', '4')),
    scale: Number(getFlag('--scale', '0.01')),
  });
  console.log(out);
}
