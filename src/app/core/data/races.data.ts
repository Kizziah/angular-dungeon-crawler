import { Race, Stats } from '../models/character.model';

export interface RaceDef {
  name: Race;
  description: string;
  statModifiers: Partial<Stats>;
  allowedClasses: string[];
  allowedAlignments: string[];
  hpBonus: number;
}

export const RACES: RaceDef[] = [
  {
    name: 'Human',
    description: 'Versatile and adaptable. No restrictions on class or alignment.',
    statModifiers: {},
    allowedClasses: ['Fighter','Wizard','Priest','Thief','Valkyrie','Samurai','Ninja','Ranger'],
    allowedAlignments: ['Good','Neutral','Evil'],
    hpBonus: 0
  },
  {
    name: 'Elf',
    description: 'Intelligent and agile, skilled in magic. Weaker constitution.',
    statModifiers: { intelligence: 2, agility: 1, vitality: -1 },
    allowedClasses: ['Fighter','Wizard','Thief','Ranger','Ninja'],
    allowedAlignments: ['Good','Neutral'],
    hpBonus: -1
  },
  {
    name: 'Dwarf',
    description: 'Tough and strong, highly resistant to magic.',
    statModifiers: { strength: 2, vitality: 2, intelligence: -2, agility: -1 },
    allowedClasses: ['Fighter','Priest','Thief'],
    allowedAlignments: ['Good','Neutral'],
    hpBonus: 2
  },
  {
    name: 'Gnome',
    description: 'Small and lucky, gifted in illusion magic.',
    statModifiers: { intelligence: 1, luck: 3, strength: -1, vitality: -1 },
    allowedClasses: ['Fighter','Wizard','Thief'],
    allowedAlignments: ['Good','Neutral'],
    hpBonus: -1
  },
  {
    name: 'Hobbit',
    description: 'Nimble and lucky, great thieves. Weak in combat.',
    statModifiers: { agility: 3, luck: 2, strength: -2 },
    allowedClasses: ['Fighter','Thief'],
    allowedAlignments: ['Good','Neutral'],
    hpBonus: -1
  },
  {
    name: 'Half-Elf',
    description: 'A balance between Human and Elf. Versatile spellcasters.',
    statModifiers: { intelligence: 1, agility: 1 },
    allowedClasses: ['Fighter','Wizard','Priest','Thief','Ranger'],
    allowedAlignments: ['Good','Neutral','Evil'],
    hpBonus: 0
  },
  {
    name: 'Half-Orc',
    description: 'Brutish and powerful. Shunned by polite society.',
    statModifiers: { strength: 3, vitality: 1, intelligence: -2, luck: -1 },
    allowedClasses: ['Fighter','Thief','Ninja'],
    allowedAlignments: ['Neutral','Evil'],
    hpBonus: 2
  }
];
