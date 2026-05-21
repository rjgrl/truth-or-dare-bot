const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const {
  startParty,
  getParty,
  endParty,
  recordPartyAction,
  addPlayer,
  removePlayer,
} = require('../utils/party');
const {
  getPartyMaxPlayers,
  setPartyMaxPlayers,
  validatePlayerCount,
  ABSOLUTE_MAX,
} = require('../utils/partyLimits');
const { addPoints } = require('../utils/leaderboard');
const { partyEmbed, errorEmbed, successEmbed } = require('../utils/embeds');
const { sendQuestion } = require('../utils/questionResponder');
const { isAdmin } = require('../utils/permissions');

/** Collect non-bot member IDs from a voice channel */
function playersFromVoice(voice) {
  const ids = [];
  if (voice?.members) {
    voice.members.forEach((m) => {
      if (!m.user.bot) ids.push(m.id);
    });
  }
  return ids;
}

/** Collect non-bot members with a role (best-effort; may skip uncached members) */
async function playersFromRole(guild, role) {
  if (!role) return [];
  const members = await guild.members.fetch();
  return members
    .filter((m) => !m.user.bot && m.roles.cache.has(role.id))
    .map((m) => m.id);
}

function partyReplyEmbed(party, guildId) {
  return partyEmbed({
    ...party,
    maxPlayers: getPartyMaxPlayers(guildId),
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('party')
    .setDescription('Multiplayer party mode — rotate turns (up to 25+ players)')
    .addSubcommand((sub) =>
      sub
        .setName('start')
        .setDescription('Start a party from voice channel and/or role')
        .addChannelOption((o) =>
          o
            .setName('voice')
            .setDescription('Add everyone in this voice channel')
            .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
        )
        .addRoleOption((o) =>
          o.setName('role').setDescription('Add all members with this role (cached members)')
        )
    )
    .addSubcommand((sub) =>
      sub.setName('join').setDescription('Join the active party (if there is room)')
    )
    .addSubcommand((sub) => sub.setName('leave').setDescription('Leave the active party'))
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a player to the party (Manage Server or party host)')
        .addUserOption((o) => o.setName('user').setDescription('Player to add').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('setmax')
        .setDescription(`Set max party size for this server (2–${ABSOLUTE_MAX})`)
        .addIntegerOption((o) =>
          o
            .setName('max')
            .setDescription('Maximum players in one party')
            .setRequired(true)
            .setMinValue(2)
            .setMaxValue(ABSOLUTE_MAX)
        )
    )
    .addSubcommand((sub) => sub.setName('status').setDescription('Show current party status'))
    .addSubcommand((sub) => sub.setName('end').setDescription('End the active party'))
    .addSubcommand((sub) =>
      sub
        .setName('complete')
        .setDescription('Mark your dare as completed and pass the turn')
    )
    .addSubcommand((sub) =>
      sub
        .setName('round')
        .setDescription('Start the current player\'s round (truth or dare)')
        .addStringOption((o) =>
          o.setName('type').setDescription('Truth or dare').setRequired(true).addChoices(
            { name: 'Truth', value: 'truth' },
            { name: 'Dare', value: 'dare' }
          )
        )
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'setmax') {
      if (!isAdmin(interaction.member, interaction.user.id)) {
        return interaction.reply({
          embeds: [errorEmbed('You need **Manage Server** (or bot admin) to change party size.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      const max = interaction.options.getInteger('max');
      const applied = setPartyMaxPlayers(guildId, max);
      return interaction.reply({
        embeds: [
          successEmbed(
            'Party size updated',
            `This server can now have up to **${applied}** players per party.\nDefault from bot host: \`PARTY_MAX_PLAYERS\` in .env.`
          ),
        ],
      });
    }

    if (sub === 'join') {
      const party = getParty(guildId);
      if (!party?.active) {
        return interaction.reply({
          embeds: [errorEmbed('No active party. Wait for `/party start` or start one yourself.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      const max = getPartyMaxPlayers(guildId);
      if (party.players.length >= max) {
        return interaction.reply({
          embeds: [errorEmbed(`Party is full (**${max}** players). Ask an admin for \`/party setmax\`.`)],
          flags: MessageFlags.Ephemeral,
        });
      }
      const result = addPlayer(guildId, interaction.user.id);
      if (result.error === 'already_in') {
        return interaction.reply({
          embeds: [errorEmbed('You are already in this party!')],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [successEmbed('Joined party', `You are player **${result.party.players.length}** of ${max}.`)],
      });
    }

    if (sub === 'leave') {
      const result = removePlayer(guildId, interaction.user.id);
      if (result?.error === 'no_party') {
        return interaction.reply({
          embeds: [errorEmbed('No active party.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      if (result?.error === 'not_in') {
        return interaction.reply({
          embeds: [errorEmbed('You are not in this party.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      if (result?.error === 'min_players') {
        return interaction.reply({
          embeds: [errorEmbed('Cannot leave — party must keep at least 2 players. Use `/party end` instead.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [successEmbed('Left party', 'You are out of the current game.')],
      });
    }

    if (sub === 'add') {
      const party = getParty(guildId);
      if (!party?.active) {
        return interaction.reply({
          embeds: [errorEmbed('No active party.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      const isHost = party.hostId === interaction.user.id;
      if (!isHost && !isAdmin(interaction.member, interaction.user.id)) {
        return interaction.reply({
          embeds: [errorEmbed('Only the party host or admins can add players.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      const user = interaction.options.getUser('user');
      if (user.bot) {
        return interaction.reply({
          embeds: [errorEmbed('Bots cannot join the party.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      const max = getPartyMaxPlayers(guildId);
      if (party.players.length >= max) {
        return interaction.reply({
          embeds: [errorEmbed(`Party is full (**${max}/${max}**). Use \`/party setmax\` to raise the limit.`)],
          flags: MessageFlags.Ephemeral,
        });
      }
      const result = addPlayer(guildId, user.id);
      if (result.error === 'already_in') {
        return interaction.reply({
          embeds: [errorEmbed(`${user} is already in the party.`)],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [successEmbed('Player added', `<@${user.id}> joined the party (${result.party.players.length}/${max}).`)],
      });
    }

    if (sub === 'start') {
      const existing = getParty(guildId);
      if (existing?.active) {
        return interaction.reply({
          embeds: [errorEmbed('A party is already running! Use `/party end` first.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const playerIds = new Set();
      const voice = interaction.options.getChannel('voice');
      playersFromVoice(voice).forEach((id) => playerIds.add(id));

      const role = interaction.options.getRole('role');
      if (role) {
        const roleMembers = await playersFromRole(interaction.guild, role);
        roleMembers.forEach((id) => playerIds.add(id));
      }

      playerIds.add(interaction.user.id);

      const check = validatePlayerCount(playerIds.size, guildId);
      if (!check.ok) {
        return interaction.reply({
          embeds: [errorEmbed(check.message)],
          flags: MessageFlags.Ephemeral,
        });
      }

      const sorted = [...playerIds].sort();
      const party = startParty(guildId, sorted, interaction.channelId, interaction.user.id);
      const max = getPartyMaxPlayers(guildId);
      await interaction.reply({
        embeds: [
          partyReplyEmbed(party, guildId),
          successEmbed(
            'Party started',
            `**${sorted.length}** players · max **${max}**\nOthers can \`/party join\` · host/admins can \`/party add\``
          ),
        ],
      });
      return;
    }

    if (sub === 'status') {
      const party = getParty(guildId);
      if (!party?.active) {
        return interaction.reply({
          embeds: [errorEmbed('No active party. Start one with `/party start`!')],
          ephemeral: true,
        });
      }
      return interaction.reply({ embeds: [partyReplyEmbed(party, guildId)] });
    }

    if (sub === 'end') {
      endParty(guildId);
      return interaction.reply({ embeds: [successEmbed('Party ended', 'Thanks for playing! 🎉')] });
    }

    if (sub === 'complete') {
      const result = recordPartyAction(guildId, interaction.user.id, 'completed');
      if (!result) {
        return interaction.reply({
          embeds: [errorEmbed('No active party.')],
          ephemeral: true,
        });
      }
      if (result.error === 'not_your_turn') {
        return interaction.reply({
          embeds: [errorEmbed('It\'s not your turn!')],
          ephemeral: true,
        });
      }
      addPoints(guildId, interaction.user.id, { completed: 1, points: 10 });
      return interaction.reply({
        embeds: [partyReplyEmbed(result, guildId)],
      });
    }

    if (sub === 'round') {
      const party = getParty(guildId);
      if (!party?.active) {
        return interaction.reply({
          embeds: [errorEmbed('Start a party first with `/party start`!')],
          ephemeral: true,
        });
      }
      const current = party.players[party.currentIndex];
      if (current.id !== interaction.user.id) {
        return interaction.reply({
          embeds: [errorEmbed(`It's <@${current.id}>'s turn!`)],
          ephemeral: true,
        });
      }
      const type = interaction.options.getString('type');
      await sendQuestion(interaction, type);
    }
  },
};
