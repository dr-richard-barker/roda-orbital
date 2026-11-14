// Street Fighter II inspired Cel-Shading (crisp 2-band + warm shadow tint + rim highlight) & ink outlines.
import * as THREE from 'three';

let sharedGrad: THREE.DataTexture | null = null;

export function getToonGradient(): THREE.DataTexture {
  if (sharedGrad) return sharedGrad;
  // Crisp 3-step arcade cel ramp (deep shadow, mid lit, bright highlight)
  const data = new Uint8Array([
    105, 105, 105, 255,
    205, 205, 205, 255,
    255, 255, 255, 255,
  ]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  sharedGrad = tex;
  return tex;
}

export interface ToonOptions {
  shadowTint?: string | number;
  rimColor?: string | number;
  rimStrength?: number;
  side?: THREE.Side;
}

export function toonMat(color: string | number, opts: ToonOptions = {}): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: getToonGradient(),
    side: opts.side ?? THREE.FrontSide,
  });

  const base = new THREE.Color(color);
  // SF2 arcade sprites shift shadows toward warm plum/crimson rather than muddy grey
  const defaultShadow = base.clone().lerp(new THREE.Color('#2a1538'), 0.42);
  const shadowCol = opts.shadowTint !== undefined ? new THREE.Color(opts.shadowTint) : defaultShadow;
  const rimCol = new THREE.Color(opts.rimColor ?? '#ffe6b0');
  const rimStrength = opts.rimStrength ?? 0.32;

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uShadowTint = { value: shadowCol };
    shader.uniforms.uRimColor = { value: rimCol };
    shader.uniforms.uRimStrength = { value: rimStrength };

    shader.fragmentShader =
      `
      uniform vec3 uShadowTint;
      uniform vec3 uRimColor;
      uniform float uRimStrength;
      ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      // Rim highlight for crisp silhouette separation against the stage
      vec3 viewDirN = normalize(vViewPosition);
      float fresnel = 1.0 - max(dot(normalize(normal), viewDirN), 0.0);
      float rimBand = smoothstep(0.58, 0.72, fresnel);
      gl_FragColor.rgb += uRimColor * rimBand * uRimStrength;

      // Subtle warm shadow floor so shadows stay rich like CPS-1 sprites
      float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
      float shadowMask = 1.0 - smoothstep(0.18, 0.38, lum);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, max(gl_FragColor.rgb, uShadowTint * 0.85), shadowMask * 0.45);
      #include <dithering_fragment>
      `,
    );
  };
  return mat;
}

const outlineMat = new THREE.MeshBasicMaterial({
  color: 0x0e0b14,
  side: THREE.BackSide,
});

export function addOutline(mesh: THREE.Mesh, thickness = 1.065): void {
  const out = new THREE.Mesh(mesh.geometry, outlineMat);
  out.scale.setScalar(thickness);
  out.renderOrder = -1;
  mesh.add(out);
}
