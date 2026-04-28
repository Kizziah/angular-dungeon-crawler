import * as THREE from 'three';
import { ItemType, ItemStats } from '../models/item.model';
import { wmesh, lam, bladeMat } from '../../features/dungeon/mesh-utils';

export interface ItemDef {
  id: string;
  name: string;
  unidentifiedName: string;
  type: ItemType;
  stats: ItemStats;
  cursed: boolean;
  value: number;
  usable: boolean;
  effect?: string;
  floorMin: number;
  floorMax: number;
  /** Optional Three.js mesh factory. Receives the item's cursed state. */
  makeMesh?: (cursed?: boolean) => THREE.Group;
}

// ─── Reusable geometry builders ───────────────────────────────────────────────

function makeSwordMesh(opts: {
  cursed?: boolean; enchanted?: boolean; fire?: boolean; ice?: boolean; holy?: boolean;
  bladeLen?: number; guardWidth?: number; handleLen?: number; bladeWidth?: number;
}): THREE.Group {
  const { cursed = false, enchanted = false, fire = false, ice = false, holy = false,
          bladeLen = 0.28, guardWidth = 0.16, handleLen = 0.14, bladeWidth = 0.04 } = opts;
  const handleMat = lam(cursed ? 0x110011 : 0x5a3a1a, 0.85, 0.0);
  const guardMat  = lam(cursed ? 0x220022 : 0xccaa44, 0.30, 0.75);
  const bMat      = bladeMat({ cursed, enchanted, fire, ice, holy });
  const g = new THREE.Group();
  g.add(wmesh(new THREE.BoxGeometry(0.04, handleLen, 0.04),              handleMat, 0, -handleLen / 2,      0));
  g.add(wmesh(new THREE.BoxGeometry(0.06, 0.04, 0.06),                   guardMat,  0, -handleLen - 0.02,   0));
  g.add(wmesh(new THREE.BoxGeometry(guardWidth, 0.03, 0.03),             guardMat,  0,  0.01,               0));
  g.add(wmesh(new THREE.BoxGeometry(bladeWidth, bladeLen, 0.015),        bMat,      0,  bladeLen / 2 + 0.03, 0));
  return g;
}

function makeDaggerMesh(opts: { cursed?: boolean; enchanted?: boolean }): THREE.Group {
  const { cursed = false, enchanted = false } = opts;
  const handleMat = lam(cursed ? 0x110011 : 0x5a3a1a, 0.85, 0.0);
  const guardMat  = lam(cursed ? 0x220022 : 0xccaa44, 0.30, 0.75);
  const bMat      = bladeMat({ cursed, enchanted });
  const g = new THREE.Group();
  g.add(wmesh(new THREE.BoxGeometry(0.03, 0.10, 0.03),  handleMat, 0, -0.05, 0));
  g.add(wmesh(new THREE.BoxGeometry(0.09, 0.02, 0.02),  guardMat,  0,  0,    0));
  g.add(wmesh(new THREE.BoxGeometry(0.025, 0.14, 0.012), bladeMat({ cursed, enchanted }), 0, 0.08, 0));
  return g;
}

function makeMaceMesh(opts: { cursed?: boolean; enchanted?: boolean; hammer?: boolean }): THREE.Group {
  const { cursed = false, enchanted = false, hammer = false } = opts;
  const handleMat = lam(cursed ? 0x110011 : 0x5a3a1a, 0.85, 0.0);
  const bMat      = bladeMat({ cursed, enchanted });
  const g = new THREE.Group();
  g.add(wmesh(new THREE.BoxGeometry(0.04, 0.28, 0.04), handleMat, 0, 0.02, 0));
  if (hammer) {
    g.add(wmesh(new THREE.BoxGeometry(0.16, 0.08, 0.06), bMat, 0, 0.20, 0));
  } else {
    g.add(wmesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), bMat, 0, 0.22, 0));
    for (let i = 0; i < 4; i++) {
      const f = wmesh(new THREE.BoxGeometry(0.03, 0.10, 0.17), lam(0x889999, 0.35, 0.70), 0, 0.22, 0);
      f.rotation.y = (i * Math.PI) / 2;
      g.add(f);
    }
  }
  return g;
}

