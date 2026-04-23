import { Injectable } from '@angular/core';
import { Item } from '../models/item.model';
import { Character } from '../models/character.model';
import { ITEMS } from '../data/items.data';
import { rollDice } from '../utils/dice.util';

@Injectable({ providedIn: 'root' })
export class ItemService {

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  generateItem(definitionId: string): Item {
    const def = ITEMS.find(i => i.id === definitionId);
    if (!def) throw new Error(`Unknown item: ${definitionId}`);
    return {
      id: this.generateId(),
      definitionId: def.id,
      name: def.name,
      unidentifiedName: def.unidentifiedName,
      identified: false,
      type: def.type,
      stats: { ...def.stats },
      cursed: def.cursed,
      value: def.value,
      quantity: 1,
      usable: def.usable,
      effect: def.effect,
      floorMin: def.floorMin,
      floorMax: def.floorMax
    };
  }

  generateLoot(floorLevel: number, count: number): Item[] {
    const eligible = ITEMS.filter(i => i.floorMin <= floorLevel && i.floorMax >= floorLevel);
    const items: Item[] = [];
    for (let i = 0; i < count; i++) {
      if (eligible.length === 0) break;
      const def = eligible[Math.floor(Math.random() * eligible.length)];
      items.push(this.generateItem(def.id));
    }
    return items;
  }

  identify(item: Item): Item {
    return { ...item, identified: true };
  }

  getShopInventory(floorLevel: number = 5): Item[] {
    const eligible = ITEMS.filter(i => i.floorMin <= floorLevel + 5 && !i.cursed);
    const selected = [...eligible].sort(() => Math.random() - 0.5).slice(0, 20);
    return selected.map(def => ({ ...this.generateItem(def.id), identified: true }));
  }

  applyItemEffect(item: Item, target: Character): { message: string; updatedChar: Character } {
    if (!item.effect) return { message: 'Nothing happens.', updatedChar: target };
    let updatedChar = { ...target };
    let message = 'You use the item.';
    switch (item.effect) {
      case 'heal-small':
        updatedChar.currentHp = Math.min(updatedChar.maxHp, updatedChar.currentHp + rollDice('1d8+2'));
        message = `${target.name} is healed!`;
        break;
      case 'heal-medium':
        updatedChar.currentHp = Math.min(updatedChar.maxHp, updatedChar.currentHp + rollDice('2d8+4'));
        message = `${target.name} is healed!`;
        break;
      case 'heal-large':
        updatedChar.currentHp = Math.min(updatedChar.maxHp, updatedChar.currentHp + rollDice('4d8+8'));
        message = `${target.name} is greatly healed!`;
        break;
      case 'restore-mp':
        updatedChar.currentMp = Math.min(updatedChar.maxMp, updatedChar.currentMp + rollDice('2d6+4'));
        message = `${target.name}'s mana is restored!`;
        break;
      case 'cure-poison':
        if (updatedChar.status === 'Poisoned') updatedChar.status = 'Healthy';
        message = `${target.name} is cured of poison!`;
        break;
      case 'boost-str':
        message = `${target.name} feels stronger!`;
        break;
      case 'invisibility':
        message = `${target.name} becomes invisible!`;
        break;
      case 'speed':
        message = `${target.name} feels faster!`;
        break;
      case 'food':
      case 'food-large':
        message = `${target.name} eats and feels better.`;
        break;
      case 'poison-self':
        updatedChar.status = 'Poisoned';
        message = `${target.name} is poisoned!`;
        break;
    }
    return { message, updatedChar };
  }
}
