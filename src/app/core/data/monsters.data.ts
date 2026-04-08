import { MonsterDef } from '../models/monster.model';

export const MONSTERS: MonsterDef[] = [
  // Floors 1-5
  {
    id: 'rat', name: 'Rat', symbol: '🐁💨', color: '#888888',
    hp: '1d4', ac: 12, attack: '1d2', attackCount: 1,
    abilities: [], xpReward: 5, goldMin: 0, goldMax: 2,
    floorMin: 1, floorMax: 3, description: 'A small rodent. Harmless but annoying.'
  },
  {
    id: 'giant-rat', name: 'Giant Rat', symbol: '🐀🟢', color: '#aaaaaa',
    hp: '2d4', ac: 13, attack: '1d4', attackCount: 1,
    abilities: ['poison'], xpReward: 15, goldMin: 0, goldMax: 5,
    floorMin: 1, floorMax: 5, description: 'A large rat the size of a dog. Its bite may poison.'
  },
  {
    id: 'kobold', name: 'Kobold', symbol: '🦎🗡️', color: '#cc6600',
    hp: '1d6', ac: 12, attack: '1d4', attackCount: 1,
    abilities: [], xpReward: 20, goldMin: 1, goldMax: 8,
    floorMin: 1, floorMax: 5, description: 'A small reptilian creature armed with a rusty blade.'
  },
  {
    id: 'goblin', name: 'Goblin', symbol: '👺🪙', color: '#00aa00',
    hp: '1d8', ac: 13, attack: '1d6', attackCount: 1,
    abilities: ['steal-gold'], xpReward: 30, goldMin: 2, goldMax: 15,
    floorMin: 1, floorMax: 6, description: 'A sneaky green creature with nimble fingers.'
  },
  {
    id: 'skeleton', name: 'Skeleton', symbol: '💀🦴', color: '#ffffff',
    hp: '2d6', ac: 13, attack: '1d6', attackCount: 1,
    abilities: [], xpReward: 35, goldMin: 0, goldMax: 10,
    floorMin: 2, floorMax: 7, description: 'An animated skeleton. Immune to poison and sleep.'
  },
  {
    id: 'orc', name: 'Orc', symbol: '👹⚔️', color: '#55aa00',
    hp: '2d8', ac: 14, attack: '1d8', attackCount: 1,
    abilities: [], xpReward: 45, goldMin: 5, goldMax: 20,
    floorMin: 2, floorMax: 8, description: 'A brutish humanoid warrior with an iron axe.'
  },
  // Floors 6-15
  {
    id: 'hobgoblin', name: 'Hobgoblin', symbol: '🪖👹', color: '#aa4400',
    hp: '3d8', ac: 15, attack: '1d8+1', attackCount: 1,
    abilities: [], xpReward: 65, goldMin: 8, goldMax: 30,
    floorMin: 4, floorMax: 10, description: 'A larger, more organized goblin warrior.'
  },
  {
    id: 'gnoll', name: 'Gnoll', symbol: '🐕‍🦺⚔️', color: '#aaaa00',
    hp: '3d8+3', ac: 15, attack: '1d8', attackCount: 2,
    abilities: [], xpReward: 80, goldMin: 10, goldMax: 35,
    floorMin: 5, floorMax: 12, description: 'A hyena-headed humanoid with multiple attacks.'
  },
  {
    id: 'zombie', name: 'Zombie', symbol: '🧟‍♂️🧠', color: '#558855',
    hp: '3d8+6', ac: 12, attack: '1d8', attackCount: 1,
    abilities: ['paralyze'], xpReward: 70, goldMin: 0, goldMax: 15,
    floorMin: 5, floorMax: 12, description: 'A rotting undead. Slow but its grip may paralyze.'
  },
  {
    id: 'ghoul', name: 'Ghoul', symbol: '🧟‍♀️💀', color: '#887755',
    hp: '2d8+2', ac: 14, attack: '1d6', attackCount: 3,
    abilities: ['paralyze'], xpReward: 100, goldMin: 5, goldMax: 20,
    floorMin: 6, floorMax: 14, description: 'A ravenous undead that claws for paralysis.'
  },
  {
    id: 'lizardman', name: 'Lizardman', symbol: '🦎🏹', color: '#008833',
    hp: '3d8', ac: 15, attack: '1d8+1', attackCount: 1,
    abilities: [], xpReward: 90, goldMin: 8, goldMax: 25,
    floorMin: 6, floorMax: 14, description: 'A bipedal reptile warrior with a spear.'
  },
  {
    id: 'giant-spider', name: 'Giant Spider', symbol: '🕸️🕷️', color: '#888844',
    hp: '2d8', ac: 14, attack: '1d6', attackCount: 1,
    abilities: ['poison'], xpReward: 85, goldMin: 0, goldMax: 10,
    floorMin: 5, floorMax: 14, description: 'An oversized spider. Its bite is venomous.'
  },
  {
    id: 'wolf', name: 'Wolf', symbol: '🐺🌙', color: '#aaaaaa',
    hp: '2d8+2', ac: 14, attack: '1d6', attackCount: 1,
    abilities: [], xpReward: 60, goldMin: 0, goldMax: 5,
    floorMin: 4, floorMax: 10, description: 'A large grey wolf. Fast and ferocious.'
  },
  {
    id: 'orc-chief', name: 'Orc Chief', symbol: '👹👑', color: '#55cc00',
    hp: '4d8+4', ac: 16, attack: '1d10+2', attackCount: 1,
    abilities: [], xpReward: 150, goldMin: 20, goldMax: 60,
    floorMin: 7, floorMax: 15, description: 'A powerful orc commanding lesser warriors.'
  },
  {
    id: 'ogre', name: 'Ogre', symbol: '🧌💥', color: '#886633',
    hp: '4d10+4', ac: 15, attack: '2d6', attackCount: 1,
    abilities: [], xpReward: 200, goldMin: 15, goldMax: 50,
    floorMin: 8, floorMax: 18, description: 'A massive humanoid with incredible strength.'
  },
  {
    id: 'troll', name: 'Troll', symbol: '🧌🌿', color: '#446644',
    hp: '5d10+10', ac: 16, attack: '1d8+2', attackCount: 2,
    abilities: [], xpReward: 300, goldMin: 20, goldMax: 80,
    floorMin: 12, floorMax: 22, description: 'A regenerating monster that attacks twice.'
  },
  // Floors 16-30
  {
    id: 'vampire-bat', name: 'Vampire Bat', symbol: '🦇🩸', color: '#880000',
    hp: '3d6', ac: 15, attack: '1d4', attackCount: 2,
    abilities: ['drain-level'], xpReward: 180, goldMin: 0, goldMax: 10,
    floorMin: 14, floorMax: 25, description: 'A large bat that drains life energy.'
  },
  {
    id: 'wight', name: 'Wight', symbol: '🧊👻', color: '#aaaaff',
    hp: '4d8+4', ac: 15, attack: '1d6', attackCount: 1,
    abilities: ['drain-level'], xpReward: 350, goldMin: 10, goldMax: 40,
    floorMin: 15, floorMax: 28, description: 'An undead spirit that drains experience levels.'
  },
  {
    id: 'wraith', name: 'Wraith', symbol: '💨👻', color: '#8888ff',
    hp: '5d8', ac: 16, attack: '1d6+1', attackCount: 1,
    abilities: ['drain-level'], xpReward: 450, goldMin: 15, goldMax: 50,
    floorMin: 18, floorMax: 32, description: 'A powerful undead. Only hit by magical weapons.'
  },
  {
    id: 'medusa', name: 'Medusa', symbol: '🐍👁️', color: '#00aa88',
    hp: '5d8+5', ac: 16, attack: '1d8', attackCount: 1,
    abilities: ['petrify'], xpReward: 500, goldMin: 30, goldMax: 100,
    floorMin: 20, floorMax: 35, description: 'Her gaze can turn adventurers to stone.'
  },
  {
    id: 'harpy', name: 'Harpy', symbol: '🦅💀', color: '#cc8800',
    hp: '4d8', ac: 15, attack: '1d6', attackCount: 2,
    abilities: [], xpReward: 280, goldMin: 10, goldMax: 45,
    floorMin: 16, floorMax: 28, description: 'A winged creature with enchanting voice.'
  },
  {
    id: 'minotaur', name: 'Minotaur', symbol: '🐂🪓', color: '#885533',
    hp: '6d10+6', ac: 16, attack: '2d6+3', attackCount: 1,
    abilities: [], xpReward: 450, goldMin: 25, goldMax: 90,
    floorMin: 18, floorMax: 30, description: 'A half-man, half-bull with a massive axe.'
  },
  {
    id: 'vampire', name: 'Vampire', symbol: '🧛🩸', color: '#cc0000',
    hp: '7d8+14', ac: 17, attack: '1d6+3', attackCount: 2,
    abilities: ['drain-level', 'cast-spell'], xpReward: 800, goldMin: 50, goldMax: 200,
    floorMin: 25, floorMax: 45, description: 'An undead noble of great power. Drains levels.'
  },
  // Floors 31-50
  {
    id: 'golem', name: 'Stone Golem', symbol: '🗿🛡️', color: '#888888',
    hp: '8d10+16', ac: 18, attack: '2d8+4', attackCount: 1,
    abilities: [], xpReward: 700, goldMin: 0, goldMax: 50,
    floorMin: 28, floorMax: 45, description: 'An animated stone construct immune to magic.'
  },
  {
    id: 'basilisk', name: 'Basilisk', symbol: '🐊👁️', color: '#558800',
    hp: '6d8+12', ac: 16, attack: '1d10', attackCount: 1,
    abilities: ['petrify'], xpReward: 750, goldMin: 20, goldMax: 80,
    floorMin: 30, floorMax: 48, description: 'Its gaze and breath can petrify the living.'
  },
  {
    id: 'demon', name: 'Demon', symbol: '😈🔥', color: '#cc2200',
    hp: '7d8+14', ac: 17, attack: '2d6+2', attackCount: 2,
    abilities: ['breathe-fire', 'cast-spell'], xpReward: 900, goldMin: 40, goldMax: 150,
    floorMin: 33, floorMax: 50, description: 'A denizen of the lower planes. Immune to fire.'
  },
  {
    id: 'giant', name: 'Hill Giant', symbol: '🏔️🦶', color: '#cc8833',
    hp: '8d10+24', ac: 16, attack: '2d8+6', attackCount: 1,
    abilities: [], xpReward: 850, goldMin: 50, goldMax: 200,
    floorMin: 30, floorMax: 50, description: 'A massive giant capable of crushing armor.'
  },
  {
    id: 'lich-apprentice', name: 'Lich Apprentice', symbol: '🧙💀', color: '#8888ff',
    hp: '6d8+6', ac: 16, attack: '1d6', attackCount: 1,
    abilities: ['cast-spell', 'drain-level'], xpReward: 1000, goldMin: 60, goldMax: 250,
    floorMin: 38, floorMax: 55, description: 'A student of the lich arts. Wields powerful spells.'
  },
  // Floors 51-75
  {
    id: 'greater-demon', name: 'Greater Demon', symbol: '👿🔥', color: '#ff2200',
    hp: '10d10+20', ac: 19, attack: '2d8+4', attackCount: 2,
    abilities: ['breathe-fire', 'cast-spell', 'drain-level'], xpReward: 1500, goldMin: 100, goldMax: 400,
    floorMin: 48, floorMax: 65, description: 'A powerful demon lord of the infernal realm.'
  },
  {
    id: 'dragon', name: 'Dragon', symbol: '🐉🔥', color: '#ff8800',
    hp: '12d10+24', ac: 20, attack: '2d10+5', attackCount: 2,
    abilities: ['breathe-fire'], xpReward: 2000, goldMin: 200, goldMax: 800,
    floorMin: 50, floorMax: 70, description: 'A fire-breathing dragon of fearsome power.'
  },
  {
    id: 'lich', name: 'Lich', symbol: '🧙‍♂️💀', color: '#aaaaff',
    hp: '10d8+30', ac: 19, attack: '2d6+3', attackCount: 1,
    abilities: ['cast-spell', 'drain-level', 'instant-kill'], xpReward: 2500, goldMin: 150, goldMax: 600,
    floorMin: 55, floorMax: 75, description: 'An undead archmage of terrible power.'
  },
  {
    id: 'death-knight', name: 'Death Knight', symbol: '🛡️💀', color: '#444488',
    hp: '10d10+20', ac: 20, attack: '2d8+6', attackCount: 2,
    abilities: ['drain-level', 'cast-spell'], xpReward: 2200, goldMin: 100, goldMax: 500,
    floorMin: 52, floorMax: 72, description: 'A fallen paladin reborn as an undead champion.'
  },
  {
    id: 'beholder-kin', name: 'Beholder-Kin', symbol: '👁️‍🗨️✨', color: '#00cccc',
    hp: '8d8+16', ac: 18, attack: '2d6', attackCount: 1,
    abilities: ['petrify', 'cast-spell', 'paralyze'], xpReward: 2800, goldMin: 80, goldMax: 350,
    floorMin: 58, floorMax: 76, description: 'A floating orb with many magical eye rays.'
  },
  // Floors 76-99
  {
    id: 'ancient-dragon', name: 'Ancient Dragon', symbol: '🐉⚡🔥', color: '#ff0000',
    hp: '16d10+48', ac: 22, attack: '3d10+8', attackCount: 3,
    abilities: ['breathe-fire', 'breathe-cold', 'instant-kill'], xpReward: 5000, goldMin: 500, goldMax: 2000,
    floorMin: 74, floorMax: 90, description: 'An ancient wyrm of catastrophic power.'
  },
  {
    id: 'arch-lich', name: 'Arch-Lich', symbol: '💀👑🔮', color: '#ff88ff',
    hp: '14d8+42', ac: 22, attack: '3d6+5', attackCount: 2,
    abilities: ['cast-spell', 'drain-level', 'instant-kill', 'paralyze'], xpReward: 6000, goldMin: 300, goldMax: 1500,
    floorMin: 78, floorMax: 95, description: 'The apex of undead arcane mastery.'
  },
  {
    id: 'demon-lord', name: 'Demon Lord', symbol: '👿👑🔥', color: '#ff0044',
    hp: '15d10+45', ac: 23, attack: '3d8+8', attackCount: 3,
    abilities: ['breathe-fire', 'cast-spell', 'drain-level', 'instant-kill'], xpReward: 7000, goldMin: 400, goldMax: 2000,
    floorMin: 80, floorMax: 98, description: 'A lord of the infernal abyss.'
  },
  {
    id: 'balrog', name: 'Balrog', symbol: '🔥⚡🪓', color: '#ff4400',
    hp: '18d10+54', ac: 24, attack: '3d10+10', attackCount: 2,
    abilities: ['breathe-fire', 'drain-level', 'instant-kill'], xpReward: 8000, goldMin: 500, goldMax: 2500,
    floorMin: 84, floorMax: 99, description: 'A demon of ancient power, wreathed in flames.'
  },
  {
    id: 'gorgon', name: 'Gorgon', symbol: '🐂💨🗿', color: '#884400',
    hp: '14d10+28', ac: 21, attack: '2d10+6', attackCount: 2,
    abilities: ['petrify', 'breathe-fire'], xpReward: 5500, goldMin: 200, goldMax: 1000,
    floorMin: 76, floorMax: 96, description: 'An iron bull that breathes petrifying gas.'
  },
  // Additional mid-level monsters for variety
  {
    id: 'werewolf', name: 'Werewolf', symbol: '🐺🌕', color: '#887733',
    hp: '5d8+10', ac: 16, attack: '1d8+2', attackCount: 2,
    abilities: ['poison'], xpReward: 400, goldMin: 15, goldMax: 60,
    floorMin: 18, floorMax: 32, description: 'A lycanthrope that transforms at night.'
  },
  {
    id: 'elemental-fire', name: 'Fire Elemental', symbol: '🔥🌋', color: '#ff6600',
    hp: '6d8+12', ac: 16, attack: '2d6', attackCount: 1,
    abilities: ['breathe-fire'], xpReward: 500, goldMin: 0, goldMax: 30,
    floorMin: 22, floorMax: 38, description: 'A creature made of living flame.'
  },
  {
    id: 'shadow', name: 'Shadow', symbol: '🌑👤', color: '#334433',
    hp: '3d8', ac: 15, attack: '1d6', attackCount: 1,
    abilities: ['drain-level'], xpReward: 250, goldMin: 0, goldMax: 20,
    floorMin: 14, floorMax: 26, description: 'A creature of darkness that saps strength.'
  },
  {
    id: 'cyclops', name: 'Cyclops', symbol: '👁️⚡', color: '#cc6600',
    hp: '7d10+14', ac: 15, attack: '2d8+5', attackCount: 1,
    abilities: [], xpReward: 600, goldMin: 30, goldMax: 120,
    floorMin: 24, floorMax: 42, description: 'A one-eyed giant who hurls boulders.'
  },
  {
    id: 'manticore', name: 'Manticore', symbol: '🦁🦂', color: '#cc4400',
    hp: '6d10+12', ac: 17, attack: '1d8+2', attackCount: 3,
    abilities: ['poison'], xpReward: 650, goldMin: 20, goldMax: 100,
    floorMin: 28, floorMax: 45, description: 'A lion-man with a venomous tail spike.'
  },
  {
    id: 'ice-golem', name: 'Ice Golem', symbol: '🏔️❄️', color: '#aaddff',
    hp: '9d10+18', ac: 18, attack: '2d8+3', attackCount: 1,
    abilities: ['breathe-cold'], xpReward: 800, goldMin: 0, goldMax: 60,
    floorMin: 35, floorMax: 55, description: 'A golem of magical ice. Breathes cold.'
  },
  {
    id: 'chimera', name: 'Chimera', symbol: '🐉🦁🐐', color: '#ff8800',
    hp: '8d10+16', ac: 17, attack: '2d6+3', attackCount: 3,
    abilities: ['breathe-fire'], xpReward: 1100, goldMin: 60, goldMax: 250,
    floorMin: 40, floorMax: 58, description: 'A three-headed beast: lion, goat, and dragon.'
  },
  {
    id: 'pit-fiend', name: 'Pit Fiend', symbol: '👿⚔️🔥', color: '#cc0000',
    hp: '12d10+24', ac: 20, attack: '2d8+5', attackCount: 2,
    abilities: ['breathe-fire', 'cast-spell', 'poison'], xpReward: 3000, goldMin: 150, goldMax: 600,
    floorMin: 60, floorMax: 80, description: 'A massive demon general of the pit.'
  },
  {
    id: 'spectral-knight', name: 'Spectral Knight', symbol: '⚔️👻', color: '#8888cc',
    hp: '8d8+16', ac: 18, attack: '2d6+4', attackCount: 2,
    abilities: ['drain-level'], xpReward: 1800, goldMin: 80, goldMax: 350,
    floorMin: 45, floorMax: 65, description: 'A ghostly warrior in ethereal plate armor.'
  },
  {
    id: 'frost-giant', name: 'Frost Giant', symbol: '❄️🧌', color: '#aaddff',
    hp: '10d10+30', ac: 17, attack: '3d6+8', attackCount: 1,
    abilities: ['breathe-cold'], xpReward: 1600, goldMin: 100, goldMax: 450,
    floorMin: 48, floorMax: 68, description: 'A giant from the frozen north.'
  },
  {
    id: 'djinn', name: 'Djinn', symbol: '🌪️💫', color: '#8888ff',
    hp: '7d8+14', ac: 17, attack: '2d8+2', attackCount: 1,
    abilities: ['cast-spell'], xpReward: 1200, goldMin: 70, goldMax: 300,
    floorMin: 42, floorMax: 60, description: 'A powerful wind spirit from another plane.'
  }
];
