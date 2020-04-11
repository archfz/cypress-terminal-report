const chalk = require('chalk');
const CONSTANTS = require('./constants');
const LOG_TYPES = CONSTANTS.LOG_TYPES;
const KNOWN_TYPES = Object.values(CONSTANTS.LOG_TYPES);

const LOG_SYMBOLS = (() => {
  if (process.platform !== 'win32' || process.env.CI || process.env.TERM === 'xterm-256color') {
    return {
      error: '✘',
      warning: '⚠',
      success: '✔',
      info: 'ⓘ',
      route: '⛗',
    }
  } else {
    return {
      error: 'x',
      warning: '!',
      success: '+',
      info: 'i',
      route: '~',
    }
  }
})();

function installLogsPrinter(on, options = {}) {
  on('task', {
    [CONSTANTS.TASK_NAME]: messages => {
      logToTerminal(messages, options);
      return null;
    }
  });
}

function logToTerminal(messages, options) {
  const padType = (type) =>
    new Array(Math.max(17 - type.length, 0)).join(' ') + type + ' ';

  messages.forEach(([type, message, severity]) => {
    let color = 'white',
      typeString = KNOWN_TYPES.includes(type) ? padType(type) : padType('[unknown]'),
      processedMessage = message,
      trim = options.defaultTrimLength || 800,
      icon = '-';

    if (type === LOG_TYPES.BROWSER_CONSOLE_WARN) {
      color = 'yellow';
      icon = LOG_SYMBOLS.warning;
    } else if (type === LOG_TYPES.BROWSER_CONSOLE_ERROR) {
      color = 'red';
      icon = LOG_SYMBOLS.warning;
    } else if (type === LOG_TYPES.BROWSER_CONSOLE_LOG) {
      color = 'white';
      icon = LOG_SYMBOLS.info;
    } else if (type === LOG_TYPES.BROWSER_CONSOLE_INFO) {
      color = 'white';
      icon = LOG_SYMBOLS.info;
    } else if (type === LOG_TYPES.CYPRESS_LOG) {
      color = 'green';
      icon = LOG_SYMBOLS.info;
    } else if (type === LOG_TYPES.CYPRESS_XHR) {
      color = 'green';
      icon = LOG_SYMBOLS.info;
    } else if (type === LOG_TYPES.CYPRESS_ROUTE) {
      color = 'green';
      icon = LOG_SYMBOLS.route;
      trim = options.routeTrimLength || 5000;
    } else if (type === LOG_TYPES.CYPRESS_REQUEST) {
      color = 'green';
      icon = LOG_SYMBOLS.success;
      trim = options.routeTrimLength || 5000;
    } else if (type === LOG_TYPES.CYPRESS_COMMAND) {
      color = 'green';
      icon = LOG_SYMBOLS.success;
      trim = options.commandTrimLength || 800;
    }

    if (severity === CONSTANTS.SEVERITY.ERROR) {
      color = 'red';
      icon = LOG_SYMBOLS.error;
    } else if (severity === CONSTANTS.SEVERITY.WARNING) {
      color = 'yellow';
      icon = LOG_SYMBOLS.warning;
    }

    if (message.length > trim) {
      processedMessage = message.substring(0, trim) + ' ...';
    }

    const coloredTypeString = ['red', 'yellow'].includes(color) ?
      chalk[color].bold(typeString + icon + ' ') :
      chalk[color](typeString + icon + ' ');

    console.log(coloredTypeString, processedMessage);
  });

  console.log('\n\n');
}

module.exports = installLogsPrinter;