function makeStaffMesh(opts: { cursed?: boolean; enchanted?: boolean }): THREE.Group {
  const { enchanted = false } = opts;
  const woodMat   = lam(0xc28b4a, 0.70);
  const metalMat  = lam(0x888888, 0.30, 0.80);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: enchanted ? 0x66ccff : 0xaaaaaa,
    emissive: new THREE.Color(enchanted ? 0x3399ff : 0x333333),
    emissiveIntensity: enchanted ? 0.8 : 0.1,
    roughness: 0.2
  });
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 1.5, 10), woodMat);
  shaft.position.y = 0.5;
  g.add(shaft);
  const bottomCap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), metalMat);
  bottomCap.position.y = -0.1;
  g.add(bottomCap);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), metalMat);
  head.position.y = 1.2;
  g.add(head);
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), crystalMat);
  crystal.position.y = 1.2;
  g.add(crystal);
  const bandGeo = new THREE.TorusGeometry(0.1, 0.02, 8, 16);
  [1.0, 0.2].forEach(y => {
    const band = new THREE.Mesh(bandGeo, metalMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    g.add(band);
  });
  return g;
}

function makeBowMesh(opts: { cursed?: boolean }): THREE.Group {
  const woodMat = lam(0x5a3010, 0.85, 0.0);
  const g = new THREE.Group();
  g.add(wmesh(new THREE.BoxGeometry(0.04, 0.14, 0.04), woodMat, 0, 0, 0));
  const upper = wmesh(new THREE.BoxGeometry(0.03, 0.17, 0.03), woodMat, -0.04, 0.16, 0);
  upper.rotation.z = -0.28;
  g.add(upper);
  const lower = wmesh(new THREE.BoxGeometry(0.03, 0.17, 0.03), woodMat, -0.04, -0.16, 0);
  lower.rotation.z = 0.28;
  g.add(lower);
  g.add(wmesh(new THREE.BoxGeometry(0.005, 0.48, 0.005), lam(0xeeeecc, 0.70, 0.1), -0.075, 0, 0));
  return g;
}

function makeSpearMesh(opts: { cursed?: boolean }): THREE.Group {
  const woodMat = lam(0x5a3010, 0.85, 0.0);
  const bMat    = bladeMat({ cursed: opts.cursed });
  const g = new THREE.Group();
  g.add(wmesh(new THREE.BoxGeometry(0.04,  0.50, 0.04),  woodMat, 0, 0.19, 0));
  g.add(wmesh(new THREE.BoxGeometry(0.035, 0.15, 0.015), bMat,    0, 0.50, 0));
  return g;
}

function makeAxeMesh(opts: { cursed?: boolean; enchanted?: boolean }): THREE.Group {
  const woodMat = lam(opts.cursed ? 0x110011 : 0x5a3010, 0.85, 0.0);
  const bMat    = bladeMat({ cursed: opts.cursed, enchanted: opts.enchanted });
  const g = new THREE.Group();
  g.add(wmesh(new THREE.BoxGeometry(0.04, 0.34, 0.04), woodMat,  0,     0.07, 0));
  g.add(wmesh(new THREE.BoxGeometry(0.19, 0.14, 0.04), bMat,    -0.05,  0.27, 0));
  g.add(wmesh(new THREE.BoxGeometry(0.06, 0.06, 0.03), bMat,     0.07,  0.25, 0));
  return g;
}

