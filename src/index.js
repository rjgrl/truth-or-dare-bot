const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { config } = require('./config');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { logger } = require('./utils/logger');
const { startKeepAlive } = require('./keepAlive');
const { initDatabase } = require('./utils/db');

if (!config.token || !config.clientId) {
  logger.error('Missing DISCORD_TOKEN or CLIENT_ID in .env — copy .env.example to .env');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  logger.error('Missing DATABASE_URL in .env — add your Supabase PostgreSQL connection string');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

loadCommands(client);
loadEvents(client);

startKeepAlive();

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
});

async function start() {
  try {
    await initDatabase();
    await client.login(config.token);
  } catch (err) {
    logger.error('Failed to start:', err.message);
    process.exit(1);
  }
}

start();
