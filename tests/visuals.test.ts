import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { COSTUME_LIST, ROSTER, type CostumeId } from '../src/data/characters';
import { countMovesByIteration, ITERATIONS, verifyIterationsIntegrity } from '../src/data/iterations';
import { MOVES } from '../src/data/moves';
import { FILTER_PRESETS, STYLE_PRESETS, filterPreset, stylePreset } from '../src/render/presets';
import { addOutline, toonMat } from '../src/render/toon';
import { VfxSystem } from '../src/render/vfx';
import { createAiMemory, stepAi } from '../src/ai/cpu';
import { createMatchState, hashMatchState } from '../src/sim/state';
import { step } from '../src/sim/step';

describe('Visual Styles, Filters, Skins & Palettes', () => {
  it('defines all 7 character costumes with unique ids and labels', () => {
    const ids = COSTUME_LIST.map((c) => c.id);
    expect(ids).toEqual(['default', 'maculele', 'mestre', 'rua', 'orbital', 'kilombo', 'xray']);
    expect(new Set(ids).size).toBe(7);
    for (const c of COSTUME_LIST) {
      expect(c.label.trim().length).toBeGreaterThan(2);
    }
  });

  it('gives every roster fighter at least 3 distinct color palettes', () => {
    for (const fighter of ROSTER) {
      expect(fighter.palettes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('defines 5 stage styles and 6 post-processing filters with clean defaults', () => {
    expect(STYLE_PRESETS.map((s) => s.id)).toEqual([
      'sf2',
      'crosshatch',
      'sumie',
      'noturna',
      'lunar',
    ]);
    expect(FILTER_PRESETS.map((f) => f.id)).toEqual([
      'none',
      'crt',
      'halftone',
      'vhs',
      'noir',
      'afterimage',
    ]);
    expect(stylePreset('unknown').id).toBe('sf2');
    expect(filterPreset('unknown').id).toBe('none');
  });

  it('keeps deterministic simulation bit-identical regardless of skin or palette choice', () => {
    const run = (costume: CostumeId, pal: number): number[] => {
      const s = createMatchState({
        p1Char: 'faisca',
        p2Char: 'jacare',
        p1Costume: costume,
        p1Palette: pal,
        p2Palette: 2,
        trainingMode: false,
      });
      const ai0 = createAiMemory(0x123456);
      const ai1 = createAiMemory(0x654321);
      const hashes: number[] = [];
      for (let f = 0; f < 180; f++) {
        step(s, [stepAi(s, 0, ai0, 'HARD'), stepAi(s, 1, ai1, 'MEDIUM')]);
        hashes.push(hashMatchState(s));
      }
      return hashes;
    };

    const baseline = run('default', 0);
    for (const skin of ['mestre', 'rua', 'orbital', 'kilombo', 'xray'] as CostumeId[]) {
      expect(run(skin, 2)).toEqual(baseline);
    }
  });

  it('keeps simulation deterministic when customizing P2 fighter costume and palette', () => {
    const runP2 = (p2Costume: CostumeId, p2Palette: number): number[] => {
      const s = createMatchState({
        p1Char: 'orbita',
        p2Char: 'touro',
        p1Costume: 'orbital',
        p2Costume,
        p1Palette: 0,
        p2Palette,
        gravityScale: 0.165,
        toque: 'iuna',
        trainingMode: false,
      });
      const ai0 = createAiMemory(0x44332211);
      const ai1 = createAiMemory(0x88776655);
      const hashes: number[] = [];
      for (let f = 0; f < 120; f++) {
        step(s, [stepAi(s, 0, ai0, 'HARD'), stepAi(s, 1, ai1, 'MEDIUM')]);
        hashes.push(hashMatchState(s));
      }
      return hashes;
    };

    const baseline = runP2('default', 0);
    expect(runP2('mestre', 2)).toEqual(baseline);
    expect(runP2('kilombo', 1)).toEqual(baseline);
  });

  it('keeps toon ground opt-out, welded static outlines, and dynamic contact AO functional', () => {
    const floorMat = toonMat('#d89c72', { hatchable: false });
    const fighterMat = toonMat('#a86b45', { hatchable: true });
    expect(floorMat.customProgramCacheKey()).not.toEqual(fighterMat.customProgramCacheKey());

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), fighterMat);
    addOutline(box, 1.06);
    const out = box.children[0] as THREE.Mesh;
    const smoothNorm = out.geometry.getAttribute('aSmoothNormal') as THREE.BufferAttribute;
    expect(smoothNorm).toBeDefined();
    expect(smoothNorm.count).toBe(box.geometry.getAttribute('position').count);
    // Coincident corner vertices receive averaged diagonal unit normals (~0.577 magnitude per axis)
    const len = Math.hypot(smoothNorm.getX(0), smoothNorm.getY(0), smoothNorm.getZ(0));
    expect(len).toBeCloseTo(1, 3);
    expect(Math.abs(smoothNorm.getX(0))).toBeGreaterThan(0.5);
    expect(Math.abs(smoothNorm.getY(0))).toBeGreaterThan(0.5);

    const vfx = new VfxSystem();
    vfx.updateContactAO([
      { x: -0.4, z: 0.1, clearance: 0.0, radius: 0.145 },
      { x: 0.5, z: -0.2, clearance: 0.16, radius: 0.115 },
    ]);
    const activeAOs = vfx.group.children.filter((c) => c.visible) as THREE.Mesh[];
    expect(activeAOs.length).toBe(2);
    expect((activeAOs[0].material as THREE.MeshBasicMaterial).opacity).toBeGreaterThan(
      (activeAOs[1].material as THREE.MeshBasicMaterial).opacity,
    );

    vfx.updateContactAO([]);
    expect(vfx.group.children.filter((c) => c.visible).length).toBe(0);
    floorMat.dispose();
    fighterMat.dispose();
    box.geometry.dispose();
    out.geometry.dispose();
  });

  it('tracks all 5 playable development iterations and partitions all 116 integrated moves', () => {
    expect(ITERATIONS.length).toBe(5);
    expect(verifyIterationsIntegrity()).toBe(true);
    const counts = countMovesByIteration();
    expect(counts[1]).toBe(17);
    expect(counts[3]).toBe(97);
    expect(counts[5]).toBe(2);
    expect(counts[1] + counts[3] + counts[5]).toBe(MOVES.length);
  });
});
