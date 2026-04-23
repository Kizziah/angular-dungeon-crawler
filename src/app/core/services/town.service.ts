import { Injectable } from '@angular/core';
import { Character } from '../models/character.model';
import { GuildState } from '../models/guild.model';
import { Item } from '../models/item.model';
import { CharacterService } from './character.service';
import { ItemService } from './item.service';

@Injectable({ providedIn: 'root' })
export class TownService {

  constructor(private charService: CharacterService, private itemService: ItemService) {}

  rest(chars: Character[], guildGold: number): { cost: number; healed: Character[]; canAfford: boolean } {
    const cost = chars.length * 10;
    const canAfford = guildGold >= cost;
    if (!canAfford) return { cost, healed: chars, canAfford: false };
    const healed = chars.map(c => ({ ...c, currentHp: c.maxHp, currentMp: c.maxMp }));
    return { cost, healed, canAfford: true };
  }

  shopBuy(char: Character, item: Item, guildGold: number): { success: boolean; newChar: Character; newGold: number } {
    if (guildGold < item.value) return { success: false, newChar: char, newGold: guildGold };
    const newChar = { ...char, inventory: [...char.inventory, { ...item, identified: true }] };
    return { success: true, newChar, newGold: guildGold - item.value };
  }

  shopSell(char: Character, item: Item): { gold: number; newChar: Character } {
    const gold = Math.floor(item.value / 2);
    const newChar = { ...char, inventory: char.inventory.filter(i => i.id !== item.id) };
    return { gold, newChar };
  }

  resurrect(char: Character, guildGold: number): { success: boolean; cost: number; char: Character } {
    const cost = char.level === 1 ? 0 : 500 + char.level * 100;
    if (guildGold < cost) return { success: false, cost, char };
    const successChance = Math.max(0.1, 0.9 - char.level * 0.05);
    if (Math.random() < successChance) {
      return { success: true, cost, char: { ...char, status: 'Healthy', currentHp: 1 } };
    }
    return { success: false, cost, char: { ...char, status: 'Ashes' } };
  }

  cureStatus(char: Character, guildGold: number): { cost: number; newChar: Character; canAfford: boolean } {
    const statusCosts: Record<string, number> = { Poisoned: 50, Paralyzed: 100, Stoned: 300 };
    const cost = statusCosts[char.status] || 0;
    if (cost === 0) return { cost: 0, newChar: char, canAfford: true };
    if (guildGold < cost) return { cost, newChar: char, canAfford: false };
    return { cost, newChar: { ...char, status: 'Healthy' }, canAfford: true };
  }

  identifyItem(item: Item, guildGold: number): { cost: number; item: Item; canAfford: boolean } {
    const cost = 100;
    if (guildGold < cost) return { cost, item, canAfford: false };
    return { cost, item: { ...item, identified: true }, canAfford: true };
  }

  levelUp(char: Character, guildGold: number): { cost: number; char: Character; canAfford: boolean; canLevel: boolean } {
    const cost = 100 * char.level;
    const canLevel = char.experience >= char.experienceToNext;
    if (!canLevel) return { cost, char, canAfford: guildGold >= cost, canLevel: false };
    if (guildGold < cost) return { cost, char, canAfford: false, canLevel: true };
    return { cost, char: this.charService.levelUp(char), canAfford: true, canLevel: true };
  }

  bankDeposit(amount: number, guild: GuildState): GuildState {
    if (amount <= 0 || amount > guild.gold) return guild;
    return { ...guild, gold: guild.gold - amount, bankGold: guild.bankGold + amount };
  }

  bankWithdraw(amount: number, guild: GuildState): GuildState {
    if (amount <= 0 || amount > guild.bankGold) return guild;
    return { ...guild, gold: guild.gold + amount, bankGold: guild.bankGold - amount };
  }

  getShopStock(currentFloor: number = 5): Item[] {
    return this.itemService.getShopInventory(currentFloor);
  }
}
