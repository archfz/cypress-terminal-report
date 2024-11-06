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

const InstallLogsPrinterSchema = object({
  printLogsToConsole: optional(enums(['onFail', 'always', 'never'])),
  printLogsToFile: optional(enums(['onFail', 'always', 'never'])),
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
