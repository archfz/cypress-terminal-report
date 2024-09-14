import chalk from 'chalk';
import path from 'path';
import tv4 from 'tv4';
import schema from './installLogsPrinter.schema.json';
import tv4ErrorTransformer from './tv4ErrorTransformer';
import CtrError from './CtrError';
import CONSTANTS from './constants';
import CustomOutputProcessor from './outputProcessor/CustomOutputProcessor';
import NestedOutputProcessorDecorator from './outputProcessor/NestedOutputProcessorDecorator';
import JsonOutputProcessor from "./outputProcessor/JsonOutputProcessor";
import TextOutputProcessor from "./outputProcessor/TextOutputProcessor";

const LOG_TYPES = CONSTANTS.LOG_TYPES;
const KNOWN_TYPES = Object.values(CONSTANTS.LOG_TYPES);
const OUTPUT_PROCESSOR_TYPE = {
  'json': JsonOutputProcessor,
  'txt': TextOutputProcessor,
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
let outputProcessors: any = [];

const createLogger = (enabled: any) => enabled
  ? (message: any) => console.log(`[cypress-terminal-report:debug] ${message}`)
  : () => {}

/**
 * Installs the cypress plugin for printing logs to terminal.
 *
 * Needs to be added to plugins file.
 *
 * @see ./installLogsPrinter.d.ts
 * @type {import('./installLogsPrinter')}
 */
function installLogsPrinter(on: any, options = {}) {
  // @ts-expect-error TS(2339): Property 'printLogsToFile' does not exist on type ... Remove this comment to see the full error message
  options.printLogsToFile = options.printLogsToFile || "onFail";
  // @ts-expect-error TS(2339): Property 'printLogsToConsole' does not exist on ty... Remove this comment to see the full error message
  options.printLogsToConsole = options.printLogsToConsole || "onFail";
  const result = tv4.validateMultiple(options, schema);

  if (!result.valid) {
    throw new CtrError(`Invalid plugin install options: ${tv4ErrorTransformer.toReadableString(result.errors)}`);
  }

  // @ts-expect-error TS(2339): Property 'debug' does not exist on type '{}'.
  const logDebug = createLogger(options.debug);

  on('task', {
    [CONSTANTS.TASK_NAME]: function (/** @type {Data} */ data: any) {
      logDebug(`${CONSTANTS.TASK_NAME}: Received ${data.messages.length} messages, for ${data.spec}:${data.test}, with state ${data.state}.`);
      let messages = data.messages;

      const terminalMessages =
        // @ts-expect-error TS(2339): Property 'compactLogs' does not exist on type '{}'... Remove this comment to see the full error message
        typeof options.compactLogs === 'number' && options.compactLogs >= 0
          // @ts-expect-error TS(2339): Property 'compactLogs' does not exist on type '{}'... Remove this comment to see the full error message
          ? compactLogs(messages, options.compactLogs, logDebug)
          : messages;

      const isHookAndShouldLog = data.isHook &&
        // @ts-expect-error TS(2339): Property 'includeSuccessfulHookLogs' does not exis... Remove this comment to see the full error message
        (options.includeSuccessfulHookLogs || data.state === 'failed');

      // @ts-expect-error TS(2339): Property 'outputTarget' does not exist on type '{}... Remove this comment to see the full error message
      if (options.outputTarget && options.printLogsToFile !== "never") {
        if (
          data.state === "failed" ||
          // @ts-expect-error TS(2339): Property 'printLogsToFile' does not exist on type ... Remove this comment to see the full error message
          options.printLogsToFile === "always" ||
          isHookAndShouldLog
        ) {
          let outputFileMessages =
            // @ts-expect-error TS(2339): Property 'outputCompactLogs' does not exist on typ... Remove this comment to see the full error message
            typeof options.outputCompactLogs === 'number'
              // @ts-expect-error TS(2339): Property 'outputCompactLogs' does not exist on typ... Remove this comment to see the full error message
              ? compactLogs(messages, options.outputCompactLogs, logDebug)
              // @ts-expect-error TS(2339): Property 'outputCompactLogs' does not exist on typ... Remove this comment to see the full error message
              : options.outputCompactLogs === false
              ? messages
              : terminalMessages;

          logDebug(`Storing for file logging ${outputFileMessages.length} messages, for ${data.spec}:${data.test}.`);

          // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          writeToFileMessages[data.spec] = writeToFileMessages[data.spec] || {};
          // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          writeToFileMessages[data.spec][data.test] = outputFileMessages;
        }
      }

      if (
        // @ts-expect-error TS(2339): Property 'printLogsToConsole' does not exist on ty... Remove this comment to see the full error message
        options.printLogsToConsole !== "never" && (
          // @ts-expect-error TS(2339): Property 'printLogsToConsole' does not exist on ty... Remove this comment to see the full error message
          options.printLogsToConsole === "always"
          // @ts-expect-error TS(2339): Property 'printLogsToConsole' does not exist on ty... Remove this comment to see the full error message
          || (options.printLogsToConsole === "onFail" && data.state !== "passed")
          || isHookAndShouldLog
        )
      ) {
        logDebug(`Logging to console ${terminalMessages.length} messages, for ${data.spec}:${data.test}.`);
        logToTerminal(terminalMessages, options, data);
      }

      // @ts-expect-error TS(2339): Property 'collectTestLogs' does not exist on type ... Remove this comment to see the full error message
      if (options.collectTestLogs) {
        logDebug(`Running \`collectTestLogs\` on ${terminalMessages.length} messages, for ${data.spec}:${data.test}.`);
        // @ts-expect-error TS(2339): Property 'collectTestLogs' does not exist on type ... Remove this comment to see the full error message
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

  // @ts-expect-error TS(2339): Property 'outputTarget' does not exist on type '{}... Remove this comment to see the full error message
  if (options.outputTarget) {
    installOutputProcessors(on, options);
  }

  // @ts-expect-error TS(2339): Property 'logToFilesOnAfterRun' does not exist on ... Remove this comment to see the full error message
  if (options.logToFilesOnAfterRun) {
    on('after:run', () => {
      logDebug(`after:run: Attempting file logging on after run.`);
      logToFiles(options);
    });
  }
}

function logToFiles(/** @type {PluginOptions} */ options: any) {
  outputProcessors.forEach((processor: any) => {
    if (Object.entries(writeToFileMessages).length !== 0){
      processor.write(writeToFileMessages);
      if (options.outputVerbose !== false)
        logOutputTarget(processor);
    }
  });
  writeToFileMessages = {};
}


function logOutputTarget(processor: any) {
  let message;
  let standardOutputType = Object.keys(OUTPUT_PROCESSOR_TYPE).find(
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    (type) => processor instanceof OUTPUT_PROCESSOR_TYPE[type]
  );
  if (standardOutputType) {
    message = `Wrote ${standardOutputType} logs to ${processor.getTarget()}. (${processor.getSpentTime()}ms)`;
  } else {
    message = `Wrote custom logs to ${processor.getTarget()}. (${processor.getSpentTime()}ms)`;
  }
  console.log('cypress-terminal-report:', message);
}
function installOutputProcessors(on: any, /** @type {PluginOptions} */ options: any) {
  if (!options.outputRoot) {
    throw new CtrError(`Missing outputRoot configuration.`);
  }

  const createProcessorFromType = (file: any, type: any) => {
    if (typeof type === 'string') {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      return new OUTPUT_PROCESSOR_TYPE[type](path.join(options.outputRoot, file));
    }

    if (typeof type === 'function') {
      return new CustomOutputProcessor(path.join(options.outputRoot, file), type);
    }
  };

  Object.entries(options.outputTarget).forEach(([file, type]) => {
    const requiresNested = file.match(/^[^|]+\|.*$/);

    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    if (typeof type === 'string' && !OUTPUT_PROCESSOR_TYPE[type]) {
      throw new CtrError(`Unknown output format '${type}'.`);
    }
    if (!['function', 'string'].includes(typeof type)) {
      throw new CtrError(`Output target type can only be string or function.`);
    }

    if (requiresNested) {
      const parts = file.split('|');
      const root = parts[0];
      const ext = parts[1];
      outputProcessors.push(new NestedOutputProcessorDecorator(root, options.specRoot, ext, (nestedFile: any) => {
        return createProcessorFromType(nestedFile, type);
      }));
    } else {
      outputProcessors.push(createProcessorFromType(file, type));
    }
  });

  outputProcessors.forEach((processor: any) => processor.initialize());
}

function compactLogs(
  /** @type {Log[]} */
  logs: any,
  /** @type {number} */
  keepAroundCount: any,
  /** @type {function} */
  logDebug: any,
) {
  logDebug(`Compacting ${logs.length} logs.`)

  const failingIndexes = logs.filter((log: any) => log.severity === CONSTANTS.SEVERITY.ERROR)
    .map((log: any) => logs.indexOf(log));

  const includeIndexes = new Array(logs.length);

  failingIndexes.forEach((index: any) => {
    const from = Math.max(0, index - keepAroundCount);
    const to = Math.min(logs.length - 1, index + keepAroundCount);
    for (let i = from; i <= to; i++) {
      includeIndexes[i] = 1;
    }
  });

  const compactedLogs = [];
  const addOmittedLog = (count: any) => compactedLogs.push({
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
  messages: any,
  /** @type {PluginOptions} */
  options: any,
  /** @type {Data} */
  data: any) {
  const tabLevel = data.level || 0;
  const levelPadding = '  '.repeat(Math.max(0, tabLevel - 1));
  const padding = CONSTANTS.PADDING.LOG + levelPadding;
  const padType = (type: any) => new Array(Math.max(padding.length - type.length - 3, 0)).join(' ') + type + ' ';

  if (data.consoleTitle) {
    console.log(' '.repeat(4) + levelPadding + chalk.gray(data.consoleTitle));
  }

  messages.forEach(({
    type,
    message,
    severity,
    timeString
  }: any) => {
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
      (chalk as any)[color].bold(typeString + icon + ' ') :
      (chalk as any)[color](typeString + icon + ' ');

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

export = installLogsPrinter;
