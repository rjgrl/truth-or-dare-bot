const { query } = require('./db');

/** @type {Map<string, object>} */
const activeParties = new Map();

async function loadParties() {
  const { rows } = await query('SELECT guild_id, party FROM party_sessions WHERE active = true');
  for (const row of rows) {
    activeParties.set(row.guild_id, row.party);
  }
}

async function saveParty(guildId, party) {
  await query(
    `INSERT INTO party_sessions (guild_id, party, active, updated_at)
     VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (guild_id) DO UPDATE SET
       party = EXCLUDED.party,
       active = EXCLUDED.active,
       updated_at = NOW()`,
    [guildId, JSON.stringify(party), !!party.active]
  );
}

async function startParty(guildId, players, channelId, hostId = null) {
  const party = {
    active: true,
    guildId,
    channelId,
    hostId,
    players: players.map((id) => ({ id })),
    currentIndex: 0,
    round: 1,
    stats: { completed: 0, skipped: 0, points: 0 },
    startedAt: Date.now(),
  };
  activeParties.set(guildId, party);
  await saveParty(guildId, party);
  return party;
}

function getParty(guildId) {
  return activeParties.get(guildId) || null;
}

async function endParty(guildId) {
  const party = activeParties.get(guildId);
  if (party) {
    party.active = false;
    await saveParty(guildId, party);
  }
  activeParties.delete(guildId);
}

async function nextTurn(guildId) {
  const party = activeParties.get(guildId);
  if (!party) return null;
  party.currentIndex = (party.currentIndex + 1) % party.players.length;
  if (party.currentIndex === 0) party.round += 1;
  await saveParty(guildId, party);
  return party;
}

async function recordPartyAction(guildId, userId, action) {
  const party = activeParties.get(guildId);
  if (!party) return null;
  const current = party.players[party.currentIndex];
  if (current.id !== userId) return { error: 'not_your_turn' };

  if (action === 'completed') {
    party.stats.completed += 1;
    party.stats.points += 10;
  } else if (action === 'skipped') {
    party.stats.skipped += 1;
    party.stats.points += 2;
  }
  await saveParty(guildId, party);
  await nextTurn(guildId);
  return party;
}

function getCurrentPlayer(guildId) {
  const party = activeParties.get(guildId);
  if (!party) return null;
  return party.players[party.currentIndex];
}

async function addPlayer(guildId, userId) {
  const party = activeParties.get(guildId);
  if (!party?.active) return { error: 'no_party' };
  if (party.players.some((p) => p.id === userId)) return { error: 'already_in' };
  const { getPartyMaxPlayers } = require('./partyLimits');
  if (party.players.length >= (await getPartyMaxPlayers(guildId))) return { error: 'full' };
  party.players.push({ id: userId });
  await saveParty(guildId, party);
  return { party };
}

async function removePlayer(guildId, userId) {
  const party = activeParties.get(guildId);
  if (!party?.active) return { error: 'no_party' };
  const idx = party.players.findIndex((p) => p.id === userId);
  if (idx === -1) return { error: 'not_in' };
  if (party.players.length <= 2) return { error: 'min_players' };

  party.players.splice(idx, 1);
  if (idx < party.currentIndex) {
    party.currentIndex -= 1;
  } else if (idx === party.currentIndex) {
    party.currentIndex = party.currentIndex % party.players.length;
  }
  await saveParty(guildId, party);
  return { party };
}

module.exports = {
  loadParties,
  startParty,
  getParty,
  endParty,
  nextTurn,
  recordPartyAction,
  getCurrentPlayer,
  addPlayer,
  removePlayer,
};
