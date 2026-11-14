// Deterministic FNV-1a 32-bit state hash for determinism verification and netplay desync checks.

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);

export class Hasher {
  private h = FNV_OFFSET;

  i32(v: number): void {
    let x = v | 0;
    this.h ^= x & 0xff; this.h = Math.imul(this.h, FNV_PRIME);
    this.h ^= (x >>> 8) & 0xff; this.h = Math.imul(this.h, FNV_PRIME);
    this.h ^= (x >>> 16) & 0xff; this.h = Math.imul(this.h, FNV_PRIME);
    this.h ^= (x >>> 24) & 0xff; this.h = Math.imul(this.h, FNV_PRIME);
  }

  f64(v: number): void {
    // Normalize -0 to +0 so -0 and +0 hash identically.
    f64[0] = v === 0 ? 0 : v;
    this.i32(u32[0]);
    this.i32(u32[1]);
  }

  bool(v: boolean): void {
    this.i32(v ? 1 : 0);
  }

  str(s: string): void {
    this.i32(s.length);
    for (let i = 0; i < s.length; i++) {
      this.i32(s.charCodeAt(i));
    }
  }

  finish(): number {
    return this.h >>> 0;
  }
}
