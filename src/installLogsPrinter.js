const chalk = require('chalk');
const path = require('path');
const tv4 = require('tv4');

const schema = require('./installLogsPrinter.schema.json');
const tv4ErrorTransformer = require('./tv4ErrorTransformer');
const CtrError = require('./CtrError');
const CONSTANTS = require('./constants');
const LOG_TYPES = CONSTANTS.LOG_TYPES;
const KNOWN_TYPES = Object.values(CONSTANTS.LOG_TYPES);
const CustomOutputProcessor = require('./outputProcessor/CustomOutputProcessor');
const NestedOutputProcessorDecorator = require('./outputProcessor/NestedOutputProcessorDecorator');
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
      debug: 'ⓓ',
      route: '⛗'
    }
  } else {
    return {
      error: 'x',
      warning: '!',
      success: '+',
      info: 'i',
      debug: '%',
      route: '~'
    }
  }
})();

let allMessages = {};
let outputProcessors = [];

/**
 * Installs the cypress plugin for printing logs to terminal.
 *
 * Needs to be added to plugins file.
 *
 * @param {Function} on
 *    Cypress event listen handler.
 * @param {object} options
 *    Options for displaying output:
 *      - printLogsToConsole?: string; Default: 'onFail'. When to print logs to console, possible values: 'always', 'onFail', 'never'.
 *      - printLogsToFile?: string; Default: 'onFail'. When to print logs to file(s), possible values: 'always', 'onFail', 'never'.
 *      - defaultTrimLength?: Trim length for console and cy.log.
 *      - commandTrimLength?: Trim length for cy commands.
 *      - outputRoot?: The root path to output log files to.
 *      - outputTarget?: Log output types. {[filePath: string]: string | function}
 *      - compactLogs?: Number of lines to compact around failing commands.
 *      - collectTestLogs?: Callback to collect each test case's logs after its run.
 */
function installLogsPrinter(on, options = {}) {
  options.printLogsToFile = options.printLogsToFile || "onFail";
  options.printLogsToConsole = options.printLogsToConsole || "onFail";
  const result = tv4.validateMultiple(options, schema);

  if (!result.valid) {
    throw new Error(`[cypress-terminal-report] Invalid plugin install options: ${tv4ErrorTransformer.toReadableString(result.errors)}`);
  }

  on('task', {
    [CONSTANTS.TASK_NAME]: data => {
      let messages = data.messages;

      if (typeof options.compactLogs === 'number' && options.compactLogs >= 0) {
        messages = compactLogs(messages, options.compactLogs);
      }

      if (options.outputTarget && options.printLogsToFile !== "never") {
        if (data.state === "failed" || options.printLogsToFile === "always") {
          allMessages[data.spec] = allMessages[data.spec] || {};
          allMessages[data.spec][data.test] = messages;
        }
      }

      if ((options.printLogsToConsole === "onFail" && data.state !== "passed")
        || options.printLogsToConsole === "always") {
        logToTerminal(messages, options);
      }

      if (options.collectTestLogs) {
        options.collectTestLogs({ spec: data.spec, test: data.test, state: data.state }, messages);
      }

      return null;
    },
    [CONSTANTS.TASK_NAME_OUTPUT]: () => {
      outputProcessors.forEach((processor) => {
        if (Object.entries(allMessages).length !== 0){
          processor.write(allMessages);
          logOutputTarget(processor);
        }
      });
      allMessages = {};
      return null;
    }
  });

  if (options.outputTarget) {
    installOutputProcessors(on, options);
  }
}


function logOutputTarget(processor) {
  let message;
  let standardOutputType = Object.keys(OUTPUT_PROCESSOR_TYPE).find(
    (type) => processor instanceof OUTPUT_PROCESSOR_TYPE[type]
  );
  if (standardOutputType) {
    message = `Wrote ${standardOutputType} logs to ${processor.getTarget()}. (${processor.getSpentTime()}ms)`;
  } else {
    message = `Wrote custom logs to ${processor.getTarget()}. (${processor.getSpentTime()}ms)`;
  }
  console.log('[cypress-terminal-report]', message);
}

function installOutputProcessors(on, options) {
  if (!options.outputRoot) {
    throw new CtrError(`Missing outputRoot configuration.`);
  }

  const createProcessorFromType = (file, type) => {
    if (typeof type === 'string') {
      return new OUTPUT_PROCESSOR_TYPE[type](path.join(options.outputRoot, file));
    }

    if (typeof type === 'function') {
      return new CustomOutputProcessor(path.join(options.outputRoot, file), type);
    }
  };

  Object.entries(options.outputTarget).forEach(([file, type]) => {
    const requiresNested = file.match(/^[^|]+\|.*$/);

    if (typeof type === 'string' && !OUTPUT_PROCESSOR_TYPE[type]) {
      throw new CtrError(`Unknown output format '${type}'.`);
    }
    if (!['function', 'string'].includes(typeof type)) {
      throw new CtrError(`[cypress-terminal-report] Output target type can only be string or function.`);
    }

    if (requiresNested) {
      const parts = file.split('|');
      const root = parts[0];
      const ext = parts[1];
      outputProcessors.push(new NestedOutputProcessorDecorator(root, options.specRoot, ext, (nestedFile) => {
        return createProcessorFromType(nestedFile, type);
      }));
    } else {
      outputProcessors.push(createProcessorFromType(file, type));
    }
  });

  outputProcessors.forEach((processor) => processor.initialize());
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
    } else if (type === LOG_TYPES.BROWSER_CONSOLE_DEBUG) {
      color = 'blue';
      icon = LOG_SYMBOLS.debug;
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
      trim = options.routeTrimLength || 5000;
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
