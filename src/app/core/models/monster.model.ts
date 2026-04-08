export type MonsterAbility = 'drain-level' | 'petrify' | 'poison' | 'paralyze' | 'instant-kill' | 'breathe-fire' | 'breathe-cold' | 'cast-spell' | 'steal-gold';

export interface MonsterDef {
  id: string;
  name: string;
  symbol: string;
  color: string;
  hp: string;
  ac: number;
  attack: string;
  attackCount: number;
  abilities: MonsterAbility[];
  xpReward: number;
  goldMin: number;
  goldMax: number;
  floorMin: number;
  floorMax: number;
  description: string;
}

export interface MonsterInstance {
  definitionId: string;
  name: string;
  symbol: string;
  color: string;
  maxHp: number;
  currentHp: number;
  ac: number;
  attack: string;
  attackCount: number;
  abilities: MonsterAbility[];
  xpReward: number;
  goldMin: number;
  goldMax: number;
  status: 'alive' | 'dead';
}

export interface MonsterGroup {
  monsters: MonsterInstance[];
}
