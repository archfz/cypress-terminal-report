import tv4 from 'tv4';
import semver from 'semver';
import schema from './installLogsCollector.schema.json';
import CtrError from './CtrError';
import LogCollectBrowserConsole from "./collector/LogCollectBrowserConsole";
import LogCollectCypressCommand from "./collector/LogCollectCypressCommand";
import LogCollectCypressRequest from "./collector/LogCollectCypressRequest";
import LogCollectCypressIntercept from "./collector/LogCollectCypressIntercept";
import LogCollectCypressXhr from "./collector/LogCollectCypressXhr";
import LogCollectCypressFetch from "./collector/LogCollectCypressFetch";
import LogCollectCypressLog from "./collector/LogCollectCypressLog";
import LogCollectorState from "./collector/LogCollectorState";
import LogCollectExtendedControl from "./collector/LogCollectExtendedControl";
import LogCollectSimpleControl from "./collector/LogCollectSimpleControl";
import logsTxtFormatter from "./outputProcessor/logsTxtFormatter";
import CONSTANTS from "./constants";
import {ExtendedSupportOptions, SupportOptions} from "./installLogsCollector.types";
import {LogType, Log, Severity} from "./types";
import utils from "./utils";

/**
 * Installs the logs collector for cypress. Needs to be added to support file.
 */
function installLogsCollector(config: SupportOptions = {}) {
  validateConfig(config);

  const extendedConfig: ExtendedSupportOptions = {
    ...config,
    collectTypes: config.collectTypes || Object.values(CONSTANTS.LOG_TYPES) as LogType[],
    collectBody: config.xhr && config.xhr.printBody !== undefined ? config.xhr.printBody : true,
    collectRequestData: config.xhr && config.xhr.printRequestData,
    collectHeaderData: config.xhr && config.xhr.printHeaderData,
  };

  let logCollectorState = new LogCollectorState(extendedConfig);
  registerLogCollectorTypes(logCollectorState, extendedConfig);

  if (extendedConfig.enableExtendedCollector) {
    (new LogCollectExtendedControl(logCollectorState, extendedConfig)).register();
  } else {
    (new LogCollectSimpleControl(logCollectorState, extendedConfig)).register();
  }

  registerGlobalApi(logCollectorState);
}

function registerLogCollectorTypes(logCollectorState: any, config: ExtendedSupportOptions) {
  (new LogCollectBrowserConsole(logCollectorState, config)).register()

  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_LOG)) {
    (new LogCollectCypressLog(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_XHR)) {
    (new LogCollectCypressXhr(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_FETCH)) {
    (new LogCollectCypressFetch(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_REQUEST)) {
    (new LogCollectCypressRequest(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_COMMAND)) {
    (new LogCollectCypressCommand(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(CONSTANTS.LOG_TYPES.CYPRESS_INTERCEPT) && semver.gte(Cypress.version, '6.0.0')) {
    (new LogCollectCypressIntercept(logCollectorState, config)).register();
  }
}

function registerGlobalApi(logCollectorState: any) {
  (Cypress as any).TerminalReport = {
    getLogs: (format: string) => {
      const logs = logCollectorState.getCurrentLogStack();

      if (format === 'txt') {
        return logsTxtFormatter(logs);
      } else if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      }

      return logs;
    },
  };
}

function validateConfig(config: SupportOptions) {
  const result = tv4.validateMultiple(config, schema);

  if (!result.valid) {
    throw new CtrError(
      `Invalid plugin install options: ${utils.tv4ToString(result.errors)}`
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
