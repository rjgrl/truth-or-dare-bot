const { EmbedBuilder } = require('discord.js');
const { config, CATEGORIES } = require('../config');

function baseEmbed() {
  return new EmbedBuilder().setColor(config.embedColor).setTimestamp();
}

function truthEmbed({ question, category, rating, requester, footer }) {
  const cat = CATEGORIES.find((c) => c.name === category);
  return baseEmbed()
    .setTitle(`${cat?.emoji || '💬'} Truth`)
    .setDescription(`**${question}**`)
    .addFields(
      { name: 'Category', value: category, inline: true },
      { name: 'Rating', value: rating, inline: true },
      { name: 'Requested by', value: requester, inline: true }
    )
    .setFooter({ text: footer || 'Use buttons below for the next round!' });
}

function dareEmbed({ question, category, rating, requester, timerSeconds, footer }) {
  const cat = CATEGORIES.find((c) => c.name === category);
  const embed = baseEmbed()
    .setTitle(`${cat?.emoji || '⚡'} Dare`)
    .setDescription(`**${question}**`)
    .addFields(
      { name: 'Category', value: category, inline: true },
      { name: 'Rating', value: rating, inline: true },
      { name: 'Requested by', value: requester, inline: true }
    )
    .setFooter({ text: footer || 'Complete the dare or hit Skip!' });

  if (timerSeconds > 0) {
    embed.addFields({ name: '⏱️ Timer', value: `${timerSeconds} seconds`, inline: true });
  }
  return embed;
}

function randomEmbed({ type, question, category, rating, requester }) {
  return type === 'truth'
    ? truthEmbed({ question, category, rating, requester, footer: '🎲 Random pick!' })
    : dareEmbed({ question, category, rating, requester, footer: '🎲 Random pick!' });
}

function errorEmbed(message) {
  return baseEmbed().setTitle('❌ Oops!').setDescription(message).setColor(0xed4245);
}

function successEmbed(title, message) {
  return baseEmbed().setTitle(`✅ ${title}`).setDescription(message).setColor(0x57f287);
}

function infoEmbed(title, description, fields = []) {
  const embed = baseEmbed().setTitle(title).setDescription(description);
  if (fields.length) embed.addFields(fields);
  return embed;
}

function leaderboardEmbed(entries, guildName) {
  const lines = entries.length
    ? entries
        .slice(0, 10)
        .map((e, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
          return `${medal} <@${e.userId}> — **${e.points}** pts (${e.completed} done, ${e.skipped} skipped)`;
        })
        .join('\n')
    : '_No scores yet — start a party or play dares!_';

  return baseEmbed()
    .setTitle('🏆 Leaderboard')
    .setDescription(lines)
    .setFooter({ text: guildName });
}

function formatPartyRoster(players, currentIndex) {
  if (players.length <= 20) {
    return players
      .map((p, i) => `${i === currentIndex ? '▶️' : '•'} ${i + 1}. <@${p.id}>`)
      .join('\n');
  }
  const lines = [];
  for (let i = 0; i < players.length; i++) {
    const nearCurrent = Math.abs(i - currentIndex) <= 2;
    const isEdge = i === 0 || i === players.length - 1;
    if (nearCurrent || isEdge) {
      lines.push(`${i === currentIndex ? '▶️' : '•'} ${i + 1}. <@${players[i].id}>`);
    } else if (lines[lines.length - 1] !== '_…_') {
      lines.push('_…_');
    }
  }
  return lines.join('\n');
}

function partyEmbed({ players, currentIndex, round, stats, maxPlayers }) {
  const current = players[currentIndex];
  const lines = [
    `**Round:** ${round}`,
    `**Current turn:** <@${current?.id}>`,
    `**Players:** ${players.length}${maxPlayers ? ` / ${maxPlayers}` : ''}`,
    '',
    formatPartyRoster(players, currentIndex),
  ];

  return baseEmbed()
    .setTitle('🎉 Party Mode')
    .setDescription(lines.join('\n'))
    .addFields(
      { name: 'Completed', value: String(stats.completed), inline: true },
      { name: 'Skipped', value: String(stats.skipped), inline: true },
      { name: 'Points', value: String(stats.points), inline: true }
    );
}

function categoriesEmbed() {
  const list = CATEGORIES.map((c) => `${c.emoji} **${c.name}** — \`${c.slug}\``).join('\n');
  return infoEmbed('📂 Categories', 'Use optional category on commands:\n`/truth category:funny`', [
    { name: 'Available', value: list },
  ]);
}

function nhieEmbed(statement, requester) {
  return baseEmbed()
    .setTitle('🙅 Never Have I Ever')
    .setDescription(`**${statement}**`)
    .setFooter({ text: `React 👍 if you have · 👎 if you haven't · ${requester}` });
}

function wheelEmbed(punishment, requester) {
  return baseEmbed()
    .setTitle('🎡 Punishment Wheel')
    .setDescription(`**${punishment}**`)
    .setFooter({ text: `Spun by ${requester}` });
}

function dailyEmbed(challenge, day) {
  return baseEmbed()
    .setTitle('📅 Daily Challenge')
    .setDescription(`**${challenge}**`)
    .setFooter({ text: `Day ${day} · Come back tomorrow!` });
}

function submissionEmbed(entry, status) {
  return baseEmbed()
    .setTitle('📝 Submission')
    .setDescription(entry.question)
    .addFields(
      { name: 'Type', value: entry.type, inline: true },
      { name: 'Category', value: entry.category, inline: true },
      { name: 'Status', value: status, inline: true },
      { name: 'Submitted by', value: `<@${entry.userId}>`, inline: true }
    );
}

module.exports = {
  truthEmbed,
  dareEmbed,
  randomEmbed,
  errorEmbed,
  successEmbed,
  infoEmbed,
  leaderboardEmbed,
  partyEmbed,
  categoriesEmbed,
  nhieEmbed,
  wheelEmbed,
  dailyEmbed,
  submissionEmbed,
};
