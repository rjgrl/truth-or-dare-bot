const { ActivityType } = require('discord.js');
const { reloadQuestions } = require('../utils/questions');
const { loadParties } = require('../utils/party');
const { logger } = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    reloadQuestions();
    try {
      await loadParties();
    } catch (err) {
      logger.error('Failed to load party sessions (bot will still run):', err.message);
    }
    client.user.setActivity('Truth or Dare 🎲', { type: ActivityType.Playing });
    logger.success(`Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);
  },
};
