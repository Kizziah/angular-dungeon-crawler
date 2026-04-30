export type ItemType = 'Weapon' | 'Shield' | 'Helmet' | 'BodyArmor' | 'Gloves' | 'Boots' | 'Ring' | 'Amulet' | 'Potion' | 'Scroll' | 'Wand' | 'Food' | 'Gold' | 'Pet';

export interface ItemStats {
  attack?: number;
  damage?: string;
  defense?: number;
  hpBonus?: number;
  mpBonus?: number;
  strBonus?: number;
  intBonus?: number;
  pietyBonus?: number;
  vitBonus?: number;
  agiBonus?: number;
  luckBonus?: number;
}

export interface Item {
  id: string;
  definitionId: string;
  name: string;
  unidentifiedName: string;
  identified: boolean;
  type: ItemType;
  stats: ItemStats;
  cursed: boolean;
  value: number;
  quantity: number;
  usable: boolean;
  effect?: string;
  floorMin: number;
  floorMax: number;
}
