/**
 * equipment-meshes.ts
 *
 * Thin dispatcher for in-hand weapon and shield geometry.
 * Each item definition in items.data.ts carries its own makeMesh() factory.
 * These functions simply call that factory when present.
 *
 * Usage:
 *   import { makeWeaponMesh, makeShieldMesh } from './equipment-meshes';
 */

import * as THREE from 'three';
import { Item } from '../../core/models/item.model';
import { ITEMS } from '../../core/data/items.data';

// Re-export shared helpers so existing callers in first-person-view.component.ts keep working.
export { wmesh, lam } from './mesh-utils';

// ─── Weapon mesh factory ──────────────────────────────────────────────────────

export function makeWeaponMesh(weapon: Item): THREE.Group {
  const def = ITEMS.find(d => d.id === weapon.definitionId);
  if (def?.makeMesh) {
    return def.makeMesh(weapon.cursed);
  }
  // Fallback: plain grey box for any item not yet in the registry
  const g = new THREE.Group();
  g.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.30, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.4 })
  ));
  return g;
}

// ─── Shield mesh factory ──────────────────────────────────────────────────────

export function makeShieldMesh(shield: Item): THREE.Group {
  const def = ITEMS.find(d => d.id === shield.definitionId);
  if (def?.makeMesh) {
    return def.makeMesh(shield.cursed);
  }
  // Fallback: plain grey box
  const g = new THREE.Group();
  g.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 1.20, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x6677aa, roughness: 0.25, metalness: 0.75 })
  ));
  return g;
}
