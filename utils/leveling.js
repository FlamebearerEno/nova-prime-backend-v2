// utils/leveling.js
export function getXPForLevel(level) {
  return Math.floor(500 * Math.pow(level, 1.5));
}

export function addXPAndLevelUp(userStats, gainedXP) {
  userStats.retroXP = (userStats.retroXP || 0) + gainedXP;

  let currentLevel = userStats.level || 1;
  let currentXP = userStats.retroXP;
  let xpNeeded = getXPForLevel(currentLevel);

  while (currentXP >= xpNeeded) {
    currentXP -= xpNeeded;
    currentLevel++;
    xpNeeded = getXPForLevel(currentLevel);
  }

  return {
    level: currentLevel,
    xpInLevel: currentXP,
    xpNeeded: xpNeeded,
  };
}
