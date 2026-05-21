const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info(message, ...args) {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}INFO${colors.reset}  ${message}`, ...args);
  },
  success(message, ...args) {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.green}OK${colors.reset}    ${message}`, ...args);
  },
  warn(message, ...args) {
    console.warn(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.yellow}WARN${colors.reset}  ${message}`, ...args);
  },
  error(message, ...args) {
    console.error(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.red}ERROR${colors.reset} ${message}`, ...args);
  },
};

module.exports = { logger };
