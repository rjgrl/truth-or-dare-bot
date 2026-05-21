const express = require('express');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 3000;

function startKeepAlive() {
  const app = express();

  app.get('/', (req, res) => {
    res.send('Truth or Dare Bot is alive and kicking!');
  });

  app.listen(PORT, () => {
    logger.success(`Keep-alive server listening on port ${PORT}`);
  });
}

module.exports = { startKeepAlive };
