const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

function bindEvent(client, event) {
  const run = async (...args) => {
    try {
      await event.execute(...args, client);
    } catch (err) {
      logger.error(`Event handler failed (${event.name}):`, err);
    }
  };

  if (event.once) {
    client.once(event.name, run);
  } else {
    client.on(event.name, run);
  }
}

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    const event = require(path.join(eventsPath, file));
    bindEvent(client, event);
    logger.info(`Event registered: ${event.name}`);
  }
}

module.exports = { loadEvents };
