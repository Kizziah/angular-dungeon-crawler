/**
 * equipment-meshes.ts
 *
 * Procedural Three.js mesh factories for in-hand weapon and shield geometry.
 * Each factory receives an Item and returns a THREE.Group sized/oriented so
 * the caller can simply attach it to the appropriate wrist/elbow joint.
 *
 * Usage:
 *   import { makeWeaponMesh, makeShieldMesh, wmesh } from './equipment-meshes';
 */

import * as THREE from 'three';
import { Item } from '../../core/models/item.model';

// ─── Shared helper ────────────────────────────────────────────────────────────

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

// ─── Internal helpers ─────────────────────────────────────────────────────────

type WeaponKind = 'sword' | 'dagger' | 'axe' | 'mace' | 'staff' | 'bow' | 'spear';

function weaponKind(id: string): WeaponKind {
  if (id.includes('dagger'))                                                return 'dagger';
  if (id.includes('sword') || id.includes('blade') ||
      id.includes('avenger') || id === 'cursed-sword')                     return 'sword';
  if (id.includes('axe'))                                                   return 'axe';
  if (id.includes('hammer') || id.includes('mace'))                        return 'mace';
  if (id.includes('staff')  || id.includes('rod') || id.includes('wand'))  return 'staff';
  if (id.includes('bow'))                                                   return 'bow';
  if (id.includes('spear')  || id.includes('lance'))                       return 'spear';
  return 'sword';
}

/** Compact MeshStandardMaterial factory. */
function lam(
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

// ─── Weapon mesh factory ──────────────────────────────────────────────────────

export function makeWeaponMesh(weapon: Item): THREE.Group {
  const id       = weapon.definitionId;
  debugger
  const kind     = weaponKind(id);
  const isFire   = id === 'sword-of-fire';
  const isIce    = id === 'blade-of-ice';
  const isHoly   = id === 'holy-avenger';
  const isCursed = weapon.cursed;
  const isEnch   = id.includes('-p') || isFire || isIce || isHoly;

  const g = new THREE.Group();

  let bColor = isCursed ? 0x220022 : 0xccddee;
  let bEmit  = 0, bEmitI = 0;
  if      (isFire)   { bColor = 0xff6600; bEmit = 0xff2200; bEmitI = 0.7; }
  else if (isIce)    { bColor = 0xaaddff; bEmit = 0x4488ff; bEmitI = 0.5; }
  else if (isHoly)   { bColor = 0xffeeaa; bEmit = 0xffcc44; bEmitI = 0.6; }
  else if (isCursed) { bColor = 0x110011; bEmit = 0x440044; bEmitI = 0.3; }
  else if (isEnch)   { bColor = 0x99bbff; bEmit = 0x3355ff; bEmitI = 0.25; }

  const handleMat = lam(isCursed ? 0x110011 : 0x5a3a1a, 0.85, 0.0);
  const guardMat  = lam(isCursed ? 0x220022 : 0xccaa44, 0.30, 0.75);
  const woodMat   = lam(isCursed ? 0x110011 : 0x5a3010, 0.85, 0.0);
  const bladeMat  = lam(bColor, isEnch ? 0.25 : 0.15, isEnch ? 0.3 : 0.85, bEmit, bEmitI);

  switch (kind) {

    // ── Dagger ──────────────────────────────────────────────────────────────
    case 'dagger': {
      g.add(wmesh(new THREE.BoxGeometry(0.03,  0.10,  0.03),  handleMat, 0, -0.05, 0));
      g.add(wmesh(new THREE.BoxGeometry(0.09,  0.02,  0.02),  guardMat,  0,  0,    0));
      g.add(wmesh(new THREE.BoxGeometry(0.025, 0.14,  0.012), bladeMat,  0,  0.08, 0));
      break;
    }

    // ── Sword / Longsword / Greatsword ──────────────────────────────────────
    case 'sword': {
      const isGreat = id.includes('great') || id.includes('bastard');
      const isShort = id.includes('short');
      const bLen = isGreat ? 0.38 : isShort ? 0.20 : 0.28;
      const gW   = isGreat ? 0.24 : 0.16;
      g.add(wmesh(new THREE.BoxGeometry(0.04, 0.14, 0.04),                         handleMat, 0, -0.07,           0));
      g.add(wmesh(new THREE.BoxGeometry(0.06, 0.04, 0.06),                         guardMat,  0, -0.15,           0));
      g.add(wmesh(new THREE.BoxGeometry(gW,   0.03, 0.03),                         guardMat,  0,  0.01,           0));
      g.add(wmesh(new THREE.BoxGeometry(isGreat ? 0.06 : 0.04, bLen, 0.015),       bladeMat,  0,  bLen / 2 + 0.03, 0));
      break;
    }

    // ── Battle Axe ──────────────────────────────────────────────────────────
    case 'axe': {
      g.add(wmesh(new THREE.BoxGeometry(0.04, 0.34, 0.04), woodMat,   0,     0.07, 0));
      g.add(wmesh(new THREE.BoxGeometry(0.19, 0.14, 0.04), bladeMat, -0.05,  0.27, 0));
      g.add(wmesh(new THREE.BoxGeometry(0.06, 0.06, 0.03), bladeMat,  0.07,  0.25, 0));
      break;
    }

    // ── Mace / War Hammer ───────────────────────────────────────────────────
    case 'mace': {
      const isHammer = id.includes('hammer');
      g.add(wmesh(new THREE.BoxGeometry(0.04, 0.28, 0.04), handleMat, 0, 0.02, 0));
      if (isHammer) {
        g.add(wmesh(new THREE.BoxGeometry(0.16, 0.08, 0.06), bladeMat, 0, 0.20, 0));
      } else {
        // Flanged mace head
        g.add(wmesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), bladeMat, 0, 0.22, 0));
        for (let i = 0; i < 4; i++) {
          const f = wmesh(new THREE.BoxGeometry(0.03, 0.10, 0.17), lam(0x889999, 0.35, 0.70), 0, 0.22, 0);
          f.rotation.y = (i * Math.PI) / 2;
          g.add(f);
        }
      }
      break;
    }

    // ── Staff ────────────────────────────────────────────────────────────────
    case 'staff': {
      g.add(wmesh(new THREE.BoxGeometry(0.04, 1.74, 0.04), woodMat, 0, 0.16, 0));
      if (isEnch) {
        // Glowing orb at the tip for enchanted staves
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.057, 8, 8),
          lam(bColor, bEmit, Math.max(0.5, bEmitI))
        );
        orb.position.set(0, 0.40, 0);
        g.add(orb);
      } else {
        g.add(wmesh(new THREE.BoxGeometry(0.04, 0.06, 0.04), lam(0x6a4a1a, 0.85, 0.0), 0, 0.40, 0));
      }
      break;
    }

    // ── Bow ─────────────────────────────────────────────────────────────────
    case 'bow': {
      // Riser (grip)
      g.add(wmesh(new THREE.BoxGeometry(0.04, 0.14, 0.04), woodMat, 0, 0, 0));
      // Upper limb
      const upper = wmesh(new THREE.BoxGeometry(0.03, 0.17, 0.03), woodMat, -0.04, 0.16, 0);
      upper.rotation.z = -0.28;
      g.add(upper);
      // Lower limb
      const lower = wmesh(new THREE.BoxGeometry(0.03, 0.17, 0.03), woodMat, -0.04, -0.16, 0);
      lower.rotation.z = 0.28;
      g.add(lower);
      // String
      g.add(wmesh(new THREE.BoxGeometry(0.005, 0.48, 0.005), lam(0xeeeecc, 0.70, 0.1), -0.075, 0, 0));
      break;
    }

    // ── Spear ────────────────────────────────────────────────────────────────
    case 'spear': {
      g.add(wmesh(new THREE.BoxGeometry(0.04,  0.50, 0.04),  woodMat,  0, 0.19, 0));
      g.add(wmesh(new THREE.BoxGeometry(0.035, 0.15, 0.015), bladeMat, 0, 0.50, 0));
      break;
    }
  }

  return g;
}

