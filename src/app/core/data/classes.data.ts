import { CharacterClass } from '../models/character.model';

export interface ClassDef {
  name: CharacterClass;
  description: string;
  hitDie: string;
  spellProgression: boolean;
  spellType: 'arcane' | 'divine' | 'none';
  primaryStat: string;
  allowedAlignments: string[];
  baseAC: number;
  attackBonus: number;
  abilities: string[];
}

export const CLASSES: ClassDef[] = [
  {
    name: 'Fighter',
    description: 'Master of melee combat. Highest HP and best weapon/armor access.',
    hitDie: '1d10',
    spellProgression: false,
    spellType: 'none',
    primaryStat: 'strength',
    allowedAlignments: ['Good','Neutral','Evil'],
    baseAC: 10,
    attackBonus: 2,
    abilities: ['Melee Mastery', 'Shield Wall']
  },
  {
    name: 'Wizard',
    description: 'Powerful arcane spellcaster. Fragile in melee.',
    hitDie: '1d4',
    spellProgression: true,
    spellType: 'arcane',
    primaryStat: 'intelligence',
    allowedAlignments: ['Good','Neutral','Evil'],
    baseAC: 10,
    attackBonus: 1,
    abilities: ['Arcane Spells', 'Identify']
  },
  {
    name: 'Priest',
    description: 'Divine healer and undead turner. Moderate combat.',
    hitDie: '1d8',
    spellProgression: true,
    spellType: 'divine',
    primaryStat: 'piety',
    allowedAlignments: ['Good','Neutral','Evil'],
    baseAC: 10,
    attackBonus: 1,
    abilities: ['Divine Spells', 'Turn Undead']
  },
  {
    name: 'Thief',
    description: 'Stealth and backstab. Decent combat when hidden.',
    hitDie: '1d6',
    spellProgression: false,
    spellType: 'none',
    primaryStat: 'agility',
    allowedAlignments: ['Neutral','Evil'],
    baseAC: 10,
    attackBonus: 1,
    abilities: ['Backstab', 'Disarm Traps', 'Steal']
  },
  {
    name: 'Valkyrie',
    description: 'Elite warrior with some divine magic. Good only.',
    hitDie: '1d10',
    spellProgression: true,
    spellType: 'divine',
    primaryStat: 'strength',
    allowedAlignments: ['Good'],
    baseAC: 10,
    attackBonus: 2,
    abilities: ['Holy Strike', 'Divine Spells']
  },
  {
    name: 'Samurai',
    description: 'Disciplined warrior with higher crit rate.',
    hitDie: '1d10',
    spellProgression: false,
    spellType: 'none',
    primaryStat: 'strength',
    allowedAlignments: ['Good','Neutral'],
    baseAC: 10,
    attackBonus: 2,
    abilities: ['Critical Strike', 'Bushido']
  },
  {
    name: 'Ninja',
    description: 'Shadow assassin. Can instant-kill on backstab.',
    hitDie: '1d8',
    spellProgression: false,
    spellType: 'none',
    primaryStat: 'agility',
    allowedAlignments: ['Evil','Neutral'],
    baseAC: 8,
    attackBonus: 2,
    abilities: ['Shadow Strike', 'Evasion', 'Poison Blade']
  },
  {
    name: 'Ranger',
    description: 'Archer and tracker. Dual wield and minor arcane spells.',
    hitDie: '1d8',
    spellProgression: true,
    spellType: 'arcane',
    primaryStat: 'agility',
    allowedAlignments: ['Good','Neutral'],
    baseAC: 10,
    attackBonus: 2,
    abilities: ['Dual Wield', 'Ranged Attack', 'Arcane Spells']
  }
];
