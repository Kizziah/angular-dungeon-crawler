import { Injectable } from '@angular/core';
import { MonsterDef, MonsterInstance, MonsterGroup } from '../models/monster.model';
import { Character } from '../models/character.model';
import { CombatAction } from '../models/combat.model';
import { MONSTERS } from '../data/monsters.data';
import { rollDice } from '../utils/dice.util';

@Injectable({ providedIn: 'root' })
export class MonsterService {

  getMonstersForFloor(level: number): MonsterDef[] {
    return MONSTERS.filter(m => m.floorMin <= level && m.floorMax >= level);
  }

  rollEncounterGroup(level: number): MonsterGroup {
    const available = this.getMonstersForFloor(level);
    let def: MonsterDef;
    if (available.length === 0) {
      const allMonsters = [...MONSTERS].sort((a, b) => Math.abs(a.floorMin - level) - Math.abs(b.floorMin - level));
      def = allMonsters[0];
    } else {
      def = available[Math.floor(Math.random() * available.length)];
    }
    const count = Math.floor(Math.random() * 3) + 1;
    return { monsters: Array.from({ length: count }, () => this.instantiateMonster(def)) };
  }

  instantiateMonster(def: MonsterDef): MonsterInstance {
    const hp = rollDice(def.hp);
    return {
      definitionId: def.id,
      name: def.name,
      symbol: def.symbol,
      color: def.color,
      maxHp: hp,
      currentHp: hp,
      ac: def.ac,
      attack: def.attack,
      attackCount: def.attackCount,
      abilities: [...def.abilities],
      xpReward: def.xpReward,
      goldMin: def.goldMin,
      goldMax: def.goldMax,
      status: 'alive'
    };
  }

  chooseMonsterAction(monster: MonsterInstance, party: Character[]): CombatAction {
    const living = party.filter(c => c.status === 'Healthy' || c.status === 'Poisoned');
    const target = living.length > 0 ? Math.floor(Math.random() * living.length) : 0;
    return { type: 'attack', actorId: monster.name, targetIndex: target };
  }
}
