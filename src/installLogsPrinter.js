const chalk = require('chalk');
const CONSTANTS = require('./constants');
const LOG_TYPES = CONSTANTS.LOG_TYPES;
const KNOWN_TYPES = Object.values(CONSTANTS.LOG_TYPES);

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
      trim = options.defaultTrimLength || 200,
      icon = '-';

    if (type === LOG_TYPES.BROWSER_CONSOLE_WARN) {
      color = 'yellow';
      icon = '⚠';
    } else if (type === LOG_TYPES.BROWSER_CONSOLE_ERROR) {
      color = 'red';
      icon = '⚠';
    } else if (type === LOG_TYPES.BROWSER_CONSOLE_LOG) {
      color = 'white';
      icon = 'ⓘ';
    } else if (type === LOG_TYPES.BROWSER_CONSOLE_INFO) {
      color = 'white';
      icon = 'ⓘ';
    } else if (type === LOG_TYPES.CYPRESS_LOG) {
      color = 'green';
      icon = 'ⓘ';
    } else if (type === LOG_TYPES.CYPRESS_XHR) {
      color = 'green';
      icon = 'ⓘ';
    } else if (type === LOG_TYPES.CYPRESS_ROUTE) {
      color = 'green';
      icon = '⛗';
      trim = options.routeTrimLength || 5000;
    } else if (type === LOG_TYPES.CYPRESS_REQUEST) {
      color = 'green';
      icon = '✔';
      trim = options.routeTrimLength || 600;
    } else if (type === LOG_TYPES.CYPRESS_COMMAND) {
      color = 'green';
      icon = '✔';
      trim = options.commandTrimLength || 600;
    }

    if (severity === CONSTANTS.SEVERITY.ERROR) {
      color = 'red';
      icon = '✘';
    } else if (severity === CONSTANTS.SEVERITY.WARNING) {
      color = 'yellow';
      icon = '⚠';
    }

    if (message.length > trim) {
      processedMessage = message.substring(0, trim) + ' ...';
    }
    console.log(chalk[color](typeString + icon + ' '), processedMessage);
  });

  console.log('\n\n');
}

module.exports = installLogsPrinter;
