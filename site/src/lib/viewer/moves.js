import { AnimationClip, Quaternion, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from 'three';

// Extra moves for tevy people, made in code from the shared skeleton: nothing in the model files
// changes. A pose turns joints in the person's own frame (+Y up, +Z forward, +X the person's
// left) relative to the bind pose, so the same pose fits every person.

const FPS = 30;
const UP = new Vector3(0, 1, 0);
const FORWARD = new Vector3(0, 0, 1);

/** Turns a bone so it points along dir, given in the person's frame. */
const aim = (x, y, z) => (j) => new Quaternion().setFromUnitVectors(j.dir, new Vector3(x, y, z).normalize());
/** Turns a joint around an axis of the person's frame, in degrees. */
const turn = (x, y, z, deg) => () => new Quaternion().setFromAxisAngle(new Vector3(x, y, z).normalize(), (deg * Math.PI) / 180);
/** Rolls a bone about its own length, in degrees: positive turns the palm of a left forearm up. */
const twist = (deg) => (j) => new Quaternion().setFromAxisAngle(j.dir, (deg * Math.PI) / 180);
/** Bends an elbow or knee: positive brings the lower bone forward (elbows) or back (knees, with a negative angle). */
const bend = (deg) => (j) => new Quaternion().setFromAxisAngle(j.hinge, (deg * Math.PI) / 180);

// Standing at ease: arms down by the sides, elbows a little bent.
const AT_EASE = {
  upperarm_L: aim(0.12, -1, 0),
  upperarm_R: aim(-0.12, -1, 0),
  forearm_L: bend(12),
  forearm_R: bend(12),
};

// Each move: a looping clip as keys of { t (seconds), pose, hips (offset in meters) }.
const MOVES = {
  dance: {
    length: 2,
    keys: [0, 0.5, 1, 1.5].map((t, i) => {
      const left = i % 2 === 0;
      return {
        t,
        hips: [left ? 0.05 : -0.05, -0.06, 0],
        pose: {
          spine: turn(0, 0, 1, left ? -6 : 6),
          chest: turn(0, 1, 0, left ? 12 : -12),
          head: turn(0, 0, 1, left ? 8 : -8),
          upperarm_L: left ? aim(0.5, 0.8, 0.25) : aim(0.35, -0.6, 0.6),
          forearm_L: bend(left ? 40 : 95),
          upperarm_R: left ? aim(-0.35, -0.6, 0.6) : aim(-0.5, 0.8, 0.25),
          forearm_R: bend(left ? 95 : 40),
          thigh_L: turn(1, 0, 0, left ? -14 : -4),
          calf_L: bend(left ? -26 : -8),
          thigh_R: turn(1, 0, 0, left ? -4 : -14),
          calf_R: bend(left ? -8 : -26),
        },
      };
    }).flatMap((key) => [key, { ...key, t: key.t + 0.25, hips: [key.hips[0] * 0.4, 0.01, 0] }]),
  },
  cheer: {
    length: 2.4,
    keys: [
      { t: 0, hips: [0, -0.04, 0], pose: { ...AT_EASE, forearm_L: bend(70), forearm_R: bend(70), upperarm_L: aim(0.3, -0.7, 0.4), upperarm_R: aim(-0.3, -0.7, 0.4), thigh_L: turn(1, 0, 0, -8), thigh_R: turn(1, 0, 0, -8), calf_L: bend(-16), calf_R: bend(-16) } },
      { t: 0.45, hips: [0, 0.03, 0], pose: { upperarm_L: aim(0.55, 1, 0.1), upperarm_R: aim(-0.55, 1, 0.1), forearm_L: bend(6), forearm_R: bend(6), head: turn(1, 0, 0, -14), chest: turn(1, 0, 0, -6) } },
      { t: 0.75, hips: [0, 0.02, 0], pose: { upperarm_L: aim(0.6, 1, 0.05), upperarm_R: aim(-0.6, 1, 0.05), forearm_L: bend(14), forearm_R: bend(14), head: turn(1, 0, 0, -10), chest: turn(1, 0, 0, -4) } },
      { t: 1.05, hips: [0, 0.03, 0], pose: { upperarm_L: aim(0.55, 1, 0.1), upperarm_R: aim(-0.55, 1, 0.1), forearm_L: bend(6), forearm_R: bend(6), head: turn(1, 0, 0, -14), chest: turn(1, 0, 0, -6) } },
      { t: 1.7, pose: AT_EASE },
    ],
  },
  jump: {
    length: 1.6,
    keys: [
      { t: 0, pose: AT_EASE },
      { t: 0.35, hips: [0, -0.2, 0.03], pose: { spine: turn(1, 0, 0, 18), upperarm_L: aim(0.2, -0.7, -0.6), upperarm_R: aim(-0.2, -0.7, -0.6), forearm_L: bend(10), forearm_R: bend(10), thigh_L: turn(1, 0, 0, -50), thigh_R: turn(1, 0, 0, -50), calf_L: bend(-85), calf_R: bend(-85) } },
      { t: 0.6, hips: [0, 0.38, 0], pose: { upperarm_L: aim(0.35, 1, 0.3), upperarm_R: aim(-0.35, 1, 0.3), forearm_L: bend(10), forearm_R: bend(10), thigh_L: turn(1, 0, 0, -30), thigh_R: turn(1, 0, 0, -30), calf_L: bend(-60), calf_R: bend(-60) } },
      { t: 0.85, hips: [0, -0.14, 0.02], pose: { spine: turn(1, 0, 0, 12), upperarm_L: aim(0.4, -0.6, 0.5), upperarm_R: aim(-0.4, -0.6, 0.5), forearm_L: bend(20), forearm_R: bend(20), thigh_L: turn(1, 0, 0, -38), thigh_R: turn(1, 0, 0, -38), calf_L: bend(-65), calf_R: bend(-65) } },
      { t: 1.2, pose: AT_EASE },
    ],
  },
  clap: {
    length: 1.2,
    keys: [0, 0.3, 0.6, 0.9].map((t, i) => ({
      t,
      hips: [0, i % 2 ? -0.015 : 0, 0],
      pose: {
        upperarm_L: aim(i % 2 ? 0.04 : 0.4, -0.55, 0.8),
        upperarm_R: aim(i % 2 ? -0.04 : -0.4, -0.55, 0.8),
        forearm_L: bend(i % 2 ? 80 : 66),
        forearm_R: bend(i % 2 ? 80 : 66),
        hand_L: twist(70),
        hand_R: twist(-70),
        head: turn(1, 0, 0, i % 2 ? 6 : 2),
      },
    })),
  },
  high_five: {
    length: 2.4,
    keys: [
      { t: 0, pose: AT_EASE },
      { t: 0.45, hips: [0, -0.02, 0], pose: { ...AT_EASE, upperarm_R: aim(-0.1, 0.3, 1), forearm_R: bend(75), chest: turn(0, 1, 0, -8) } },
      { t: 0.8, hips: [0, 0.01, 0.05], pose: { ...AT_EASE, upperarm_R: aim(0.08, 0.42, 1), forearm_R: bend(6), chest: turn(0, 1, 0, 8), spine: turn(1, 0, 0, 4) } },
      { t: 1.05, hips: [0, 0, 0.04], pose: { ...AT_EASE, upperarm_R: aim(0.1, 0.36, 1), forearm_R: bend(16), chest: turn(0, 1, 0, 6), spine: turn(1, 0, 0, 3) } },
      { t: 1.7, pose: AT_EASE },
    ],
  },
};

/** The names of the moves makeMoves builds, in display order. */
export const MOVE_NAMES = Object.keys(MOVES);

/** Moves made for two people facing each other, with the time their right hands meet. */
export const PAIRS = { high_five: 0.8 };

/**
 * Builds the moves for one loaded person (a GLTFLoader scene in its bind pose). Returns
 * AnimationClips for an AnimationMixer on that scene, or none when the skeleton is not tevy's.
 */
export function makeMoves(root) {
  root.updateMatrixWorld(true);
  const joints = new Map();
  root.traverse((o) => {
    if (o.isBone && !joints.has(o.name)) joints.set(o.name, o);
  });
  // Only the people skeleton: animals share some joint names but have no hands or calves.
  if (!['hips', 'upperarm_L', 'hand_L', 'hand_R', 'calf_L', 'calf_R'].every((j) => joints.has(j))) return [];

  // Per joint: its bind rotation, its parent's world rotation, the bone direction and the hinge
  // axis for a bend, all in the person's frame.
  const info = new Map();
  const at = (name) => joints.get(name).getWorldPosition(new Vector3());
  const childOf = { hand_L: 'middle_01_L', hand_R: 'middle_01_R', upperarm_L: 'forearm_L', upperarm_R: 'forearm_R', forearm_L: 'hand_L', forearm_R: 'hand_R', thigh_L: 'calf_L', thigh_R: 'calf_R', calf_L: 'foot_L', calf_R: 'foot_R' };
  for (const [name, bone] of joints) {
    const parent = bone.parent.getWorldQuaternion(new Quaternion());
    const dir = childOf[name] ? at(childOf[name]).sub(at(name)).normalize() : UP.clone();
    // A bend turns the lower bone toward the front: the hinge is across the bone and the forward axis.
    const hinge = new Vector3().crossVectors(dir, FORWARD).normalize();
    info.set(name, { bind: bone.quaternion.clone(), parent, parentInv: parent.clone().invert(), dir, hinge });
  }
  const hipsBind = joints.get('hips').position.clone();

  const ease = (x) => x * x * (3 - 2 * x);
  return MOVE_NAMES.map((name) => {
    const { length, keys } = MOVES[name];
    const frames = Math.round(length * FPS);
    const times = Array.from({ length: frames + 1 }, (_, i) => i / FPS);
    // The joints any key moves; the at-ease arms are always part of a move so a blend from a
    // shipped clip does not fall back to the bind pose's raised arms.
    const used = new Set(Object.keys(AT_EASE));
    for (const key of keys) for (const j of Object.keys(key.pose)) if (info.has(j)) used.add(j);
    const local = (j, key) => {
      const make = key.pose[j] ?? AT_EASE[j];
      const delta = make ? make(info.get(j)) : new Quaternion();
      const { bind, parent, parentInv } = info.get(j);
      // A turn in the person's frame, applied in the joint's parent space.
      return parentInv.clone().multiply(delta).multiply(parent).multiply(bind);
    };
    const keyQ = keys.map((key) => new Map([...used].map((j) => [j, local(j, key)])));
    // Where a time falls between two keys; the loop wraps from the last key back to the first.
    const segment = (t) => {
      let i = keys.length - 1;
      while (i > 0 && keys[i].t > t) i--;
      const next = (i + 1) % keys.length;
      const end = next === 0 ? length : keys[next].t;
      return { i, next, f: ease((t - keys[i].t) / Math.max(end - keys[i].t, 1e-6)) };
    };

    const tracks = [...used].map((j) => {
      const values = [];
      const q = new Quaternion();
      for (const t of times) {
        const { i, next, f } = segment(t % length);
        q.slerpQuaternions(keyQ[i].get(j), keyQ[next].get(j), f);
        values.push(q.x, q.y, q.z, q.w);
      }
      return new QuaternionKeyframeTrack(`${joints.get(j).name}.quaternion`, times, values);
    });
    const hips = [];
    for (const t of times) {
      const { i, next, f } = segment(t % length);
      const a = keys[i].hips ?? [0, 0, 0];
      const b = keys[next].hips ?? [0, 0, 0];
      hips.push(...[0, 1, 2].map((k) => hipsBind.getComponent(k) + a[k] + (b[k] - a[k]) * f));
    }
    tracks.push(new VectorKeyframeTrack('hips.position', times, hips));
    return new AnimationClip(name, length, tracks);
  });
}
