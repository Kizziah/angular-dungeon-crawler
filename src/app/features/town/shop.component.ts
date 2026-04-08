import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { TownService } from '../../core/services/town.service';
import { Item } from '../../core/models/item.model';
import { Character } from '../../core/models/character.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
  private gameState = inject(GameStateService);
  private townService = inject(TownService);
  private router = inject(Router);

  guild = this.gameState.guild;
  party = this.gameState.activeParty;
  shopInventory: Item[] = [];
  selectedShopItem: Item | null = null;
  selectedChar: Character | null = null;
  message = '';
  tab: 'buy' | 'sell' = 'buy';

  ngOnInit(): void {
    this.shopInventory = this.townService.getShopStock(5);
    if (this.party().length > 0) {
      this.selectedChar = this.party()[0];
    }
  }

  selectShopItem(item: Item): void {
    this.selectedShopItem = item;
  }

  buy(): void {
    if (!this.selectedShopItem || !this.selectedChar) return;
    const result = this.townService.shopBuy(this.selectedChar, this.selectedShopItem, this.guild().gold);
    if (!result.success) {
      this.message = `Not enough gold! Need ${this.selectedShopItem.value} gp.`;
      return;
    }
    const charId = this.selectedChar.id;
    this.gameState.updateGuild(g => ({
      ...g,
      gold: result.newGold,
      characters: g.characters.map(c => c.id === charId ? result.newChar : c)
    }));
    this.selectedChar = result.newChar;
    this.message = `Bought ${this.selectedShopItem.name} for ${this.selectedShopItem.value} gp!`;
  }

  sell(item: Item): void {
    if (!this.selectedChar) return;
    const result = this.townService.shopSell(this.selectedChar, item);
    const charId = this.selectedChar.id;
    this.gameState.updateGuild(g => ({
      ...g,
      gold: g.gold + result.gold,
      characters: g.characters.map(c => c.id === charId ? result.newChar : c)
    }));
    this.selectedChar = result.newChar;
    this.message = `Sold for ${result.gold} gp!`;
  }

  selectChar(char: Character): void {
    this.selectedChar = this.gameState.guild().characters.find(c => c.id === char.id) || char;
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape') this.back();
  }

    back(): void {
    this.router.navigate(['/town']);
  }

  getItemTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      Weapon: '⚔', Shield: '🛡', Helmet: '⛑', BodyArmor: '🥋',
      Gloves: '🧤', Boots: '👢', Ring: '💍', Amulet: '📿',
      Potion: '🧪', Scroll: '📜', Food: '🍖', Wand: '🪄'
    };
    return icons[type] || '?';
  }

  getCharInventory(): Item[] {
    if (!this.selectedChar) return [];
    const char = this.guild().characters.find(c => c.id === this.selectedChar!.id);
    return char?.inventory || [];
  }
}
