import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/guild', pathMatch: 'full' },
  { path: 'guild', loadComponent: () => import('./features/guild/guild.component').then(m => m.GuildComponent) },
  { path: 'overworld', loadComponent: () => import('./features/overworld/overworld.component').then(m => m.OverworldComponent) },
  { path: 'worldmap', loadComponent: () => import('./features/worldmap/worldmap.component').then(m => m.WorldMapComponent) },
  { path: 'alefgard', loadComponent: () => import('./features/alefgard/alefgard.component').then(m => m.AlefgardComponent) },
  { path: 'alefgard-map', loadComponent: () => import('./features/alefgard-map/alefgard-map.component').then(m => m.AlefgardMapComponent) },
  { path: 'mystara', loadComponent: () => import('./features/mystara/mystara.component').then(m => m.MystaraComponent) },
  { path: 'create-character', loadComponent: () => import('./features/character-creation/character-creation.component').then(m => m.CharacterCreationComponent) },
  { path: 'town', loadComponent: () => import('./features/town/town.component').then(m => m.TownComponent) },
  { path: 'town/inn', loadComponent: () => import('./features/town/inn.component').then(m => m.InnComponent) },
  { path: 'town/shop', loadComponent: () => import('./features/town/shop.component').then(m => m.ShopComponent) },
  { path: 'town/temple', loadComponent: () => import('./features/town/temple.component').then(m => m.TempleComponent) },
  { path: 'town/training', loadComponent: () => import('./features/town/training-hall.component').then(m => m.TrainingHallComponent) },
  { path: 'town/bank', loadComponent: () => import('./features/town/bank.component').then(m => m.BankComponent) },
  { path: 'town/library', loadComponent: () => import('./features/town/library.component').then(m => m.LibraryComponent) },
  { path: 'dungeon', loadComponent: () => import('./features/dungeon/dungeon.component').then(m => m.DungeonComponent) },
  { path: 'combat', loadComponent: () => import('./features/combat/combat.component').then(m => m.CombatComponent) },
  { path: 'inventory/:id', loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent) },
];
