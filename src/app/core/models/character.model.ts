import { Item } from './item.model';

export type Race = 'Human' | 'Elf' | 'Dwarf' | 'Gnome' | 'Hobbit' | 'Half-Elf' | 'Half-Orc';
export type CharacterClass = 'Fighter' | 'Wizard' | 'Priest' | 'Thief' | 'Valkyrie' | 'Samurai' | 'Ninja' | 'Ranger';
export type Alignment = 'Good' | 'Neutral' | 'Evil';
export type StatusEffect = 'Healthy' | 'Poisoned' | 'Paralyzed' | 'Stoned' | 'Dead' | 'Ashes';

export interface Stats {
  strength: number;
  intelligence: number;
  piety: number;
  vitality: number;
  agility: number;
  luck: number;
}

export interface Equipment {
  weapon: Item | null;
  shield: Item | null;
  helmet: Item | null;
  bodyArmor: Item | null;
  gloves: Item | null;
  boots: Item | null;
  ring: Item | null;
  amulet: Item | null;
  pet: Item | null;
}

export interface Character {
  id: string;
  name: string;
  race: Race;
  class: CharacterClass;
  alignment: Alignment;
  level: number;
  experience: number;
  experienceToNext: number;
  stats: Stats;
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  ac: number;
  gold: number;
  status: StatusEffect;
  equipment: Equipment;
  inventory: Item[];
  spells: string[];
  inParty: boolean;
  inDungeon: boolean;
  floorLevel: number;
  kills: number;
  deaths: number;
}
