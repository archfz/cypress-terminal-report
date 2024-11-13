import CONSTANTS from './constants';
import {
  boolean,
  enums,
  func,
  min,
  number,
  object,
  optional,
  record,
  string,
  union,
} from 'superstruct';

const LOG_OCCURRENCE = Object.values(CONSTANTS.LOG_OCCURRENCE);

const InstallLogsPrinterSchema = object({
  printLogsToConsole: optional(enums(LOG_OCCURRENCE)),
  printLogsToFile: optional(enums(LOG_OCCURRENCE)),
  includeSuccessfulHookLogs: optional(boolean()),
  defaultTrimLength: optional(number()),
  commandTrimLength: optional(number()),
  routeTrimLength: optional(number()),
  compactLogs: optional(min(number(), 0)),
  outputCompactLogs: optional(union([min(number(), -1), boolean()])),
  outputRoot: optional(string()),
  specRoot: optional(string()),
  outputTarget: optional(record(string(), union([string(), func()]))),
  collectTestLogs: optional(func()),
  logToFilesOnAfterRun: optional(boolean()),
  outputVerbose: optional(boolean()),
  debug: optional(boolean()),
});

export {InstallLogsPrinterSchema};
