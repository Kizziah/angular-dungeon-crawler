import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppSaveState } from './save.service';

/** HTTP client for all premium MMO REST endpoints. */
@Injectable({ providedIn: 'root' })
export class MmoService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Cloud saves ──────────────────────────────────────────────────────────

  listSaves(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/saves/`);
  }

  loadSave(slot: number): Observable<AppSaveState> {
    return this.http.get<AppSaveState>(`${this.API}/saves/${slot}/`);
  }

  uploadSave(slot: number, state: AppSaveState): Observable<any> {
    return this.http.put<any>(`${this.API}/saves/${slot}/`, {
      guild_state: state.guild,
      dungeon_state: state.dungeonState,
      overworld_state: state.overworldState,
      version: state.version,
    });
  }

  deleteSave(slot: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/saves/${slot}/delete/`);
  }

  // ── World / players ──────────────────────────────────────────────────────

  getOnlinePlayers(world: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/world/players/?world=${world}`);
  }

  // ── Dungeons ─────────────────────────────────────────────────────────────

  getDungeonInstances(world: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/world/dungeons/?world=${world}`);
  }

  createDungeonInstance(world: string, entranceX: number, entranceY: number): Observable<any> {
    return this.http.post<any>(`${this.API}/world/dungeons/`, {
      world, entrance_x: entranceX, entrance_y: entranceY,
    });
  }

  joinDungeonInstance(instanceId: number): Observable<any> {
    return this.http.post<any>(`${this.API}/world/dungeons/${instanceId}/join/`, {});
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  getChatHistory(room: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/chat/${room}/history/`);
  }

  // ── Trading ──────────────────────────────────────────────────────────────

  getPendingTrades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/trades/`);
  }

  sendTradeOffer(offer: {
    receiver: number;
    sender_gold: number;
    receiver_gold: number;
    sender_items: any[];
    receiver_items: any[];
    message: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.API}/trades/`, offer);
  }

  respondToTrade(tradeId: number, action: 'accept' | 'decline'): Observable<any> {
    return this.http.post<any>(`${this.API}/trades/${tradeId}/respond/`, { action });
  }

  cancelTrade(tradeId: number): Observable<void> {
    return this.http.post<void>(`${this.API}/trades/${tradeId}/cancel/`, {});
  }

  // ── Leaderboard ──────────────────────────────────────────────────────────

  getTopCharacters(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/leaderboard/characters/`);
  }

  getTopGuilds(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/leaderboard/guilds/`);
  }
}