// ─── Shield mesh factory ──────────────────────────────────────────────────────

export function makeShieldMesh(shield: Item): THREE.Group {
  const id       = shield.definitionId;
  const isTower  = id.includes('tower');
  const isLarge  = id.includes('large');
  const isEnch   = id.includes('-p');
  const isCursed = shield.cursed;

  // Shield face dimensions
  const w = isTower ? 0.22 : isLarge ? 0.50 : 0.16;
  const h = isTower ? 0.36 : isLarge ? 0.57 : 0.20;

  const g = new THREE.Group();

  const bodyCol = isCursed ? 0x220022 : isEnch ? 0x8899bb : 0x6677aa;
  const emitCol = isCursed ? 0x440044 : isEnch  ? 0x2233ff : 0;
  const emitI   = isCursed ? 0.3      : isEnch  ? 0.2      : 0;

  const rimMat = lam(0xaaaaaa, 0.20, 0.80);

  // Face plate
  g.add(wmesh(new THREE.BoxGeometry(w, h, 0.04),      lam(bodyCol, 0.25, 0.75, emitCol, emitI), 0, 0, 0));
  // Center boss
  g.add(wmesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), lam(isCursed ? 0x440044 : 0xccaa44, 0.30, 0.70), 0, 0, 0.04));
  // Rim (top, bottom, left, right)
  g.add(wmesh(new THREE.BoxGeometry(w + 0.03, 0.03, 0.02), rimMat,  0,       h / 2, 0.01));
  g.add(wmesh(new THREE.BoxGeometry(w + 0.03, 0.03, 0.02), rimMat,  0,      -h / 2, 0.01));
  g.add(wmesh(new THREE.BoxGeometry(0.03, h + 0.03, 0.02), rimMat,  w / 2,  0,      0.01));
  g.add(wmesh(new THREE.BoxGeometry(0.03, h + 0.03, 0.02), rimMat, -w / 2,  0,      0.01));

  return g;
}
