// Procedural seeded CanvasTextures for skin, cotton abadá weave, cordão braid,
// terracotta Roda floor, and hardwood percussion/grima grain. Offline-safe, cached once.
import * as THREE from 'three';

export interface SurfaceTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

const cache = new Map<string, SurfaceTextureSet>();

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvasPair(
  key: string,
  size: number,
  paint: (
    colCtx: CanvasRenderingContext2D,
    bumpCtx: CanvasRenderingContext2D,
    rng: () => number,
  ) => void,
  repeatX = 1,
  repeatY = 1,
): SurfaceTextureSet {
  const hit = cache.get(key);
  if (hit) return hit;

  const colCanvas = document.createElement('canvas');
  colCanvas.width = size;
  colCanvas.height = size;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;

  const colCtx = colCanvas.getContext('2d')!;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  paint(colCtx, bumpCtx, mulberry32(key.length * 9973 + size));

  const map = new THREE.CanvasTexture(colCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(repeatX, repeatY);
  bumpMap.needsUpdate = true;

  const set = { map, bumpMap };
  cache.set(key, set);
  return set;
}

/** Subtle neutral anatomical tone + smooth micro-grain bump (multiplied by character skin tint). */
export function getSkinTextureSet(): SurfaceTextureSet {
  return makeCanvasPair('skin-v3', 512, (c, b, rng) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 512, 512);
    b.fillStyle = '#808080';
    b.fillRect(0, 0, 512, 512);

    // Smooth vertical warmth + subtle pectoral / clavicle / linea alba tonal definition
    const grad = c.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, 'rgba(255, 250, 245, 1)');
    grad.addColorStop(0.45, 'rgba(251, 246, 240, 1)');
    grad.addColorStop(1, 'rgba(238, 230, 224, 1)');
    c.fillStyle = grad;
    c.fillRect(0, 0, 512, 512);

    // Subtle soft central sternum / shoulder tone separation without sharp stripes
    const pecGrad = c.createRadialGradient(256, 210, 18, 256, 210, 170);
    pecGrad.addColorStop(0, 'rgba(255, 248, 240, 0.35)');
    pecGrad.addColorStop(0.75, 'rgba(230, 214, 200, 0.14)');
    pecGrad.addColorStop(1, 'rgba(230, 214, 200, 0)');
    c.fillStyle = pecGrad;
    c.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 1100; i++) {
      const x = rng() * 512;
      const y = rng() * 512;
      const r = 1.1 + rng() * 1.4;
      const v = Math.floor(124 + rng() * 8);
      b.fillStyle = `rgb(${v},${v},${v})`;
      b.beginPath();
      b.arc(x, y, r, 0, Math.PI * 2);
      b.fill();
    }
  });
}

/** Diagonal woven cotton twill for Capoeira abadá trousers & camiseta. */
export function getAbadaTextureSet(): SurfaceTextureSet {
  return makeCanvasPair('abada', 256, (c, b, rng) => {
    c.fillStyle = '#f8f8f8';
    c.fillRect(0, 0, 256, 256);
    b.fillStyle = '#808080';
    b.fillRect(0, 0, 256, 256);

    // Fine diagonal 45° twill weft lines
    c.strokeStyle = 'rgba(210, 210, 218, 0.28)';
    b.strokeStyle = 'rgba(160, 160, 160, 0.55)';
    c.lineWidth = 1;
    b.lineWidth = 1.2;
    for (let d = -256; d < 512; d += 5) {
      c.beginPath();
      c.moveTo(d, 0);
      c.lineTo(d + 256, 256);
      c.stroke();

      b.beginPath();
      b.moveTo(d, 0);
      b.lineTo(d + 256, 256);
      b.stroke();
    }

    // Soft vertical cloth drape ripples along trousers
    for (let i = 0; i < 18; i++) {
      const x = (i / 18) * 256 + (rng() - 0.5) * 8;
      const w = 8 + rng() * 10;
      const fold = b.createLinearGradient(x - w, 0, x + w, 0);
      fold.addColorStop(0, 'rgba(128,128,128,0)');
      fold.addColorStop(0.5, rng() > 0.5 ? 'rgba(205,205,205,0.45)' : 'rgba(65,65,65,0.45)');
      fold.addColorStop(1, 'rgba(128,128,128,0)');
      b.fillStyle = fold;
      b.fillRect(x - w, 0, w * 2, 256);
    }
  }, 2, 2);
}

