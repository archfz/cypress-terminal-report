import CtrError from './CtrError';
import LogCollectBrowserConsole from "./collector/LogCollectBrowserConsole";
import LogCollectCypressCommand from "./collector/LogCollectCypressCommand";
import LogCollectCypressRequest from "./collector/LogCollectCypressRequest";
import LogCollectCypressIntercept from "./collector/LogCollectCypressIntercept";
import LogCollectCypressBrowserNetwork from "./collector/LogCollectCypressBrowserNetwork";
import LogCollectCypressLog from "./collector/LogCollectCypressLog";
import LogCollectorState from "./collector/LogCollectorState";
import LogCollectControlExtended from "./collector/LogCollectControlExtended";
import LogCollectControlSimple from "./collector/LogCollectControlSimple";
import logsTxtFormatter from "./outputProcessor/logsTxtFormatter";
import CONSTANTS from "./constants";
import type {ExtendedSupportOptions, SupportOptions} from "./installLogsCollector.types";
import type {LogType, Log, Severity} from "./types";
import utils from "./utils";
import {validate} from "superstruct";
import {InstallLogsCollectorSchema} from "./installLogsCollector.schema";
import {compare} from "compare-versions";

/**
 * Installs the logs collector for cypress. Needs to be added to support file.
 */
function installLogsCollector(config: SupportOptions = {}) {
  validateConfig(config);

  const extendedConfig: ExtendedSupportOptions = {
    ...config,
    collectTypes: config.collectTypes || Object.values(CONSTANTS.LOG_TYPES),
    collectBody: config.xhr?.printBody ?? true,
    collectRequestData: config.xhr?.printRequestData,
    collectHeaderData: config.xhr?.printHeaderData,
  };

  let logCollectorState = new LogCollectorState(extendedConfig);
  registerLogCollectorTypes(logCollectorState, extendedConfig);

  if (extendedConfig.enableExtendedCollector) {
    (new LogCollectControlExtended(logCollectorState, extendedConfig)).register();
  } else {
    (new LogCollectControlSimple(logCollectorState, extendedConfig)).register();
  }

  registerGlobalApi(logCollectorState);
}

function registerLogCollectorTypes(logCollectorState: LogCollectorState, config: ExtendedSupportOptions) {
  (new LogCollectBrowserConsole(logCollectorState, config)).register()

  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_LOG)) {
    (new LogCollectCypressLog(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_XHR)) {
    (new LogCollectCypressBrowserNetwork('xhr', logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_FETCH)) {
    (new LogCollectCypressBrowserNetwork('fetch', logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_REQUEST)) {
    (new LogCollectCypressRequest(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_COMMAND)) {
    (new LogCollectCypressCommand(logCollectorState, config)).register();
  }
  if (
    config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_INTERCEPT)
    && compare(Cypress.version, '6.0.0', '>=')
  ) {
    (new LogCollectCypressIntercept(logCollectorState, config)).register();
  }
}

function registerGlobalApi(logCollectorState: LogCollectorState) {
  Cypress.TerminalReport = {
    //@ts-ignore there is no error, this works correctly.
    getLogs: (format = 'none') => {
      const logs = logCollectorState.getCurrentLogStack();

      if (!logs) {
        return null;
      }

      switch (format) {
        case "txt":
          return logsTxtFormatter(logs);
        case "json":
          return JSON.stringify(logs, null, 2);
        default:
          return logs;
      }
    },
  };
}

function validateConfig(config: SupportOptions) {
  const [error] = validate(config, InstallLogsCollectorSchema);

  if (error) {
    throw new CtrError(
      `Invalid plugin install options: ${utils.validatorErrToStr(error.failures())}`
    );
  }

  if (config.filterLog && typeof config.filterLog !== 'function') {
    throw new CtrError(`Filter log option expected to be a function.`);
  }
  if (config.processLog && typeof config.processLog !== 'function') {
    throw new CtrError(`Process log option expected to be a function.`);
  }
  if (config.collectTestLogs && typeof config.collectTestLogs !== 'function') {
    throw new CtrError(`Collect test logs option expected to be a function.`);
  }
}

// Ensures backwards compatibility type imports.
declare namespace installLogsCollector {
  export {LogType, Log, Severity, SupportOptions}
}

export = installLogsCollector;
