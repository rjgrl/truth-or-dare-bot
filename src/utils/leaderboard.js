const { query } = require('./db');

async function getGuildLeaderboard(guildId) {
  const { rows } = await query(
    'SELECT user_id, points, completed, skipped FROM leaderboard_entries WHERE guild_id = $1',
    [guildId]
  );
  const board = {};
  for (const row of rows) {
    board[row.user_id] = {
      points: row.points,
      completed: row.completed,
      skipped: row.skipped,
    };
  }
  return board;
}

async function addPoints(guildId, userId, { completed = 0, skipped = 0, points = 0 }) {
  await query(
    `INSERT INTO leaderboard_entries (guild_id, user_id, points, completed, skipped)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (guild_id, user_id) DO UPDATE SET
       points = leaderboard_entries.points + EXCLUDED.points,
       completed = leaderboard_entries.completed + EXCLUDED.completed,
       skipped = leaderboard_entries.skipped + EXCLUDED.skipped`,
    [guildId, userId, points, completed, skipped]
  );
}

async function getTopPlayers(guildId, limit = 10) {
  const { rows } = await query(
    `SELECT user_id, points, completed, skipped
     FROM leaderboard_entries
     WHERE guild_id = $1
     ORDER BY points DESC
     LIMIT $2`,
    [guildId, limit]
  );
  return rows.map((row) => ({
    userId: row.user_id,
    points: row.points,
    completed: row.completed,
    skipped: row.skipped,
  }));
}

module.exports = { getGuildLeaderboard, addPoints, getTopPlayers };
