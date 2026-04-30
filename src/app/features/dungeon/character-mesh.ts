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
  // Dog companion joints
  dogFrontLegL?: THREE.Group;
  dogFrontLegR?: THREE.Group;
  dogBackLegL?:  THREE.Group;
  dogBackLegR?:  THREE.Group;
  dogTailPivot?: THREE.Group;
  // Cat companion joints
  catFrontLegL?: THREE.Group;
  catFrontLegR?: THREE.Group;
  catBackLegL?:  THREE.Group;
  catBackLegR?:  THREE.Group;
  catTailPivot?: THREE.Group;
  // Raven companion joints
  ravenWingL?: THREE.Group;
  ravenWingR?: THREE.Group;
  // Serpent companion joints
  snakeHeadPivot?: THREE.Group;
  // Alligator companion joints
  alligatorTailPivot?: THREE.Group;
  alligatorJawPivot?:  THREE.Group;
  // Monkey companion joints
  monkeyTailPivot?: THREE.Group;
  monkeyArmL?:      THREE.Group;
  monkeyArmR?:      THREE.Group;
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

  // ── PET DISPATCH ─────────────────────────────────────────────────────
  const petId = eq?.pet?.definitionId;
  const petCursed = eq?.pet?.cursed ?? false;
  const base = { hipPivot, legPivotL, legPivotR, kneePivotL, kneePivotR, shoulderL, shoulderR, elbowL, elbowR };

  if (petId === 'loyal-dog') {
    return { ...base, ...buildDogMesh(g, petCursed) };
  }
  if (petId === 'tabby-cat') {
    return { ...base, ...buildCatMesh(g, petCursed) };
  }
  if (petId === 'raven') {
    return { ...base, ...buildRavenMesh(g, petCursed) };
  }
  if (petId === 'coiled-serpent') {
    return { ...base, ...buildSnakeMesh(g, petCursed) };
  }
  if (petId === 'alligator') {
    return { ...base, ...buildAlligatorMesh(g, petCursed) };
  }
  if (petId === 'monkey') {
    return { ...base, ...buildMonkeyMesh(g, petCursed) };
  }

  return base;
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

// ─── Cat companion mesh ────────────────────────────────────────────────────────

