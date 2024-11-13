import CONSTANTS from "./constants";
import {array, boolean, enums, func, object, optional} from "superstruct";

const InstallLogsCollectorSchema = object({
  collectTypes: optional(array(enums(
    Object.values(CONSTANTS.LOG_TYPES).filter(
      (t) => t !== CONSTANTS.LOG_TYPES.PLUGIN_LOG_TYPE
    )
  ))
  ),
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
  commandTimings: optional(enums(Object.values(CONSTANTS.COMMAND_TIMINGS))),
  debug: optional(boolean()),
});

export {InstallLogsCollectorSchema};
