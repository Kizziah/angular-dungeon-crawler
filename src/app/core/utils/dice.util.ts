// Parse and roll dice notation like "3d8+2", "1d6", "2d6-1"
export function rollDice(notation: string): number {
  const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) return parseInt(notation) || 0;
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return Math.max(1, total + modifier);
}

export function rollStat(): number {
  // Roll 4d6 drop lowest
  const rolls = [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1
  ];
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}