function buildCatMesh(g: THREE.Group, cursed = false): {
  catFrontLegL: THREE.Group; catFrontLegR: THREE.Group;
  catBackLegL:  THREE.Group; catBackLegR:  THREE.Group;
  catTailPivot: THREE.Group;
} {
  const lam = (hex: number, rough = 0.85, metal = 0.0): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });

  const furColor  = cursed ? 0x0a0008 : 0xcc7722;
  const bellyColor = cursed ? 0x140012 : 0xe8aa55;
  const eyeColor  = cursed ? 0xff0000 : 0x44cc44;

  const fur   = lam(furColor);
  const belly = lam(bellyColor);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeColor, roughness: 0.4,
    emissive: new THREE.Color(cursed ? 0xff0000 : 0x44cc44),
    emissiveIntensity: cursed ? 1.0 : 0.25,
  });
  const noseMat = lam(cursed ? 0x330011 : 0xffaacc, 0.6);

  const catRoot = new THREE.Group();
  // Right side of character, slightly behind
  catRoot.position.set(0.88, 0, 0.15);
  g.add(catRoot);

  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rT: number, rB: number, h: number, s = 7) => new THREE.CylinderGeometry(rT, rB, h, s);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = catRoot): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Body — slender, elongated
  add(box(0.38, 0.16, 0.50), fur, 0, 0.28, 0);
  // Belly patch
  add(box(0.26, 0.10, 0.40), belly, 0, 0.27, 0.04);

  // Neck — graceful curve up/forward
  const neckGrp = new THREE.Group();
  neckGrp.position.set(0, 0.34, -0.20);
  neckGrp.rotation.x = 0.50;
  catRoot.add(neckGrp);
  add(new THREE.CylinderGeometry(0.055, 0.065, 0.16, 7), fur, 0, 0.06, 0, neckGrp);

  // Head — rounder than dog
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.45, -0.26);
  catRoot.add(headGrp);
  add(box(0.24, 0.22, 0.22), fur, 0, 0, 0, headGrp);
  // Muzzle — small, slightly protruding
  add(box(0.12, 0.09, 0.10), belly, 0, -0.04, -0.14, headGrp);
  // Nose
  add(box(0.06, 0.04, 0.03), noseMat, 0, 0.005, -0.185, headGrp);
  // Eyes — slightly tilted / almond
  add(box(0.05, 0.038, 0.025), eyeMat, -0.065, 0.04, -0.115, headGrp);
  add(box(0.05, 0.038, 0.025), eyeMat,  0.065, 0.04, -0.115, headGrp);
  // Pointed ears
  const earGeo = new THREE.ConeGeometry(0.055, 0.13, 4);
  const earL = new THREE.Mesh(earGeo, fur); earL.position.set(-0.085, 0.14, -0.02); earL.castShadow = true; headGrp.add(earL);
  const earR = new THREE.Mesh(earGeo, fur); earR.position.set( 0.085, 0.14, -0.02); earR.castShadow = true; headGrp.add(earR);

  // Long curved tail (2-segment for curve effect)
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.32, 0.26);
  tailPivot.rotation.x = -0.70;
  catRoot.add(tailPivot);
  add(cyl(0.022, 0.034, 0.30, 6), fur, 0, 0.15, 0, tailPivot);
  // Tip segment curving inward
  const tailTip = new THREE.Group();
  tailTip.position.set(0, 0.30, 0);
  tailTip.rotation.x = -0.90;
  tailPivot.add(tailTip);
  add(cyl(0.014, 0.020, 0.20, 5), fur, 0, 0.10, 0, tailTip);

  // Legs — four slender pivots
  const legDefs: Array<{ name: string; x: number; z: number }> = [
    { name: 'catFrontLegL', x: -0.12, z: -0.16 },
    { name: 'catFrontLegR', x:  0.12, z: -0.16 },
    { name: 'catBackLegL',  x: -0.12, z:  0.16 },
    { name: 'catBackLegR',  x:  0.12, z:  0.16 },
  ];
  const legGroups: Record<string, THREE.Group> = {};
  for (const def of legDefs) {
    const pivot = new THREE.Group();
    pivot.name = def.name;
    pivot.position.set(def.x, 0.28, def.z);
    catRoot.add(pivot);
    add(cyl(0.034, 0.026, 0.18, 6), fur, 0, -0.09, 0, pivot);
    const knee = new THREE.Group();
    knee.position.set(0, -0.18, 0);
    pivot.add(knee);
    add(cyl(0.026, 0.020, 0.16, 6), fur, 0, -0.08, 0, knee);
    // Paw — small oval
    add(box(0.08, 0.04, 0.10), fur, 0, -0.175, 0.014, knee);
    legGroups[def.name] = pivot;
  }

  return {
    catFrontLegL: legGroups['catFrontLegL'],
    catFrontLegR: legGroups['catFrontLegR'],
    catBackLegL:  legGroups['catBackLegL'],
    catBackLegR:  legGroups['catBackLegR'],
    catTailPivot: tailPivot,
  };
}

// ─── Raven companion mesh ──────────────────────────────────────────────────────

