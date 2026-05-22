const { logger } = require('../utils/logger');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    logger.success(`Joined guild: ${guild.name} (${guild.id}) — ${guild.memberCount} members`);
  },
};
