/**
 * @typedef {import('./installLogsCollector').Log} Log
 * @typedef {import('./installLogsPrinter').PluginOptions} PluginOptions
 * @typedef {{ messages: Log[],
 *             isHook: boolean,
 *             state: string,
 *             spec: string,
 *             test: string,
 *             level?: number,
 *             consoleTitle?: string,
 *             continuous?: boolean }} Data
 */

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
      warning: '❖',
      success: '✔',
      info: '✱',
      debug: '⚈',
      route: '➟'
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

let writeToFileMessages = {};
let outputProcessors = [];

const createLogger = (enabled) => enabled
  ? (message) => console.log(`[cypress-terminal-report:debug] ${message}`)
  : () => {}

/**
 * Installs the cypress plugin for printing logs to terminal.
 *
 * Needs to be added to plugins file.
 *
 * @see ./installLogsPrinter.d.ts
 * @type {import('./installLogsPrinter')}
 */
function installLogsPrinter(on, options = {}) {
  options.printLogsToFile = options.printLogsToFile || "onFail";
  options.printLogsToConsole = options.printLogsToConsole || "onFail";
  const result = tv4.validateMultiple(options, schema);

  if (!result.valid) {
    throw new CtrError(`Invalid plugin install options: ${tv4ErrorTransformer.toReadableString(result.errors)}`);
  }

  const logDebug = createLogger(options.debug);

  on('task', {
    [CONSTANTS.TASK_NAME]: function (/** @type {Data} */ data) {
      logDebug(`${CONSTANTS.TASK_NAME}: Received ${data.messages.length} messages, for ${data.spec}:${data.test}, with state ${data.state}.`);
      let messages = data.messages;

      const terminalMessages =
        typeof options.compactLogs === 'number' && options.compactLogs >= 0
          ? compactLogs(messages, options.compactLogs, logDebug)
          : messages;

      const isHookAndShouldLog = data.isHook &&
        (options.includeSuccessfulHookLogs || data.state === 'failed');

      if (options.outputTarget && options.printLogsToFile !== "never") {
        if (
          data.state === "failed" ||
          options.printLogsToFile === "always" ||
          isHookAndShouldLog
        ) {
          let outputFileMessages =
            typeof options.outputCompactLogs === 'number'
              ? compactLogs(messages, options.outputCompactLogs, logDebug)
              : options.outputCompactLogs === false
              ? messages
              : terminalMessages;

          logDebug(`Storing for file logging ${outputFileMessages.length} messages, for ${data.spec}:${data.test}.`);

          writeToFileMessages[data.spec] = writeToFileMessages[data.spec] || {};
          writeToFileMessages[data.spec][data.test] = outputFileMessages;
        }
      }

      if (
        options.printLogsToConsole !== "never" && (
          options.printLogsToConsole === "always"
          || (options.printLogsToConsole === "onFail" && data.state !== "passed")
        || isHookAndShouldLog
        )
      ) {
        logDebug(`Logging to console ${terminalMessages.length} messages, for ${data.spec}:${data.test}.`);
        logToTerminal(terminalMessages, options, data);
      }

      if (options.collectTestLogs) {
        logDebug(`Running \`collectTestLogs\` on ${terminalMessages.length} messages, for ${data.spec}:${data.test}.`);
        options.collectTestLogs(
          {spec: data.spec, test: data.test, state: data.state},
          terminalMessages
        );
      }

      return null;
    },
    [CONSTANTS.TASK_NAME_OUTPUT]: () => {
      logDebug(`${CONSTANTS.TASK_NAME_OUTPUT}: Triggered.`);
      logToFiles(options);
      return null;
    }
  });

  if (options.outputTarget) {
    installOutputProcessors(on, options);
  }

  if (options.logToFilesOnAfterRun) {
    on('after:run', () => {
      logDebug(`after:run: Attempting file logging on after run.`);
      logToFiles(options);
    });
  }
}

function logToFiles(/** @type {PluginOptions} */ options) {
  outputProcessors.forEach((processor) => {
    if (Object.entries(writeToFileMessages).length !== 0){
      processor.write(writeToFileMessages);
      if (options.outputVerbose !== false)
        logOutputTarget(processor);
    }
  });
  writeToFileMessages = {};
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
  console.log('cypress-terminal-report:', message);
}
function installOutputProcessors(on, /** @type {PluginOptions} */ options) {
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
      throw new CtrError(`Output target type can only be string or function.`);
    }

    if (requiresNested) {
      outputProcessors.push(new NestedOutputProcessorDecorator(file, options.specRoot, (nestedFile) => {
        return createProcessorFromType(nestedFile, type);
      }));
    } else {
      outputProcessors.push(createProcessorFromType(file, type));
    }
  });

  outputProcessors.forEach((processor) => processor.initialize());
}

function compactLogs(
  /** @type {Log[]} */
  logs,
  /** @type {number} */
  keepAroundCount,
  /** @type {function} */
  logDebug,
) {
  logDebug(`Compacting ${logs.length} logs.`)

  const failingIndexes = logs.filter((log) => log.severity === CONSTANTS.SEVERITY.ERROR)
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
    compactedLogs.push({
      type: CONSTANTS.LOG_TYPES.PLUGIN_LOG_TYPE,
      message: `[ ... ${count} omitted logs ... ]`,
      severity: CONSTANTS.SEVERITY.SUCCESS
  });

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

function logToTerminal(
  /** @type {Log[]} */
  messages,
  /** @type {PluginOptions} */
  options,
  /** @type {Data} */
  data) {
  const tabLevel = data.level || 0;
  const levelPadding = '  '.repeat(Math.max(0, tabLevel - 1));
  const padding = CONSTANTS.PADDING.LOG + levelPadding;
  const padType = (type) =>
    new Array(Math.max(padding.length - type.length - 3, 0)).join(' ') + type + ' ';

  if (data.consoleTitle) {
    console.log(' '.repeat(4) + levelPadding + chalk.gray(data.consoleTitle));
  }

  messages.forEach(({type, message, severity, timeString}) => {
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
      icon = LOG_SYMBOLS.route;
      trim = options.routeTrimLength || 5000;
    } else if (type === LOG_TYPES.CYPRESS_FETCH) {
      color = 'green';
      icon = LOG_SYMBOLS.route;
      trim = options.routeTrimLength || 5000;
    } else if (type === LOG_TYPES.CYPRESS_ROUTE) {
      color = 'green';
      icon = LOG_SYMBOLS.route;
      trim = options.routeTrimLength || 5000;
    } else if (type === LOG_TYPES.CYPRESS_INTERCEPT) {
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

    if (timeString) {
      console.log(chalk.gray(`${padding}Time: ${timeString}`));
    }

    console.log(
      coloredTypeString,
      processedMessage.replace(/\n/g, '\n' + padding)
    );
  });

  if (messages.length !== 0 && !data.continuous) {
    console.log('\n');
  }
}

module.exports = installLogsPrinter;
