import path from 'path';
import CtrError from './CtrError';
import CONSTANTS from './constants';
import CustomOutputProcessor from './outputProcessor/CustomOutputProcessor';
import NestedOutputProcessorDecorator from './outputProcessor/NestedOutputProcessorDecorator';
import JsonOutputProcessor from './outputProcessor/JsonOutputProcessor';
import TextOutputProcessor from './outputProcessor/TextOutputProcessor';
import type {
  CustomOutputProcessorCallback,
  PluginOptions,
  AllMessages,
} from './installLogsPrinter.types';
import type {BuiltinOutputProcessorsTypes, Log, LogType, MessageData, Severity} from './types';
import type {IOutputProcecessor} from './outputProcessor/BaseOutputProcessor';
import utils from './utils';
import consoleProcessor from './outputProcessor/consoleProcessor';
import {validate} from 'superstruct';
import {InstallLogsPrinterSchema} from './installLogsPrinter.schema';

const OUTPUT_PROCESSOR_TYPE: Record<
  BuiltinOutputProcessorsTypes,
  {new (file: string, options: PluginOptions): IOutputProcecessor}
> = {
  json: JsonOutputProcessor,
  txt: TextOutputProcessor,
};

let writeToFileMessages: Record<string, Record<string, Log[]>> = {};
let outputProcessors: IOutputProcecessor[] = [];

const createLogger = (enabled?: boolean) =>
  enabled
    ? (message: string) => console.log(`[cypress-terminal-report:debug] ${message}`)
    : () => {};

/**
 * Installs the cypress plugin for printing logs to terminal.
 *
 * Needs to be added to plugins file.
 *
 * @see ./installLogsPrinter.d.ts
 * @type {import('./installLogsPrinter')}
 */
function installLogsPrinter(on: Cypress.PluginEvents, options: PluginOptions = {}) {
  const resolvedOptions: PluginOptions = {
    printLogsToFile: 'onFail',
    printLogsToConsole: 'onFail',
    routeTrimLength: 5000,
    defaultTrimLength: 800,
    commandTrimLength: 800,
    outputVerbose: true,
    ...options,
  };

  const {
    printLogsToFile,
    printLogsToConsole,
    outputCompactLogs,
    outputTarget,logToFilesOnAfterRun,
    includeSuccessfulHookLogs,
    compactLogs: compactLogsOption,
    collectTestLogs,
  } = resolvedOptions;

  const [error] = validate(resolvedOptions, InstallLogsPrinterSchema);

  if (error) {
    throw new CtrError(
      `Invalid plugin install options: ${utils.validatorErrToStr(error.failures())}`
    );
  }

  const logDebug = createLogger(resolvedOptions.debug);

  on('task', {
    [CONSTANTS.TASK_NAME]: function (data: MessageData) {
      logDebug(
        `${CONSTANTS.TASK_NAME}: Received ${data.messages.length} messages, for ${data.spec}:${data.test}, with state ${data.state}.`
      );
      let messages = data.messages;

      const terminalMessages =
        typeof compactLogsOption === 'number' && compactLogsOption >= 0
          ? compactLogs(messages, compactLogsOption, logDebug)
          : messages;

      const isHookAndShouldLog =
        data.isHook && (includeSuccessfulHookLogs || data.state === 'failed');

      if (outputTarget && printLogsToFile !== 'never') {
        if (data.state === 'failed' || printLogsToFile === 'always' || isHookAndShouldLog) {
          let outputFileMessages =
            typeof outputCompactLogs === 'number'
              ? compactLogs(messages, outputCompactLogs, logDebug)
              : outputCompactLogs === false
                ? messages
                : terminalMessages;

          logDebug(
            `Storing for file logging ${outputFileMessages.length} messages, for ${data.spec}:${data.test}.`
          );

          writeToFileMessages[data.spec] = writeToFileMessages[data.spec] || {};
          writeToFileMessages[data.spec][data.test] = outputFileMessages;
        }
      }

      if (
        printLogsToConsole !== 'never' &&
        (printLogsToConsole === 'always' ||
          (printLogsToConsole === 'onFail' && data.state !== 'passed') ||
          isHookAndShouldLog)
      ) {
        logDebug(
          `Logging to console ${terminalMessages.length} messages, for ${data.spec}:${data.test}.`
        );
        consoleProcessor(terminalMessages, resolvedOptions, data);
      }

      if (collectTestLogs) {
        logDebug(
          `Running \`collectTestLogs\` on ${terminalMessages.length} messages, for ${data.spec}:${data.test}.`
        );
        collectTestLogs({spec: data.spec, test: data.test, state: data.state}, terminalMessages);
      }

      return null;
    },
    [CONSTANTS.TASK_NAME_OUTPUT]: () => {
      logDebug(`${CONSTANTS.TASK_NAME_OUTPUT}: Triggered.`);
      logToFiles(resolvedOptions);
      return null;
    },
  });

  installOutputProcessors(on, resolvedOptions);

  if (logToFilesOnAfterRun) {
    on('after:run', () => {
      logDebug(`after:run: Attempting file logging on after run.`);
      logToFiles(resolvedOptions);
    });
  }
}

