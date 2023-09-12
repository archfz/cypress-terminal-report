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
    // In Cypress 13+ this is under an extra props key
    const consoleProps = (options) => options.consoleProps && options.consoleProps.props ? options.consoleProps.props : options.consoleProps

    const formatXhr = (options) =>
      (options.renderProps.wentToOrigin ? '' : 'STUBBED ') +
      consoleProps(options).Method + ' ' + consoleProps(options).URL;

    const formatDuration = (durationInMs) =>
      durationInMs < 1000 ? `${durationInMs} ms` : `${durationInMs / 1000} s`;

    Cypress.on('log:added', (options) => {
      if (
        options.instrument === 'command' &&
        consoleProps(options) &&
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
        consoleProps(options) &&
        options.state !== 'pending'
      ) {
        let statusCode;

        if (consoleProps(options)['Response Status Code']) {
          statusCode = consoleProps(options)['Response Status Code'];
        }

        const isSuccess = statusCode && (statusCode + '')[0] === '2';
        const severity = isSuccess ? CONSTANTS.SEVERITY.SUCCESS : CONSTANTS.SEVERITY.WARNING;
        let log = formatXhr(options);

        // @TODO: Not supported anymore :(
        if (consoleProps(options).Duration) {
          log += ` (${formatDuration(consoleProps(options).Duration)})`;
        }
        if (statusCode) {
          log += `\nStatus: ${statusCode}`;
        }
        if (options.err && options.err.message.match(/abort/)) {
          log += ' - ABORTED';
        }
        if (
          this.config.collectRequestData && this.config.collectHeaderData &&
          consoleProps(options)['Request Headers']
        ) {
          log += `\nRequest headers: ${await this.format.formatXhrBody(consoleProps(options)['Request Headers'])}`;
        }
        if (
          this.config.collectRequestData &&
          consoleProps(options)['Request Body']
        ) {
          log += `\nRequest body: ${await this.format.formatXhrBody(consoleProps(options)['Request Body'])}`;
        }
        if (
          this.config.collectHeaderData &&
          consoleProps(options)['Response Headers']
        ) {
          log += `\nResponse headers: ${await this.format.formatXhrBody(consoleProps(options)['Response Headers'])}`;
        }
        if (
          !isSuccess &&
          consoleProps(options)['Response Body']
        ) {
          log += `\nResponse body: ${await this.format.formatXhrBody(consoleProps(options)['Response Body'])}`;
        }

        this.collectorState.updateLog(log, severity, options.id);
      }
    });
  }

}
