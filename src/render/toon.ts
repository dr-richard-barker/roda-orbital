// Street Fighter II / III HD inspired Cel-Shading (4-band crisp shadow + warm subsurface bounce + rim highlight) & ink outlines.
import * as THREE from 'three';
import type { StylePreset } from './presets';

const sharedStyleUniforms = {
  uHatchStrength: { value: 0 },
  uRimBoost: { value: 0 },
  uSumieMix: { value: 0 },
  uOutlineScale: { value: 1.0 },
};

let sharedGrad: THREE.DataTexture | null = null;

export function getToonGradient(): THREE.DataTexture {
  if (sharedGrad) return sharedGrad;
  // Crisp yet anti-aliased 4-plateau painted cel ramp (eliminates polygon diagonal aliasing while keeping SF2 bands bold)
  const stops = [
    92, 92, 92, 118,
    152, 152, 152, 152,
    180, 214, 214, 214,
    214, 236, 255, 255,
  ];
  const data = new Uint8Array(stops.length * 4);
  for (let i = 0; i < stops.length; i++) {
    const v = stops[i];
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, stops.length, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  sharedGrad = tex;
  return tex;
}

export interface ToonOptions {
  shadowTint?: string | number;
  rimColor?: string | number;
  rimStrength?: number;
  subsurfaceStrength?: number;
  hatchable?: boolean;
  map?: THREE.Texture;
  bumpMap?: THREE.Texture;
  bumpScale?: number;
  side?: THREE.Side;
}

export function toonMat(color: string | number, opts: ToonOptions = {}): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: getToonGradient(),
    map: opts.map ?? null,
    bumpMap: opts.bumpMap ?? null,
    bumpScale: opts.bumpScale ?? 0.012,
    side: opts.side ?? THREE.FrontSide,
  });

  const base = new THREE.Color(color);
  // SF2 arcade sprites shift shadows toward warm plum/crimson rather than muddy grey
  const defaultShadow = base.clone().lerp(new THREE.Color('#2c1336'), 0.44);
  const shadowCol = opts.shadowTint !== undefined ? new THREE.Color(opts.shadowTint) : defaultShadow;
  const rimCol = new THREE.Color(opts.rimColor ?? '#ffe6b0');
  const rimStrength = opts.rimStrength ?? 0.34;
  const sssStrength = opts.subsurfaceStrength ?? 0;
  const hatchFloor = opts.hatchable === false ? 0 : 1;

  mat.customProgramCacheKey = () =>
    `sf2-toon-${sssStrength.toFixed(2)}-${hatchFloor}-${opts.map ? 1 : 0}-${opts.bumpMap ? 1 : 0}`;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uShadowTint = { value: shadowCol };
    shader.uniforms.uRimColor = { value: rimCol };
    shader.uniforms.uRimStrength = { value: rimStrength };
    shader.uniforms.uSssStrength = { value: sssStrength };
    shader.uniforms.uHatchFloor = { value: hatchFloor };
    shader.uniforms.uHatchStrength = sharedStyleUniforms.uHatchStrength;
    shader.uniforms.uRimBoost = sharedStyleUniforms.uRimBoost;
    shader.uniforms.uSumieMix = sharedStyleUniforms.uSumieMix;

    shader.fragmentShader =
      `
      uniform vec3 uShadowTint;
      uniform vec3 uRimColor;
      uniform float uRimStrength;
      uniform float uSssStrength;
      uniform float uHatchFloor;
      uniform float uHatchStrength;
      uniform float uRimBoost;
      uniform float uSumieMix;
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      // Rim highlight for crisp silhouette separation (only boost rim when surface opts into rim lighting)
      vec3 viewDirN = normalize(vViewPosition);
      float ndv = max(dot(normalize(normal), viewDirN), 0.0);
      float fresnel = 1.0 - ndv;
      float rimBand = smoothstep(0.56, 0.74, fresnel);
      float rimFactor = uRimStrength > 0.01 ? (uRimStrength + uRimBoost) : 0.0;
      gl_FragColor.rgb += uRimColor * rimBand * rimFactor;

      // Subtle warm shadow floor + terminator subsurface warmth so skin glows richly
      float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
      float shadowMask = 1.0 - smoothstep(0.16, 0.40, lum);
      float shadowFactor = uRimStrength > 0.01 ? 0.46 : 0.0;
      gl_FragColor.rgb = mix(gl_FragColor.rgb, max(gl_FragColor.rgb, uShadowTint * 0.88), shadowMask * shadowFactor);
      if (uSssStrength > 0.001) {
        float termBand = smoothstep(0.12, 0.34, lum) * (1.0 - smoothstep(0.36, 0.62, lum));
        gl_FragColor.rgb += vec3(0.95, 0.34, 0.16) * termBand * uSssStrength;
      }

      // Comic diagonal ink crosshatching scoped strictly to deep character/prop shadow terminators
      if (uHatchStrength > 0.001 && uHatchFloor > 0.5) {
        float lumH = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
        vec2 fc = gl_FragCoord.xy;
        float d1 = abs(mod(fc.x + fc.y, 6.0) - 3.0);
        float d2 = abs(mod(fc.x - fc.y, 6.0) - 3.0);
        float l1 = 1.0 - smoothstep(0.45, 1.15, d1);
        float l2 = 1.0 - smoothstep(0.45, 1.15, d2);
        float band1 = 1.0 - smoothstep(0.22, 0.36, lumH);
        float band2 = 1.0 - smoothstep(0.10, 0.20, lumH);
        float hatch = max(band1 * l1, band2 * l2) * uHatchStrength;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.06, 0.04, 0.09), hatch * 0.76);
      }

      // Bamboo Sumi-e sepia rice-paper ink wash with preserved midtone readability for dark skin
      if (uSumieMix > 0.001) {
        float lumS = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
        float edgeInk = smoothstep(0.60, 0.86, fresnel);
        float inkBand = smoothstep(0.04, 0.72, pow(max(lumS, 0.015), 0.72));
        vec3 paperLight = vec3(0.95, 0.90, 0.80);
        vec3 charcoal = vec3(0.13, 0.10, 0.08);
        vec3 sumieCol = mix(charcoal, paperLight, inkBand);
        vec3 lifted = sumieCol * 0.54 + (vec3(inkBand) * 0.28 + gl_FragColor.rgb * 0.72) * 0.50;
        lifted = mix(lifted, charcoal, edgeInk * 0.78);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, lifted, uSumieMix);
      }
      #include <dithering_fragment>
      `,
    );
  };
  return mat;
}

