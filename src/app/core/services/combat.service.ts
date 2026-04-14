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
    const hitThreshold = Math.max(2, 20 - target.ac);
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
    // Flee is immediate — don't wait for other party members
    if (action.type === 'flee') {
      if (this.attemptFlee(state.party)) {
        return { ...state, phase: 'fled', log: [...state.log, 'The party flees!'] };
      }
      // Failed flee still costs the whole round
      return this.resolveRound({
        ...state,
        pendingActions: state.party
          .filter(c => c.currentHp > 0 && c.status !== 'Dead' && c.status !== 'Stoned')
          .map((c, _, arr) => ({ type: 'defend' as const, actorId: c.id, targetIndex: 0 })),
        log: [...state.log, 'Cannot flee!']
      });
    }

    // Record this actor's choice
    const newPending: CombatAction[] = [...state.pendingActions, { ...action, actorId: state.party[state.currentActorIndex]?.id }];

    // How many alive members still need to act?
    const aliveMembers = state.party.filter(c => c.currentHp > 0 && c.status !== 'Dead' && c.status !== 'Stoned');

    if (newPending.length >= aliveMembers.length) {
      // All party members have chosen — resolve the full round
      return this.resolveRound({ ...state, pendingActions: newPending });
    }

    // Advance to the next alive party member
    let nextIdx = state.currentActorIndex + 1;
    while (nextIdx < state.party.length) {
      const c = state.party[nextIdx];
      if (c.currentHp > 0 && c.status !== 'Dead' && c.status !== 'Stoned') break;
      nextIdx++;
    }

    return { ...state, pendingActions: newPending, currentActorIndex: nextIdx };
  }

  private resolvePartyAction(state: CombatState, action: CombatAction): CombatState {
    let newState = { ...state, log: [...state.log] };
    const actorIdx = newState.party.findIndex(c => c.id === action.actorId);
    if (actorIdx < 0) return newState;
    const actor = newState.party[actorIdx];
    if (!actor || actor.currentHp <= 0 || actor.status === 'Dead') return newState;

    switch (action.type) {
      case 'attack': {
        const targetIdx = action.targetIndex ?? 0;
        const aliveEnemies = newState.enemies.filter(e => e.status === 'alive');
        const target = aliveEnemies[targetIdx] ?? aliveEnemies[0];
        if (target) {
          const enemyIdx = newState.enemies.indexOf(target);
          const result = this.resolveAttack(actor, target);
          newState = this.applyResult(newState, result, true, enemyIdx);
        }
        break;
      }
      case 'spell': {
        if (action.spellId) {
          const aliveEnemies = newState.enemies.filter(e => e.status === 'alive');
          const spell = SPELLS.find(s => s.id === action.spellId);
          const spellTargets: (Character | MonsterInstance)[] = spell?.targetType === 'all-enemies'
            ? aliveEnemies : aliveEnemies.slice(0, 1);
          const { results, updatedCaster } = this.resolveSpell(actor, action.spellId, spellTargets);
          const newParty = newState.party.map((c, i) => i === actorIdx ? updatedCaster : c);
          newState = { ...newState, party: newParty };
          for (const result of results) {
            if (result.damage > 0) {
              const eIdx = newState.enemies.findIndex(e => e.status === 'alive');
              if (eIdx >= 0) newState = this.applyResult(newState, result, true, eIdx);
            } else {
              newState = { ...newState, log: [...newState.log, result.message] };
            }
          }
        }
        break;
      }
      case 'defend': {
        newState = { ...newState, log: [...newState.log, `${actor.name} takes a defensive stance.`] };
        break;
      }
      case 'item': {
        newState = { ...newState, log: [...newState.log, `${actor.name} uses an item.`] };
        break;
      }
    }
    return newState;
  }

  private resolveRound(state: CombatState): CombatState {
    let newState = { ...state };

    // Resolve all pending party actions in order
    for (const action of state.pendingActions) {
      newState = this.resolvePartyAction(newState, action);
      if (this.checkVictory(newState)) {
        const loot = this.generateLoot(newState.enemies);
        return {
          ...newState, phase: 'victory',
          xpGained: loot.xp, goldGained: loot.gold, loot: loot.items,
          log: [...newState.log, `🏆 Victory! Gained ${loot.xp} XP and ${loot.gold} gold!`]
        };
      }
    }

    // Monster phase — all alive monsters attack
    for (const monster of newState.enemies.filter(e => e.status === 'alive')) {
      const living = newState.party
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.currentHp > 0 && c.status !== 'Dead' && c.status !== 'Stoned');
      if (living.length === 0) break;
      for (let a = 0; a < monster.attackCount; a++) {
        const { c: target, i: targetIdx } = living[Math.floor(Math.random() * living.length)];
        const result = this.resolveMonsterAttack(monster, target);
        newState = this.applyResult(newState, result, false, targetIdx);
      }
    }

    if (this.checkDefeat(newState)) {
      return { ...newState, phase: 'defeat', log: [...newState.log, '💀 The party has been defeated!'] };
    }

    // Reset for next round — find first alive member
    const firstAlive = newState.party.findIndex(c => c.currentHp > 0 && c.status !== 'Dead' && c.status !== 'Stoned');
    return {
      ...newState,
      pendingActions: [],
      currentActorIndex: Math.max(0, firstAlive),
      round: newState.round + 1,
      phase: 'player-input'
    };
  }
}
