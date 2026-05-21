const { config } = require('../config');
const { query } = require('./db');

function rowToSettings(row) {
  if (!row) {
    return { nsfwChannels: [], nsfwEnabled: config.allowNsfwDefault };
  }
  return {
    nsfwChannels: row.nsfw_channels || [],
    nsfwEnabled: row.nsfw_enabled,
    partyMaxPlayers: row.party_max_players ?? undefined,
  };
}

async function getGuildSettings(guildId) {
  const { rows } = await query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
  return rowToSettings(rows[0]);
}

async function ensureGuildRow(guildId) {
  await query(
    `INSERT INTO guild_settings (guild_id, nsfw_enabled, nsfw_channels)
     VALUES ($1, $2, '[]'::jsonb)
     ON CONFLICT (guild_id) DO NOTHING`,
    [guildId, config.allowNsfwDefault]
  );
}

async function toggleNsfwChannel(guildId, channelId, enabled) {
  await ensureGuildRow(guildId);
  const current = await getGuildSettings(guildId);
  const channels = new Set(current.nsfwChannels || []);
  if (enabled) channels.add(channelId);
  else channels.delete(channelId);
  const list = [...channels];
  await query('UPDATE guild_settings SET nsfw_channels = $2::jsonb WHERE guild_id = $1', [
    guildId,
    JSON.stringify(list),
  ]);
  return { ...current, nsfwChannels: list };
}

async function setNsfwEnabled(guildId, enabled) {
  await ensureGuildRow(guildId);
  await query('UPDATE guild_settings SET nsfw_enabled = $2 WHERE guild_id = $1', [guildId, enabled]);
  const current = await getGuildSettings(guildId);
  return { ...current, nsfwEnabled: enabled };
}

module.exports = { getGuildSettings, toggleNsfwChannel, setNsfwEnabled, ensureGuildRow };
