const { config } = require('../config');
const { query } = require('./db');
const { ensureGuildRow } = require('./settings');

/** Hard ceiling so slash/embed limits stay sane */
const ABSOLUTE_MAX = 50;

async function getPartyMaxPlayers(guildId) {
  const { rows } = await query(
    'SELECT party_max_players FROM guild_settings WHERE guild_id = $1',
    [guildId]
  );
  const guildMax = rows[0]?.party_max_players;
  const base = guildMax ?? config.partyMaxPlayers;
  return Math.min(Math.max(2, base), ABSOLUTE_MAX);
}

async function setPartyMaxPlayers(guildId, value) {
  const capped = Math.min(Math.max(2, value), ABSOLUTE_MAX);
  await ensureGuildRow(guildId);
  await query('UPDATE guild_settings SET party_max_players = $2 WHERE guild_id = $1', [
    guildId,
    capped,
  ]);
  return capped;
}

async function validatePlayerCount(count, guildId) {
  const max = await getPartyMaxPlayers(guildId);
  if (count < 2) {
    return { ok: false, max, message: 'Need at least **2 players** to start a party.' };
  }
  if (count > max) {
    return {
      ok: false,
      max,
      message: `Too many players (**${count}**). This server's party max is **${max}**. Admins can raise it with \`/party setmax\` (up to ${ABSOLUTE_MAX}).`,
    };
  }
  return { ok: true, max };
}

module.exports = {
  ABSOLUTE_MAX,
  getPartyMaxPlayers,
  setPartyMaxPlayers,
  validatePlayerCount,
};
