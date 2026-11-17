// Earth "Roda" arena: textured packed terracotta courtyard, stone perimeter kerb,
// horizon palm silhouettes, and animated clapping Roda spectators + Bateria musicians
// (Berimbau with cabaça gourd, Atabaque barrel drum, Pandeiro).
import * as THREE from 'three';
import {
  getEarthRodaTextureSet,
  getLunarRodaTextureSet,
  getWashiPaperTextureSet,
  getWoodTextureSet,
} from './textures';
import { stylePreset, type VisualStyleId } from './presets';
import { addOutline, toonMat } from './toon';

export interface ArenaHandle {
  group: THREE.Group;
  updateBeat(beatPhaseNorm: number): void;
  updateCameraVisibility(cameraPos: THREE.Vector3, focusPos: THREE.Vector3): void;
  applyStyle(styleId: VisualStyleId): void;
}

interface SpectatorActor {
  root: THREE.Group;
  bobGroup: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  phaseOffset: number;
  isMusician: boolean;
}

export function buildEarthRoda(radius = 6.5): ArenaHandle {
  const group = new THREE.Group();
  const earthTex = getEarthRodaTextureSet();
  const lunarTex = getLunarRodaTextureSet();
  const washiTex = getWashiPaperTextureSet();
  const woodTex = getWoodTextureSet();

  // Procedural sky dome supporting Bahia Sunset, Ink Wash Mist, Midnight Stars, and Lunar Earth-rise
  const skyGeo = new THREE.SphereGeometry(65, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color('#231645') },
      midColor: { value: new THREE.Color('#c84e31') },
      botColor: { value: new THREE.Color('#f4a261') },
      sunDiscColor: { value: new THREE.Color('#fff0c2') },
      uStarStrength: { value: 0.0 },
      uEarthRise: { value: 0.0 },
      uSumieMix: { value: 0.0 },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 topColor; uniform vec3 midColor; uniform vec3 botColor;
      uniform vec3 sunDiscColor;
      uniform float uStarStrength; uniform float uEarthRise; uniform float uSumieMix;
      varying vec3 vPos;
      float hash3(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }
      void main() {
        vec3 dir = normalize(vPos);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(botColor, midColor, smoothstep(0.0, 0.28, h));
        col = mix(col, topColor, smoothstep(0.28, 0.85, h));

        // Crisp cel solar/lunar disc framed cleanly in left sky beside upper HUD bars
        vec3 sunDir = normalize(vec3(-0.48, 0.108, -0.871));
        float sunDot = dot(dir, sunDir);
        float sunCore = smoothstep(0.9986, 0.99905, sunDot);
        float sunHalo = pow(max(sunDot, 0.0), 96.0) * (1.0 - uStarStrength) * 0.36;
        float isDayOrDusk = (1.0 - uStarStrength) * (1.0 - uEarthRise);
        float bandZone = smoothstep(0.01, 0.04, dir.y) * (1.0 - smoothstep(0.14, 0.26, dir.y));
        float arcadeBands = step(0.18, fract(dir.y * 58.0));
        float sunsetCut = mix(1.0, arcadeBands * 0.84 + 0.16, bandZone * isDayOrDusk * 0.55);
        float sumieOrCel = uSumieMix > 0.5 ? 0.88 : 0.82;
        col = mix(col, sunDiscColor, sunCore * sunsetCut * sumieOrCel);
        col += sunDiscColor * sunHalo;

        // Subtle stylized layered horizon clouds during daytime / Bahia sunset styles
        if (isDayOrDusk > 0.2 && uSumieMix < 0.5 && dir.y > 0.015 && dir.y < 0.34) {
          float cloudBandA = smoothstep(0.45, 0.82, sin(dir.x * 11.0 + dir.z * 7.0 + dir.y * 28.0) * 0.5 + 0.5);
          float cloudBandB = smoothstep(0.55, 0.90, sin(dir.x * 23.0 - dir.y * 64.0) * 0.5 + 0.5);
          float cloudMask = cloudBandA * cloudBandB * smoothstep(0.015, 0.06, dir.y) * (1.0 - smoothstep(0.18, 0.34, dir.y));
          col = mix(col, mix(midColor, sunDiscColor, 0.55), cloudMask * 0.28 * isDayOrDusk);
        }

        // Smooth circular sub-pixel starfield across two density octaves (shining down to horizon on Lunar airless sky)
        float starHorizMin = mix(0.02, 0.005, uEarthRise);
        float starHorizFade = mix(0.12, 0.038, uEarthRise);
        if (uStarStrength > 0.01 && dir.y > starHorizMin) {
          float hMask = smoothstep(starHorizMin, starHorizFade, dir.y);
          vec3 p1 = dir * 135.0;
          vec3 c1 = floor(p1);
          vec3 f1 = fract(p1) - 0.5;
          float r1 = hash3(c1);
          if (r1 > 0.958) {
            vec3 jit = vec3(hash3(c1 + 1.7), hash3(c1 + 3.1), hash3(c1 + 5.3)) - 0.5;
            float dist = length(f1 - jit * 0.48);
            float rad = mix(0.09, 0.19, fract(r1 * 47.0));
            float star = smoothstep(rad, rad * 0.15, dist) * hMask;
            vec3 tint = mix(vec3(1.0, 0.90, 0.78), vec3(0.78, 0.90, 1.0), fract(r1 * 91.0));
            col += tint * star * uStarStrength * 1.2;
          }
          vec3 p2 = dir * 240.0;
          vec3 c2 = floor(p2);
          vec3 f2 = fract(p2) - 0.5;
          float r2 = hash3(c2 + 19.4);
          if (r2 > 0.974) {
            float dist2 = length(f2);
            float star2 = smoothstep(0.17, 0.02, dist2) * hMask;
            col += vec3(0.84, 0.92, 1.0) * star2 * 0.7 * uStarStrength;
          }
        }

        // Vivid 3D spherical crescent Earthrise positioned visibly above lunar horizon in upper-right sky
        if (uEarthRise > 0.01) {
          vec3 earthDir = normalize(vec3(0.42, 0.068, -0.905));
          float ed = dot(dir, earthDir);
          float rCos = 0.9960;
          float disc = smoothstep(rCos, rCos + 0.0005, ed);
          if (disc > 0.001) {
            float radNorm = clamp(sqrt(max(0.0, 1.0 - ed * ed)) / sqrt(1.0 - rCos * rCos), 0.0, 1.0);
            vec3 tang = dir - earthDir * ed;
            float tangLen = length(tang);
            vec3 tangDir = tangLen > 1e-5 ? tang / tangLen : vec3(0.0, 1.0, 0.0);
            float sphereZ = sqrt(max(0.0, 1.0 - radNorm * radNorm));
            vec3 sphereN = normalize(tangDir * radNorm - earthDir * sphereZ);
            float sunLit = smoothstep(-0.10, 0.58, dot(sphereN, normalize(vec3(-0.76, 0.34, 0.55))));
            float c1 = sin(sphereN.x * 5.2 + cos(sphereN.y * 4.4) * 1.4) * cos(sphereN.y * 4.6 - sin(sphereN.z * 3.8));
            float landMask = smoothstep(0.08, 0.36, c1 + 0.10);
            vec3 earthSurface = mix(vec3(0.06, 0.36, 0.88), vec3(0.24, 0.56, 0.36), landMask);
            float clouds = smoothstep(0.20, 0.68, sin(sphereN.x * 8.5 + sphereN.y * 4.5 + cos(sphereN.y * 10.0)));
            earthSurface = mix(earthSurface, vec3(0.95, 0.98, 1.0), clouds * 0.52);
            vec3 limbGlow = vec3(0.32, 0.80, 1.0) * smoothstep(0.58, 0.98, radNorm) * 0.62;
            col = mix(col, earthSurface * (0.05 + sunLit * 0.98) + limbGlow, disc * uEarthRise);
          }
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  group.add(new THREE.Mesh(skyGeo, skyMat));

  // Outer plaza floor (hatchable: false keeps sunlit sand clean under Comic Crosshatch)
  const outerGroundMat = toonMat('#6e442c', {
    map: earthTex.map,
    bumpMap: earthTex.bumpMap,
    bumpScale: 0.03,
    rimStrength: 0,
    hatchable: false,
  });
  const outerGround = new THREE.Mesh(new THREE.CircleGeometry(45, 56), outerGroundMat);
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.025;
  outerGround.receiveShadow = true;
  group.add(outerGround);

  // Inner Roda fighting circle
  const floorGeo = new THREE.CylinderGeometry(radius, radius + 0.16, 0.08, 64);
  const floorMat = toonMat('#d89c72', {
    map: earthTex.map,
    bumpMap: earthTex.bumpMap,
    bumpScale: 0.024,
    rimStrength: 0,
    hatchable: false,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.04;
  floor.receiveShadow = true;
  group.add(floor);

  // Chalk / hologram Roda rings
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf7efe2 });
  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(radius - 0.18, radius - 0.05, 64),
    ringMat,
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.004;
  group.add(outerRing);

  const innerRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.56, 48), ringMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.004;
  group.add(innerRing);

  // Perimeter cobblestone / basalt kerb outside Roda ring
  const stoneMatA = toonMat('#8c6b53', { bumpMap: earthTex.bumpMap, bumpScale: 0.02, hatchable: false });
  const stoneMatB = toonMat('#735641', { bumpMap: earthTex.bumpMap, bumpScale: 0.02, hatchable: false });
  const kerbCount = 44;
  for (let i = 0; i < kerbCount; i++) {
    const a = (i / kerbCount) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.09, 0.24),
      i % 2 === 0 ? stoneMatA : stoneMatB,
    );
    stone.position.set(Math.cos(a) * (radius + 0.12), 0.005, Math.sin(a) * (radius + 0.12));
    stone.rotation.y = -a + Math.PI / 2;
    stone.receiveShadow = true;
    stone.castShadow = true;
    group.add(stone);
  }

  // Horizon Group A: Salvador Bahia Pelourinho colonial gables & curved coastal palms (Bahia / Crosshatch / Noturna)
  const bahiaHorizon = new THREE.Group();
  const silMat = toonMat('#3d2236', { shadowTint: '#251226', rimColor: '#f4a261', rimStrength: 0.35, hatchable: false });
  const facadeMatA = toonMat('#533146', { shadowTint: '#2a162b', rimColor: '#f4a261', rimStrength: 0.25, hatchable: false });
  const facadeMatB = toonMat('#432842', { shadowTint: '#221328', rimColor: '#f4a261', rimStrength: 0.22, hatchable: false });

  // Colonial Pelourinho skyline buildings & plaza balustrade wall far behind Roda
  for (let b = 0; b < 14; b++) {
    const ang = -Math.PI * 0.92 + (b / 13) * Math.PI * 0.84;
    const dist = 25.5 + (b % 3) * 2.8;
    const w = 2.4 + (b % 3) * 0.85;
    const h = 2.6 + ((b * 7) % 5) * 0.65;
    const d = 1.9 + (b % 2) * 0.5;
    const house = new THREE.Group();
    house.position.set(Math.cos(ang) * dist, -0.1, Math.sin(ang) * dist);
    house.lookAt(0, 0, 0);

    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), b % 2 === 0 ? facadeMatA : facadeMatB);
    wall.position.y = h * 0.5;
    house.add(wall);

    // Mix classic flat cornice coastal sobrados with pitched tile roofs & Pelourinho bell tower
    if (b === 8) {
      const spire = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.2, 0.95), facadeMatA);
      spire.position.y = h + 1.05;
      house.add(spire);
      const dome = new THREE.Mesh(new THREE.ConeGeometry(0.66, 1.1, 6), silMat);
      dome.position.y = h + 2.65;
      house.add(dome);
    } else if (b % 2 === 0) {
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, 0.18, d + 0.16), silMat);
      cornice.position.y = h + 0.08;
      house.add(cornice);
    } else {
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, 0.92, 4), silMat);
      roof.rotation.y = Math.PI * 0.25;
      roof.position.y = h + 0.44;
      house.add(roof);
    }

    // Lit warm amber Colonial windows standing out sharply during Roda Noturna & twilight
    for (let wx = -0.65; wx <= 0.66; wx += 0.65) {
      if (Math.abs(wx) > w * 0.34) continue;
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.44),
        new THREE.MeshBasicMaterial({ color: b % 3 === 0 ? 0xffb35c : 0xff8c42 }),
      );
      win.position.set(wx, h * 0.64, d * 0.5 + 0.02);
      house.add(win);
    }
    bahiaHorizon.add(house);
  }

  // Gently curving segmented Bahia palm trees framing the rooftops
  for (let i = 0; i < 8; i++) {
    const ang = -Math.PI * 0.88 + (i / 7) * Math.PI * 0.76;
    const dist = 21.5 + (i % 3) * 3.0;
    const totalH = 5.0 + (i % 2) * 1.4;
    const lean = (i % 2 === 0 ? 1 : -1) * 0.22;
    const palm = new THREE.Group();
    palm.position.set(Math.cos(ang) * dist, -0.1, Math.sin(ang) * dist);
    palm.rotation.y = ang * 0.5;

    let curX = 0;
    let curY = 0;
    const segCount = 3;
    const segH = totalH / segCount;
    for (let s = 0; s < segCount; s++) {
      const tilt = lean * (s + 1) * 0.55;
      const rBot = 0.22 - s * 0.038;
      const rTop = 0.18 - s * 0.036;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, segH + 0.08, 8), silMat);
      trunk.rotation.z = tilt;
      trunk.position.set(curX - Math.sin(tilt) * segH * 0.5, curY + Math.cos(tilt) * segH * 0.5, 0);
      palm.add(trunk);
      curX -= Math.sin(tilt) * segH;
      curY += Math.cos(tilt) * segH;
    }

    for (let f = 0; f < 7; f++) {
      const fa = (f / 7) * Math.PI * 2 + i * 0.3;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(curX, curY, 0);
      frondGroup.rotation.y = fa;

      const innerLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.35, 4), silMat);
      innerLeaf.scale.set(0.32, 1, 1.4);
      innerLeaf.rotation.z = -Math.PI * 0.34;
      innerLeaf.position.set(0.56, 0.18, 0);
      frondGroup.add(innerLeaf);

      const outerLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.19, 1.32, 4), silMat);
      outerLeaf.scale.set(0.25, 1, 1.2);
      outerLeaf.rotation.z = -Math.PI * 0.62;
      outerLeaf.position.set(1.42, -0.08, 0);
      frondGroup.add(outerLeaf);

      palm.add(frondGroup);
    }
    bahiaHorizon.add(palm);
  }

  // Plaza Gambiarra warm string lights slung across wooden poles (active in Roda Noturna)
  const noturnaLights = new THREE.Group();
  noturnaLights.visible = false;
  const postMat = toonMat('#3d2518', { hatchable: false });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffc66e });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 3.6, 8), postMat);
    post.position.set(side * 4.4, 1.8, -(radius + 1.45));
    post.castShadow = true;
    addOutline(post, 1.05);
    noturnaLights.add(post);
  }
  const lanternBulbCount = 9;
  for (let b = 0; b < lanternBulbCount; b++) {
    const u = b / (lanternBulbCount - 1);
    const lx = THREE.MathUtils.lerp(-4.2, 4.2, u);
    const sag = Math.sin(u * Math.PI) * 0.58;
    const ly = 3.38 - sag;
    const lz = -(radius + 1.42);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), bulbMat);
    bulb.position.set(lx, ly, lz);
    noturnaLights.add(bulb);
  }
  const warmFillL = new THREE.PointLight(0xff9b3d, 2.2, 11, 1.6);
  warmFillL.position.set(-2.9, 2.75, -(radius + 1.1));
  const warmFillR = new THREE.PointLight(0xff9b3d, 2.2, 11, 1.6);
  warmFillR.position.set(2.9, 2.75, -(radius + 1.1));
  noturnaLights.add(warmFillL, warmFillR);
  bahiaHorizon.add(noturnaLights);
  group.add(bahiaHorizon);

  // Horizon Group B: Shan-Shui layered ink mountains + jointed bamboo stalks (Bamboo Sumi-e style)
  const sumieHorizon = new THREE.Group();
  sumieHorizon.visible = false;
  const peakNearMat = toonMat('#5e5244', { shadowTint: '#322b22', rimStrength: 0, hatchable: false });
  const peakFarMat = toonMat('#857867', { shadowTint: '#4f463b', rimStrength: 0, hatchable: false });
  const bambooMat = toonMat('#3d342a', { shadowTint: '#1f1914', rimStrength: 0.12, hatchable: false });
  for (let m = 0; m < 10; m++) {
    const ang = -Math.PI * 0.90 + (m / 9) * Math.PI * 0.80;
    const farDist = 28 + (m % 2) * 3.0;
    const farPeak = new THREE.Mesh(
      new THREE.ConeGeometry(4.2 + (m % 3) * 1.1, 6.2 + (m % 4) * 1.4, 7),
      peakFarMat,
    );
    farPeak.position.set(Math.cos(ang) * farDist, 2.4, Math.sin(ang) * farDist);
    sumieHorizon.add(farPeak);

    if (m % 2 === 0) {
      const nearDist = 22 + (m % 3) * 1.8;
      const nearPeak = new THREE.Mesh(
        new THREE.ConeGeometry(3.1 + (m % 2) * 0.9, 3.8 + (m % 3) * 0.9, 6),
        peakNearMat,
      );
      nearPeak.position.set(Math.cos(ang + 0.08) * nearDist, 1.5, Math.sin(ang + 0.08) * nearDist);
      sumieHorizon.add(nearPeak);
    }
  }
  for (let b = 0; b < 14; b++) {
    const ang = -Math.PI * 0.89 + (b / 13) * Math.PI * 0.78;
    const dist = 14.5 + (b % 4) * 2.4;
    const stalk = new THREE.Group();
    stalk.position.set(Math.cos(ang) * dist, -0.05, Math.sin(ang) * dist);
    const h = 4.8 + (b % 3) * 1.3;
    const lean = ((b % 3) - 1) * 0.07;
    const culm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.09, h, 6), bambooMat);
    culm.position.y = h * 0.5;
    culm.rotation.z = lean;
    stalk.add(culm);

    // Distinct bamboo culm node rings & ink brush leaf blades
    for (let y = 1.1; y < h - 0.5; y += 1.05) {
      const node = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.015, 5, 8), bambooMat);
      node.rotation.x = Math.PI / 2;
      node.position.set(-Math.sin(lean) * y, y, 0);
      stalk.add(node);
      if (y > 2.2) {
        for (const side of [-1, 1]) {
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.92, 4), bambooMat);
          leaf.scale.set(0.28, 1, 0.7);
          leaf.rotation.z = side * -1.15;
          leaf.position.set(-Math.sin(lean) * y + side * 0.38, y + 0.08, 0);
          stalk.add(leaf);
        }
      }
    }
    sumieHorizon.add(stalk);
  }
  group.add(sumieHorizon);

  // Horizon Group C: Lunar Crater ridges, boulders & orbital comm relay beacons (shown in 'lunar' style)
  const lunarHorizon = new THREE.Group();
  lunarHorizon.visible = false;
  const ridgeMat = toonMat('#434c5e', { shadowTint: '#1b212e', rimColor: '#67e8f9', rimStrength: 0.24, hatchable: false });
  const boulderMat = toonMat('#5b677d', { shadowTint: '#232a3a', rimColor: '#9beeff', rimStrength: 0.30, hatchable: false });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x3ce8ff });
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * Math.PI * 2;
    if (Math.sin(ang) > 0.70) continue;
    const dist = 24 + (i % 3) * 4.5;
    const peakH = 1.4 + (i % 4) * 0.75;
    const peakR = 2.6 + (i % 3) * 1.25;
    // Asymmetric stepped crater escarpment arc instead of uniform smooth cone frustums
    const peak = new THREE.Mesh(new THREE.DodecahedronGeometry(peakR * 0.68, 1), ridgeMat);
    peak.scale.set(1.45, peakH / (peakR * 1.1), 0.92);
    peak.position.set(Math.cos(ang) * dist, peakH * 0.12 - 0.18, Math.sin(ang) * dist);
    peak.rotation.set((i % 2) * 0.2, ang * 1.7, ((i % 3) - 1) * 0.14);
    lunarHorizon.add(peak);

    // Scattered foreground lunar basalt boulders outside perimeter
    if (i % 2 === 0) {
      const bDist = radius + 2.4 + (i % 3) * 1.9;
      const bSize = 0.24 + (i % 3) * 0.13;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(bSize, 0), boulderMat);
      rock.scale.set(1.25, 0.75, 1.1);
      rock.position.set(Math.cos(ang + 0.12) * bDist, bSize * 0.22 - 0.02, Math.sin(ang + 0.12) * bDist);
      rock.rotation.set(i * 0.4, i * 0.9, 0);
      addOutline(rock, 1.055);
      lunarHorizon.add(rock);
    }

    if (i % 5 === 0) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.085, 3.8, 6), ridgeMat);
      mast.position.set(Math.cos(ang) * 15.5, 1.85, Math.sin(ang) * 15.5);
      const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), boulderMat);
      crossArm.position.y = 1.4;
      mast.add(crossArm);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), beaconMat);
      tip.position.y = 1.95;
      mast.add(tip);
      lunarHorizon.add(mast);
    }
  }
  group.add(lunarHorizon);

  // Warm overhead lantern / holographic beacon above the Bateria (active in Noturna & Lunar)
  const bateriaLantern = new THREE.PointLight(0xff9b3d, 0, 14, 1.4);
  bateriaLantern.position.set(0, 2.35, -(radius + 0.55));
  group.add(bateriaLantern);
  const lanternBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffb35c }),
  );
  lanternBulb.position.copy(bateriaLantern.position);
  lanternBulb.visible = false;
  group.add(lanternBulb);

  // Articulated clapping Roda spectators + Bateria (Berimbau, Atabaque, Pandeiro)
  const actors: SpectatorActor[] = [];
  const specCount = 18;
  const shirtColors = ['#f2f0e8', '#e63946', '#2a9d8f', '#e9c46a', '#457b9d', '#f4a261'];
  const skinTones = ['#6b4026', '#9c6644', '#b87c54', '#52301c', '#d0a07a'];
  const woodMat = toonMat('#7a4b2a', { map: woodTex.map, bumpMap: woodTex.bumpMap, bumpScale: 0.015, hatchable: false });
  const gourdMat = toonMat('#d48c3b', { rimStrength: 0.35, hatchable: false });
  const gourdBandMat = toonMat('#c8102e', { hatchable: false });
  const drumMat = toonMat('#5e361c', { map: woodTex.map, bumpMap: woodTex.bumpMap, bumpScale: 0.02, hatchable: false });
  const skinHeadMat = toonMat('#f2e6cf', { hatchable: false });
  const hatStrawMat = toonMat('#ead7ab', { shadowTint: '#8a734f', hatchable: false });
  const aoContactGeo = new THREE.CircleGeometry(0.28, 16);
  const aoContactMat = new THREE.MeshBasicMaterial({
    color: 0x160a0d,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });

  // Determine the 3 central rear indices for Bateria
  const rearIndices: number[] = [];
  for (let i = 0; i < specCount; i++) {
    const ang = (i / specCount) * Math.PI * 2;
    if (Math.sin(ang) < -0.82) rearIndices.push(i);
  }

  for (let i = 0; i < specCount; i++) {
    const ang = (i / specCount) * Math.PI * 2;
    if (Math.sin(ang) > 0.65) continue; // Keep camera lane clear

    const sg = new THREE.Group();
    const bobGroup = new THREE.Group();
    const dist = radius + 0.78;
    sg.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    sg.lookAt(0, 0, 0);
    sg.add(bobGroup);

    // Grounded contact shadow disc so spectators & musicians sit firmly on courtyard earth
    const aoDisc = new THREE.Mesh(aoContactGeo, aoContactMat);
    aoDisc.rotation.x = -Math.PI / 2;
    aoDisc.position.y = 0.002;
    sg.add(aoDisc);

    const musicianSlot = rearIndices.indexOf(i);
    const isMusician = musicianSlot >= 0;

    const shirtCol = shirtColors[i % shirtColors.length];
    const skinCol = skinTones[i % skinTones.length];
    const specSkinMat = toonMat(skinCol, { hatchable: false });
    const shirtMat = toonMat(shirtCol, { hatchable: false });
    const abadaMat = toonMat('#f2efe6', { hatchable: false });

    const scaleH = isMusician ? 0.94 : 0.95 + (i % 3) * 0.04;
    bobGroup.scale.set(scaleH, scaleH, scaleH);

    // Legs & feet (seated low stool posture for Bateria musicians, standing barefoot stance otherwise)
    if (isMusician) {
      const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 12), woodMat);
      stoolTop.position.set(0, 0.32, -0.02);
      addOutline(stoolTop, 1.05);
      sg.add(stoolTop);
      const stoolBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.30, 10), woodMat);
      stoolBase.position.set(0, 0.15, -0.02);
      sg.add(stoolBase);
    }
    const legH = isMusician ? 0.36 : 0.44;
    for (const s of [-0.085, 0.085]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.054, legH, 10), abadaMat);
      leg.position.set(s, legH * 0.5 + 0.02, isMusician ? 0.08 : 0);
      leg.castShadow = true;
      addOutline(leg, 1.055);
      bobGroup.add(leg);

      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.046, 8, 6), specSkinMat);
      foot.scale.set(0.95, 0.55, 1.55);
      foot.position.set(s, 0.024, (isMusician ? 0.08 : 0) + 0.036);
      addOutline(foot, 1.05);
      bobGroup.add(foot);
    }

    // Torso & subtle waist belt sash
    const bodyY = isMusician ? 0.54 : 0.64;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.125, 0.42, 12), shirtMat);
    body.position.y = bodyY;
    body.castShadow = true;
    addOutline(body, 1.055);
    bobGroup.add(body);

    const waistCord = new THREE.Mesh(
      new THREE.TorusGeometry(0.132, 0.016, 6, 16),
      toonMat(shirtColors[(i + 2) % shirtColors.length], { hatchable: false }),
    );
    waistCord.rotation.x = Math.PI / 2;
    waistCord.position.y = bodyY - 0.17;
    bobGroup.add(waistCord);

    // Head + varied hair / hats / headwraps
    const headY = bodyY + 0.32;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), specSkinMat);
    head.position.y = headY;
    head.castShadow = true;
    addOutline(head, 1.06);
    bobGroup.add(head);

    const specHairMat = toonMat(i % 2 === 0 ? '#1b141c' : '#2d1c16', { hatchable: false });
    if (i % 4 === 1) {
      // Straw / Panama Roda hat
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.195, 0.014, 14), hatStrawMat);
      brim.position.set(0, headY + 0.075, 0.01);
      addOutline(brim, 1.05);
      bobGroup.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.115, 0.08, 12), hatStrawMat);
      crown.position.set(0, headY + 0.115, 0.005);
      addOutline(crown, 1.05);
      bobGroup.add(crown);
    } else if (i % 4 === 3) {
      // Wrapped Bahian scarf / cap
      const wrap = new THREE.Mesh(
        new THREE.TorusGeometry(0.102, 0.026, 6, 14),
        toonMat(shirtColors[(i + 1) % shirtColors.length], { hatchable: false }),
      );
      wrap.rotation.x = Math.PI * 0.45;
      wrap.position.set(0, headY + 0.055, 0);
      addOutline(wrap, 1.05);
      bobGroup.add(wrap);
    } else {
      const hairCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.56),
        specHairMat,
      );
      hairCap.position.y = headY + 0.005;
      hairCap.rotation.x = -0.18;
      bobGroup.add(hairCap);
    }

    // Connected shoulder joints + articulated clapping/playing arms with ink outlines
    const armY = bodyY + 0.12;
    const armL = new THREE.Group();
    armL.position.set(0.155, armY, 0.02);
    const shL = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), shirtMat);
    addOutline(shL, 1.055);
    armL.add(shL);
    const upperL = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.13, 4, 8), specSkinMat);
    upperL.rotation.set(0.35, 0, 0.25);
    upperL.position.set(0.02, -0.07, 0.04);
    addOutline(upperL, 1.06);
    armL.add(upperL);
    const segL = new THREE.Mesh(new THREE.CapsuleGeometry(0.034, 0.17, 4, 8), specSkinMat);
    segL.rotation.set(Math.PI * 0.46, 0, 0.44);
    segL.position.set(-0.04, -0.10, 0.16);
    addOutline(segL, 1.06);
    armL.add(segL);
    bobGroup.add(armL);

    const armR = new THREE.Group();
    armR.position.set(-0.155, armY, 0.02);
    const shR = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), shirtMat);
    addOutline(shR, 1.055);
    armR.add(shR);
    const upperR = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.13, 4, 8), specSkinMat);
    upperR.rotation.set(0.35, 0, -0.25);
    upperR.position.set(-0.02, -0.07, 0.04);
    addOutline(upperR, 1.06);
    armR.add(upperR);
    const segR = new THREE.Mesh(new THREE.CapsuleGeometry(0.034, 0.17, 4, 8), specSkinMat);
    segR.rotation.set(Math.PI * 0.46, 0, -0.44);
    segR.position.set(0.04, -0.10, 0.16);
    addOutline(segR, 1.06);
    armR.add(segR);
    bobGroup.add(armR);

    if (musicianSlot === 1) {
      // Center Musician: tall Atabaque barrel drum standing firmly on floor
      const drumBody = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.72, 14), drumMat);
      drumBody.position.set(0, 0.36, 0.36);
      drumBody.castShadow = true;
      addOutline(drumBody, 1.05);
      sg.add(drumBody);

      const drumSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.02, 14), skinHeadMat);
      drumSkin.position.set(0, 0.72, 0.36);
      sg.add(drumSkin);
    } else if (musicianSlot === 0 || musicianSlot === 2) {
      // Berimbau Gunga & Viola held upright against seated player chest with string & cabaça gourd
      const side = musicianSlot === 0 ? 1 : -1;
      const bowGroup = new THREE.Group();
      bowGroup.position.set(side * 0.09, bodyY + 0.24, 0.24);

      const bow = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.018, 8, 22, Math.PI * 0.72),
        woodMat,
      );
      bow.position.set(-side * 0.45, 0.02, 0);
      bow.rotation.z = side > 0 ? -0.32 : Math.PI - 0.32;
      addOutline(bow, 1.07);
      bowGroup.add(bow);

      const arame = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 1.05, 5),
        new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }),
      );
      arame.position.set(side * 0.02, 0.02, 0);
      bowGroup.add(arame);

      const gourd = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), gourdMat);
      gourd.scale.set(1, 0.9, 1);
      gourd.position.set(side * 0.04, -0.26, -0.04);
      addOutline(gourd, 1.06);
      bowGroup.add(gourd);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.107, 0.107, 0.036, 10), gourdBandMat);
      band.position.copy(gourd.position);
      bowGroup.add(band);

      bobGroup.add(bowGroup);
    } else if (i % 5 === 0) {
      // Extra Pandeiro tambourine held cleanly at hands
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.016, 6, 16), woodMat);
      rim.rotation.x = Math.PI * 0.35;
      rim.position.set(0.06, -0.08, 0.28);
      addOutline(rim, 1.05);
      armR.add(rim);
    }

    actors.push({
      root: sg,
      bobGroup,
      armL,
      armR,
      phaseOffset: (i % 3) * 0.25,
      isMusician,
    });
    group.add(sg);
  }

  return {
    group,
    applyStyle(styleId: VisualStyleId) {
      const p = stylePreset(styleId);
      skyMat.uniforms.topColor.value.setHex(p.skyZenith);
      skyMat.uniforms.midColor.value.setHex(p.skyMid);
      skyMat.uniforms.botColor.value.setHex(p.skyHorizon);
      skyMat.uniforms.sunDiscColor.value.setHex(p.sunDiscColor);
      skyMat.uniforms.uStarStrength.value = p.starStrength;
      skyMat.uniforms.uEarthRise.value = p.earthRise;
      skyMat.uniforms.uSumieMix.value = p.sumieMix;

      const isLunar = styleId === 'lunar';
      const isSumie = styleId === 'sumie';
      const isNoturna = styleId === 'noturna';

      bahiaHorizon.visible = !isLunar && !isSumie;
      sumieHorizon.visible = isSumie;
      noturnaLights.visible = isNoturna;
      lunarHorizon.visible = isLunar;

      bateriaLantern.color.setHex(p.lanternColor);
      bateriaLantern.intensity = p.lanternIntensity;
      lanternBulb.visible = p.lanternIntensity > 0.05;
      (lanternBulb.material as THREE.MeshBasicMaterial).color.setHex(p.lanternColor);

      const texSet = isLunar ? lunarTex : isSumie ? washiTex : earthTex;
      floorMat.map = texSet.map;
      floorMat.bumpMap = texSet.bumpMap;
      outerGroundMat.map = texSet.map;
      outerGroundMat.bumpMap = texSet.bumpMap;
      stoneMatA.bumpMap = texSet.bumpMap;
      stoneMatB.bumpMap = texSet.bumpMap;

      if (isLunar) {
        floorMat.color.set('#b4bfce');
        outerGroundMat.color.set('#4c5464');
        ringMat.color.setHex(0x40e8ff);
        stoneMatA.color.set('#646d80');
        stoneMatB.color.set('#454d5c');
      } else if (isSumie) {
        floorMat.color.set('#efe6d3');
        outerGroundMat.color.set('#dcd0b8');
        ringMat.color.setHex(0x2d231b);
        stoneMatA.color.set('#695d50');
        stoneMatB.color.set('#4f453a');
        silMat.color.set('#4a4035');
      } else if (isNoturna) {
        floorMat.color.set('#806256');
        outerGroundMat.color.set('#3d2b28');
        ringMat.color.setHex(0xf2d299);
        stoneMatA.color.set('#564b54');
        stoneMatB.color.set('#3f353f');
        silMat.color.set('#141933');
        facadeMatA.color.set('#1f213d');
        facadeMatB.color.set('#181930');
      } else {
        floorMat.color.set('#d89c72');
        outerGroundMat.color.set('#6e442c');
        ringMat.color.setHex(0xf7efe2);
        stoneMatA.color.set('#8c6b53');
        stoneMatB.color.set('#735641');
        silMat.color.set('#3d2236');
        facadeMatA.color.set('#533146');
        facadeMatB.color.set('#432842');
      }

      floorMat.needsUpdate = true;
      outerGroundMat.needsUpdate = true;
      stoneMatA.needsUpdate = true;
      stoneMatB.needsUpdate = true;
    },
    updateBeat(beatPhaseNorm: number) {
      const pulse = Math.max(0, Math.sin(beatPhaseNorm * Math.PI));
      const clapSwing = Math.sin(beatPhaseNorm * Math.PI * 2);
      for (const a of actors) {
        a.bobGroup.position.y = pulse * (a.isMusician ? 0.032 : 0.055);
        if (a.isMusician) {
          // Musicians strike / shake on beat
          a.armR.rotation.x = -0.22 + clapSwing * 0.24;
          a.armL.rotation.x = -0.14 + Math.sin((beatPhaseNorm + 0.25) * Math.PI * 2) * 0.12;
        } else {
          // Roda spectators clap hands inward rhythmically on every beat
          const angleIn = Math.max(0, Math.sin((beatPhaseNorm + a.phaseOffset * 0.15) * Math.PI)) * 0.42;
          a.armL.rotation.y = angleIn;
          a.armR.rotation.y = -angleIn;
        }
      }
    },
    updateCameraVisibility(cameraPos: THREE.Vector3, focusPos: THREE.Vector3) {
      const fx = focusPos.x - cameraPos.x;
      const fz = focusPos.z - cameraPos.z;
      const fLen2 = Math.max(1e-4, fx * fx + fz * fz);
      for (const a of actors) {
        const ax = a.root.position.x - cameraPos.x;
        const az = a.root.position.z - cameraPos.z;
        const distCam2 = ax * ax + az * az;
        const proj = (ax * fx + az * fz) / fLen2;
        if (distCam2 < 4.5) {
          a.root.visible = false;
          continue;
        }
        if (proj > -0.15 && proj < 0.92) {
          const perpX = ax - fx * proj;
          const perpZ = az - fz * proj;
          const rayDist2 = perpX * perpX + perpZ * perpZ;
          a.root.visible = rayDist2 > 2.25;
        } else {
          a.root.visible = true;
        }
      }
    },
  };
}
