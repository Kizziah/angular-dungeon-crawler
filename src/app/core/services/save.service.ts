import { Injectable } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class SaveService {
  private readonly VERSION = '1.0.0';
  private readonly KEY_PREFIX = 'mordor_save_';

  save(slot: number, state: AppSaveState): void {
    const key = `${this.KEY_PREFIX}${slot}`;
    localStorage.setItem(key, JSON.stringify({ ...state, timestamp: Date.now(), version: this.VERSION }));
  }

  load(slot: number): AppSaveState | null {
    const key = `${this.KEY_PREFIX}${slot}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

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
  }

  autoSave(state: AppSaveState): void {
    this.save(0, state);
  }
}
