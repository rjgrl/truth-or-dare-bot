const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { toggleNsfwChannel, setNsfwEnabled, getGuildSettings } = require('../utils/settings');
const { getPartyMaxPlayers } = require('../utils/partyLimits');
const { isAdmin } = require('../utils/permissions');
const { successEmbed, errorEmbed, infoEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Server settings (NSFW mode for specific channels)')
    .addSubcommand((sub) =>
      sub
        .setName('nsfw-channel')
        .setDescription('Enable or disable NSFW questions in this channel')
        .addBooleanOption((o) => o.setName('enabled').setDescription('Enable NSFW content here').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('nsfw-global')
        .setDescription('Allow NSFW questions in marked channels (admin)')
        .addBooleanOption((o) => o.setName('enabled').setDescription('Enable globally').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('View current settings including party max')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'view') {
      const s = await getGuildSettings(guildId);
      return interaction.reply({
        embeds: [
          infoEmbed('⚙️ Settings', null, [
            { name: 'NSFW globally allowed', value: s.nsfwEnabled ? 'Yes' : 'No', inline: true },
            {
              name: 'NSFW channels',
              value: s.nsfwChannels?.length
                ? s.nsfwChannels.map((id) => `<#${id}>`).join(', ')
                : '_None_',
            },
            {
              name: 'Party max players',
              value: String(await getPartyMaxPlayers(interaction.guildId)),
              inline: true,
            },
          ]),
        ],
      });
    }

    if (sub === 'nsfw-channel') {
      const enabled = interaction.options.getBoolean('enabled');
      await toggleNsfwChannel(guildId, interaction.channelId, enabled);
      return interaction.reply({
        embeds: [
          successEmbed(
            'Channel updated',
            enabled
              ? 'NSFW-rated questions **enabled** in this channel only.'
              : 'NSFW-rated questions **disabled** in this channel.'
          ),
        ],
      });
    }

    if (sub === 'nsfw-global') {
      if (!isAdmin(interaction.member, interaction.user.id)) {
        return interaction.reply({
          embeds: [errorEmbed('Admin permission required.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      const enabled = interaction.options.getBoolean('enabled');
      await setNsfwEnabled(guildId, enabled);
      return interaction.reply({
        embeds: [
          successEmbed(
            'NSFW mode',
            enabled
              ? 'NSFW questions can appear in channels you mark with `/settings nsfw-channel`.'
              : 'NSFW questions disabled server-wide.'
          ),
        ],
      });
    }
  },
};
