const { updateJson, readJson } = require('./storage');

function getGuildLeaderboard(guildId) {
  const data = readJson('leaderboard.json', {});
  return data[guildId] || {};
}

function addPoints(guildId, userId, { completed = 0, skipped = 0, points = 0 }) {
  updateJson('leaderboard.json', {}, (data) => {
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) {
      data[guildId][userId] = { points: 0, completed: 0, skipped: 0 };
    }
    const entry = data[guildId][userId];
    entry.completed += completed;
    entry.skipped += skipped;
    entry.points += points;
    return data;
  });
}

function getTopPlayers(guildId, limit = 10) {
  const board = getGuildLeaderboard(guildId);
  return Object.entries(board)
    .map(([userId, stats]) => ({ userId, ...stats }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}

module.exports = { getGuildLeaderboard, addPoints, getTopPlayers };