/** Braided cordão rank belt chevron texture. */
export function getCordaoTextureSet(): SurfaceTextureSet {
  return makeCanvasPair('cordao', 128, (c, b) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 128, 128);
    b.fillStyle = '#707070';
    b.fillRect(0, 0, 128, 128);

    c.lineWidth = 4;
    b.lineWidth = 4;
    for (let y = -128; y < 256; y += 10) {
      c.strokeStyle = 'rgba(195, 195, 200, 0.45)';
      b.strokeStyle = 'rgb(215, 215, 215)';
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(64, y + 48);
      c.lineTo(128, y);
      c.stroke();

      b.beginPath();
      b.moveTo(0, y);
      b.lineTo(64, y + 48);
      b.lineTo(128, y);
      b.stroke();
    }
  }, 4, 1);
}

/** High-resolution packed terracotta courtyard earth with circular sweeping scuff marks. */
export function getEarthRodaTextureSet(): SurfaceTextureSet {
  return makeCanvasPair('earth-roda-hd', 1024, (c, b, rng) => {
    const cx = 512;
    const cy = 512;

    // Warm Bahia red-ochre base with center dusty highlight & darker perimeter rim
    const rg = c.createRadialGradient(cx, cy, 40, cx, cy, 512);
    rg.addColorStop(0, '#ce7648');
    rg.addColorStop(0.55, '#ad5b36');
    rg.addColorStop(0.84, '#884225');
    rg.addColorStop(1, '#592b1a');
    c.fillStyle = rg;
    c.fillRect(0, 0, 1024, 1024);

    b.fillStyle = '#808080';
    b.fillRect(0, 0, 1024, 1024);

    // Subtle stone plaza joint ring near edge of Roda
    c.strokeStyle = 'rgba(65, 28, 16, 0.28)';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(cx, cy, 445, 0, Math.PI * 2);
    c.stroke();

    // Concentric chalky footsteps & kicking sweep arcs inside Roda center
    for (let i = 0; i < 110; i++) {
      const r = 55 + rng() * 380;
      const a0 = rng() * Math.PI * 2;
      const span = 0.22 + rng() * 0.72;
      c.strokeStyle = rng() > 0.42 ? 'rgba(226, 164, 118, 0.20)' : 'rgba(92, 42, 22, 0.22)';
      c.lineWidth = 2.5 + rng() * 9;
      c.beginPath();
      c.arc(cx, cy, r, a0, a0 + span);
      c.stroke();

      b.strokeStyle = rng() > 0.5 ? 'rgba(162, 162, 162, 0.30)' : 'rgba(98, 98, 98, 0.30)';
      b.lineWidth = 2 + rng() * 7;
      b.beginPath();
      b.arc(cx, cy, r, a0, a0 + span);
      b.stroke();
    }

    // Fine mineral grit & smooth rounded pebbles
    for (let i = 0; i < 8500; i++) {
      const x = rng() * 1024;
      const y = rng() * 1024;
      const sz = rng() > 0.9 ? 2.4 : 1.3;
      c.fillStyle = rng() > 0.5 ? 'rgba(235, 182, 134, 0.25)' : 'rgba(72, 30, 18, 0.26)';
      c.beginPath();
      c.arc(x, y, sz * 0.55, 0, Math.PI * 2);
      c.fill();
      const gv = Math.floor(100 + rng() * 58);
      b.fillStyle = `rgb(${gv},${gv},${gv})`;
      b.fillRect(x, y, sz, sz);
    }
  });
}

/** Hardwood Biriba / Jacarandá grain for Berimbau bows, Atabaque drums, and Maculelê grimas. */
export function getWoodTextureSet(): SurfaceTextureSet {
  return makeCanvasPair('wood', 128, (c, b, rng) => {
    c.fillStyle = '#c89b6e';
    c.fillRect(0, 0, 128, 128);
    b.fillStyle = '#808080';
    b.fillRect(0, 0, 128, 128);

    for (let i = 0; i < 64; i++) {
      const x = rng() * 128;
      c.fillStyle = rng() > 0.5 ? 'rgba(90, 52, 26, 0.28)' : 'rgba(232, 185, 134, 0.22)';
      c.fillRect(x, 0, 1 + rng() * 2.5, 128);
      const v = Math.floor(105 + rng() * 48);
      b.fillStyle = `rgb(${v},${v},${v})`;
      b.fillRect(x, 0, 1.5, 128);
    }
  });
}

