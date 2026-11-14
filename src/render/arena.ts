// Earth "Roda" arena: packed-earth circle, painted ring, stone rim, and spectator circle.
import * as THREE from 'three';
import { toonMat } from './toon';

export interface ArenaHandle {
  group: THREE.Group;
  updateBeat(beatPhaseNorm: number): void;
}

export function buildEarthRoda(radius = 6.5): ArenaHandle {
  const group = new THREE.Group();

  // Warm sunset sky dome
  const skyGeo = new THREE.SphereGeometry(65, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color('#2d1b4e') },
      midColor: { value: new THREE.Color('#c84e31') },
      botColor: { value: new THREE.Color('#f4a261') },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform vec3 topColor; uniform vec3 midColor; uniform vec3 botColor;
      varying vec3 vPos;
      void main() {
        float h = clamp(normalize(vPos).y, 0.0, 1.0);
        vec3 col = mix(botColor, midColor, smoothstep(0.0, 0.28, h));
        col = mix(col, topColor, smoothstep(0.28, 0.85, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  group.add(new THREE.Mesh(skyGeo, skyMat));

  // Outer ground plane
  const outerGround = new THREE.Mesh(
    new THREE.CircleGeometry(45, 48),
    toonMat('#5a3d28'),
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.02;
  outerGround.receiveShadow = true;
  group.add(outerGround);

  // Inner Roda packed earth floor
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius + 0.15, 0.08, 48),
    toonMat('#c68b59'),
  );
  floor.position.y = -0.04;
  floor.receiveShadow = true;
  group.add(floor);

  // Painted white Roda rings
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf7efe2 });
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(radius - 0.18, radius - 0.04, 64), ringMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.005;
  group.add(outerRing);

  const innerRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.56, 48), ringMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.005;
  group.add(innerRing);

  // Stylized spectator mannequins sitting/standing around the Roda
  const spectators: THREE.Group[] = [];
  const specCount = 18;
  const shirtColors = ['#f2f0e8', '#e63946', '#2a9d8f', '#e9c46a', '#457b9d', '#f4a261'];
  for (let i = 0; i < specCount; i++) {
    const ang = (i / specCount) * Math.PI * 2;
    // Leave front camera lane mostly open
    if (Math.sin(ang) > 0.65) continue;
    const sg = new THREE.Group();
    const dist = radius + 0.75;
    sg.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    sg.lookAt(0, 0, 0);

    const col = shirtColors[i % shirtColors.length];
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.42, 4, 8), toonMat(col));
    body.position.y = 0.42;
    body.castShadow = true;
    sg.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), toonMat('#8a5a3b'));
    head.position.y = 0.82;
    sg.add(head);

    // Berimbau arc on the 3 musicians at the back
    if (Math.sin(ang) < -0.82) {
      const bow = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.018, 6, 18, Math.PI * 0.75),
        toonMat('#6b4423'),
      );
      bow.position.set(0.18, 0.95, 0.25);
      bow.rotation.z = -0.35;
      sg.add(bow);
    }

    spectators.push(sg);
    group.add(sg);
  }

  return {
    group,
    updateBeat(beatPhaseNorm: number) {
      const bounce = Math.max(0, Math.sin(beatPhaseNorm * Math.PI)) * 0.06;
      for (const s of spectators) {
        s.position.y = bounce;
      }
    },
  };
}
