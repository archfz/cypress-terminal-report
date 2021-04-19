const LOG_TYPE = require('../constants').LOG_TYPES;
const CONSTANTS = require('../constants');
const LogFormat = require("./LogFormat");

module.exports = class LogCollectCypressXhr {

  constructor(collectorState, config) {
    this.config = config;
    this.collectorState = collectorState;

    this.format = new LogFormat(config);
  }

  register() {
    const formatXhr = (options) => options.message +
      (options.consoleProps.Stubbed === 'Yes' ? 'STUBBED ' : '') +
      options.consoleProps.Method + ' ' + options.consoleProps.URL;

    const formatDuration = (durationInMs) =>
      durationInMs < 1000 ? `${durationInMs} ms` : `${durationInMs / 1000} s`;

    Cypress.on('log:added', (options) => {
      if (
        options.instrument === 'command' &&
        options.consoleProps &&
        options.name === 'xhr' &&
        // Prevent duplicated xhr logs in case of cy.intercept.
        options.displayName !== 'req'
      ) {
        const log = formatXhr(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.WARNING : '';
        this.collectorState.addLog([LOG_TYPE.CYPRESS_XHR, log, severity], options.id);
      }
    });

    Cypress.on('log:changed', async (options) => {
      if (
        options.instrument === 'command' &&
        options.name === 'xhr' &&
        options.consoleProps &&
        options.consoleProps.Status
      ) {
        const [, statusCode, statusText] = /^(\d{3})\s\((.+)\)$/.exec(options.consoleProps.Status) || [];
        const isSuccess = statusCode && statusCode[0] === '2';
        const severity = isSuccess ? CONSTANTS.SEVERITY.SUCCESS : CONSTANTS.SEVERITY.WARNING;
        let log = formatXhr(options) +
          ` (${formatDuration(options.consoleProps.Duration)})` +
          `\nStatus: ${statusCode} - ${statusText}`;
        if (!isSuccess && !this.collectorState.hasXhrResponseBeenLogged(options.consoleProps.XHR.id)) {
          log += `\nResponse body: ${await this.format.formatXhrBody(options.consoleProps.Response.body)}`;
        }
        this.collectorState.updateLog(log, severity, options.id);
      }
    });
  }

}