function buildRavenMesh(g: THREE.Group, cursed = false): {
  ravenWingL: THREE.Group;
  ravenWingR: THREE.Group;
} {
  const lam = (hex: number, rough = 0.60, metal = 0.0, em = 0, emI = 0): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
    if (em) { m.emissive.setHex(em); m.emissiveIntensity = emI; }
    return m;
  };

  const featherColor = cursed ? 0x0d0014 : 0x111118;
  const eyeColor     = cursed ? 0xff0000 : 0xffcc00;
  const beakColor    = cursed ? 0x550000 : 0xddaa00;

  const feather = lam(featherColor, 0.65, 0.15);
  const eyeMat  = lam(eyeColor, 0.3, 0.1, eyeColor, cursed ? 1.2 : 0.6);
  const beakMat = lam(beakColor, 0.55, 0.2);

  // Perched on the right shoulder (shoulder at y=0.79, x=0.27 in character space)
  const ravenRoot = new THREE.Group();
  ravenRoot.position.set(0.38, 0.84, -0.08);
  g.add(ravenRoot);

  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rT: number, rB: number, h: number, s = 6) => new THREE.CylinderGeometry(rT, rB, h, s);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = ravenRoot): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Body — compact oval
  add(new THREE.SphereGeometry(0.095, 8, 6), feather, 0, 0, 0);
  // Chest slightly puffed
  add(new THREE.SphereGeometry(0.080, 7, 5), feather, 0, -0.02, -0.06);

  // Head
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.11, -0.06);
  ravenRoot.add(headGrp);
  add(new THREE.SphereGeometry(0.068, 8, 6), feather, 0, 0, 0, headGrp);
  // Eyes
  add(box(0.026, 0.026, 0.018), eyeMat, -0.038, 0.012, -0.052, headGrp);
  add(box(0.026, 0.026, 0.018), eyeMat,  0.038, 0.012, -0.052, headGrp);
  // Beak (upper + lower)
  add(new THREE.ConeGeometry(0.022, 0.095, 5), beakMat, 0, -0.008, -0.115, headGrp).rotation.x = Math.PI / 2;
  add(new THREE.ConeGeometry(0.016, 0.065, 5), beakMat, 0, -0.028, -0.11,  headGrp).rotation.x = -Math.PI / 2;

  // Tail feathers — flat fan, angled back
  const tailGrp = new THREE.Group();
  tailGrp.position.set(0, -0.05, 0.09);
  tailGrp.rotation.x = 0.40;
  ravenRoot.add(tailGrp);
  add(box(0.13, 0.04, 0.14), feather, 0, 0, 0, tailGrp);

  // Feet — gripping the shoulder
  add(cyl(0.012, 0.010, 0.07, 5), lam(beakColor, 0.6), -0.03, -0.10,  0.015);
  add(cyl(0.012, 0.010, 0.07, 5), lam(beakColor, 0.6),  0.03, -0.10,  0.015);
  add(cyl(0.010, 0.008, 0.06, 5), lam(beakColor, 0.6),  0,    -0.10, -0.025);

  // Wings — pivot at top-sides of body, folded by default
  const wingDefs = [
    { name: 'ravenWingL', x: -0.09, side: -1 },
    { name: 'ravenWingR', x:  0.09, side:  1 },
  ];
  const wingGroups: Record<string, THREE.Group> = {};
  for (const def of wingDefs) {
    const pivot = new THREE.Group();
    pivot.name = def.name;
    pivot.position.set(def.x, 0.02, 0);
    ravenRoot.add(pivot);
    // Primary feather panel — folded down by default
    const panel = new THREE.Mesh(box(0.13, 0.04, 0.14), feather);
    panel.position.set(def.side * 0.065, -0.05, 0);
    panel.rotation.z = def.side * 0.22; // slight droop
    panel.castShadow = true;
    pivot.add(panel);
    // Secondary feather tip
    const tip = new THREE.Mesh(box(0.09, 0.025, 0.10), feather);
    tip.position.set(def.side * 0.065, -0.10, 0.02);
    tip.rotation.z = def.side * 0.38;
    tip.castShadow = true;
    pivot.add(tip);
    wingGroups[def.name] = pivot;
  }

  return {
    ravenWingL: wingGroups['ravenWingL'],
    ravenWingR: wingGroups['ravenWingR'],
  };
}

// ─── Coiled Serpent companion mesh ────────────────────────────────────────────

