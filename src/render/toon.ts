// Cel-shaded toon materials & inverted-hull outlines.
import * as THREE from 'three';

let sharedGrad: THREE.DataTexture | null = null;

export function getToonGradient(): THREE.DataTexture {
  if (sharedGrad) return sharedGrad;
  // 3-step crisp cel shading ramp
  const data = new Uint8Array([95, 95, 95, 255, 178, 178, 178, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  sharedGrad = tex;
  return tex;
}

export function toonMat(color: string | number): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: getToonGradient(),
  });
}

const outlineMat = new THREE.MeshBasicMaterial({
  color: 0x111116,
  side: THREE.BackSide,
});

export function addOutline(mesh: THREE.Mesh, thickness = 1.07): void {
  const out = new THREE.Mesh(mesh.geometry, outlineMat);
  out.scale.setScalar(thickness);
  out.renderOrder = -1;
  mesh.add(out);
}
