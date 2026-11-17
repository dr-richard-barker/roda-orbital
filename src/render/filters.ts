// GPU post-processing pipeline (CRT cabinet, Manga Halftone, 90s Roda VHS,
// Ink & Ouro selective color, and Kinetic Ghost afterimage trails).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { VisualFilterId } from './presets';

const CRT_SHADER = {
  name: 'Cps1CrtShader',
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      // Subtle arcade glass barrel distortion
      vec2 centered = vUv * 2.0 - 1.0;
      float r2 = dot(centered, centered);
      vec2 uv = centered * (1.0 + 0.048 * r2);
      uv = uv * 0.5 + 0.5;

      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.015, 0.015, 0.025, 1.0);
        return;
      }

      // Subtle CRT gun subpixel convergence split
      float split = 0.0014;
      float r = texture2D(tDiffuse, uv + vec2(split, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(split, 0.0)).b;
      vec3 col = vec3(r, g, b);

      // Horizontal raster scanline modulation + subtle RGB phosphor triad mask
      float scan = 0.87 + 0.13 * sin(uv.y * 380.0 * 3.14159265 * 2.0);
      float triad = floor(mod(gl_FragCoord.x, 3.0));
      vec3 mask = triad < 0.5
        ? vec3(1.06, 0.94, 0.94)
        : (triad < 1.5 ? vec3(0.94, 1.06, 0.94) : vec3(0.94, 0.94, 1.06));

      // Gentle 32-level arcade DAC quantization + edge vignette
      col = floor(col * 34.0 + 0.5) / 34.0;
      float vig = clamp(1.0 - r2 * 0.24, 0.45, 1.0);
      float flicker = 0.985 + 0.015 * sin(uTime * 42.0);

      gl_FragColor = vec4(col * scan * mask * vig * flicker * 1.08, 1.0);
    }
  `,
};

const VHS_SHADER = {
  name: 'RodaVhsShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uShake: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uShake;
    varying vec2 vUv;

    float rand2(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      // Scrolling analog tracking hum bar + horizontal head switch wobble
      float barY = fract(uTime * 0.17);
      float barDist = abs(vUv.y - barY);
      float bar = smoothstep(0.055, 0.0, min(barDist, 1.0 - barDist));
      float wobble = (sin(vUv.y * 140.0 + uTime * 22.0) * 0.0012 + bar * 0.0055);
      float shift = 0.0022 + clamp(uShake * 0.08, 0.0, 0.016) + bar * 0.0035;

      vec2 uv = clamp(vec2(vUv.x + wobble, vUv.y), 0.001, 0.999);
      float r = texture2D(tDiffuse, clamp(uv + vec2(shift, 0.0), 0.001, 0.999)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, clamp(uv - vec2(shift, 0.0), 0.001, 0.999)).b;
      vec3 col = vec3(r, g, b);

      // Warm tape tint & fine film grain
      float grain = (rand2(vUv * 512.0 + fract(uTime) * 43.0) - 0.5) * 0.075;
      col += grain + bar * 0.06;
      col *= vec3(1.03, 0.99, 0.94);

      float edgeDist = length(vUv * 2.0 - 1.0);
      col *= clamp(1.06 - edgeDist * edgeDist * 0.22, 0.55, 1.05);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

const MANGA_HALFTONE_SHADER = {
  name: 'MangaHalftoneShader',
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1280, 720) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float dotScreen(vec2 fc, float angle, float cellPx, float density) {
      float s = sin(angle);
      float c = cos(angle);
      vec2 p = vec2(fc.x * c - fc.y * s, fc.x * s + fc.y * c) / cellPx;
      vec2 cell = fract(p) - 0.5;
      float r = clamp(density, 0.0, 0.92) * 0.48;
      return smoothstep(r + 0.07, r - 0.07, length(cell));
    }

    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      vec2 fc = vUv * uResolution;

      // Rotated Ben-Day manga tone scoped cleanly to deep shadows & creases without darkening sunlit clay
      float tone = smoothstep(0.40, 0.06, lum);
      float fineDot = dotScreen(fc, 0.5236, 6.2, tone * 0.92);
      float inkDot = mix(1.0, 0.54, fineDot * smoothstep(0.08, 0.58, tone));

      // Crisp manga highlight separation
      vec3 printed = col * inkDot;
      printed = mix(printed, col * 1.03, smoothstep(0.54, 0.88, lum));
      gl_FragColor = vec4(printed, 1.0);
    }
  `,
};

