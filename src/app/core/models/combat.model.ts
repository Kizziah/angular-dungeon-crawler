import { Character } from './character.model';
import { MonsterInstance } from './monster.model';
import { Item } from './item.model';

export type CombatActionType = 'attack' | 'spell' | 'item' | 'flee' | 'defend';

export interface CombatAction {
  type: CombatActionType;
  actorId: string;
  targetIndex?: number;
  spellId?: string;
  itemId?: string;
}

export interface CombatTurn {
  round: number;
  actions: CombatAction[];
}

export interface CombatResult {
  hit: boolean;
  damage: number;
  message: string;
  statusInflicted?: string;
}

export interface CombatState {
  active: boolean;
  round: number;
  party: Character[];
  enemies: MonsterInstance[];
  log: string[];
  currentActorIndex: number;
  phase: 'player-input' | 'resolving' | 'victory' | 'defeat' | 'fled';
  pendingActions: CombatAction[];
  xpGained: number;
  goldGained: number;
  loot: Item[];
}