function buildSnakeMesh(g: THREE.Group, cursed = false): {
  snakeHeadPivot: THREE.Group;
} {
  const lam = (hex: number, rough = 0.70, metal = 0.0, em = 0, emI = 0): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
    if (em) { m.emissive.setHex(em); m.emissiveIntensity = emI; }
    return m;
  };

  const scaleColor  = cursed ? 0x220008 : 0x2a5c1e;
  const bellyColor  = cursed ? 0x3a0012 : 0x7ab832;
  const eyeColor    = cursed ? 0x00ff44 : 0xddcc00;
  const tongueColor = cursed ? 0xff0044 : 0xcc1133;

  const scaleMat  = lam(scaleColor, 0.55, 0.10);
  const bellyMat  = lam(bellyColor, 0.65, 0.05);
  const eyeMat    = lam(eyeColor, 0.30, 0.1, eyeColor, cursed ? 1.2 : 0.5);
  const tongueMat = lam(tongueColor, 0.60);

  const snakeRoot = new THREE.Group();
  // Right side, slightly in front — coiled on the floor
  snakeRoot.position.set(0.72, 0, 0.05);
  g.add(snakeRoot);

  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rT: number, rB: number, h: number, s = 8) => new THREE.CylinderGeometry(rT, rB, h, s);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, parent: THREE.Object3D = snakeRoot): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Coiled body — series of arced segments forming a flat coil
  const coilSegments: Array<{ x: number; z: number; ry: number; r: number }> = [
    { x:  0.00, z:  0.00, ry: 0.00,  r: 0.048 },
    { x: -0.10, z: -0.05, ry: 0.55,  r: 0.044 },
    { x: -0.16, z:  0.02, ry: 1.10,  r: 0.040 },
    { x: -0.12, z:  0.12, ry: 1.70,  r: 0.036 },
    { x:  0.00, z:  0.16, ry: 2.25,  r: 0.032 },
    { x:  0.12, z:  0.12, ry: 2.80,  r: 0.028 },
    { x:  0.16, z:  0.02, ry: 3.35,  r: 0.024 },
    { x:  0.10, z: -0.06, ry: 3.90,  r: 0.020 },
  ];
  for (const seg of coilSegments) {
    add(cyl(seg.r, seg.r * 1.08, 0.10, 7), scaleMat, seg.x, 0.05, seg.z, Math.PI / 2, seg.ry, 0);
    // Belly strip along bottom
    add(box(seg.r * 1.2, 0.06, 0.08), bellyMat, seg.x, 0.03, seg.z);
  }

  // Raised neck leading up to head
  const neckGrp = new THREE.Group();
  neckGrp.position.set(0.08, 0.05, -0.10);
  neckGrp.rotation.x = -0.60;
  snakeRoot.add(neckGrp);
  add(cyl(0.030, 0.040, 0.22, 7), scaleMat, 0, 0.11, 0, 0, 0, 0, neckGrp);

  // Head pivot — so the head can sway
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.24, 0);
  neckGrp.add(headPivot);

  // Head shape — flattened elongated box, slightly triangular
  add(box(0.072, 0.038, 0.11), scaleMat, 0,  0, 0, 0, 0, 0, headPivot);
  add(box(0.055, 0.028, 0.07), bellyMat,  0, -0.008, -0.07, 0, 0, 0, headPivot);
  // Jaw scales
  add(box(0.065, 0.018, 0.09), bellyMat, 0, -0.020, 0.00, 0, 0, 0, headPivot);
  // Eyes
  add(box(0.018, 0.018, 0.012), eyeMat, -0.028, 0.010, -0.036, 0, 0, 0, headPivot);
  add(box(0.018, 0.018, 0.012), eyeMat,  0.028, 0.010, -0.036, 0, 0, 0, headPivot);
  // Forked tongue
  add(box(0.005, 0.003, 0.030), tongueMat, -0.010, -0.018, -0.085, 0, 0,  0.18, headPivot);
  add(box(0.005, 0.003, 0.030), tongueMat,  0.010, -0.018, -0.085, 0, 0, -0.18, headPivot);

  return { snakeHeadPivot: headPivot };
}

// ─── Alligator companion mesh ──────────────────────────────────────────────────

