const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const { logger } = require('../utils/logger');

function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '..', 'commands');
  const entries = fs.readdirSync(commandsPath, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(commandsPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = fs.readdirSync(filePath).filter((f) => f.endsWith('.js'));
      for (const file of subFiles) {
        registerCommand(client, path.join(filePath, file));
      }
    } else if (entry.name.endsWith('.js')) {
      registerCommand(client, filePath);
    }
  }
  logger.success(`Loaded ${client.commands.size} command(s)`);
}

function registerCommand(client, filePath) {
  const command = require(filePath);
  if (!command.data || !command.execute) {
    logger.warn(`Skipping ${filePath} — missing data or execute`);
    return;
  }
  client.commands.set(command.data.name, command);
}

module.exports = { loadCommands };
