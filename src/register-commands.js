const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { config } = require('./config');
const { logger } = require('./utils/logger');

function collectCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const entries = fs.readdirSync(commandsPath, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(commandsPath, entry.name);
    if (entry.isDirectory()) {
      for (const file of fs.readdirSync(filePath).filter((f) => f.endsWith('.js'))) {
        const cmd = require(path.join(filePath, file));
        if (cmd.data) commands.push(cmd.data.toJSON());
      }
    } else if (entry.name.endsWith('.js')) {
      const cmd = require(filePath);
      if (cmd.data) commands.push(cmd.data.toJSON());
    }
  }
  return commands;
}

async function register() {
  const commands = collectCommands();
  const rest = new REST({ version: '10' }).setToken(config.token);

  logger.info(`Registering ${commands.length} slash command(s)...`);

  try {
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commands,
      });
      logger.success(`Registered ${commands.length} guild commands (instant) for guild ${config.guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      logger.success(`Registered ${commands.length} global commands (may take up to 1 hour)`);
    }
  } catch (err) {
    logger.error('Registration failed:', err);
    process.exit(1);
  }
}

register();
