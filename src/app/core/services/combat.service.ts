import { Injectable } from '@angular/core';
import { CombatState, CombatAction, CombatResult } from '../models/combat.model';
import { Character } from '../models/character.model';
import { MonsterGroup, MonsterInstance } from '../models/monster.model';
import { Item } from '../models/item.model';
import { SPELLS } from '../data/spells.data';
import { rollDice } from '../utils/dice.util';
import { ItemService } from './item.service';

@Injectable({ providedIn: 'root' })
export class CombatService {

  constructor(private itemService: ItemService) {}

  initCombat(party: Character[], enemies: MonsterGroup): CombatState {
    return {
      active: true,
      round: 1,
      party: party.map(c => ({ ...c })),
      enemies: enemies.monsters.map(m => ({ ...m })),
      log: ['⚔ Combat begins!'],
      currentActorIndex: 0,
      phase: 'player-input',
      pendingActions: [],
      xpGained: 0,
      goldGained: 0,
      loot: []
    };
  }

  resolveAttack(attacker: Character, defender: MonsterInstance): CombatResult {
    const roll = rollDice('1d20');
    const attackBonus = Math.floor((attacker.stats.strength - 10) / 2) + Math.floor(attacker.level / 2);
    const weaponAttack = attacker.equipment.weapon?.stats.attack || 0;
    const totalAttack = roll + attackBonus + weaponAttack;
    const hitThreshold = 20 - defender.ac;

    if (totalAttack < hitThreshold) {
      return { hit: false, damage: 0, message: `${attacker.name} misses ${defender.name}!` };
    }

    const weaponDamage = attacker.equipment.weapon?.stats.damage || '1d4';
    const strBonus = Math.floor((attacker.stats.strength - 10) / 2);
    const weaponBonus = attacker.equipment.weapon?.stats.attack || 0;
    const damage = Math.max(1, rollDice(weaponDamage) + strBonus + weaponBonus);

    return { hit: true, damage, message: `${attacker.name} hits ${defender.name} for ${damage} damage!` };
  }

  resolveMonsterAttack(monster: MonsterInstance, target: Character): CombatResult {
    const roll = rollDice('1d20');
    const hitThreshold = Math.max(2, 20 - target.ac + 10);
    if (roll < hitThreshold) {
      return { hit: false, damage: 0, message: `${monster.name} misses ${target.name}!` };
    }

    const damage = Math.max(1, rollDice(monster.attack));
    let statusInflicted: string | undefined;

    if (monster.abilities.includes('poison') && Math.random() < 0.3) {
      statusInflicted = 'Poisoned';
    } else if (monster.abilities.includes('paralyze') && Math.random() < 0.2) {
      statusInflicted = 'Paralyzed';
    } else if (monster.abilities.includes('petrify') && Math.random() < 0.15) {
      statusInflicted = 'Stoned';
    } else if (monster.abilities.includes('drain-level') && Math.random() < 0.25) {
      statusInflicted = 'Drained';
    }

    let msg = `${monster.name} hits ${target.name} for ${damage} damage!`;
    if (statusInflicted) msg += ` ${target.name} is ${statusInflicted}!`;

    return { hit: true, damage, message: msg, statusInflicted };
  }

  resolveSpell(caster: Character, spellId: string, targets: (Character | MonsterInstance)[]): { results: CombatResult[]; updatedCaster: Character } {
    const spell = SPELLS.find(s => s.id === spellId);
    if (!spell) return { results: [{ hit: false, damage: 0, message: 'Unknown spell!' }], updatedCaster: caster };
    if (caster.currentMp < spell.mpCost) {
      return { results: [{ hit: false, damage: 0, message: `${caster.name} doesn't have enough MP!` }], updatedCaster: caster };
    }

    const updatedCaster = { ...caster, currentMp: caster.currentMp - spell.mpCost };
    const results: CombatResult[] = [];

    for (const target of targets) {
      if (spell.damage) {
        const damage = rollDice(spell.damage);
        results.push({ hit: true, damage, message: `${spell.name} hits for ${damage} damage!` });
      } else if (spell.healing) {
        const healing = rollDice(spell.healing);
        results.push({ hit: true, damage: -healing, message: `${spell.name} heals for ${healing} HP!` });
      } else {
        results.push({ hit: true, damage: 0, message: `${spell.name} takes effect on ${(target as any).name}!` });
      }
    }

    return { results, updatedCaster };
  }

  resolveMonsterTurn(monster: MonsterInstance, party: Character[]): CombatResult[] {
    const living = party.filter(c => c.currentHp > 0 && c.status !== 'Dead' && c.status !== 'Stoned');
    if (living.length === 0) return [];

    const results: CombatResult[] = [];
    for (let i = 0; i < monster.attackCount; i++) {
      const target = living[Math.floor(Math.random() * living.length)];
      const result = this.resolveMonsterAttack(monster, target);
      results.push({ ...result, actorName: monster.name, targetName: target.name } as any);
    }
    return results;
  }

  attemptFlee(party: Character[]): boolean {
    const avgAgi = party.reduce((s, c) => s + c.stats.agility, 0) / Math.max(1, party.length);
    const fleeChance = Math.min(0.8, 0.3 + (avgAgi - 10) * 0.03);
    return Math.random() < fleeChance;
  }

