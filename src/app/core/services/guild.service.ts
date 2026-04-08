import { Injectable } from '@angular/core';
import { Character } from '../models/character.model';
import { GuildState } from '../models/guild.model';

@Injectable({ providedIn: 'root' })
export class GuildService {
  MAX_PARTY_SIZE = 6;

  addToParty(guild: GuildState, charId: string): GuildState {
    const partyCount = guild.characters.filter(c => c.inParty).length;
    if (partyCount >= this.MAX_PARTY_SIZE) return guild;
    return {
      ...guild,
      characters: guild.characters.map(c =>
        c.id === charId ? { ...c, inParty: true } : c
      )
    };
  }

  removeFromParty(guild: GuildState, charId: string): GuildState {
    return {
      ...guild,
      characters: guild.characters.map(c =>
        c.id === charId ? { ...c, inParty: false } : c
      )
    };
  }

  addCharacter(guild: GuildState, char: Character): GuildState {
    return { ...guild, characters: [...guild.characters, char] };
  }

  removeCharacter(guild: GuildState, charId: string): GuildState {
    return { ...guild, characters: guild.characters.filter(c => c.id !== charId) };
  }

  getParty(guild: GuildState): Character[] {
    return guild.characters.filter(c => c.inParty);
  }

  getAvailable(guild: GuildState): Character[] {
    return guild.characters.filter(c => !c.inParty);
  }
}
