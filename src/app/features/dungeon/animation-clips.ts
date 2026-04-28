/**
 * animation-clips.ts
 *
 * Keyframe-driven AnimationClip factories for the dungeon character.
 * Inspired by threejs.org/examples/#webgl_animation_keyframes:
 *   mixer = new THREE.AnimationMixer(model)
 *   mixer.clipAction(clip).play()
 *   mixer.update(delta)  ← called each frame
 *
 * Joint names must match the Three.js Object3D names set in character-mesh.ts:
 *   hipPivot, legPivotL/R, kneePivotL/R, shoulderL/R, elbowL/R
 */

import * as THREE from 'three';

/** Returns one full walk-cycle AnimationClip using QuaternionKeyframeTracks. */
export function buildWalkClip(): THREE.AnimationClip {
  const FREQ = 8.5;                      // radians / second (matches legacy walk speed)
  const T    = (2 * Math.PI) / FREQ;    // one full cycle ≈ 0.74 s
  const N    = 16;                       // samples per cycle
  const AX   = new THREE.Vector3(1, 0, 0);
  const AZ   = new THREE.Vector3(0, 0, 1);
  const q    = new THREE.Quaternion();

  const times: number[] = [];
  const legL: number[] = [], legR: number[] = [];
  const kneeL: number[] = [], kneeR: number[] = [];
  const hipZ: number[] = [];
  const shL: number[] = [], shR: number[] = [];
  const elL: number[] = [], elR: number[] = [];

  for (let i = 0; i <= N; i++) {
    const frac = i / N;
    const sw   = Math.sin(frac * 2 * Math.PI);
    times.push(frac * T);

    q.setFromAxisAngle(AX,  sw * 0.72);  legL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, -sw * 0.72);  legR.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, Math.max(0, -sw) * 0.60); kneeL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, Math.max(0,  sw) * 0.60); kneeR.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AZ, -sw * 0.04);  hipZ.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, -sw * 0.60);  shL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX,  sw * 0.60);  shR.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX,  0.10 + Math.max(0,  sw) * 0.45); elL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX,  0.10 + Math.max(0, -sw) * 0.45); elR.push(q.x, q.y, q.z, q.w);
  }

  const QKT = (name: string, vals: number[]) =>
    new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, vals);

  return new THREE.AnimationClip('walk', T, [
    QKT('legPivotL',  legL),  QKT('legPivotR',  legR),
    QKT('kneePivotL', kneeL), QKT('kneePivotR', kneeR),
    QKT('hipPivot',   hipZ),
    QKT('shoulderL',  shL),   QKT('shoulderR',  shR),
    QKT('elbowL',     elL),   QKT('elbowR',     elR),
  ]);
}

/** Gentle idle breathing AnimationClip. */
export function buildIdleClip(): THREE.AnimationClip {
  const T  = (2 * Math.PI) / 1.8;   // breathing period ≈ 3.49 s
  const N  = 12;
  const AX = new THREE.Vector3(1, 0, 0);
  const q  = new THREE.Quaternion();

  const times: number[] = [];
  const shL: number[] = [], shR: number[] = [];
  const elL: number[] = [], elR: number[] = [];

  for (let i = 0; i <= N; i++) {
    const frac = i / N;
    const sway = Math.sin(frac * 2 * Math.PI) * 0.015;
    times.push(frac * T);
    q.setFromAxisAngle(AX, sway);          shL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, sway);          shR.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, 0.10 + sway);   elL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, 0.10 + sway);   elR.push(q.x, q.y, q.z, q.w);
  }

  const QKT = (name: string, vals: number[]) =>
    new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, vals);

  return new THREE.AnimationClip('idle', T, [
    QKT('shoulderL', shL), QKT('shoulderR', shR),
    QKT('elbowL',    elL), QKT('elbowR',    elR),
  ]);
}

/**
 * Run AnimationClip — faster cadence and greater amplitude than walk.
 * Uses the same joint/track layout as buildWalkClip() but tuned for sprinting:
 *   • FREQ 14 Hz (vs 8.5), period 0.45 s
 *   • Leg amplitude 0.90 (vs 0.72), knee bend 0.75 (vs 0.60)
 *   • Shoulder pump 0.80 (vs 0.60), elbow max 0.60 (vs 0.45)
 *   • Hip sway 0.06 (vs 0.04)
 */
export function buildRunClip(): THREE.AnimationClip {
  const FREQ = 14;
  const T    = (2 * Math.PI) / FREQ;  // period ≈ 0.45 s
  const N    = 16;
  const AX   = new THREE.Vector3(1, 0, 0);
  const AZ   = new THREE.Vector3(0, 0, 1);
  const q    = new THREE.Quaternion();

  const times: number[] = [];
  const hipArr: number[] = [];
  const lgL: number[] = [], lgR: number[] = [];
  const knL: number[] = [], knR: number[] = [];
  const shL: number[] = [], shR: number[] = [];
  const elL: number[] = [], elR: number[] = [];

  for (let i = 0; i <= N; i++) {
    const ph   = (i / N) * 2 * Math.PI;
    const sinP = Math.sin(ph);
    const cosP = Math.cos(ph);
    times.push((i / N) * T);

    // Hip sway (Z)
    q.setFromAxisAngle(AZ, sinP * 0.06);      hipArr.push(q.x, q.y, q.z, q.w);
    // Legs (X) — opposite phase
    const legSwing = 0.90;
    q.setFromAxisAngle(AX,  sinP * legSwing); lgL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, -sinP * legSwing); lgR.push(q.x, q.y, q.z, q.w);
    // Knees — bend more on trailing leg
    const kneeBend = 0.75;
    q.setFromAxisAngle(AX, Math.max(0, -sinP) * kneeBend); knL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, Math.max(0,  sinP) * kneeBend); knR.push(q.x, q.y, q.z, q.w);
    // Arms pump opposite to legs
    const shPump = 0.80;
    q.setFromAxisAngle(AX, -cosP * shPump * 0.5 + sinP * shPump * 0.5); shL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX,  cosP * shPump * 0.5 - sinP * shPump * 0.5); shR.push(q.x, q.y, q.z, q.w);
    // Elbow bend
    const elMax = 0.60;
    q.setFromAxisAngle(AX, Math.max(0.20, Math.abs(sinP)) * elMax); elL.push(q.x, q.y, q.z, q.w);
    q.setFromAxisAngle(AX, Math.max(0.20, Math.abs(cosP)) * elMax); elR.push(q.x, q.y, q.z, q.w);
  }

  const QKT = (name: string, vals: number[]) =>
    new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, vals);

  return new THREE.AnimationClip('run', T, [
    QKT('hipPivot',   hipArr),
    QKT('legPivotL',  lgL),   QKT('legPivotR',  lgR),
    QKT('kneePivotL', knL),   QKT('kneePivotR', knR),
    QKT('shoulderL',  shL),   QKT('shoulderR',  shR),
    QKT('elbowL',     elL),   QKT('elbowR',     elR),
  ]);
}
