const chalk = require('chalk');
const path = require('path');

const CtrError = require('./CtrError');
const CONSTANTS = require('./constants');
const LOG_TYPES = CONSTANTS.LOG_TYPES;
const KNOWN_TYPES = Object.values(CONSTANTS.LOG_TYPES);
const CUSTOM_OUTPUT_PROCESSOR = require('./outputProcessor/CustomOutputProcessor');
const OUTPUT_PROCESSOR_TYPE = {
  'json': require('./outputProcessor/JsonOutputProcessor'),
  'txt': require('./outputProcessor/TextOutputProcessor'),
};

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

let allMessages = {};
let outputProcessors = [];

function installLogsPrinter(on, options = {}) {
  on('task', {
    [CONSTANTS.TASK_NAME]: data => {
      let messages = data.messages;

      if (typeof options.compactLogs === 'number' && options.compactLogs >= 0) {
        messages = compactLogs(messages, options.compactLogs);
      }

      if (options.outputTarget) {
        allMessages[data.spec] = allMessages[data.spec] || {};
        allMessages[data.spec][data.test] = messages;
      }

      logToTerminal(messages, options);
      return null;
    },
    [CONSTANTS.TASK_NAME_OUTPUT]: () => {
      outputProcessors.forEach((processor) => {
        processor.write(allMessages);
        logOutputTarget(processor);
      });
      allMessages = {};
      return null;
    }
  });

  if (options.outputTarget) {
    installOutputProcessors(on, options.outputRoot, options.outputTarget);
  }
}

function logOutputTarget(processor) {
  let message;
  let standardOutputType = Object.keys(OUTPUT_PROCESSOR_TYPE).find(
    (type) => processor instanceof OUTPUT_PROCESSOR_TYPE[type]
  );
  if (standardOutputType) {
    message = `Wrote ${standardOutputType} logs to ${processor.file}`;
  } else {
    message = `Wrote custom logs to ${processor.file}`;
  }
  console.log('[cypress-terminal-report]', message);
}

function installOutputProcessors(on, root, outputTargets) {
  if (!root) {
    throw new CtrError(`Missing outputRoot configuration.`);
  }

  Object.entries(outputTargets).forEach(([file, type]) => {
    if (typeof type === 'string') {
      if (!OUTPUT_PROCESSOR_TYPE[type]) {
        throw new CtrError(`Unknown output format '${type}'.`);
      }

      outputProcessors.push(new OUTPUT_PROCESSOR_TYPE[type](path.join(root, file)));
    } else if (typeof type === 'function') {
      outputProcessors.push(new CUSTOM_OUTPUT_PROCESSOR(path.join(root, file), type));
    } else {
      throw new CtrError(`Output target type can only be string or function.`);
    }
  });

  outputProcessors.forEach((processor) => processor.prepare());
}

function compactLogs(logs, keepAroundCount) {
  const failingIndexes = logs.filter((log) => log[2] === CONSTANTS.SEVERITY.ERROR)
    .map((log) => logs.indexOf(log));

  const includeIndexes = new Array(logs.length);

  failingIndexes.forEach((index) => {
    const from = Math.max(0, index - keepAroundCount);
    const to = Math.min(logs.length - 1, index + keepAroundCount);
    for (let i = from; i <= to; i++) {
      includeIndexes[i] = 1;
    }
  });

  const compactedLogs = [];
  const addOmittedLog = (count) =>
    compactedLogs.push([
      CONSTANTS.LOG_TYPES.PLUGIN_LOG_TYPE,
      `[ ... ${count} omitted logs ... ]`,
      CONSTANTS.SEVERITY.SUCCESS
    ]);

  let excludeCount = 0;
  for (let i = 0; i < includeIndexes.length; i++) {
    if (includeIndexes[i]) {
      if (excludeCount) {
        addOmittedLog(excludeCount);
        excludeCount = 0;
      }

      compactedLogs.push(logs[i]);
    } else {
      ++excludeCount;
    }
  }

  if (excludeCount) {
    addOmittedLog(excludeCount);
  }

  return compactedLogs;
}

function logToTerminal(messages, options) {
  const padType = (type) =>
    new Array(Math.max(CONSTANTS.PADDING.LOG.length - type.length - 3, 0)).join(' ') + type + ' ';

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

    console.log(coloredTypeString, processedMessage.replace(/\n/g, '\n' + CONSTANTS.PADDING.LOG));
  });

  console.log('\n\n');
}

module.exports = installLogsPrinter;