const NOIR_SHADER = {
  name: 'InkOuroNoirShader',
  uniforms: {
    tDiffuse: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;

    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      float maxC = max(col.r, max(col.g, col.b));
      float minC = min(col.r, min(col.g, col.b));
      float sat = (maxC - minC) / max(0.001, maxC);

      // Gentle selective accent preservation so dark horizon transitions smoothly without hard black seams
      float warmKeep = smoothstep(0.05, 0.34, col.r - col.b) * smoothstep(0.16, 0.56, sat) * smoothstep(0.04, 0.22, lum);
      float cyanKeep = smoothstep(0.06, 0.28, col.b - col.r) * smoothstep(0.26, 0.62, sat);
      float keep = clamp(max(warmKeep, cyanKeep * 0.90), 0.0, 1.0);

      // Filmic silver-gelatin twilight curve with lifted slate floor so silhouettes remain readable
      float ink = 0.04 + 0.92 * smoothstep(0.0, 0.90, pow(max(lum, 0.001), 0.84));
      vec3 mono = vec3(ink * 0.91, ink * 0.94, ink * 1.01);
      vec3 outCol = mix(mono, col * 1.14, keep);

      float d = length(vUv * 2.0 - 1.0);
      outCol *= clamp(1.06 - d * d * 0.20, 0.52, 1.06);
      gl_FragColor = vec4(outCol, 1.0);
    }
  `,
};

export class FilterPipeline {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private bloomPass: UnrealBloomPass;
  private halftonePass: ShaderPass;
  private afterimagePass: AfterimagePass;
  private crtPass: ShaderPass;
  private vhsPass: ShaderPass;
  private noirPass: ShaderPass;
  private outputPass: OutputPass;

  private activeFilter: VisualFilterId = 'none';
  private elapsed = 0;
  private flareTimer = 0;
  private flarePrime = false;

  constructor(
    private renderer: THREE.WebGLRenderer,
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    width: number,
    height: number,
  ) {
    this.composer = new EffectComposer(renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.setSize(width, height);

    this.renderPass = new RenderPass(scene, camera);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.22, 0.45, 0.86);
    this.halftonePass = new ShaderPass(MANGA_HALFTONE_SHADER);
    this.afterimagePass = new AfterimagePass(0.84);
    this.crtPass = new ShaderPass(CRT_SHADER);
    this.vhsPass = new ShaderPass(VHS_SHADER);
    this.noirPass = new ShaderPass(NOIR_SHADER);
    this.outputPass = new OutputPass();

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.afterimagePass);
    this.composer.addPass(this.halftonePass);
    this.composer.addPass(this.crtPass);
    this.composer.addPass(this.vhsPass);
    this.composer.addPass(this.noirPass);
    this.composer.addPass(this.outputPass);

    this.setFilter('none');
  }

  getFilter(): VisualFilterId {
    return this.activeFilter;
  }

  setFilter(id: VisualFilterId): void {
    this.activeFilter = id;
    this.bloomPass.strength = 0.22;
    this.afterimagePass.uniforms['damp'].value = 0.84;
    this.bloomPass.enabled = id === 'crt' || id === 'afterimage' || id === 'noir';
    this.afterimagePass.enabled = id === 'afterimage';
    this.halftonePass.enabled = id === 'halftone';
    this.crtPass.enabled = id === 'crt';
    this.vhsPass.enabled = id === 'vhs';
    this.noirPass.enabled = id === 'noir';
    this.outputPass.enabled = id !== 'none';
  }

  /** Trigger a temporary Kinetic Ghost & bloom pulse without altering selected user filter. */
  triggerPeakFlare(duration = 0.45): void {
    if (this.flareTimer <= 0 && this.activeFilter !== 'afterimage') {
      this.flarePrime = true;
    }
    this.flareTimer = Math.max(this.flareTimer, duration);
  }

  setSize(width: number, height: number, pixelRatio = Math.min(window.devicePixelRatio, 2)): void {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(w, h);
    this.crtPass.uniforms.uResolution.value.set(w * pixelRatio, h * pixelRatio);
    this.halftonePass.uniforms.uResolution.value.set(w * pixelRatio, h * pixelRatio);
  }

  render(dtReal: number, camShake: number): void {
    this.elapsed += dtReal;
    if (this.flareTimer > 0) {
      this.flareTimer = Math.max(0, this.flareTimer - dtReal);
      if (this.flareTimer === 0) {
        this.setFilter(this.activeFilter);
      } else {
        this.bloomPass.enabled = true;
        this.bloomPass.strength = 0.36;
        this.afterimagePass.enabled = true;
        this.afterimagePass.uniforms['damp'].value = this.flarePrime ? 0.0 : 0.78;
        this.flarePrime = false;
        this.outputPass.enabled = true;
        this.crtPass.uniforms.uTime.value = this.elapsed;
        this.vhsPass.uniforms.uTime.value = this.elapsed;
        this.vhsPass.uniforms.uShake.value = camShake;
        this.composer.render();
        return;
      }
    }

    if (this.activeFilter === 'none') {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.crtPass.uniforms.uTime.value = this.elapsed;
    this.vhsPass.uniforms.uTime.value = this.elapsed;
    this.vhsPass.uniforms.uShake.value = camShake;
    this.composer.render();
  }

  dispose(): void {
    this.composer.dispose();
  }
}
