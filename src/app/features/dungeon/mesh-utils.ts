/**
 * mesh-utils.ts
 *
 * Shared Three.js geometry helpers for dungeon equipment rendering.
 * Import these in items.data.ts and equipment-meshes.ts.
 */

import * as THREE from 'three';

/** Create a positioned Mesh inline — keeps per-part declarations compact. */
export function wmesh(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number, y: number, z: number
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

/** Compact MeshStandardMaterial factory. */
export function lam(
  hex: number,
  rough = 0.70,
  metal = 0.0,
  em    = 0,
  emI   = 0
): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
  if (em) { m.emissive.setHex(em); m.emissiveIntensity = emI; }
  return m;
}

/** Standard sword/blade material based on enchant / curse / special state. */
export function bladeMat(opts: {
  cursed?: boolean;
  enchanted?: boolean;
  fire?: boolean;
  ice?: boolean;
  holy?: boolean;
}): THREE.MeshStandardMaterial {
  const { cursed, enchanted, fire, ice, holy } = opts;
  let color = cursed ? 0x220022 : 0xccddee;
  let emit  = 0, emitI = 0;
  if      (fire)      { color = 0xff6600; emit = 0xff2200; emitI = 0.7; }
  else if (ice)       { color = 0xaaddff; emit = 0x4488ff; emitI = 0.5; }
  else if (holy)      { color = 0xffeeaa; emit = 0xffcc44; emitI = 0.6; }
  else if (cursed)    { color = 0x110011; emit = 0x440044; emitI = 0.3; }
  else if (enchanted) { color = 0x99bbff; emit = 0x3355ff; emitI = 0.25; }
  return lam(color, enchanted || fire || ice || holy ? 0.25 : 0.15, enchanted || fire || ice || holy ? 0.3 : 0.85, emit, emitI);
}