function makeShieldGroup(opts: {
  cursed?: boolean; enchanted?: boolean;
  w: number; h: number;
}): THREE.Group {
  const { cursed = false, enchanted = false, w, h } = opts;
  const bodyCol = cursed ? 0x220022 : enchanted ? 0x8899bb : 0x6677aa;
  const emitCol = cursed ? 0x440044 : enchanted  ? 0x2233ff : 0;
  const emitI   = cursed ? 0.3      : enchanted  ? 0.2      : 0;
  const rimMat  = lam(0xaaaaaa, 0.20, 0.80);
  const g = new THREE.Group();
  g.add(wmesh(new THREE.BoxGeometry(w, h, 0.04),       lam(bodyCol, 0.25, 0.75, emitCol, emitI), 0, 0, 0));
  g.add(wmesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), lam(cursed ? 0x440044 : 0xccaa44, 0.30, 0.70), 0, 0, 0.04));
  g.add(wmesh(new THREE.BoxGeometry(w + 0.03, 0.03, 0.02), rimMat,  0,       h / 2, 0.01));
  g.add(wmesh(new THREE.BoxGeometry(w + 0.03, 0.03, 0.02), rimMat,  0,      -h / 2, 0.01));
  g.add(wmesh(new THREE.BoxGeometry(0.03, h + 0.03, 0.02), rimMat,  w / 2,  0,      0.01));
  g.add(wmesh(new THREE.BoxGeometry(0.03, h + 0.03, 0.02), rimMat, -w / 2,  0,      0.01));
  return g;
}

// ─── Item definitions ─────────────────────────────────────────────────────────

