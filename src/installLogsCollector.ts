import tv4 from 'tv4';
import semver from 'semver';
import schema from './installLogsCollector.schema.json';
import CtrError from './CtrError';
import tv4ErrorTransformer from './tv4ErrorTransformer';
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

/**
 * Installs the logs collector for cypress.
 *
 * Needs to be added to support file.
 *
 * @see ./installLogsCollector.d.ts
 * @type {import('./installLogsCollector')}
 */
function installLogsCollector(config = {}) {
  validateConfig(config);

  // @ts-expect-error TS(2339): Property 'collectTypes' does not exist on type '{}... Remove this comment to see the full error message
  config.collectTypes = config.collectTypes || Object.values(CONSTANTS.LOG_TYPES);
  // @ts-expect-error TS(2339): Property 'collectBody' does not exist on type '{}'... Remove this comment to see the full error message
  config.collectBody = config.xhr && config.xhr.printBody !== undefined ? !!config.xhr.printBody : true;
  // @ts-expect-error TS(2339): Property 'collectRequestData' does not exist on ty... Remove this comment to see the full error message
  config.collectRequestData = config.xhr && config.xhr.printRequestData;
  // @ts-expect-error TS(2339): Property 'collectHeaderData' does not exist on typ... Remove this comment to see the full error message
  config.collectHeaderData = config.xhr && config.xhr.printHeaderData;

  let logCollectorState = new LogCollectorState(config);
  registerLogCollectorTypes(logCollectorState, config);

  // @ts-expect-error TS(2339): Property 'enableExtendedCollector' does not exist ... Remove this comment to see the full error message
  if (config.enableExtendedCollector) {
    (new LogCollectExtendedControl(logCollectorState, config)).register();
  } else {
    (new LogCollectSimpleControl(logCollectorState, config)).register();
  }

  registerGlobalApi(logCollectorState);
}

function registerLogCollectorTypes(logCollectorState: any, config: any) {
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
  // @ts-expect-error TS(2339): Property 'TerminalReport' does not exist on type '... Remove this comment to see the full error message
  Cypress.TerminalReport = {
    getLogs: (format: any) => {
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

function validateConfig(config: any) {
  const result = tv4.validateMultiple(config, schema);

  if (!result.valid) {
    throw new CtrError(
      `Invalid plugin install options: ${tv4ErrorTransformer.toReadableString(
        result.errors
      )}`
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

export = installLogsCollector;
