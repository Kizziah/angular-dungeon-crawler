import { Component, HostListener, inject, Input, OnChanges, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { CharacterService } from '../../core/services/character.service';
import { Character, Equipment } from '../../core/models/character.model';
import { Item } from '../../core/models/item.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit, OnChanges {
  private gameState = inject(GameStateService);
  private charService = inject(CharacterService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** When set, the component works as an embedded panel instead of a routed page */
  @Input() embeddedCharId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() itemDragStart = new EventEmitter<{ item: Item; fromCharId: string }>();
  @Output() itemDragEnd = new EventEmitter<void>();

  character: Character | null = null;
  selectedItem: Item | null = null;
  message = '';
  returnTo = '/guild';

  /** Groups identical items (same definitionId + identified + cursed) for stacked display. */
  get stackedInventory(): { item: Item; quantity: number }[] {
    const stacks = new Map<string, { item: Item; quantity: number }>();
    for (const item of this.character?.inventory ?? []) {
      const key = `${item.definitionId}|${item.identified}|${item.cursed}`;
      if (stacks.has(key)) {
        stacks.get(key)!.quantity += item.quantity;
      } else {
        stacks.set(key, { item, quantity: item.quantity });
      }
    }
    return Array.from(stacks.values());
  }

  equipmentSlots: (keyof Equipment)[] = ['weapon', 'shield', 'helmet', 'bodyArmor', 'gloves', 'boots', 'ring', 'amulet'];

  get isEmbedded(): boolean { return this.embeddedCharId !== null; }

  ngOnInit(): void {
    this.loadCharacter();
  }

  ngOnChanges(): void {
    this.loadCharacter();
    this.message = '';
  }

  private loadCharacter(): void {
    if (this.embeddedCharId) {
      this.character = this.gameState.guild().characters.find(c => c.id === this.embeddedCharId) || null;
    } else {
      const id = this.route.snapshot.paramMap.get('id');
      this.character = this.gameState.guild().characters.find(c => c.id === id) || null;
      const ret = this.route.snapshot.queryParamMap.get('returnTo');
      if (ret === 'dungeon') this.returnTo = '/dungeon';
    }
  }

  equip(item: Item): void {
    if (!this.character) return;
    const slot = this.charService.getEquipmentSlot(item.type);
    if (!slot) {
      this.message = 'Cannot equip this item type.';
      return;
    }
    const updated = this.charService.equipItem(this.character, item);
    this.saveChar(updated);
    this.message = `Equipped ${item.identified ? item.name : item.unidentifiedName}!`;
  }

  unequip(slot: keyof Equipment): void {
    if (!this.character) return;
    const updated = this.charService.unequipItem(this.character, slot);
    this.saveChar(updated);
    this.message = `Unequipped ${slot}.`;
  }

  drop(item: Item): void {
    if (!this.character) return;
    const updated = { ...this.character, inventory: this.character.inventory.filter(i => i.id !== item.id) };
    this.saveChar(updated);
    this.message = `Dropped ${item.identified ? item.name : item.unidentifiedName}.`;
  }

  private saveChar(char: Character): void {
    this.character = char;
    this.gameState.updateGuild(g => ({
      ...g,
      characters: g.characters.map(c => c.id === char.id ? char : c)
    }));
  }

  onDragStart(event: DragEvent, item: Item): void {
    if (!this.character) return;
    event.dataTransfer?.setData('text/plain', JSON.stringify({ itemId: item.id, fromCharId: this.character.id }));
    this.itemDragStart.emit({ item, fromCharId: this.character.id });
  }

  onDragEnd(): void {
    this.itemDragEnd.emit();
  }

  /** Remove an item (called by dungeon when dropped onto another character) */
  removeItem(itemId: string): void {
    if (!this.character) return;
    const updated = { ...this.character, inventory: this.character.inventory.filter(i => i.id !== itemId) };
    this.saveChar(updated);
  }

  canEquip(item: Item): boolean {
    return this.charService.getEquipmentSlot(item.type) !== null;
  }

  getSlotLabel(slot: keyof Equipment): string {
    const labels: Record<string, string> = {
      weapon: 'Weapon', shield: 'Shield', helmet: 'Helmet',
      bodyArmor: 'Armor', gloves: 'Gloves', boots: 'Boots',
      ring: 'Ring', amulet: 'Amulet'
    };
    return labels[slot] || slot;
  }

  getItemDisplay(item: Item): string {
    return item.identified ? item.name : item.unidentifiedName;
  }

  statKeys(): (keyof import('../../core/models/character.model').Stats)[] {
    return ['strength', 'intelligence', 'piety', 'vitality', 'agility', 'luck'];
  }

  statLabel(key: string): string {
    const map: Record<string, string> = {
      strength: 'STR', intelligence: 'INT', piety: 'PIE',
      vitality: 'VIT', agility: 'AGI', luck: 'LCK'
    };
    return map[key] || key.slice(0, 3).toUpperCase();
  }

  getAttackBonusStr(): string {
    if (!this.character) return '+0';
    const b = this.charService.calcAttackBonus(this.character);
    return b >= 0 ? `+${b}` : `${b}`;
  }

  getWeaponDamageStr(): string {
    if (!this.character) return '1d4';
    return this.charService.getWeaponDamage(this.character);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape') this.back();
  }

  back(): void {
    if (this.isEmbedded) {
      this.close.emit();
    } else {
      this.router.navigate([this.returnTo]);
    }
  }
}
