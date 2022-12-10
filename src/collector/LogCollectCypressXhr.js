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
    const formatXhr = (options) =>
      (options.renderProps.wentToOrigin ? '' : 'STUBBED ') +
      options.consoleProps.Method + ' ' + options.consoleProps.URL;

    const formatDuration = (durationInMs) =>
      durationInMs < 1000 ? `${durationInMs} ms` : `${durationInMs / 1000} s`;

    Cypress.on('log:added', (options) => {
      if (
        options.instrument === 'command' &&
        options.consoleProps &&
        options.displayName === 'xhr'
      ) {
        const log = formatXhr(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.WARNING : '';
        this.collectorState.addLog([LOG_TYPE.CYPRESS_XHR, log, severity], options.id);
      }
    });

    Cypress.on('log:changed', async (options) => {
      if (
        options.instrument === 'command' &&
        ['request', 'xhr'].includes(options.name) &&
        options.consoleProps &&
        options.state !== 'pending'
      ) {
        let statusCode;

        if (options.consoleProps['Response Status Code']) {
          statusCode = options.consoleProps['Response Status Code'];
        }

        const isSuccess = statusCode && (statusCode + '')[0] === '2';
        const severity = isSuccess ? CONSTANTS.SEVERITY.SUCCESS : CONSTANTS.SEVERITY.WARNING;
        let log = formatXhr(options);

        // @TODO: Not supported anymore :(
        if (options.consoleProps.Duration) {
          log += ` (${formatDuration(options.consoleProps.Duration)})`;
        }
        if (statusCode) {
          log += `\nStatus: ${statusCode}`;
        }
        if (options.err && options.err.message.match(/abort/)) {
          log += ' - ABORTED';
        }
        if (
          this.config.collectRequestData && this.config.collectHeaderData &&
          options.consoleProps['Request Headers']
        ) {
          log += `\nRequest headers: ${await this.format.formatXhrBody(options.consoleProps['Request Headers'])}`;
        }
        if (
          this.config.collectRequestData &&
          options.consoleProps['Request Body']
        ) {
          log += `\nRequest body: ${await this.format.formatXhrBody(options.consoleProps['Request Body'])}`;
        }
        if (
          this.config.collectHeaderData &&
          options.consoleProps['Response Headers']
        ) {
          log += `\nResponse headers: ${await this.format.formatXhrBody(options.consoleProps['Response Headers'])}`;
        }
        if (
          !isSuccess &&
          options.consoleProps['Response Body']
        ) {
          log += `\nResponse body: ${await this.format.formatXhrBody(options.consoleProps['Response Body'])}`;
        }

        this.collectorState.updateLog(log, severity, options.id);
      }
    });
  }

}
