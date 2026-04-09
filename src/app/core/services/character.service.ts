import { Injectable } from '@angular/core';
import { Character, CharacterClass, Race, Alignment, Stats, Equipment } from '../models/character.model';
import { Item } from '../models/item.model';
import { RACES } from '../data/races.data';
import { CLASSES } from '../data/classes.data';
import { rollDice, rollStat } from '../utils/dice.util';

@Injectable({ providedIn: 'root' })
export class CharacterService {

  createCharacter(name: string, race: Race, cls: CharacterClass, alignment: Alignment): Character {
    const stats = this.rollStats(race, cls);
    const classDef = CLASSES.find(c => c.name === cls)!;
    const raceDef = RACES.find(r => r.name === race)!;
    const maxHp = Math.max(1, rollDice(classDef.hitDie) + Math.floor((stats.vitality - 10) / 2) + raceDef.hpBonus);
    const maxMp = classDef.spellProgression ? Math.floor((stats.intelligence + stats.piety) / 2) : 0;
    return {
      id: this.generateId(),
      name,
      race,
      class: cls,
      alignment,
      level: 1,
      experience: 0,
      experienceToNext: this.calcXpForLevel(2),
      stats,
      maxHp,
      currentHp: maxHp,
      maxMp,
      currentMp: maxMp,
      ac: this.calcBaseAC(cls),
      gold: 100,
      status: 'Healthy',
      equipment: { weapon: null, shield: null, helmet: null, bodyArmor: null, gloves: null, boots: null, ring: null, amulet: null },
      inventory: [],
      spells: this.getStartingSpells(cls),
      inParty: false,
      inDungeon: false,
      floorLevel: 0,
      kills: 0,
      deaths: 0
    };
  }

  rollStats(race: Race, _cls: CharacterClass): Stats {
    const raceDef = RACES.find(r => r.name === race)!;
    const base = {
      strength: rollStat(),
      intelligence: rollStat(),
      piety: rollStat(),
      vitality: rollStat(),
      agility: rollStat(),
      luck: rollStat()
    };
    return {
      strength: Math.max(3, Math.min(18, base.strength + (raceDef.statModifiers.strength || 0))),
      intelligence: Math.max(3, Math.min(18, base.intelligence + (raceDef.statModifiers.intelligence || 0))),
      piety: Math.max(3, Math.min(18, base.piety + (raceDef.statModifiers.piety || 0))),
      vitality: Math.max(3, Math.min(18, base.vitality + (raceDef.statModifiers.vitality || 0))),
      agility: Math.max(3, Math.min(18, base.agility + (raceDef.statModifiers.agility || 0))),
      luck: Math.max(3, Math.min(18, base.luck + (raceDef.statModifiers.luck || 0)))
    };
  }

  calcXpForLevel(level: number): number {
    return Math.floor(1000 * Math.pow(1.5, level - 1));
  }

  levelUp(char: Character): Character {
    const classDef = CLASSES.find(c => c.name === char.class)!;
    const raceDef = RACES.find(r => r.name === char.race)!;
    const newLevel = char.level + 1;
    const hpGain = Math.max(1, rollDice(classDef.hitDie) + Math.floor((char.stats.vitality - 10) / 2) + raceDef.hpBonus);
    const mpGain = classDef.spellProgression ? Math.floor((char.stats.intelligence + char.stats.piety) / 4) : 0;
    const newMaxHp = char.maxHp + hpGain;
    const newMaxMp = char.maxMp + mpGain;
    return {
      ...char,
      level: newLevel,
      experienceToNext: this.calcXpForLevel(newLevel + 1),
      maxHp: newMaxHp,
      currentHp: newMaxHp,
      maxMp: newMaxMp,
      currentMp: newMaxMp,
      stats: this.improveStats(char.stats)
    };
  }

  private improveStats(stats: Stats): Stats {
    const statKeys = Object.keys(stats) as (keyof Stats)[];
    const newStats = { ...stats };
    const improvements = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < improvements; i++) {
      const key = statKeys[Math.floor(Math.random() * statKeys.length)];
      if (newStats[key] < 20) newStats[key]++;
    }
    return newStats;
  }

  calcAC(char: Character): number {
    let ac = 10;
    const eq = char.equipment;
    // Mordor descending AC: lower is better, equipment reduces AC
    if (eq.bodyArmor) ac -= (eq.bodyArmor.stats.defense || 0);
    if (eq.shield)    ac -= (eq.shield.stats.defense || 0);
    if (eq.helmet)    ac -= (eq.helmet.stats.defense || 0);
    if (eq.gloves)    ac -= (eq.gloves.stats.defense || 0);
    if (eq.boots)     ac -= (eq.boots.stats.defense || 0);
    if (eq.ring)      ac -= (eq.ring.stats.defense || 0);
    if (eq.amulet)    ac -= (eq.amulet.stats.defense || 0);
    ac -= Math.floor((char.stats.agility - 10) / 2);
    return ac;
  }

  private calcBaseAC(cls: CharacterClass): number {
    return CLASSES.find(c => c.name === cls)?.baseAC || 10;
  }

  calcAttackBonus(char: Character): number {
    const classDef = CLASSES.find(c => c.name === char.class)!;
    return Math.floor(char.level * classDef.attackBonus / 2) + Math.floor((char.stats.strength - 10) / 2);
  }

  private generateId(): string {
    // crypto.randomUUID() requires a secure context (HTTPS).
    // localhost is exempt, but plain HTTP on S3 is not — use a fallback.
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  isAlive(char: Character): boolean {
    return char.status !== 'Dead' && char.status !== 'Ashes' && char.currentHp > 0;
  }

  applyEquipment(char: Character): Character {
    return { ...char, ac: this.calcAC(char) };
  }

  private getStartingSpells(cls: CharacterClass): string[] {
    switch (cls) {
      case 'Wizard': return ['magic-missile', 'detect-magic'];
      case 'Priest': return ['heal', 'cure-poison'];
      case 'Valkyrie': return ['heal'];
      case 'Ranger': return ['magic-missile'];
      default: return [];
    }
  }

  equipItem(char: Character, item: Item): Character {
    const newEquipment = { ...char.equipment };
    const newInventory = char.inventory.filter(i => i.id !== item.id);
    const slot = this.getEquipmentSlot(item.type);
    if (slot && newEquipment[slot]) {
      newInventory.push(newEquipment[slot]!);
    }
    if (slot) {
      (newEquipment as any)[slot] = item;
    }
    return this.applyEquipment({ ...char, equipment: newEquipment, inventory: newInventory });
  }

  unequipItem(char: Character, slot: keyof Equipment): Character {
    const newEquipment = { ...char.equipment };
    const item = newEquipment[slot];
    const newInventory = [...char.inventory];
    if (item) {
      newInventory.push(item);
      (newEquipment as any)[slot] = null;
    }
    return this.applyEquipment({ ...char, equipment: newEquipment, inventory: newInventory });
  }

  getEquipmentSlot(itemType: string): keyof Equipment | null {
    const map: Record<string, keyof Equipment> = {
      'Weapon': 'weapon',
      'Shield': 'shield',
      'Helmet': 'helmet',
      'BodyArmor': 'bodyArmor',
      'Gloves': 'gloves',
      'Boots': 'boots',
      'Ring': 'ring',
      'Amulet': 'amulet'
    };
    return map[itemType] || null;
  }
}
