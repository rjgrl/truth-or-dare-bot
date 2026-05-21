const { config } = require('../config');
const { readJson, updateJson } = require('./storage');

/** Hard ceiling so slash/embed limits stay sane */
const ABSOLUTE_MAX = 50;

function getPartyMaxPlayers(guildId) {
  const guild = readJson('settings.json', {})[guildId];
  const guildMax = guild?.partyMaxPlayers;
  const base = guildMax ?? config.partyMaxPlayers;
  return Math.min(Math.max(2, base), ABSOLUTE_MAX);
}

function setPartyMaxPlayers(guildId, value) {
  const capped = Math.min(Math.max(2, value), ABSOLUTE_MAX);
  updateJson('settings.json', {}, (data) => {
    if (!data[guildId]) data[guildId] = {};
    data[guildId].partyMaxPlayers = capped;
    return data;
  });
  return capped;
}

function validatePlayerCount(count, guildId) {
  const max = getPartyMaxPlayers(guildId);
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
