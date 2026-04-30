import { Character } from '../models/character.model';
import { Item } from '../models/item.model';
import { ItemDef, ITEMS } from './items.data';

/** Convert an ItemDef into a runtime Item instance. */
function itemFromDef(def: ItemDef): Item {
  return {
    id: `mason-${def.id}`,
    definitionId: def.id,
    name: def.name,
    unidentifiedName: def.unidentifiedName,
    identified: true,
    type: def.type,
    stats: { ...def.stats },
    cursed: def.cursed,
    value: def.value,
    quantity: 1,
    usable: def.usable,
    effect: def.effect,
    floorMin: def.floorMin,
    floorMax: def.floorMax,
  };
}

function item(id: string): Item {
  const def = ITEMS.find(d => d.id === id);
  if (!def) throw new Error(`[demo-characters] Unknown item id: "${id}"`);
  return itemFromDef(def);
}

// ── Equipped gear ─────────────────────────────────────────────────────────────
const equipment = {
  weapon:    item('holy-avenger'),
  shield:    item('shield-p2'),
  helmet:    item('helm-p1'),
  bodyArmor: item('plate-p3'),
  gloves:    item('gloves-strength'),
  boots:     item('boots-of-speed'),
  ring:      item('ring-luck'),
  amulet:    item('amulet-vitality'),
  pet:       item('loyal-dog'),
};

// ── Inventory: one of every weapon type not already in the weapon slot ─────────
const inventoryWeaponIds = [
  'dagger', 'short-sword', 'longsword', 'bastard-sword', 'greatsword',
  'battle-axe', 'war-hammer', 'spear', 'mace', 'staff',
  'short-bow', 'long-bow',
  'longsword-p1', 'longsword-p2', 'longsword-p3',
  'dagger-p1', 'dagger-p2',
  'mace-p1', 'mace-p2',
  'sword-of-fire', 'blade-of-ice',
  'cursed-sword',
];

const inventoryExtras = [
  'potion-heal-large', 'potion-mana', 'scroll-identify', 'scroll-town-portal',
  'tabby-cat', 'raven', 'coiled-serpent', 'alligator', 'monkey',
];

const inventory: Item[] = [
  ...inventoryWeaponIds.map(id => item(id)),
  ...inventoryExtras.map(id => item(id)),
];

// ── All spells ─────────────────────────────────────────────────────────────────
const ALL_SPELLS = [
  // Arcane
  'magic-missile', 'sleep', 'identify', 'fireball', 'ice-storm',
  'lightning', 'charm', 'detect-magic', 'teleport', 'web',
  // Divine
  'heal', 'cure-poison', 'bless', 'holy-light', 'smite',
  'resurrect', 'protection', 'turn-undead', 'mass-heal',
];

// ── Mason ──────────────────────────────────────────────────────────────────────
export const MASON_CHARACTER: Character = {
  id: 'mason-demo',
  name: 'Mason',
  race: 'Human',
  class: 'Fighter',
  alignment: 'Good',
  level: 20,
  experience: 9_999_999,
  experienceToNext: 99_999_999,
  stats: {
    strength:     18,
    intelligence: 18,
    piety:        18,
    vitality:     18,
    agility:      18,
    luck:         18,
  },
  maxHp: 200,
  currentHp: 200,
  maxMp: 100,
  currentMp: 100,
  ac: 2,
  gold: 99_999,
  status: 'Healthy',
  equipment,
  inventory,
  spells: ALL_SPELLS,
  inParty: true,
  inDungeon: false,
  floorLevel: 0,
  kills: 999,
  deaths: 0,
};