const staticOutlineCache = new Map<string, THREE.MeshBasicMaterial>();
const skinnedOutlineCache = new Map<string, THREE.MeshBasicMaterial>();

function buildWeldedOutlineGeometry(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const geo = src.clone();
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  let norm = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
  if (!norm) {
    geo.computeVertexNormals();
    norm = geo.getAttribute('normal') as THREE.BufferAttribute;
  }

  // Average normals across shared XYZ positions so hard-edged boxes/cones extrude seamlessly without cracks
  const accum = new Map<string, [number, number, number]>();
  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(pos.getX(i) * 2000)},${Math.round(pos.getY(i) * 2000)},${Math.round(pos.getZ(i) * 2000)}`;
    const cur = accum.get(key);
    const nx = norm.getX(i);
    const ny = norm.getY(i);
    const nz = norm.getZ(i);
    if (cur) {
      cur[0] += nx;
      cur[1] += ny;
      cur[2] += nz;
    } else {
      accum.set(key, [nx, ny, nz]);
    }
  }

  const outNormals = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(pos.getX(i) * 2000)},${Math.round(pos.getY(i) * 2000)},${Math.round(pos.getZ(i) * 2000)}`;
    const sum = accum.get(key)!;
    const len = Math.hypot(sum[0], sum[1], sum[2]) || 1;
    outNormals[i * 3] = sum[0] / len;
    outNormals[i * 3 + 1] = sum[1] / len;
    outNormals[i * 3 + 2] = sum[2] / len;
  }
  geo.setAttribute('aSmoothNormal', new THREE.BufferAttribute(outNormals, 3));
  return geo;
}

function getStaticOutlineMat(offsetMeters: number): THREE.MeshBasicMaterial {
  const key = offsetMeters.toFixed(4);
  const hit = staticOutlineCache.get(key);
  if (hit) return hit;

  const mat = new THREE.MeshBasicMaterial({
    color: 0x0e0b14,
    side: THREE.BackSide,
  });
  mat.customProgramCacheKey = () => `sf2-static-outline-${key}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uOutlineScale = sharedStyleUniforms.uOutlineScale;
    shader.vertexShader =
      `uniform float uOutlineScale;\nattribute vec3 aSmoothNormal;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\ntransformed += normalize(aSmoothNormal) * (${key} * uOutlineScale);`,
    );
  };
  staticOutlineCache.set(key, mat);
  return mat;
}

function getSkinnedOutlineMat(thickness: number): THREE.MeshBasicMaterial {
  const key = thickness.toFixed(4);
  const hit = skinnedOutlineCache.get(key);
  if (hit) return hit;

  const mat = new THREE.MeshBasicMaterial({
    color: 0x120b18,
    side: THREE.BackSide,
  });
  mat.customProgramCacheKey = () => `sf2-skinned-outline-w-${key}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uOutlineScale = sharedStyleUniforms.uOutlineScale;
    shader.vertexShader =
      `uniform float uOutlineScale;\nattribute float aOutlineWeight;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vec3 outN = normalize(normal);
      float outAmt = ${key} * uOutlineScale * aOutlineWeight;
      transformed += aOutlineWeight < 0.05 ? (-outN * 0.004) : (outN * outAmt);`,
    );
  };
  skinnedOutlineCache.set(key, mat);
  return mat;
}

export function applyToonStyleUniforms(preset: StylePreset): void {
  sharedStyleUniforms.uHatchStrength.value = preset.hatchStrength;
  sharedStyleUniforms.uRimBoost.value = preset.rimBoost;
  sharedStyleUniforms.uSumieMix.value = preset.sumieMix;
  sharedStyleUniforms.uOutlineScale.value = preset.outlineScale;
  for (const m of staticOutlineCache.values()) {
    m.color.setHex(preset.outlineColor);
  }
  for (const m of skinnedOutlineCache.values()) {
    m.color.setHex(preset.outlineColor);
  }
}

export function addOutline(mesh: THREE.Mesh, thickness = 1.065): void {
  const offsetMeters = Math.min(0.015, Math.max(0.0055, (thickness - 1.0) * 0.14));
  const out = new THREE.Mesh(buildWeldedOutlineGeometry(mesh.geometry), getStaticOutlineMat(offsetMeters));
  out.renderOrder = -1;
  mesh.add(out);
}

/** Attach an inverted-hull GPU-skinned ink outline sharing the host SkinnedMesh's skeleton. */
export function addSkinnedOutline(
  host: THREE.SkinnedMesh,
  parent: THREE.Object3D,
  thickness = 0.011,
): THREE.SkinnedMesh {
  const out = new THREE.SkinnedMesh(host.geometry, getSkinnedOutlineMat(thickness));
  out.bind(host.skeleton, host.bindMatrix);
  out.frustumCulled = false;
  out.castShadow = false;
  out.receiveShadow = false;
  out.renderOrder = -1;
  parent.add(out);
  return out;
}