function buildAlligatorMesh(g: THREE.Group, cursed = false): {
  alligatorTailPivot: THREE.Group;
  alligatorJawPivot:  THREE.Group;
} {
  const lam = (hex: number, rough = 0.75, metal = 0.0, em = 0, emI = 0): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
    if (em) { m.emissive.setHex(em); m.emissiveIntensity = emI; }
    return m;
  };

  const scaleColor  = cursed ? 0x0a0015 : 0x2a4a18;
  const bellyColor  = cursed ? 0x1a0028 : 0x7a9a44;
  const eyeColor    = cursed ? 0xff2200 : 0xddcc00;
  const toothColor  = cursed ? 0xddbbbb : 0xeeeecc;

  const scaleMat = lam(scaleColor, 0.70, 0.08);
  const bellyMat = lam(bellyColor, 0.75, 0.02);
  const eyeMat   = lam(eyeColor, 0.35, 0.1, eyeColor, cursed ? 1.2 : 0.55);
  const toothMat = lam(toothColor, 0.60);

  // Position: left-front, low to ground
  const alliRoot = new THREE.Group();
  alliRoot.position.set(-0.80, 0, -0.10);
  g.add(alliRoot);

  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rT: number, rB: number, h: number, s = 7) => new THREE.CylinderGeometry(rT, rB, h, s);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, parent: THREE.Object3D = alliRoot): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Main body — wide, flat, elongated
  add(box(0.42, 0.14, 0.65), scaleMat, 0, 0.08, 0);
  // Belly — lighter underside
  add(box(0.34, 0.06, 0.58), bellyMat, 0, 0.04, 0.02);
  // Armored back ridge bumps
  for (let i = 0; i < 5; i++) {
    add(new THREE.ConeGeometry(0.028, 0.055, 4), scaleMat, 0, 0.17, -0.22 + i * 0.11);
  }

  // Upper jaw (part of head group)
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.09, -0.38);
  alliRoot.add(headGrp);
  // Head box
  add(box(0.38, 0.12, 0.24), scaleMat, 0, 0, 0, 0, 0, 0, headGrp);
  // Snout — long flat protrusion
  add(box(0.30, 0.08, 0.28), scaleMat, 0, -0.01, -0.26, 0, 0, 0, headGrp);
  // Nostrils
  add(box(0.04, 0.04, 0.04), scaleMat, -0.08, 0.03, -0.36, 0, 0, 0, headGrp);
  add(box(0.04, 0.04, 0.04), scaleMat,  0.08, 0.03, -0.36, 0, 0, 0, headGrp);
  // Eyes — raised on top of head
  add(box(0.05, 0.05, 0.04), eyeMat, -0.14, 0.08, -0.04, 0, 0, 0, headGrp);
  add(box(0.05, 0.05, 0.04), eyeMat,  0.14, 0.08, -0.04, 0, 0, 0, headGrp);
  // Upper teeth row
  for (let i = 0; i < 4; i++) {
    add(new THREE.ConeGeometry(0.018, 0.045, 4), toothMat, -0.09 + i * 0.06, -0.04, -0.15, Math.PI, 0, 0, headGrp);
  }

  // Lower jaw pivot — snaps open/shut
  const jawPivot = new THREE.Group();
  jawPivot.name = 'alligatorJawPivot';
  jawPivot.position.set(0, -0.04, -0.22);
  headGrp.add(jawPivot);
  add(box(0.28, 0.055, 0.28), bellyMat, 0, -0.025, -0.08, 0, 0, 0, jawPivot);
  // Lower teeth
  for (let i = 0; i < 4; i++) {
    add(new THREE.ConeGeometry(0.016, 0.040, 4), toothMat, -0.09 + i * 0.06, 0.02, -0.12, 0, 0, 0, jawPivot);
  }

  // Tail — long, tapered, sweeps side-to-side
  const tailPivot = new THREE.Group();
  tailPivot.name = 'alligatorTailPivot';
  tailPivot.position.set(0, 0.08, 0.36);
  alliRoot.add(tailPivot);
  add(cyl(0.038, 0.072, 0.36, 7), scaleMat, 0, 0.18, 0, 0, 0, 0, tailPivot);
  // Tail tip segment
  const tailTip = new THREE.Group();
  tailTip.position.set(0, 0.36, 0);
  tailPivot.add(tailTip);
  add(cyl(0.014, 0.036, 0.28, 6), scaleMat, 0, 0.14, 0, 0, 0, 0, tailTip);

  // Four short stubby legs
  const legDefs = [
    { x: -0.22, z: -0.18, rx:  0.15, rz:  0.55 },
    { x:  0.22, z: -0.18, rx:  0.15, rz: -0.55 },
    { x: -0.22, z:  0.18, rx: -0.10, rz:  0.55 },
    { x:  0.22, z:  0.18, rx: -0.10, rz: -0.55 },
  ];
  for (const def of legDefs) {
    const legGrp = new THREE.Group();
    legGrp.position.set(def.x, 0.07, def.z);
    legGrp.rotation.set(def.rx, 0, def.rz);
    alliRoot.add(legGrp);
    add(cyl(0.040, 0.048, 0.18, 6), scaleMat, 0, -0.05, 0, 0, 0, 0, legGrp);
    // Foot
    add(box(0.14, 0.05, 0.10), scaleMat, def.rz > 0 ? -0.04 : 0.04, -0.14, 0.02, 0, 0, 0, legGrp);
  }

  return { alligatorTailPivot: tailPivot, alligatorJawPivot: jawPivot };
}

// ─── Monkey companion mesh ─────────────────────────────────────────────────────

