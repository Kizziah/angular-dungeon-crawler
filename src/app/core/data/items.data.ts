import { ItemType, ItemStats } from '../models/item.model';

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
}

export const ITEMS: ItemDef[] = [
  // === WEAPONS ===
  { id: 'dagger', name: 'Dagger', unidentifiedName: 'Small Blade', type: 'Weapon', stats: { attack: 0, damage: '1d4' }, cursed: false, value: 20, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'short-sword', name: 'Short Sword', unidentifiedName: 'Short Blade', type: 'Weapon', stats: { attack: 0, damage: '1d6' }, cursed: false, value: 50, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'longsword', name: 'Longsword', unidentifiedName: 'Long Blade', type: 'Weapon', stats: { attack: 0, damage: '1d8' }, cursed: false, value: 100, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'bastard-sword', name: 'Bastard Sword', unidentifiedName: 'Heavy Blade', type: 'Weapon', stats: { attack: 0, damage: '1d10' }, cursed: false, value: 200, usable: false, floorMin: 3, floorMax: 99 },
  { id: 'greatsword', name: 'Greatsword', unidentifiedName: 'Huge Blade', type: 'Weapon', stats: { attack: 1, damage: '2d6' }, cursed: false, value: 350, usable: false, floorMin: 5, floorMax: 99 },
  { id: 'battle-axe', name: 'Battle Axe', unidentifiedName: 'Heavy Axe', type: 'Weapon', stats: { attack: 0, damage: '1d8' }, cursed: false, value: 90, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'war-hammer', name: 'War Hammer', unidentifiedName: 'Heavy Hammer', type: 'Weapon', stats: { attack: 0, damage: '1d8' }, cursed: false, value: 100, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'spear', name: 'Spear', unidentifiedName: 'Long Pole', type: 'Weapon', stats: { attack: 0, damage: '1d6' }, cursed: false, value: 40, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'mace', name: 'Mace', unidentifiedName: 'Blunt Club', type: 'Weapon', stats: { attack: 0, damage: '1d6' }, cursed: false, value: 60, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'staff', name: 'Staff', unidentifiedName: 'Wooden Staff', type: 'Weapon', stats: { attack: 0, damage: '1d6' }, cursed: false, value: 30, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'short-bow', name: 'Short Bow', unidentifiedName: 'Small Bow', type: 'Weapon', stats: { attack: 0, damage: '1d6' }, cursed: false, value: 80, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'long-bow', name: 'Long Bow', unidentifiedName: 'Large Bow', type: 'Weapon', stats: { attack: 1, damage: '1d8' }, cursed: false, value: 150, usable: false, floorMin: 2, floorMax: 99 },
  // Magical weapons
  { id: 'longsword-p1', name: 'Longsword +1', unidentifiedName: 'Glowing Blade', type: 'Weapon', stats: { attack: 1, damage: '1d8' }, cursed: false, value: 500, usable: false, floorMin: 5, floorMax: 99 },
  { id: 'longsword-p2', name: 'Longsword +2', unidentifiedName: 'Bright Blade', type: 'Weapon', stats: { attack: 2, damage: '1d8' }, cursed: false, value: 1000, usable: false, floorMin: 12, floorMax: 99 },
  { id: 'longsword-p3', name: 'Longsword +3', unidentifiedName: 'Blazing Blade', type: 'Weapon', stats: { attack: 3, damage: '1d8' }, cursed: false, value: 2500, usable: false, floorMin: 22, floorMax: 99 },
  { id: 'dagger-p1', name: 'Dagger +1', unidentifiedName: 'Sharp Blade', type: 'Weapon', stats: { attack: 1, damage: '1d4' }, cursed: false, value: 300, usable: false, floorMin: 4, floorMax: 99 },
  { id: 'dagger-p2', name: 'Dagger +2', unidentifiedName: 'Very Sharp Blade', type: 'Weapon', stats: { attack: 2, damage: '1d4' }, cursed: false, value: 700, usable: false, floorMin: 10, floorMax: 99 },
  { id: 'mace-p1', name: 'Mace +1', unidentifiedName: 'Resonant Club', type: 'Weapon', stats: { attack: 1, damage: '1d6' }, cursed: false, value: 400, usable: false, floorMin: 5, floorMax: 99 },
  { id: 'mace-p2', name: 'Mace +2', unidentifiedName: 'Humming Club', type: 'Weapon', stats: { attack: 2, damage: '1d6' }, cursed: false, value: 900, usable: false, floorMin: 14, floorMax: 99 },
  { id: 'sword-of-fire', name: 'Sword of Fire', unidentifiedName: 'Flaming Blade', type: 'Weapon', stats: { attack: 2, damage: '1d8' }, cursed: false, value: 3000, usable: false, floorMin: 20, floorMax: 99 },
  { id: 'blade-of-ice', name: 'Blade of Ice', unidentifiedName: 'Frost Blade', type: 'Weapon', stats: { attack: 2, damage: '1d8' }, cursed: false, value: 3000, usable: false, floorMin: 20, floorMax: 99 },
  { id: 'holy-avenger', name: 'Holy Avenger', unidentifiedName: 'Radiant Sword', type: 'Weapon', stats: { attack: 4, damage: '2d8' }, cursed: false, value: 8000, usable: false, floorMin: 40, floorMax: 99 },
  { id: 'cursed-sword', name: 'Cursed Blade -2', unidentifiedName: 'Gleaming Sword', type: 'Weapon', stats: { attack: -2, damage: '1d8' }, cursed: true, value: 0, usable: false, floorMin: 5, floorMax: 99 },
  // === SHIELDS ===
  { id: 'small-shield', name: 'Small Shield', unidentifiedName: 'Small Shield', type: 'Shield', stats: { defense: 1 }, cursed: false, value: 50, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'large-shield', name: 'Large Shield', unidentifiedName: 'Large Shield', type: 'Shield', stats: { defense: 2 }, cursed: false, value: 120, usable: false, floorMin: 1, floorMax: 99 },
  { id: 'tower-shield', name: 'Tower Shield', unidentifiedName: 'Huge Shield', type: 'Shield', stats: { defense: 3 }, cursed: false, value: 250, usable: false, floorMin: 3, floorMax: 99 },
  { id: 'shield-p1', name: 'Shield +1', unidentifiedName: 'Polished Shield', type: 'Shield', stats: { defense: 3 }, cursed: false, value: 600, usable: false, floorMin: 8, floorMax: 99 },
  { id: 'shield-p2', name: 'Shield +2', unidentifiedName: 'Gleaming Shield', type: 'Shield', stats: { defense: 4 }, cursed: false, value: 1500, usable: false, floorMin: 18, floorMax: 99 },
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
