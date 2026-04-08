import { Character } from './character.model';

export interface GuildState {
  characters: Character[];
  gold: number;
  bankGold: number;
  name: string;
  founded: number;
}

export interface SaveSlot {
  id: number;
  name: string;
  timestamp: number;
  guild: GuildState;
}
