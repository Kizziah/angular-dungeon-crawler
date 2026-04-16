import { Injectable } from '@angular/core';
import { Observable, of, tap, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { MmoService } from './mmo.service';

export interface AppSaveState {
  guild: any;
  dungeonState: any;
  overworldState?: any;
  timestamp: number;
  version: string;
}

export interface SaveSlotInfo {
  slot: number;
  name: string;
  timestamp: number;
  exists: boolean;
}

/**
 * SaveService transparently switches between:
 *  - localStorage  (free / logged-out users)
 *  - Django cloud  (premium users)
 *
 * All callers continue to use the same API; the premium path is additive.
 */
@Injectable({ providedIn: 'root' })
export class SaveService {
  private readonly VERSION = '1.0.0';
  private readonly KEY_PREFIX = 'mordor_save_';

  constructor(private auth: AuthService, private mmo: MmoService) {}

  // ── Write ─────────────────────────────────────────────────────────────────

  save(slot: number, state: AppSaveState): void {
    const full = { ...state, timestamp: Date.now(), version: this.VERSION };
    // Always write localStorage as a local backup
    localStorage.setItem(`${this.KEY_PREFIX}${slot}`, JSON.stringify(full));

    if (this.auth.isPremium()) {
      this.mmo.uploadSave(slot, full).pipe(catchError(() => of(null))).subscribe();
    }
  }

  autoSave(state: AppSaveState): void {
    this.save(0, state);
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  load(slot: number): AppSaveState | null {
    return this._loadLocal(slot);
  }

  /** Load from cloud and sync to localStorage, then return the state. */
  loadFromCloud(slot: number): Observable<AppSaveState | null> {
    if (!this.auth.isPremium()) return of(this._loadLocal(slot));

    return this.mmo.loadSave(slot).pipe(
      tap(remote => {
        if (remote) {
          const mapped: AppSaveState = {
            guild: (remote as any).guild_state,
            dungeonState: (remote as any).dungeon_state,
            overworldState: (remote as any).overworld_state,
            timestamp: new Date((remote as any).updated_at).getTime(),
            version: (remote as any).version,
          };
          // Sync cloud save into localStorage so offline play still works
          localStorage.setItem(`${this.KEY_PREFIX}${slot}`, JSON.stringify(mapped));
        }
      }),
      catchError(() => of(this._loadLocal(slot))),
    ) as Observable<AppSaveState | null>;
  }

  // ── Listing / deleting ────────────────────────────────────────────────────

  listSlots(): SaveSlotInfo[] {
    const slots: SaveSlotInfo[] = [];
    for (let i = 0; i <= 3; i++) {
      const raw = localStorage.getItem(`${this.KEY_PREFIX}${i}`);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          slots.push({ slot: i, name: i === 0 ? 'Auto Save' : `Slot ${i}`, timestamp: data.timestamp, exists: true });
        } catch {
          slots.push({ slot: i, name: i === 0 ? 'Auto Save' : `Slot ${i}`, timestamp: 0, exists: false });
        }
      } else {
        slots.push({ slot: i, name: i === 0 ? 'Auto Save' : `Slot ${i}`, timestamp: 0, exists: false });
      }
    }
    return slots;
  }

  deleteSave(slot: number): void {
    localStorage.removeItem(`${this.KEY_PREFIX}${slot}`);
    if (this.auth.isPremium()) {
      this.mmo.deleteSave(slot).pipe(catchError(() => of(null))).subscribe();
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _loadLocal(slot: number): AppSaveState | null {
    const raw = localStorage.getItem(`${this.KEY_PREFIX}${slot}`);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
}