  applyResult(state: CombatState, result: CombatResult, targetIsMonster: boolean, targetIndex: number): CombatState {
    let newState = { ...state };
    if (targetIsMonster) {
      const newEnemies = state.enemies.map(e => ({ ...e }));
      if (newEnemies[targetIndex]) {
        newEnemies[targetIndex].currentHp = Math.max(0, newEnemies[targetIndex].currentHp - result.damage);
        if (newEnemies[targetIndex].currentHp === 0) newEnemies[targetIndex].status = 'dead';
      }
      newState = { ...newState, enemies: newEnemies };
    } else {
      const newParty = state.party.map(c => ({ ...c }));
      if (newParty[targetIndex]) {
        newParty[targetIndex].currentHp = Math.max(0, newParty[targetIndex].currentHp - result.damage);
        if (result.statusInflicted && result.statusInflicted !== 'Drained') {
          newParty[targetIndex].status = result.statusInflicted as any;
        }
        if (newParty[targetIndex].currentHp === 0) newParty[targetIndex].status = 'Dead';
      }
      newState = { ...newState, party: newParty };
    }
    newState.log = [...newState.log, result.message];
    return newState;
  }

  checkVictory(state: CombatState): boolean {
    return state.enemies.every(e => e.status === 'dead');
  }

  checkDefeat(state: CombatState): boolean {
    return state.party.every(c => c.currentHp === 0 || c.status === 'Dead' || c.status === 'Stoned');
  }

  generateLoot(enemies: MonsterInstance[]): { xp: number; gold: number; items: Item[] } {
    let xp = 0, gold = 0;
    enemies.forEach(e => {
      xp += e.xpReward;
      gold += e.goldMin + Math.floor(Math.random() * Math.max(1, e.goldMax - e.goldMin + 1));
    });
    const items: Item[] = [];
    if (Math.random() < 0.3) {
      const loot = this.itemService.generateLoot(1, 1);
      items.push(...loot);
    }
    return { xp, gold, items };
  }

  processPlayerAction(state: CombatState, action: CombatAction): CombatState {
    let newState = { ...state, log: [...state.log] };

    switch (action.type) {
      case 'attack': {
        const attacker = state.party[state.currentActorIndex];
        const targetIdx = action.targetIndex ?? 0;
        const aliveEnemies = state.enemies.filter(e => e.status === 'alive');
        const target = aliveEnemies[targetIdx] ?? state.enemies.find(e => e.status === 'alive');
        if (attacker && target) {
          const enemyIdx = state.enemies.indexOf(target);
          const result = this.resolveAttack(attacker, target);
          newState = this.applyResult(newState, result, true, enemyIdx);
        }
        break;
      }
      case 'spell': {
        const caster = state.party[state.currentActorIndex];
        if (caster && action.spellId) {
          const aliveEnemies = newState.enemies.filter(e => e.status === 'alive');
          const spell = SPELLS.find(s => s.id === action.spellId);
          const spellTargets: (Character | MonsterInstance)[] = spell?.targetType === 'all-enemies'
            ? aliveEnemies
            : aliveEnemies.slice(0, 1);
          const { results, updatedCaster } = this.resolveSpell(caster, action.spellId, spellTargets);
          const newParty = newState.party.map((c, i) => i === state.currentActorIndex ? updatedCaster : c);
          newState = { ...newState, party: newParty };
          for (const result of results) {
            if (result.damage > 0) {
              const enemyIdx = newState.enemies.findIndex(e => e.status === 'alive');
              if (enemyIdx >= 0) newState = this.applyResult(newState, result, true, enemyIdx);
            } else {
              newState.log = [...newState.log, result.message];
            }
          }
        }
        break;
      }
      case 'item': {
        newState.log = [...newState.log, 'Item used.'];
        break;
      }
      case 'flee': {
        if (this.attemptFlee(state.party)) {
          return { ...newState, phase: 'fled', log: [...newState.log, 'The party flees!'] };
        } else {
          newState.log = [...newState.log, 'Cannot flee!'];
        }
        break;
      }
      case 'defend': {
        const defender = state.party[state.currentActorIndex];
        newState.log = [...newState.log, `${defender?.name} takes a defensive stance.`];
        break;
      }
    }

    if (this.checkVictory(newState)) {
      const loot = this.generateLoot(newState.enemies);
      return {
        ...newState,
        phase: 'victory',
        xpGained: loot.xp,
        goldGained: loot.gold,
        loot: loot.items,
        log: [...newState.log, `🏆 Victory! Gained ${loot.xp} XP and ${loot.gold} gold!`]
      };
    }

    if (newState.phase !== 'fled' && newState.phase !== 'victory') {
      for (const monster of newState.enemies.filter(e => e.status === 'alive')) {
        const results = this.resolveMonsterTurn(monster, newState.party);
        for (const result of results) {
          const targetIdx = newState.party.findIndex(c =>
            c.currentHp > 0 && c.status !== 'Dead'
          );
          if (targetIdx >= 0) {
            newState = this.applyResult(newState, result, false, targetIdx);
          }
        }
      }

      if (this.checkDefeat(newState)) {
        return { ...newState, phase: 'defeat', log: [...newState.log, '💀 The party has been defeated!'] };
      }

      newState = { ...newState, round: newState.round + 1 };
    }

    return newState;
  }
}