function logToFiles(options: PluginOptions) {
  outputProcessors.forEach((processor) => {
    if (Object.entries(writeToFileMessages).length !== 0) {
      processor.write(writeToFileMessages);
      if (options.outputVerbose !== false) logOutputTarget(processor);
    }
  });
  writeToFileMessages = {};
}

function logOutputTarget(processor: IOutputProcecessor) {
  let message;
  let standardOutputType = (
    Object.keys(OUTPUT_PROCESSOR_TYPE) as BuiltinOutputProcessorsTypes[]
  ).find((type) => processor instanceof OUTPUT_PROCESSOR_TYPE[type]);
  if (standardOutputType) {
    message = `Wrote ${standardOutputType} logs to ${processor.getTarget()}. (${processor.getSpentTime()}ms)`;
  } else {
    message = `Wrote custom logs to ${processor.getTarget()}. (${processor.getSpentTime()}ms)`;
  }
  console.log('cypress-terminal-report:', message);
}

function installOutputProcessors(on: Cypress.PluginEvents, options: PluginOptions) {
  if (!options.outputTarget) {
    return;
  }
  if (!options.outputRoot) {
    throw new CtrError(`Missing outputRoot configuration.`);
  }

  const createProcessorFromType = (
    file: string,
    options: PluginOptions,
    type: BuiltinOutputProcessorsTypes | CustomOutputProcessorCallback
  ) => {
    const filepath = path.join(options.outputRoot || '', file);

    if (typeof type === 'string') {
      return new OUTPUT_PROCESSOR_TYPE[type](filepath, options);
    }

    if (typeof type === 'function') {
      return new CustomOutputProcessor(filepath, options, type);
    }

    throw new Error('Unexpected type case.');
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
      const parts = file.split('|');
      const root = parts[0];
      const ext = parts[1];
      outputProcessors.push(
        new NestedOutputProcessorDecorator(
          root,
          options.specRoot || '',
          ext,
          (nestedFile: string) => createProcessorFromType(nestedFile, options, type)
        )
      );
    } else {
      outputProcessors.push(createProcessorFromType(file, options, type));
    }
  });

  outputProcessors.forEach((processor) => processor.initialize());
}

function compactLogs(logs: Log[], keepAroundCount: number, logDebug: (message: string) => void) {
  logDebug(`Compacting ${logs.length} logs.`);

  const failingIndexes = logs
    .filter((log) => log.severity === CONSTANTS.SEVERITY.ERROR)
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
  const addOmittedLog = (count: number) =>
    compactedLogs.push({
      type: CONSTANTS.LOG_TYPES.PLUGIN_LOG_TYPE,
      message: `[ ... ${count} omitted logs ... ]`,
      severity: CONSTANTS.SEVERITY.SUCCESS,
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

// Ensures backwards compatibility type imports.
declare namespace installLogsPrinter {
  export {LogType, Log, Severity, PluginOptions, AllMessages, CustomOutputProcessorCallback};
}

export = installLogsPrinter;
