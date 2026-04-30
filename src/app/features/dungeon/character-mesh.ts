/**
 * character-mesh.ts
 *
 * Builds the fully-jointed humanoid character geometry for the first-person view.
 * Returns the root Group and a CharacterJoints struct so the component can
 * animate individual joints without relying on side-effect mutation.
 */

import * as THREE from 'three';
import { Equipment } from '../../core/models/character.model';
import { makeWeaponMesh, makeShieldMesh, wmesh } from './equipment-meshes';

// ─── Armor / helm color tables ────────────────────────────────────────────────

export const ARMOR_COLORS: Record<'none' | 'leather' | 'chain' | 'plate', number> = {
  none:    0x3a2a1a,
  leather: 0x8b4513,
  chain:   0x556677,
  plate:   0x8899bb,
};

export const HELM_COLORS: Record<'none' | 'leather' | 'iron' | 'great', number> = {
  none:    0xffcc99,
  leather: 0x8b4513,
  iron:    0x6677aa,
  great:   0x8899bb,
};

// ─── Tier classifiers ─────────────────────────────────────────────────────────

export function armorTier(id: string | undefined): 'none' | 'leather' | 'chain' | 'plate' {
  if (!id) return 'none';
  if (id.includes('plate') || id === 'cursed-armor') return 'plate';
  if (id.includes('chain') || id.includes('mail')   || id.includes('elven')) return 'chain';
  if (id.includes('leather')) return 'leather';
  return 'none';
}

export function helmTier(id: string | undefined): 'none' | 'leather' | 'iron' | 'great' {
  if (!id) return 'none';
  if (id.includes('great')) return 'great';
  if (id.includes('iron')  || id.includes('helm')) return 'iron';
  if (id.includes('cap')   || id.includes('leather')) return 'leather';
  return 'none';
}

/** Produces a string key for the currently equipped items so the component can
 *  detect equipment changes without deep comparison. */
export function equipSig(eq: Equipment | null): string {
  if (!eq) return '';
  return [eq.weapon?.definitionId, eq.shield?.definitionId,
          eq.helmet?.definitionId, eq.bodyArmor?.definitionId,
          eq.gloves?.definitionId, eq.boots?.definitionId,
          eq.ring?.definitionId,   eq.amulet?.definitionId,
          eq.pet?.definitionId]
    .join('|');
}

// ─── CharacterJoints ─────────────────────────────────────────────────────────

/** Animatable joint groups returned by buildCharacterGeometry. */
export interface CharacterJoints {
  hipPivot:   THREE.Group;
  legPivotL:  THREE.Group;
  legPivotR:  THREE.Group;
  kneePivotL: THREE.Group;
  kneePivotR: THREE.Group;
  shoulderL:  THREE.Group;
  shoulderR:  THREE.Group;
  elbowL:     THREE.Group;
  elbowR:     THREE.Group;
  // Dog companion joints (present only when a pet is equipped)
  dogFrontLegL?: THREE.Group;
  dogFrontLegR?: THREE.Group;
  dogBackLegL?:  THREE.Group;
  dogBackLegR?:  THREE.Group;
  dogTailPivot?: THREE.Group;
}

// ─── Geometry builder ─────────────────────────────────────────────────────────

/**
 * Builds a fully-jointed humanoid skeleton with CylinderGeometry limbs,
 * sphere joints, tapered torso, and equipment-specific armor/weapon meshes.
 *
 * Adds all geometry as children of `g` and returns the joint Groups so the
 * caller can store them for animation (AnimationMixer or procedural).
 */