/** High-resolution lunar basalt regolith with sculpted impact craters & orbital landing pad compass lines. */
export function getLunarRodaTextureSet(): SurfaceTextureSet {
  return makeCanvasPair('lunar-roda-hd', 1024, (c, b, rng) => {
    const cx = 512;
    const cy = 512;
    const bg = c.createRadialGradient(cx, cy, 40, cx, cy, 520);
    bg.addColorStop(0, '#c6d1e0');
    bg.addColorStop(0.56, '#96a3b5');
    bg.addColorStop(1, '#576273');
    c.fillStyle = bg;
    c.fillRect(0, 0, 1024, 1024);

    b.fillStyle = '#808080';
    b.fillRect(0, 0, 1024, 1024);

    // Faint cyan-slate orbital compass ticks around the landing pad center
    c.strokeStyle = 'rgba(130, 224, 255, 0.16)';
    c.lineWidth = 3;
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      c.beginPath();
      c.moveTo(cx + Math.cos(ang) * 320, cy + Math.sin(ang) * 320);
      c.lineTo(cx + Math.cos(ang) * 360, cy + Math.sin(ang) * 360);
      c.stroke();
    }

    // Impact craters with raised ejecta highlight and dark shaded basin
    for (let i = 0; i < 64; i++) {
      const ang = rng() * Math.PI * 2;
      const dist = 85 + rng() * 405;
      const x = cx + Math.cos(ang) * dist;
      const y = cy + Math.sin(ang) * dist;
      const r = 10 + rng() * 34;

      const cg = c.createRadialGradient(x, y, r * 0.12, x, y, r);
      cg.addColorStop(0, 'rgba(62, 70, 84, 0.56)');
      cg.addColorStop(0.76, 'rgba(84, 94, 110, 0.34)');
      cg.addColorStop(0.92, 'rgba(226, 238, 252, 0.52)');
      cg.addColorStop(1, 'rgba(150, 160, 178, 0)');
      c.fillStyle = cg;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();

      const bgG = b.createRadialGradient(x, y, r * 0.1, x, y, r);
      bgG.addColorStop(0, 'rgba(55,55,55,0.65)');
      bgG.addColorStop(0.84, 'rgba(200,200,200,0.65)');
      bgG.addColorStop(1, 'rgba(128,128,128,0)');
      b.fillStyle = bgG;
      b.beginPath();
      b.arc(x, y, r, 0, Math.PI * 2);
      b.fill();
    }

    // Fine moon dust speckles
    for (let i = 0; i < 7200; i++) {
      const x = rng() * 1024;
      const y = rng() * 1024;
      const sz = rng() > 0.9 ? 2.4 : 1.3;
      c.fillStyle = rng() > 0.5 ? 'rgba(228, 236, 246, 0.22)' : 'rgba(54, 62, 74, 0.24)';
      c.fillRect(x, y, sz, sz);
      const gv = Math.floor(94 + rng() * 68);
      b.fillStyle = `rgb(${gv},${gv},${gv})`;
      b.fillRect(x, y, sz, sz);
    }
  });
}

/** High-resolution rice-paper (washi) fiber texture with sumi brush rings for the Sumi-e stage. */
export function getWashiPaperTextureSet(): SurfaceTextureSet {
  return makeCanvasPair('washi-roda-hd', 1024, (c, b, rng) => {
    const bg = c.createRadialGradient(512, 512, 48, 512, 512, 520);
    bg.addColorStop(0, '#f6eedb');
    bg.addColorStop(0.7, '#e8dac1');
    bg.addColorStop(1, '#cfc0a3');
    c.fillStyle = bg;
    c.fillRect(0, 0, 1024, 1024);

    b.fillStyle = '#808080';
    b.fillRect(0, 0, 1024, 1024);

    // Enso-like calligraphic ink sweep arcs
    for (let i = 0; i < 24; i++) {
      const r = 100 + rng() * 340;
      const a0 = rng() * Math.PI * 2;
      const span = 0.6 + rng() * 1.4;
      c.strokeStyle = 'rgba(46, 36, 26, 0.13)';
      c.lineWidth = 4 + rng() * 14;
      c.beginPath();
      c.arc(512, 512, r, a0, a0 + span);
      c.stroke();
    }

    // Organic mulberry paper fibers
    for (let i = 0; i < 1800; i++) {
      const x = rng() * 1024;
      const y = rng() * 1024;
      const ang = rng() * Math.PI * 2;
      const len = 6 + rng() * 24;
      c.strokeStyle = rng() > 0.45 ? 'rgba(130, 112, 86, 0.14)' : 'rgba(255, 250, 240, 0.24)';
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      c.stroke();

      const gv = Math.floor(110 + rng() * 38);
      b.strokeStyle = `rgb(${gv},${gv},${gv})`;
      b.lineWidth = 1.1;
      b.beginPath();
      b.moveTo(x, y);
      b.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      b.stroke();
    }
  });
}