function buildMonkeyMesh(g: THREE.Group, cursed = false): {
  monkeyTailPivot: THREE.Group;
  monkeyArmL:      THREE.Group;
  monkeyArmR:      THREE.Group;
} {
  const lam = (hex: number, rough = 0.82, metal = 0.0, em = 0, emI = 0): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal });
    if (em) { m.emissive.setHex(em); m.emissiveIntensity = emI; }
    return m;
  };

  const furColor   = cursed ? 0x0c000c : 0x7a4a1a;
  const faceColor  = cursed ? 0x1a0010 : 0xcc9966;
  const eyeColor   = cursed ? 0xff0000 : 0x221100;
  const noseColor  = cursed ? 0x330011 : 0x553322;

  const fur    = lam(furColor);
  const faceMat = lam(faceColor);
  const eyeMat  = lam(eyeColor, 0.35, 0.0, eyeColor, cursed ? 1.0 : 0.0);
  const noseMat = lam(noseColor, 0.65);

  // Perched on left shoulder (x=-0.38, y=0.84)
  const monkeyRoot = new THREE.Group();
  monkeyRoot.position.set(-0.42, 0.82, -0.05);
  g.add(monkeyRoot);

  const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rT: number, rB: number, h: number, s = 7) => new THREE.CylinderGeometry(rT, rB, h, s);
  const sph = (r: number, ws = 8, hs = 6) => new THREE.SphereGeometry(r, ws, hs);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = monkeyRoot): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Body — compact, slightly hunched
  add(sph(0.088, 8, 6), fur, 0, 0, 0);
  // Chest/belly slightly lighter
  add(sph(0.072, 7, 5), faceMat, 0, -0.02, -0.05);

  // Head — large round skull, slightly forward
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.13, -0.04);
  monkeyRoot.add(headGrp);
  add(sph(0.082, 9, 7), fur, 0, 0, 0, headGrp);
  // Face disc
  add(sph(0.062, 8, 6), faceMat, 0, -0.01, -0.055, headGrp);
  // Eyes — wide-set, expressive
  add(box(0.028, 0.028, 0.018), eyeMat, -0.040, 0.014, -0.068, headGrp);
  add(box(0.028, 0.028, 0.018), eyeMat,  0.040, 0.014, -0.068, headGrp);
  // Nose — flat, rounded
  add(box(0.030, 0.022, 0.020), noseMat, 0, -0.010, -0.076, headGrp);
  // Cheek pouches
  add(sph(0.028, 6, 5), faceMat, -0.068, -0.018, -0.040, headGrp);
  add(sph(0.028, 6, 5), faceMat,  0.068, -0.018, -0.040, headGrp);
  // Ears — round
  add(sph(0.030, 6, 5), fur, -0.088, 0.022, 0, headGrp);
  add(sph(0.030, 6, 5), fur,  0.088, 0.022, 0, headGrp);
  add(sph(0.022, 5, 4), faceMat, -0.088, 0.022, -0.010, headGrp);
  add(sph(0.022, 5, 4), faceMat,  0.088, 0.022, -0.010, headGrp);

  // Arms — pivot at shoulders, long and slightly dangling
  const armDefs = [
    { name: 'monkeyArmL', x: -0.09, side: -1 },
    { name: 'monkeyArmR', x:  0.09, side:  1 },
  ];
  const armGroups: Record<string, THREE.Group> = {};
  for (const def of armDefs) {
    const pivot = new THREE.Group();
    pivot.name = def.name;
    pivot.position.set(def.x, 0.04, 0);
    monkeyRoot.add(pivot);
    add(cyl(0.022, 0.028, 0.14, 6), fur, 0, -0.07, 0, pivot);
    // Forearm
    const forearm = new THREE.Group();
    forearm.position.set(0, -0.14, 0);
    pivot.add(forearm);
    add(cyl(0.018, 0.022, 0.12, 6), fur, 0, -0.06, 0, forearm);
    // Hand
    add(sph(0.026, 6, 5), faceMat, 0, -0.135, 0, forearm);
    armGroups[def.name] = pivot;
  }

  // Feet / sitting perch
  add(box(0.05, 0.04, 0.08), fur, -0.05, -0.10,  0.02);
  add(box(0.05, 0.04, 0.08), fur,  0.05, -0.10,  0.02);

  // Long prehensile tail — curves up and over
  const tailPivot = new THREE.Group();
  tailPivot.name = 'monkeyTailPivot';
  tailPivot.position.set(0, -0.05, 0.09);
  tailPivot.rotation.x = -0.80;
  monkeyRoot.add(tailPivot);
  add(cyl(0.020, 0.030, 0.26, 6), fur, 0, 0.13, 0, tailPivot);
  const tailMid = new THREE.Group();
  tailMid.position.set(0, 0.26, 0);
  tailMid.rotation.x = -1.10;
  tailPivot.add(tailMid);
  add(cyl(0.014, 0.020, 0.22, 5), fur, 0, 0.11, 0, tailMid);
  const tailTip = new THREE.Group();
  tailTip.position.set(0, 0.22, 0);
  tailTip.rotation.x = -1.20;
  tailMid.add(tailTip);
  add(cyl(0.010, 0.014, 0.14, 5), fur, 0, 0.07, 0, tailTip);

  return {
    monkeyTailPivot: tailPivot,
    monkeyArmL:      armGroups['monkeyArmL'],
    monkeyArmR:      armGroups['monkeyArmR'],
  };
}