export function buildCharacterGeometry(g: THREE.Group, eq: Equipment | null): CharacterJoints {
  const lam = (hex: number, rough = 0.80, metal = 0.0, em = 0, emI = 0): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
    if (em) { m.emissive.setHex(em); m.emissiveIntensity = emI; }
    return m;
  };
  const cyl = (rT: number, rB: number, h: number, s = 8) =>
    new THREE.CylinderGeometry(rT, rB, h, s);
  const sph = (r: number, ws = 8, hs = 6) =>
    new THREE.SphereGeometry(r, ws, hs);
  const box = (w: number, h: number, d: number) =>
    new THREE.BoxGeometry(w, h, d);

  // ── Armor / skin tones ───────────────────────────────────────────────
  const aTier   = armorTier(eq?.bodyArmor?.definitionId);
  const aColor  = eq?.bodyArmor?.cursed ? 0x220022 : ARMOR_COLORS[aTier];
  const hTier   = helmTier(eq?.helmet?.definitionId);
  const hColor  = eq?.helmet?.cursed   ? 0x220022 : HELM_COLORS[hTier];
  const skin    = 0xffcc99;
  const legCol  = eq?.bodyArmor?.cursed ? 0x220022
                : aTier !== 'none'       ? aColor : 0x2a3040;
  const bootCol = eq?.boots?.cursed  ? 0x110011
                : aTier === 'plate'  ? 0x667788
                : aTier === 'chain'  ? 0x445566
                : eq?.boots          ? 0x4a3a2a
                :                     0x2a1a0a;

  // PBR roughness/metalness per armor tier
  const [aRough, aMetal] = aTier === 'plate'  ? [0.20, 0.85]
                         : aTier === 'chain'  ? [0.45, 0.60]
                         : aTier === 'leather'? [0.85, 0.05]
                         :                     [0.80, 0.00];
  const [hRough, hMetal] = hTier === 'great'  ? [0.20, 0.85]
                         : hTier === 'iron'   ? [0.25, 0.75]
                         : hTier === 'leather'? [0.85, 0.05]
                         :                     [0.80, 0.00];

  const bodyMat = lam(aColor, aRough, aMetal);
  const legMat  = lam(legCol, aRough, aMetal);
  const armMat  = lam(aTier === 'none' ? skin : aColor, aTier === 'none' ? 0.82 : aRough, aTier === 'none' ? 0.0 : aMetal);
  const skinMat = lam(skin, 0.82, 0.0);
  const bootMat = lam(bootCol, 0.75, aTier === 'plate' ? 0.50 : 0.05);
  const beltMat = lam(0x6a4a2a, 0.80, 0.0);
  const buckMat = lam(0xccaa44, 0.30, 0.70);
  const helmMat = lam(hColor, hRough, hMetal);

  // ── HIP GROUP — drives leg sway ──────────────────────────────────────
  const hipPivot = new THREE.Group();
  hipPivot.name = 'hipPivot';
  hipPivot.position.set(0, 0.52, 0);
  g.add(hipPivot);
  hipPivot.add(wmesh(box(0.32, 0.10, 0.22), bodyMat, 0, 0, 0));

  // ── LEGS ─────────────────────────────────────────────────────────────
  let legPivotL!: THREE.Group, legPivotR!: THREE.Group;
  let kneePivotL!: THREE.Group, kneePivotR!: THREE.Group;

  for (const side of [-1, 1] as const) {
    const legPivot = new THREE.Group();
    legPivot.name = side === -1 ? 'legPivotL' : 'legPivotR';
    legPivot.position.set(side * 0.10, 0, 0);
    hipPivot.add(legPivot);
    if (side === -1) legPivotL = legPivot;
    else             legPivotR = legPivot;

    legPivot.add(wmesh(cyl(0.076, 0.062, 0.22), legMat, 0, -0.11, 0));
    legPivot.add(wmesh(sph(0.055), legMat, 0, -0.22, 0));

    const kneePivot = new THREE.Group();
    kneePivot.name = side === -1 ? 'kneePivotL' : 'kneePivotR';
    kneePivot.position.set(0, -0.22, 0);
    legPivot.add(kneePivot);
    if (side === -1) kneePivotL = kneePivot;
    else             kneePivotR = kneePivot;

    kneePivot.add(wmesh(cyl(0.058, 0.046, 0.24), legMat, 0, -0.12, 0));

    if (aTier === 'plate') {
      const kCol = eq?.bodyArmor?.cursed ? 0x330033 : 0x9aaac0;
      kneePivot.add(wmesh(box(0.14, 0.08, 0.14), lam(kCol, 0.20, 0.85), 0, -0.01, 0.05));
    }

    const bootGrp = new THREE.Group();
    bootGrp.position.set(0, -0.24, 0);
    kneePivot.add(bootGrp);
    bootGrp.add(wmesh(box(0.16, 0.09, 0.26), bootMat, 0, -0.045, 0.05));
  }

  // ── TORSO ────────────────────────────────────────────────────────────
  g.add(wmesh(box(0.38, 0.08, 0.23), beltMat, 0, 0.52, 0));
  g.add(wmesh(box(0.08, 0.06, 0.25), buckMat, 0, 0.52, 0));
  g.add(wmesh(box(0.36, 0.14, 0.23), bodyMat, 0, 0.61, 0));
  g.add(wmesh(box(0.48, 0.18, 0.26), bodyMat, 0, 0.73, 0));
  if (aTier === 'plate') {
    const pCol = eq?.bodyArmor?.cursed ? 0x330033 : 0x9aaac0;
    g.add(wmesh(box(0.28, 0.16, 0.28), lam(pCol, 0.20, 0.85), 0, 0.73, 0));
    g.add(wmesh(box(0.22, 0.10, 0.25), lam(pCol, 0.20, 0.85), 0, 0.61, 0));
  }

  // ── PAULDRONS ────────────────────────────────────────────────────────
  if (aTier !== 'none') {
    const pSz  = aTier === 'plate' ? 0.23 : aTier === 'chain' ? 0.17 : 0.12;
    const pCol = eq?.bodyArmor?.cursed ? 0x220022
               : aTier === 'plate'      ? 0x9aaac0
               : aColor;
    for (const sx of [-1, 1]) {
      g.add(wmesh(box(pSz, 0.10, pSz * 0.85), lam(pCol, aRough, aMetal), sx * 0.28, 0.80, 0));
    }
  }

  // ── NECK ─────────────────────────────────────────────────────────────
  g.add(wmesh(cyl(0.06, 0.055, 0.07, 6),
    lam(hTier === 'none' ? skin : aColor, hTier === 'none' ? 0.82 : aRough, hTier === 'none' ? 0.0 : aMetal), 0, 0.85, 0));

  // ── HEAD ─────────────────────────────────────────────────────────────
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.96, 0);
  g.add(headGrp);

  headGrp.add(wmesh(box(0.30, 0.28, 0.27), helmMat, 0, 0, 0));

  if (hTier === 'none' || hTier === 'leather') {
    headGrp.add(wmesh(box(0.07, 0.05, 0.02), lam(0x223344, 0.60, 0.0), -0.07, 0.03, 0.135));
    headGrp.add(wmesh(box(0.07, 0.05, 0.02), lam(0x223344, 0.60, 0.0),  0.07, 0.03, 0.135));
    headGrp.add(wmesh(box(0.04, 0.06, 0.04), lam(0xeebbaa, 0.82, 0.0), 0, -0.03, 0.145));
    if (hTier === 'none') {
      headGrp.add(wmesh(box(0.30, 0.06, 0.14), lam(0x3a2010, 0.90, 0.0), 0, 0.16, -0.06));
    }
  }
  if (hTier === 'iron' || hTier === 'great') {
    headGrp.add(wmesh(box(0.20, 0.06, 0.06), lam(0x111a22, 0.30, 0.70), 0, 0.02, 0.145));
    headGrp.add(wmesh(box(0.32, 0.05, 0.08), helmMat, 0, 0.08, 0.135));
  }
  if (hTier === 'great') {
    headGrp.add(wmesh(box(0.07, 0.20, 0.08), helmMat, -0.18, -0.05, 0.10));
    headGrp.add(wmesh(box(0.07, 0.20, 0.08), helmMat,  0.18, -0.05, 0.10));
    headGrp.add(wmesh(box(0.22, 0.07, 0.05), helmMat, 0, -0.14, 0.125));
  }
  if (hTier === 'leather') {
    headGrp.add(wmesh(box(0.34, 0.04, 0.30), helmMat, 0, 0.14, 0.02));
  }

  // ── ARMS (shoulder → elbow → hand with sphere joints) ────────────────
  let shoulderL!: THREE.Group, shoulderR!: THREE.Group;
  let elbowL!: THREE.Group, elbowR!: THREE.Group;

  for (const side of [-1, 1] as const) {
    const shoulder = new THREE.Group();
    shoulder.name = side === -1 ? 'shoulderL' : 'shoulderR';
    shoulder.position.set(side * 0.27, 0.79, 0);
    g.add(shoulder);
    if (side === -1) shoulderL = shoulder;
    else             shoulderR = shoulder;

    shoulder.add(wmesh(sph(0.062, 8, 6), armMat, 0, 0, 0));
    shoulder.add(wmesh(cyl(0.056, 0.046, 0.20), armMat, 0, -0.10, 0));
    if (aTier === 'plate' || aTier === 'chain') {
      const bCol = eq?.bodyArmor?.cursed ? 0x220022
                 : aTier === 'plate' ? 0x9aaac0 : 0x4a5a66;
      shoulder.add(wmesh(cyl(0.060, 0.056, 0.07), lam(bCol, aRough, aMetal), 0, -0.175, 0));
    }

    const elbow = new THREE.Group();
    elbow.name = side === -1 ? 'elbowL' : 'elbowR';
    elbow.position.set(0, -0.20, 0);
    shoulder.add(elbow);
    if (side === -1) elbowL = elbow;
    else             elbowR = elbow;

    elbow.add(wmesh(sph(0.048, 8, 6), armMat, 0, 0, 0));
    elbow.add(wmesh(cyl(0.044, 0.036, 0.18), armMat, 0, -0.09, 0));
    if (aTier !== 'none') {
      const wCol = eq?.bodyArmor?.cursed ? 0x220022
                 : aTier === 'plate' ? 0x9aaac0 : 0x4a5a66;
      elbow.add(wmesh(cyl(0.050, 0.048, 0.06), lam(wCol, aRough, aMetal), 0, -0.155, 0));
    }
    elbow.add(wmesh(box(0.08, 0.08, 0.07),
      aTier === 'none' ? skinMat : armMat, 0, -0.22, 0));
  }

  // ── WEAPON (right hand) ──────────────────────────────────────────────
  if (eq?.weapon) {
    const wm = makeWeaponMesh(eq.weapon);
    wm.position.set(0.02, 0.15, 0.03);
    elbowR.add(wm);
  }

  // ── SHIELD (left hand) ───────────────────────────────────────────────
  if (eq?.shield) {
    const sm = makeShieldMesh(eq.shield);
    sm.position.set(-0.02, -0.20, 0.08);
    sm.rotation.set(-Math.PI / 10, 0.12, 0);
    elbowL.add(sm);
  }

  g.traverse(child => {
    if (child instanceof THREE.Mesh) child.castShadow = true;
  });

  // ── PET DOG (left side companion) ────────────────────────────────────
  if (eq?.pet?.definitionId === 'loyal-dog') {
    const dog = buildDogMesh(g, eq.pet.cursed);
    return { hipPivot, legPivotL, legPivotR, kneePivotL, kneePivotR, shoulderL, shoulderR, elbowL, elbowR, ...dog };
  }

  return { hipPivot, legPivotL, legPivotR, kneePivotL, kneePivotR, shoulderL, shoulderR, elbowL, elbowR };
}

