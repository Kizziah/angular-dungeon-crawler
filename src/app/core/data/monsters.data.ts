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
  },

  // ── Westeros / Game of Thrones ──────────────────────────────────────────────
  {
    id: 'direwolf', name: 'Direwolf', symbol: '🐺❄️', color: '#cccccc',
    hp: '3d8+6', ac: 15, attack: '1d8+2', attackCount: 1,
    abilities: [], xpReward: 120, goldMin: 0, goldMax: 8,
    floorMin: 3, floorMax: 12, description: 'A massive wolf as large as a horse, the sigil beast of House Stark.'
  },
  {
    id: 'wildling', name: 'Wildling', symbol: '🏔️🗡️', color: '#886633',
    hp: '2d8+2', ac: 13, attack: '1d6+1', attackCount: 1,
    abilities: [], xpReward: 55, goldMin: 2, goldMax: 18,
    floorMin: 2, floorMax: 10, description: 'A fierce raider from beyond the Wall, hardened by the frozen wilderness.'
  },
  {
    id: 'white-walker', name: 'White Walker', symbol: '🧊💀', color: '#aaddff',
    hp: '5d8+10', ac: 17, attack: '1d8+2', attackCount: 1,
    abilities: ['drain-level', 'breathe-cold'], xpReward: 550, goldMin: 5, goldMax: 30,
    floorMin: 15, floorMax: 35, description: 'An ancient ice undead general. Its touch drains life and freezes the soul.'
  },
  {
    id: 'wight-walker', name: 'Wight', symbol: '💀🧊', color: '#88aacc',
    hp: '3d8+6', ac: 14, attack: '1d6+1', attackCount: 1,
    abilities: ['paralyze'], xpReward: 200, goldMin: 0, goldMax: 15,
    floorMin: 12, floorMax: 28, description: 'A dead soldier reanimated by the cold magic of the White Walkers.'
  },
  {
    id: 'faceless-assassin', name: 'Faceless Assassin', symbol: '🎭🗡️', color: '#444444',
    hp: '4d8', ac: 16, attack: '1d6+3', attackCount: 2,
    abilities: ['poison', 'instant-kill'], xpReward: 650, goldMin: 30, goldMax: 100,
    floorMin: 20, floorMax: 40, description: 'A servant of the Many-Faced God. Strikes from the shadows with deadly precision.'
  },
  {
    id: 'mountain-clansman', name: 'Mountain Clansman', symbol: '⛰️⚔️', color: '#887755',
    hp: '3d10+6', ac: 15, attack: '1d10+2', attackCount: 1,
    abilities: [], xpReward: 175, goldMin: 10, goldMax: 40,
    floorMin: 5, floorMax: 18, description: 'A rugged hill warrior from the Vale clans, clad in rough hides.'
  },
  {
    id: 'maester', name: 'Maester', symbol: '📜🔗', color: '#886688',
    hp: '3d6+3', ac: 13, attack: '1d6', attackCount: 1,
    abilities: ['cast-spell'], xpReward: 220, goldMin: 20, goldMax: 70,
    floorMin: 8, floorMax: 22, description: 'A learned scholar of the Citadel who wields subtle and dangerous magic.'
  },
  {
    id: 'kingsguard', name: 'Kingsguard', symbol: '🛡️⚔️', color: '#ffffff',
    hp: '5d10+10', ac: 19, attack: '1d10+4', attackCount: 1,
    abilities: [], xpReward: 500, goldMin: 40, goldMax: 150,
    floorMin: 18, floorMax: 35, description: 'An elite knight in white plate armor. Among the finest swords in the realm.'
  },
  {
    id: 'dothraki-rider', name: 'Dothraki Rider', symbol: '🐎⚔️', color: '#cc8833',
    hp: '3d8+3', ac: 14, attack: '1d8+1', attackCount: 2,
    abilities: [], xpReward: 250, goldMin: 15, goldMax: 55,
    floorMin: 10, floorMax: 25, description: 'A fearsome horse-lord warrior of the Dothraki sea. Strikes twice with curved arakh.'
  },
  {
    id: 'shadowcat', name: 'Shadowcat', symbol: '🐆🌑', color: '#222244',
    hp: '2d8+4', ac: 15, attack: '1d6+1', attackCount: 2,
    abilities: [], xpReward: 130, goldMin: 0, goldMax: 10,
    floorMin: 4, floorMax: 14, description: 'A large black predatory cat with a white stripe. Hunts silently from the shadows.'
  },

  // ── Alefgard / Dragon Warrior ───────────────────────────────────────────────
  {
    id: 'slime', name: 'Slime', symbol: '💧😊', color: '#4488ff',
    hp: '1d4+1', ac: 11, attack: '1d3', attackCount: 1,
    abilities: [], xpReward: 8, goldMin: 1, goldMax: 4,
    floorMin: 1, floorMax: 4, description: 'A cheerful blue blob. Weak but unexpectedly resilient.'
  },
  {
    id: 'drakee', name: 'Drakee', symbol: '🦇🔴', color: '#cc4466',
    hp: '1d6+1', ac: 12, attack: '1d4', attackCount: 1,
    abilities: [], xpReward: 12, goldMin: 1, goldMax: 6,
    floorMin: 1, floorMax: 6, description: 'A small bat-like dragon that swoops at adventurers in dark corridors.'
  },
  {
    id: 'ghost-dq', name: 'Ghost', symbol: '👻💜', color: '#bb88ff',
    hp: '2d6+2', ac: 13, attack: '1d6', attackCount: 1,
    abilities: ['petrify'], xpReward: 75, goldMin: 0, goldMax: 12,
    floorMin: 3, floorMax: 10, description: 'A floating spirit that can freeze enemies with supernatural terror.'
  },
  {
    id: 'magician-dq', name: 'Magician', symbol: '🧙🪄', color: '#cc6688',
    hp: '2d8+2', ac: 13, attack: '1d6', attackCount: 1,
    abilities: ['cast-spell'], xpReward: 110, goldMin: 10, goldMax: 35,
    floorMin: 5, floorMax: 15, description: 'A robed spellcaster whose arcane bolts punch through armor.'
  },
  {
    id: 'metal-slime', name: 'Metal Slime', symbol: '🪙😐', color: '#ccccdd',
    hp: '1d2', ac: 20, attack: '1d3', attackCount: 1,
    abilities: ['steal-gold'], xpReward: 1000, goldMin: 50, goldMax: 200,
    floorMin: 5, floorMax: 20, description: 'A tiny silver slime nearly impossible to hit. Flees instantly, but worth a fortune.'
  },
  {
    id: 'scorpion', name: 'Scorpion', symbol: '🦂🟡', color: '#ccaa00',
    hp: '2d6+2', ac: 14, attack: '1d6', attackCount: 1,
    abilities: ['poison'], xpReward: 90, goldMin: 0, goldMax: 15,
    floorMin: 4, floorMax: 12, description: 'A large desert scorpion with a venomous sting.'
  },
  {
    id: 'wyvern', name: 'Wyvern', symbol: '🐉💨', color: '#669933',
    hp: '5d10+10', ac: 16, attack: '1d10+3', attackCount: 2,
    abilities: ['breathe-fire'], xpReward: 500, goldMin: 20, goldMax: 90,
    floorMin: 15, floorMax: 30, description: 'A two-legged dragon-kin that breathes gouts of flame.'
  },
  {
    id: 'golem-dq', name: 'Golem', symbol: '🗿⚙️', color: '#886644',
    hp: '7d10+14', ac: 18, attack: '2d8+3', attackCount: 1,
    abilities: [], xpReward: 700, goldMin: 0, goldMax: 40,
    floorMin: 20, floorMax: 40, description: 'A clay guardian immune to magic, animated by an ancient alchemical process.'
  },
  {
    id: 'dragonlord-knight', name: 'Dragonlord Knight', symbol: '⚔️🐉', color: '#882200',
    hp: '8d10+16', ac: 19, attack: '2d8+5', attackCount: 1,
    abilities: ['drain-level'], xpReward: 1100, goldMin: 60, goldMax: 250,
    floorMin: 35, floorMax: 55, description: 'An armored champion in service to the Dragonlord. His black blade drains life.'
  },
  {
    id: 'stoneman', name: 'Stoneman', symbol: '🪨💪', color: '#998877',
    hp: '6d10+12', ac: 17, attack: '2d8+4', attackCount: 1,
    abilities: [], xpReward: 600, goldMin: 10, goldMax: 80,
    floorMin: 25, floorMax: 45, description: 'A massive earth elemental humanoid of the deep dungeon.'
  },

  // ── Mystara / D&D Known World ───────────────────────────────────────────────
  {
    id: 'gnome', name: 'Gnome', symbol: '🧑‍🔧💎', color: '#886633',
    hp: '1d8+1', ac: 13, attack: '1d6', attackCount: 1,
    abilities: ['steal-gold'], xpReward: 60, goldMin: 5, goldMax: 25,
    floorMin: 5, floorMax: 15, description: 'A small earth creature with nimble hands. Quick to pilfer a coin purse.'
  },
  {
    id: 'bugbear', name: 'Bugbear', symbol: '🐻⚔️', color: '#886633',
    hp: '3d8+6', ac: 15, attack: '1d8+2', attackCount: 1,
    abilities: [], xpReward: 160, goldMin: 8, goldMax: 35,
    floorMin: 8, floorMax: 20, description: 'A large, stealthy goblinoid that ambushes from the darkness.'
  },
  {
    id: 'centaur', name: 'Centaur', symbol: '🏇🏹', color: '#cc9966',
    hp: '4d8+4', ac: 15, attack: '1d6+2', attackCount: 2,
    abilities: [], xpReward: 280, goldMin: 10, goldMax: 50,
    floorMin: 10, floorMax: 25, description: 'A horse-man warrior that attacks twice with hooves and bow.'
  },
  {
    id: 'blink-dog', name: 'Blink Dog', symbol: '🐕✨', color: '#ccaa66',
    hp: '2d8+2', ac: 16, attack: '1d6', attackCount: 1,
    abilities: [], xpReward: 140, goldMin: 0, goldMax: 8,
    floorMin: 6, floorMax: 18, description: 'A teleporting canine that vanishes mid-combat, reappearing to attack from behind.'
  },
  {
    id: 'rust-monster', name: 'Rust Monster', symbol: '🦞🔧', color: '#cc8844',
    hp: '4d8', ac: 16, attack: '1d6', attackCount: 1,
    abilities: ['steal-gold'], xpReward: 300, goldMin: 0, goldMax: 30,
    floorMin: 12, floorMax: 28, description: 'Its antennae corrode metal on contact, destroying weapons and armor.'
  },
  {
    id: 'rakshasa', name: 'Rakshasa', symbol: '🐯🔮', color: '#cc6622',
    hp: '7d8+14', ac: 17, attack: '2d6+2', attackCount: 1,
    abilities: ['cast-spell', 'petrify'], xpReward: 900, goldMin: 60, goldMax: 250,
    floorMin: 30, floorMax: 55, description: 'A tiger-headed demon noble who weaves illusions and hardens enemies to stone.'
  },
  {
    id: 'mind-flayer', name: 'Mind Flayer', symbol: '🪸🧠', color: '#9955bb',
    hp: '8d8+16', ac: 17, attack: '2d4', attackCount: 4,
    abilities: ['drain-level'], xpReward: 1300, goldMin: 80, goldMax: 300,
    floorMin: 35, floorMax: 60, description: 'A tentacled psionic horror. Four attacks drain life as it devours minds.'
  },
  {
    id: 'displacer-beast', name: 'Displacer Beast', symbol: '🐆👁️', color: '#334488',
    hp: '5d10+10', ac: 19, attack: '1d8+2', attackCount: 2,
    abilities: [], xpReward: 500, goldMin: 15, goldMax: 70,
    floorMin: 18, floorMax: 38, description: 'A panther-like beast with two tentacles. Appears to be where it is not.'
  },
  {
    id: 'owlbear', name: 'Owlbear', symbol: '🦉🐻', color: '#886633',
    hp: '5d8+10', ac: 15, attack: '1d8+3', attackCount: 2,
    abilities: [], xpReward: 360, goldMin: 5, goldMax: 40,
    floorMin: 12, floorMax: 28, description: 'A ferocious hybrid of owl and bear. Attacks with razor talons twice.'
  },
  {
    id: 'treant', name: 'Treant', symbol: '🌳🤜', color: '#448833',
    hp: '6d10+18', ac: 17, attack: '2d6+4', attackCount: 2,
    abilities: [], xpReward: 600, goldMin: 0, goldMax: 50,
    floorMin: 15, floorMax: 35, description: 'A living tree of immense strength. Its bark-covered fists crush stone.'
  },
  {
    id: 'naga', name: 'Naga', symbol: '🐍🔮', color: '#226644',
    hp: '6d8+12', ac: 16, attack: '1d8+2', attackCount: 1,
    abilities: ['poison', 'cast-spell'], xpReward: 700, goldMin: 30, goldMax: 130,
    floorMin: 22, floorMax: 42, description: 'A serpent with a human-like head. Combines venomous bites with arcane magic.'
  },
  {
    id: 'gargoyle', name: 'Gargoyle', symbol: '🗿🦇', color: '#888899',
    hp: '4d8+8', ac: 17, attack: '1d6+1', attackCount: 2,
    abilities: [], xpReward: 320, goldMin: 0, goldMax: 35,
    floorMin: 14, floorMax: 30, description: 'A winged stone creature that lurks on cornices, immune to non-magical weapons.'
  },

  // ── Hyrule / Zelda ─────────────────────────────────────────────────────────
  {
    id: 'bokoblin', name: 'Bokoblin', symbol: '👺🏏', color: '#cc4466',
    hp: '1d6+1', ac: 12, attack: '1d4+1', attackCount: 1,
    abilities: [], xpReward: 18, goldMin: 1, goldMax: 8,
    floorMin: 1, floorMax: 5, description: 'A weak pink goblin-like creature armed with a crude bone club.'
  },
  {
    id: 'moblin', name: 'Moblin', symbol: '🐷🔱', color: '#aa6633',
    hp: '2d8+4', ac: 14, attack: '1d8+1', attackCount: 1,
    abilities: [], xpReward: 70, goldMin: 3, goldMax: 20,
    floorMin: 3, floorMax: 12, description: 'A pig-snouted soldier armed with a long spear. Patrols dungeon corridors.'
  },
  {
    id: 'keese', name: 'Keese', symbol: '🦇🔥', color: '#ff6600',
    hp: '1d4+2', ac: 14, attack: '1d4', attackCount: 1,
    abilities: ['breathe-fire'], xpReward: 22, goldMin: 0, goldMax: 5,
    floorMin: 2, floorMax: 8, description: 'A bat that flits through dungeon air with wings sheathed in flame.'
  },
  {
    id: 'lizalfos', name: 'Lizalfos', symbol: '🦎⚡', color: '#33aa55',
    hp: '3d8+6', ac: 16, attack: '1d8+2', attackCount: 1,
    abilities: [], xpReward: 190, goldMin: 8, goldMax: 35,
    floorMin: 8, floorMax: 20, description: 'An agile lizard warrior that leaps across the battlefield with frightening speed.'
  },
  {
    id: 'stalfos', name: 'Stalfos', symbol: '💀⚔️', color: '#ccccaa',
    hp: '4d8+8', ac: 17, attack: '1d8+3', attackCount: 1,
    abilities: ['drain-level'], xpReward: 370, goldMin: 10, goldMax: 45,
    floorMin: 10, floorMax: 25, description: 'A skeleton knight reborn in darkness. Its blade saps the life of those it strikes.'
  },
  {
    id: 'peahat', name: 'Peahat', symbol: '🌀🌿', color: '#44aa44',
    hp: '2d8+4', ac: 15, attack: '1d6+1', attackCount: 1,
    abilities: ['paralyze'], xpReward: 150, goldMin: 0, goldMax: 20,
    floorMin: 5, floorMax: 15, description: 'A spinning plant-blade that whirls across the floor, numbing those it strikes.'
  },
  {
    id: 'wizzrobe', name: 'Wizzrobe', symbol: '🧙‍♂️⚡', color: '#8844cc',
    hp: '3d8+6', ac: 16, attack: '1d8+2', attackCount: 1,
    abilities: ['cast-spell'], xpReward: 350, goldMin: 25, goldMax: 80,
    floorMin: 12, floorMax: 30, description: 'A teleporting wizard in a pointed hat. Vanishes and reappears to hurl magic bolts.'
  },
  {
    id: 'darknut', name: 'Darknut', symbol: '🛡️🗡️', color: '#443322',
    hp: '5d10+10', ac: 20, attack: '1d10+4', attackCount: 1,
    abilities: [], xpReward: 450, goldMin: 25, goldMax: 100,
    floorMin: 15, floorMax: 35, description: 'A heavily armored knight in full plate. Its shield deflects most frontal attacks.'
  },
  {
    id: 'lynel', name: 'Lynel', symbol: '🦁⚔️', color: '#cc4422',
    hp: '7d10+14', ac: 18, attack: '2d8+5', attackCount: 2,
    abilities: ['breathe-fire'], xpReward: 1000, goldMin: 50, goldMax: 200,
    floorMin: 20, floorMax: 40, description: 'A fearsome lion-centaur with a raised sword. One of the most dangerous creatures in Hyrule.'
  },
  {
    id: 'poe', name: 'Poe', symbol: '🏮👻', color: '#88aaff',
    hp: '3d8', ac: 15, attack: '1d6+1', attackCount: 1,
    abilities: ['drain-level'], xpReward: 240, goldMin: 5, goldMax: 30,
    floorMin: 8, floorMax: 22, description: 'A lantern-carrying ghost that haunts graveyards and dungeons, draining life.'
  }
];
