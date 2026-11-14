// Renderer-side pose cross-fading & subtle living idle breath (does not affect deterministic sim hitboxes).
import { blendPose, emptyPose, POSE_LEN, type Pose } from '../anim/pose';
import { BONE_INDEX } from '../data/skeleton';
import type { FighterMode, FighterState } from '../sim/state';

export class PoseSmoother {
  private lastPose = emptyPose();
  private outPose = emptyPose();
  private prevMode: FighterMode = 'IDLE';
  private prevMoveId: string | null = null;
  private blendFramesLeft = 0;
  private blendTotal = 1;
  private initialized = false;

  smooth(f: FighterState, target: Pose, globalTimeSec: number): Pose {
    if (!this.initialized) {
      this.lastPose.set(target);
      this.prevMode = f.mode;
      this.prevMoveId = f.moveId;
      this.initialized = true;
      return target;
    }

    if (f.mode !== this.prevMode || f.moveId !== this.prevMoveId) {
      // Snapshot the pose we were showing before the transition
      this.lastPose.set(this.outPose);
      // Attacks & hitstun snap quickly (2f) for crisp SF2 responsiveness; idle/walk/shift blend smoothly (5f)
      const dur =
        f.mode === 'ATTACK' || f.mode === 'HITSTUN' || f.mode === 'BLOCKSTUN'
          ? 2
          : f.mode === 'SHIFT'
            ? 3
            : 5;
      this.blendFramesLeft = dur;
      this.blendTotal = dur;
      this.prevMode = f.mode;
      this.prevMoveId = f.moveId;
    }

    if (this.blendFramesLeft > 0) {
      const progress = 1 - (this.blendFramesLeft - 0.5) / this.blendTotal;
      blendPose(this.lastPose, target, Math.min(1, Math.max(0, progress)), this.outPose);
      this.blendFramesLeft -= 1;
    } else {
      for (let i = 0; i < POSE_LEN; i++) this.outPose[i] = target[i];
    }

    // Subtle living chest/shoulder breath when idle or walking
    if (f.mode === 'IDLE' || f.mode === 'WALK') {
      const breath = Math.sin(globalTimeSec * 4.2 + f.slot * 1.3) * 0.032;
      this.outPose[6 + BONE_INDEX.chest * 3] += breath;
      this.outPose[6 + BONE_INDEX.head * 3] -= breath * 0.6;
    }

    return this.outPose;
  }
}