// ─── Dog companion mesh ───────────────────────────────────────────────────────

function buildDogMesh(g: THREE.Group, cursed = false): {
  dogFrontLegL: THREE.Group; dogFrontLegR: THREE.Group;
  dogBackLegL:  THREE.Group; dogBackLegR:  THREE.Group;
  dogTailPivot: THREE.Group;
} {
  const lam = (hex: number, rough = 0.85, metal = 0.0): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });

  const furColor   = cursed ? 0x110011 : 0xcc9944;
  const snoutColor = cursed ? 0x0d0008 : 0xe8c870;
  const eyeColor   = cursed ? 0xff0000 : 0x221100;

  const fur      = lam(furColor);
  const snoutMat = lam(snoutColor);
  const eyeMat   = new THREE.MeshStandardMaterial({
    color: eyeColor, roughness: 0.6,
    emissive: new THREE.Color(cursed ? 0xff0000 : 0), emissiveIntensity: cursed ? 0.9 : 0,
  });
  const noseMat  = lam(0x111111, 0.7);

  const dogRoot = new THREE.Group();
  // Offset: left side of character, slightly behind, at ground level
  dogRoot.position.set(-0.90, 0, 0.18);
  g.add(dogRoot);

  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rT: number, rB: number, h: number, s = 7) => new THREE.CylinderGeometry(rT, rB, h, s);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = dogRoot): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Body — elongated along Z, dog faces -Z (same forward as character)
  add(box(0.44, 0.20, 0.56), fur, 0, 0.30, 0);

  // Neck — angled forward and up
  const neckGrp = new THREE.Group();
  neckGrp.position.set(0, 0.36, -0.22);
  neckGrp.rotation.x = 0.45;
  dogRoot.add(neckGrp);
  add(new THREE.CylinderGeometry(0.065, 0.078, 0.18, 7), fur, 0, 0.06, 0, neckGrp);

  // Head
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.48, -0.30);
  dogRoot.add(headGrp);
  add(box(0.27, 0.23, 0.25), fur,      0,      0,      0,     headGrp);
  add(box(0.15, 0.11, 0.15), snoutMat, 0,     -0.045, -0.18,  headGrp);
  add(box(0.08, 0.04, 0.04), noseMat,  0,      0.01,  -0.245, headGrp);
  add(box(0.045, 0.045, 0.03), eyeMat, -0.075, 0.04,  -0.125, headGrp);
  add(box(0.045, 0.045, 0.03), eyeMat,  0.075, 0.04,  -0.125, headGrp);
  // Floppy ears
  const earL = new THREE.Mesh(box(0.075, 0.15, 0.055), fur);
  earL.position.set(-0.16, -0.02, -0.04); earL.rotation.z =  0.18; earL.castShadow = true;
  headGrp.add(earL);
  const earR = new THREE.Mesh(box(0.075, 0.15, 0.055), fur);
  earR.position.set( 0.16, -0.02, -0.04); earR.rotation.z = -0.18; earR.castShadow = true;
  headGrp.add(earR);

  // Tail pivot at the rump
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.36, 0.28);
  tailPivot.rotation.x = -0.55; // base angle — naturally curves up
  dogRoot.add(tailPivot);
  add(new THREE.CylinderGeometry(0.028, 0.042, 0.26, 6), fur, 0, 0.13, 0, tailPivot);

  // Legs — pivot at shoulder/hip height
  const legDefs: Array<{ name: string; x: number; z: number }> = [
    { name: 'dogFrontLegL', x: -0.145, z: -0.18 },
    { name: 'dogFrontLegR', x:  0.145, z: -0.18 },
    { name: 'dogBackLegL',  x: -0.145, z:  0.18 },
    { name: 'dogBackLegR',  x:  0.145, z:  0.18 },
  ];
  const legGroups: Record<string, THREE.Group> = {};
  for (const def of legDefs) {
    const pivot = new THREE.Group();
    pivot.name = def.name;
    pivot.position.set(def.x, 0.30, def.z);
    dogRoot.add(pivot);
    // Upper leg
    add(new THREE.CylinderGeometry(0.044, 0.034, 0.20, 7), fur, 0, -0.10, 0, pivot);
    // Lower leg + paw
    const knee = new THREE.Group();
    knee.position.set(0, -0.20, 0);
    pivot.add(knee);
    add(new THREE.CylinderGeometry(0.032, 0.026, 0.18, 7), fur, 0, -0.09, 0, knee);
    add(box(0.09, 0.05, 0.12), fur, 0, -0.195, 0.02, knee);
    legGroups[def.name] = pivot;
  }

  return {
    dogFrontLegL: legGroups['dogFrontLegL'],
    dogFrontLegR: legGroups['dogFrontLegR'],
    dogBackLegL:  legGroups['dogBackLegL'],
    dogBackLegR:  legGroups['dogBackLegR'],
    dogTailPivot: tailPivot,
  };
}