export const ITEMS: ItemDef[] = [
  // === WEAPONS ===
  {
    id: 'dagger', name: 'Dagger', unidentifiedName: 'Small Blade', type: 'Weapon',
    stats: { attack: 0, damage: '1d4' }, cursed: false, value: 20, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeDaggerMesh({ cursed }),
  },
  {
    id: 'short-sword', name: 'Short Sword', unidentifiedName: 'Short Blade', type: 'Weapon',
    stats: { attack: 0, damage: '1d6' }, cursed: false, value: 50, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeSwordMesh({ cursed, bladeLen: 0.20, guardWidth: 0.14 }),
  },
  {
    id: 'longsword', name: 'Longsword', unidentifiedName: 'Long Blade', type: 'Weapon',
    stats: { attack: 0, damage: '1d8' }, cursed: false, value: 100, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeSwordMesh({ cursed }),
  },
  {
    id: 'bastard-sword', name: 'Bastard Sword', unidentifiedName: 'Heavy Blade', type: 'Weapon',
    stats: { attack: 0, damage: '1d10' }, cursed: false, value: 200, usable: false, floorMin: 3, floorMax: 99,
    makeMesh: (cursed) => makeSwordMesh({ cursed, bladeLen: 0.38, guardWidth: 0.24, bladeWidth: 0.06 }),
  },
  {
    id: 'greatsword', name: 'Greatsword', unidentifiedName: 'Huge Blade', type: 'Weapon',
    stats: { attack: 1, damage: '2d6' }, cursed: false, value: 350, usable: false, floorMin: 5, floorMax: 99,
    makeMesh: (cursed) => makeSwordMesh({ cursed, bladeLen: 1.28, guardWidth: 0.24, handleLen: 0.28, bladeWidth: 0.06 }),
  },
  {
    id: 'battle-axe', name: 'Battle Axe', unidentifiedName: 'Heavy Axe', type: 'Weapon',
    stats: { attack: 0, damage: '1d8' }, cursed: false, value: 90, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeAxeMesh({ cursed }),
  },
  {
    id: 'war-hammer', name: 'War Hammer', unidentifiedName: 'Heavy Hammer', type: 'Weapon',
    stats: { attack: 0, damage: '1d8' }, cursed: false, value: 100, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeMaceMesh({ cursed, hammer: true }),
  },
  {
    id: 'spear', name: 'Spear', unidentifiedName: 'Long Pole', type: 'Weapon',
    stats: { attack: 0, damage: '1d6' }, cursed: false, value: 40, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeSpearMesh({ cursed }),
  },
  {
    id: 'mace', name: 'Mace', unidentifiedName: 'Blunt Club', type: 'Weapon',
    stats: { attack: 0, damage: '1d6' }, cursed: false, value: 60, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeMaceMesh({ cursed }),
  },
  {
    id: 'staff', name: 'Staff', unidentifiedName: 'Wooden Staff', type: 'Weapon',
    stats: { attack: 0, damage: '1d6' }, cursed: false, value: 30, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeStaffMesh({ cursed }),
  },
  {
    id: 'short-bow', name: 'Short Bow', unidentifiedName: 'Small Bow', type: 'Weapon',
    stats: { attack: 0, damage: '1d6' }, cursed: false, value: 80, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeBowMesh({ cursed }),
  },
  {
    id: 'long-bow', name: 'Long Bow', unidentifiedName: 'Large Bow', type: 'Weapon',
    stats: { attack: 1, damage: '1d8' }, cursed: false, value: 150, usable: false, floorMin: 2, floorMax: 99,
    makeMesh: (cursed) => makeBowMesh({ cursed }),
  },
  // Magical weapons
  {
    id: 'longsword-p1', name: 'Longsword +1', unidentifiedName: 'Glowing Blade', type: 'Weapon',
    stats: { attack: 1, damage: '1d8' }, cursed: false, value: 500, usable: false, floorMin: 5, floorMax: 99,
    makeMesh: () => makeSwordMesh({ enchanted: true }),
  },
  {
    id: 'longsword-p2', name: 'Longsword +2', unidentifiedName: 'Bright Blade', type: 'Weapon',
    stats: { attack: 2, damage: '1d8' }, cursed: false, value: 1000, usable: false, floorMin: 12, floorMax: 99,
    makeMesh: () => makeSwordMesh({ enchanted: true }),
  },
  {
    id: 'longsword-p3', name: 'Longsword +3', unidentifiedName: 'Blazing Blade', type: 'Weapon',
    stats: { attack: 3, damage: '1d8' }, cursed: false, value: 2500, usable: false, floorMin: 22, floorMax: 99,
    makeMesh: () => makeSwordMesh({ enchanted: true }),
  },
  {
    id: 'dagger-p1', name: 'Dagger +1', unidentifiedName: 'Sharp Blade', type: 'Weapon',
    stats: { attack: 1, damage: '1d4' }, cursed: false, value: 300, usable: false, floorMin: 4, floorMax: 99,
    makeMesh: () => makeDaggerMesh({ enchanted: true }),
  },
  {
    id: 'dagger-p2', name: 'Dagger +2', unidentifiedName: 'Very Sharp Blade', type: 'Weapon',
    stats: { attack: 2, damage: '1d4' }, cursed: false, value: 700, usable: false, floorMin: 10, floorMax: 99,
    makeMesh: () => makeDaggerMesh({ enchanted: true }),
  },
  {
    id: 'mace-p1', name: 'Mace +1', unidentifiedName: 'Resonant Club', type: 'Weapon',
    stats: { attack: 1, damage: '1d6' }, cursed: false, value: 400, usable: false, floorMin: 5, floorMax: 99,
    makeMesh: () => makeMaceMesh({ enchanted: true }),
  },
  {
    id: 'mace-p2', name: 'Mace +2', unidentifiedName: 'Humming Club', type: 'Weapon',
    stats: { attack: 2, damage: '1d6' }, cursed: false, value: 900, usable: false, floorMin: 14, floorMax: 99,
    makeMesh: () => makeMaceMesh({ enchanted: true }),
  },
  {
    id: 'sword-of-fire', name: 'Sword of Fire', unidentifiedName: 'Flaming Blade', type: 'Weapon',
    stats: { attack: 2, damage: '1d8' }, cursed: false, value: 3000, usable: false, floorMin: 20, floorMax: 99,
    makeMesh: () => makeSwordMesh({ fire: true }),
  },
  {
    id: 'blade-of-ice', name: 'Blade of Ice', unidentifiedName: 'Frost Blade', type: 'Weapon',
    stats: { attack: 2, damage: '1d8' }, cursed: false, value: 3000, usable: false, floorMin: 20, floorMax: 99,
    makeMesh: () => makeSwordMesh({ ice: true }),
  },
  {
    id: 'holy-avenger', name: 'Holy Avenger', unidentifiedName: 'Radiant Sword', type: 'Weapon',
    stats: { attack: 4, damage: '2d8' }, cursed: false, value: 8000, usable: false, floorMin: 40, floorMax: 99,
    makeMesh: () => makeSwordMesh({ holy: true, bladeLen: 0.34, guardWidth: 0.20 }),
  },
  {
    id: 'cursed-sword', name: 'Cursed Blade -2', unidentifiedName: 'Gleaming Sword', type: 'Weapon',
    stats: { attack: -2, damage: '1d8' }, cursed: true, value: 0, usable: false, floorMin: 5, floorMax: 99,
    makeMesh: () => makeSwordMesh({ cursed: true }),
  },
  // === SHIELDS ===
  {
    id: 'small-shield', name: 'Small Shield', unidentifiedName: 'Small Shield', type: 'Shield',
    stats: { defense: 1 }, cursed: false, value: 50, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeShieldGroup({ cursed, w: 0.16, h: 0.20 }),
  },
  {
    id: 'large-shield', name: 'Large Shield', unidentifiedName: 'Large Shield', type: 'Shield',
    stats: { defense: 2 }, cursed: false, value: 120, usable: false, floorMin: 1, floorMax: 99,
    makeMesh: (cursed) => makeShieldGroup({ cursed, w: 0.50, h: 1.57 }),
  },
  {
    id: 'tower-shield', name: 'Tower Shield', unidentifiedName: 'Huge Shield', type: 'Shield',
    stats: { defense: 3 }, cursed: false, value: 250, usable: false, floorMin: 3, floorMax: 99,
    makeMesh: (cursed) => makeShieldGroup({ cursed, w: 0.22, h: 0.36 }),
  },
  {
    id: 'shield-p1', name: 'Shield +1', unidentifiedName: 'Polished Shield', type: 'Shield',
    stats: { defense: 3 }, cursed: false, value: 600, usable: false, floorMin: 8, floorMax: 99,
    makeMesh: (cursed) => makeShieldGroup({ cursed, enchanted: true, w: 0.16, h: 0.20 }),
  },
  {
    id: 'shield-p2', name: 'Shield +2', unidentifiedName: 'Gleaming Shield', type: 'Shield',
    stats: { defense: 4 }, cursed: false, value: 1500, usable: false, floorMin: 18, floorMax: 99,
    makeMesh: (cursed) => makeShieldGroup({ cursed, enchanted: true, w: 0.18, h: 0.24 }),
  },
  // === BODY ARMOR ===
  { id: 'leather-armor', name: 'Leather Armor', unidentifiedName: 'Soft Armor', type: 'BodyArmor', stats: { defense: 2 }, cursed: false, value: 80, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'chain-mail', name: 'Chain Mail', unidentifiedName: 'Linked Armor', type: 'BodyArmor', stats: { defense: 4 }, cursed: false, value: 250, usable: false, floorMin: 2, floorMax: 99 },
  { id: 'plate-mail', name: 'Plate Mail', unidentifiedName: 'Heavy Armor', type: 'BodyArmor', stats: { defense: 6 }, cursed: false, value: 600, usable: false, floorMin: 5, floorMax: 99 },
  { id: 'full-plate', name: 'Full Plate', unidentifiedName: 'Imposing Armor', type: 'BodyArmor', stats: { defense: 8 }, cursed: false, value: 1500, usable: false, floorMin: 10, floorMax: 99 },
  { id: 'leather-p1', name: 'Leather Armor +1', unidentifiedName: 'Treated Leather', type: 'BodyArmor', stats: { defense: 3 }, cursed: false, value: 400, usable: false, floorMin: 5, floorMax: 99 },
  { id: 'chain-p1', name: 'Chain Mail +1', unidentifiedName: 'Fine Linked Armor', type: 'BodyArmor', stats: { defense: 5 }, cursed: false, value: 800, usable: false, floorMin: 8, floorMax: 99 },
  { id: 'chain-p2', name: 'Chain Mail +2', unidentifiedName: 'Masterwork Linked', type: 'BodyArmor', stats: { defense: 6 }, cursed: false, value: 1600, usable: false, floorMin: 15, floorMax: 99 },
  { id: 'plate-p1', name: 'Plate Mail +1', unidentifiedName: 'Reinforced Plate', type: 'BodyArmor', stats: { defense: 7 }, cursed: false, value: 1800, usable: false, floorMin: 18, floorMax: 99 },
  { id: 'plate-p2', name: 'Plate Mail +2', unidentifiedName: 'Superior Plate', type: 'BodyArmor', stats: { defense: 8 }, cursed: false, value: 3500, usable: false, floorMin: 28, floorMax: 99 },
  { id: 'plate-p3', name: 'Plate Mail +3', unidentifiedName: 'Exquisite Plate', type: 'BodyArmor', stats: { defense: 9 }, cursed: false, value: 7000, usable: false, floorMin: 38, floorMax: 99 },
  { id: 'cursed-armor', name: 'Cursed Plate -2', unidentifiedName: 'Glittering Armor', type: 'BodyArmor', stats: { defense: 4 }, cursed: true, value: 0, usable: false, floorMin: 5, floorMax: 99 },
  // === HELMETS ===
  { id: 'leather-cap', name: 'Leather Cap', unidentifiedName: 'Soft Hat', type: 'Helmet', stats: { defense: 1 }, cursed: false, value: 30, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'iron-helm', name: 'Iron Helm', unidentifiedName: 'Metal Hat', type: 'Helmet', stats: { defense: 2 }, cursed: false, value: 100, usable: false, floorMin: 2, floorMax: 99 },
  { id: 'great-helm', name: 'Great Helm', unidentifiedName: 'Full Metal Hat', type: 'Helmet', stats: { defense: 3 }, cursed: false, value: 250, usable: false, floorMin: 5, floorMax: 99 },
  { id: 'helm-of-int', name: 'Helm of Intelligence', unidentifiedName: 'Studded Helm', type: 'Helmet', stats: { defense: 1, intBonus: 3 }, cursed: false, value: 1200, usable: false, floorMin: 12, floorMax: 99 },
  { id: 'helm-p1', name: 'Great Helm +1', unidentifiedName: 'Polished Helm', type: 'Helmet', stats: { defense: 4 }, cursed: false, value: 700, usable: false, floorMin: 10, floorMax: 99 },
  // === GLOVES ===
  { id: 'work-gloves', name: 'Work Gloves', unidentifiedName: 'Cloth Gloves', type: 'Gloves', stats: { defense: 0 }, cursed: false, value: 10, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'iron-gauntlets', name: 'Iron Gauntlets', unidentifiedName: 'Metal Gloves', type: 'Gloves', stats: { defense: 1 }, cursed: false, value: 120, usable: false, floorMin: 3, floorMax: 99 },
  { id: 'gloves-agility', name: 'Gloves of Agility', unidentifiedName: 'Supple Gloves', type: 'Gloves', stats: { defense: 0, agiBonus: 3 }, cursed: false, value: 900, usable: false, floorMin: 10, floorMax: 99 },
  { id: 'gloves-strength', name: 'Gloves of Strength', unidentifiedName: 'Heavy Gloves', type: 'Gloves', stats: { defense: 0, strBonus: 3 }, cursed: false, value: 1100, usable: false, floorMin: 12, floorMax: 99 },
  // === BOOTS ===
  { id: 'leather-boots', name: 'Leather Boots', unidentifiedName: 'Soft Boots', type: 'Boots', stats: { defense: 0 }, cursed: false, value: 20, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'iron-boots', name: 'Iron Boots', unidentifiedName: 'Heavy Boots', type: 'Boots', stats: { defense: 1 }, cursed: false, value: 100, usable: false, floorMin: 3, floorMax: 99 },
  { id: 'boots-of-speed', name: 'Boots of Speed', unidentifiedName: 'Light Boots', type: 'Boots', stats: { defense: 0, agiBonus: 2 }, cursed: false, value: 800, usable: false, floorMin: 8, floorMax: 99 },
  { id: 'boots-of-stealth', name: 'Boots of Stealth', unidentifiedName: 'Silent Boots', type: 'Boots', stats: { defense: 0, agiBonus: 1 }, cursed: false, value: 600, usable: false, floorMin: 6, floorMax: 99 },
  // === RINGS ===
  { id: 'ring-protection', name: 'Ring of Protection', unidentifiedName: 'Plain Ring', type: 'Ring', stats: { defense: 1 }, cursed: false, value: 500, usable: false, floorMin: 5, floorMax: 99 },
  { id: 'ring-strength', name: 'Ring of Strength', unidentifiedName: 'Heavy Ring', type: 'Ring', stats: { strBonus: 2 }, cursed: false, value: 700, usable: false, floorMin: 8, floorMax: 99 },
  { id: 'ring-intelligence', name: 'Ring of Intelligence', unidentifiedName: 'Glowing Ring', type: 'Ring', stats: { intBonus: 2 }, cursed: false, value: 700, usable: false, floorMin: 8, floorMax: 99 },
  { id: 'ring-luck', name: 'Ring of Luck', unidentifiedName: 'Shiny Ring', type: 'Ring', stats: { luckBonus: 3 }, cursed: false, value: 600, usable: false, floorMin: 6, floorMax: 99 },
  { id: 'cursed-ring', name: 'Ring of Misfortune', unidentifiedName: 'Black Ring', type: 'Ring', stats: { luckBonus: -5 }, cursed: true, value: 0, usable: false, floorMin: 4, floorMax: 99 },
  // === AMULETS ===
  { id: 'amulet-protection', name: 'Amulet of Protection', unidentifiedName: 'Silver Amulet', type: 'Amulet', stats: { defense: 2 }, cursed: false, value: 800, usable: false, floorMin: 8, floorMax: 99 },
  { id: 'amulet-vitality', name: 'Amulet of Vitality', unidentifiedName: 'Ruby Amulet', type: 'Amulet', stats: { vitBonus: 3, hpBonus: 10 }, cursed: false, value: 1200, usable: false, floorMin: 12, floorMax: 99 },
  { id: 'amulet-piety', name: 'Amulet of Piety', unidentifiedName: 'Golden Amulet', type: 'Amulet', stats: { pietyBonus: 3 }, cursed: false, value: 900, usable: false, floorMin: 10, floorMax: 99 },
  // === POTIONS ===
  { id: 'potion-heal-small', name: 'Potion of Healing', unidentifiedName: 'Red Potion', type: 'Potion', stats: {}, cursed: false, value: 50, usable: true, effect: 'heal-small', floorMin: 1, floorMax: 99 },
  { id: 'potion-heal-medium', name: 'Potion of Greater Healing', unidentifiedName: 'Bright Red Potion', type: 'Potion', stats: {}, cursed: false, value: 120, usable: true, effect: 'heal-medium', floorMin: 4, floorMax: 99 },
  { id: 'potion-heal-large', name: 'Potion of Full Healing', unidentifiedName: 'Crimson Potion', type: 'Potion', stats: {}, cursed: false, value: 300, usable: true, effect: 'heal-large', floorMin: 10, floorMax: 99 },
  { id: 'potion-mana', name: 'Mana Potion', unidentifiedName: 'Blue Potion', type: 'Potion', stats: {}, cursed: false, value: 80, usable: true, effect: 'restore-mp', floorMin: 2, floorMax: 99 },
  { id: 'potion-antidote', name: 'Antidote', unidentifiedName: 'Green Potion', type: 'Potion', stats: {}, cursed: false, value: 60, usable: true, effect: 'cure-poison', floorMin: 1, floorMax: 99 },
  { id: 'potion-strength', name: 'Potion of Strength', unidentifiedName: 'Orange Potion', type: 'Potion', stats: {}, cursed: false, value: 200, usable: true, effect: 'boost-str', floorMin: 5, floorMax: 99 },
  { id: 'potion-invisibility', name: 'Potion of Invisibility', unidentifiedName: 'Clear Potion', type: 'Potion', stats: {}, cursed: false, value: 150, usable: true, effect: 'invisibility', floorMin: 5, floorMax: 99 },
  { id: 'potion-speed', name: 'Potion of Speed', unidentifiedName: 'Yellow Potion', type: 'Potion', stats: {}, cursed: false, value: 180, usable: true, effect: 'speed', floorMin: 6, floorMax: 99 },
  { id: 'potion-poison', name: 'Poison Potion', unidentifiedName: 'Dark Potion', type: 'Potion', stats: {}, cursed: true, value: 0, usable: true, effect: 'poison-self', floorMin: 3, floorMax: 99 },
  // === SCROLLS ===
  { id: 'scroll-identify', name: 'Scroll of Identify', unidentifiedName: 'Old Scroll', type: 'Scroll', stats: {}, cursed: false, value: 100, usable: true, effect: 'identify', floorMin: 1, floorMax: 99 },
  { id: 'scroll-town-portal', name: 'Scroll of Town Portal', unidentifiedName: 'Rune Scroll', type: 'Scroll', stats: {}, cursed: false, value: 200, usable: true, effect: 'town-portal', floorMin: 3, floorMax: 99 },
  { id: 'scroll-fireball', name: 'Scroll of Fireball', unidentifiedName: 'Singed Scroll', type: 'Scroll', stats: {}, cursed: false, value: 150, usable: true, effect: 'fireball', floorMin: 4, floorMax: 99 },
  { id: 'scroll-protection', name: 'Scroll of Protection', unidentifiedName: 'Silver Scroll', type: 'Scroll', stats: {}, cursed: false, value: 130, usable: true, effect: 'protection', floorMin: 4, floorMax: 99 },
  { id: 'scroll-map', name: 'Scroll of Mapping', unidentifiedName: 'Crisp Scroll', type: 'Scroll', stats: {}, cursed: false, value: 100, usable: true, effect: 'map', floorMin: 2, floorMax: 99 },
  { id: 'scroll-curse', name: 'Scroll of Curse', unidentifiedName: 'Dark Scroll', type: 'Scroll', stats: {}, cursed: true, value: 0, usable: true, effect: 'curse', floorMin: 3, floorMax: 99 },
  // === FOOD ===
  { id: 'ration', name: 'Field Ration', unidentifiedName: 'Wrapped Food', type: 'Food', stats: {}, cursed: false, value: 10, usable: true, effect: 'food', floorMin: 1, floorMax: 99 },
  { id: 'bread', name: 'Loaf of Bread', unidentifiedName: 'Bread', type: 'Food', stats: {}, cursed: false, value: 5, usable: true, effect: 'food', floorMin: 1, floorMax: 99 },
  { id: 'roasted-meat', name: 'Roasted Meat', unidentifiedName: 'Meat', type: 'Food', stats: {}, cursed: false, value: 15, usable: true, effect: 'food-large', floorMin: 1, floorMax: 99 }
];
