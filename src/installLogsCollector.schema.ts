import {array, boolean, enums, func, object, optional} from "superstruct";

const InstallLogsCollectorSchema = object({
  collectTypes: optional(array(enums([
    "cons:log",
    "cons:info",
    "cons:warn",
    "cons:error",
    "cons:debug",
    "cy:log",
    "cy:xhr",
    "cy:fetch",
    "cy:request",
    "cy:intercept",
    "cy:command"
  ]))),
  filterLog: optional(func()),
  processLog: optional(func()),
  collectTestLogs: optional(func()),
  xhr: optional(object({
    printHeaderData: optional(boolean()),
    printRequestData: optional(boolean()),
    printBody: optional(boolean()),
  })),
  enableExtendedCollector: optional(boolean()),
  enableContinuousLogging: optional(boolean()),
  commandTimings: optional(enums(["timestamp", "seconds"])),
  debug: optional(boolean()),
});

export {InstallLogsCollectorSchema};
