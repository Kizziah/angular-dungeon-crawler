export interface SpellDef {
  id: string;
  name: string;
  type: 'arcane' | 'divine';
  mpCost: number;
  levelRequired: number;
  effect: string;
  description: string;
  targetType: 'single-enemy' | 'all-enemies' | 'single-ally' | 'all-allies' | 'self';
  damage?: string;
  healing?: string;
}

export const SPELLS: SpellDef[] = [
  // Arcane
  { id: 'magic-missile', name: 'Magic Missile', type: 'arcane', mpCost: 2, levelRequired: 1, effect: 'damage', description: 'Fires a magical bolt of energy.', targetType: 'single-enemy', damage: '1d6+1' },
  { id: 'sleep', name: 'Sleep', type: 'arcane', mpCost: 3, levelRequired: 1, effect: 'paralyze', description: 'Puts an enemy to sleep.', targetType: 'single-enemy' },
  { id: 'identify', name: 'Identify', type: 'arcane', mpCost: 5, levelRequired: 2, effect: 'identify', description: 'Identifies an item.', targetType: 'self' },
  { id: 'fireball', name: 'Fireball', type: 'arcane', mpCost: 8, levelRequired: 3, effect: 'damage', description: 'Hurls a ball of fire at all enemies.', targetType: 'all-enemies', damage: '3d6' },
  { id: 'ice-storm', name: 'Ice Storm', type: 'arcane', mpCost: 8, levelRequired: 4, effect: 'damage', description: 'Freezing ice damages all enemies.', targetType: 'all-enemies', damage: '3d6' },
  { id: 'lightning', name: 'Lightning Bolt', type: 'arcane', mpCost: 10, levelRequired: 5, effect: 'damage', description: 'Strikes a single enemy with lightning.', targetType: 'single-enemy', damage: '5d6' },
  { id: 'charm', name: 'Charm', type: 'arcane', mpCost: 6, levelRequired: 3, effect: 'charm', description: 'Charms an enemy to fight for you.', targetType: 'single-enemy' },
  { id: 'detect-magic', name: 'Detect Magic', type: 'arcane', mpCost: 2, levelRequired: 1, effect: 'detect', description: 'Detects magical auras.', targetType: 'self' },
  { id: 'teleport', name: 'Teleport', type: 'arcane', mpCost: 15, levelRequired: 7, effect: 'teleport', description: 'Teleports the party to town.', targetType: 'self' },
  { id: 'web', name: 'Web', type: 'arcane', mpCost: 4, levelRequired: 2, effect: 'paralyze', description: 'Entangles all enemies in webs.', targetType: 'all-enemies' },
  // Divine
  { id: 'heal', name: 'Heal', type: 'divine', mpCost: 4, levelRequired: 1, effect: 'heal', description: 'Heals a single ally.', targetType: 'single-ally', healing: '2d8+2' },
  { id: 'cure-poison', name: 'Cure Poison', type: 'divine', mpCost: 3, levelRequired: 1, effect: 'cure-poison', description: 'Removes the poisoned status.', targetType: 'single-ally' },
  { id: 'bless', name: 'Bless', type: 'divine', mpCost: 4, levelRequired: 2, effect: 'bless', description: 'Blesses the party, improving to-hit.', targetType: 'all-allies' },
  { id: 'holy-light', name: 'Holy Light', type: 'divine', mpCost: 8, levelRequired: 3, effect: 'damage', description: 'Damages undead and evil creatures.', targetType: 'all-enemies', damage: '3d8' },
  { id: 'smite', name: 'Smite', type: 'divine', mpCost: 6, levelRequired: 3, effect: 'damage', description: 'Smites a single enemy with divine power.', targetType: 'single-enemy', damage: '4d6' },
  { id: 'resurrect', name: 'Resurrect', type: 'divine', mpCost: 20, levelRequired: 8, effect: 'resurrect', description: 'Resurrects a fallen ally.', targetType: 'single-ally' },
  { id: 'protection', name: 'Protection', type: 'divine', mpCost: 5, levelRequired: 2, effect: 'protect', description: 'Raises AC for all allies.', targetType: 'all-allies' },
  { id: 'turn-undead', name: 'Turn Undead', type: 'divine', mpCost: 6, levelRequired: 2, effect: 'turn-undead', description: 'Turns undead creatures.', targetType: 'all-enemies' },
  { id: 'mass-heal', name: 'Mass Heal', type: 'divine', mpCost: 15, levelRequired: 6, effect: 'heal', description: 'Heals all party members.', targetType: 'all-allies', healing: '2d8+4' },
];
