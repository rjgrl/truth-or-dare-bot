const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { config } = require('./config');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { logger } = require('./utils/logger');

if (!config.token || !config.clientId) {
  logger.error('Missing DISCORD_TOKEN or CLIENT_ID in .env — copy .env.example to .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

loadCommands(client);
loadEvents(client);

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
});

client.login(config.token).catch((err) => {
  logger.error('Failed to login:', err.message);
  process.exit(1);
});
