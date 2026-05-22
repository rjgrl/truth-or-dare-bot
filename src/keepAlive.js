const express = require('express');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 3000;

function startKeepAlive() {
  const app = express();

  app.get('/', (req, res) => {
    res.send('Truth or Dare Bot is alive and kicking!');
  });

  const server = app.listen(PORT, () => {
    logger.success(`Keep-alive server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`Port ${PORT} already in use — keep-alive disabled (bot will still connect to Discord)`);
      return;
    }
    logger.error('Keep-alive server error:', err.message);
  });
}

module.exports = { startKeepAlive };