/** Athletic mesh fabric with crisp chest/side accent stripes for Street Roda ('rua') skin. */
export function getStreetJerseyTextureSet(baseHex: string, accentHex: string): SurfaceTextureSet {
  return makeCanvasPair(`street-${baseHex}-${accentHex}`, 256, (c, b) => {
    c.fillStyle = baseHex;
    c.fillRect(0, 0, 256, 256);

    // Bold horizontal & vertical graphic racing stripe panels
    c.fillStyle = accentHex;
    c.fillRect(0, 110, 256, 26);
    c.fillRect(108, 0, 16, 256);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.fillRect(0, 102, 256, 4);
    c.fillRect(0, 140, 256, 4);

    // Micro athletic honeycomb knit bump
    b.fillStyle = '#808080';
    b.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 4) {
      for (let x = (y % 8 === 0 ? 0 : 2); x < 256; x += 4) {
        c.fillStyle = 'rgba(0,0,0,0.06)';
        c.fillRect(x, y, 2, 2);
        b.fillStyle = '#9c9c9c';
        b.fillRect(x, y, 2, 2);
      }
    }
  }, 1, 1);
}

/** Segmented quilted EVA pressure suit fabric for Orbital EVA ('orbital') skin. */
export function getOrbitalSuitTextureSet(baseHex: string, accentHex: string): SurfaceTextureSet {
  return makeCanvasPair(`orbital-${baseHex}-${accentHex}`, 256, (c, b) => {
    c.fillStyle = baseHex;
    c.fillRect(0, 0, 256, 256);

    b.fillStyle = '#787878';
    b.fillRect(0, 0, 256, 256);

    // Quilted pressure baffles & seam channels
    for (let y = 0; y < 256; y += 24) {
      c.fillStyle = 'rgba(18, 28, 44, 0.25)';
      c.fillRect(0, y, 256, 3);
      b.fillStyle = '#404040';
      b.fillRect(0, y, 256, 3);
      b.fillStyle = '#a8a8a8';
      b.fillRect(0, y + 3, 256, 18);
    }

    // High-vis mission stripe + cyan/accent seam piping
    c.fillStyle = accentHex;
    c.fillRect(0, 96, 256, 14);
    c.fillStyle = '#3ce8ff';
    c.fillRect(0, 114, 256, 5);
  }, 1, 1);
}

/** Procedural chalk-white & ochre *pemba* body paint markings on exact base skin color. */
export function getKilomboPaintTextureSet(skinHex: string, accentHex: string): SurfaceTextureSet {
  return makeCanvasPair(`kilombo-${skinHex}-${accentHex}`, 256, (c, b) => {
    c.fillStyle = skinHex;
    c.fillRect(0, 0, 256, 256);
    b.fillStyle = '#808080';
    b.fillRect(0, 0, 256, 256);

    // Warm sacred pemba white chalk horizontal bands & geometric chevrons
    c.strokeStyle = 'rgba(248, 244, 232, 0.92)';
    c.fillStyle = 'rgba(248, 244, 232, 0.92)';
    c.lineWidth = 6;
    for (const y of [44, 136, 208]) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(256, y);
      c.stroke();
      b.fillStyle = '#a8a8a8';
      b.fillRect(0, y - 3, 256, 6);
    }

    // Zig-zag / diamond motifs around torso & limbs
    c.lineWidth = 5;
    c.beginPath();
    for (let x = 0; x <= 256; x += 32) {
      const yy = x % 64 === 0 ? 74 : 106;
      if (x === 0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();

    // Ochre / accent dot rows
    c.fillStyle = accentHex;
    for (let x = 12; x < 256; x += 24) {
      for (const y of [60, 122, 168, 192]) {
        c.beginPath();
        c.arc(x, y, 4.2, 0, Math.PI * 2);
        c.fill();
      }
    }
  }, 1, 1);
}
