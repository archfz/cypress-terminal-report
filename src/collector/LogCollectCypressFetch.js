const LOG_TYPE = require('../constants').LOG_TYPES;
const CONSTANTS = require('../constants');
const LogFormat = require("./LogFormat");

module.exports = class LogCollectCypressFetch {

  constructor(collectorState, config) {
    this.config = config;
    this.collectorState = collectorState;

    this.format = new LogFormat(config);
  }

  register() {
    // In Cypress 13+ this is under an extra props key
    const consoleProps = (options) => options.consoleProps && options.consoleProps.props ? options.consoleProps.props : options.consoleProps

    const formatFetch = (options) => (options.alias !== undefined ? '(' + options.alias + ') ' : '') +
      (consoleProps(options)["Request went to origin?"] !== 'yes' ? 'STUBBED ' : '') +
      consoleProps(options).Method + ' ' + consoleProps(options).URL;

    const formatDuration = (durationInMs) =>
      durationInMs < 1000 ? `${durationInMs} ms` : `${durationInMs / 1000} s`;

    Cypress.on('log:added', (options) => {
      if (options.instrument === 'command' && options.name === 'request' && options.displayName === 'fetch') {
        const log = formatFetch(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.WARNING : '';
        this.collectorState.addLog([LOG_TYPE.CYPRESS_FETCH, log, severity], options.id);
      }
    });

    Cypress.on('log:changed', async (options) => {
      if (
        options.instrument === 'command' && options.name === 'request' && options.displayName === 'fetch' &&
        options.state !== 'pending'
      ) {
        let statusCode;

        statusCode = consoleProps(options)["Response Status Code"];

        const isSuccess = statusCode && (statusCode + '')[0] === '2';
        const severity = isSuccess ? CONSTANTS.SEVERITY.SUCCESS : CONSTANTS.SEVERITY.WARNING;
        let log = formatFetch(options);

        if (consoleProps(options).Duration) {
          log += ` (${formatDuration(consoleProps(options).Duration)})`;
        }
        if (statusCode) {
          log += `\nStatus: ${statusCode}`;
        }
        if (options.err && options.err.message) {
          log += ' - ' + options.err.message;
        }

        if (
          !isSuccess &&
          consoleProps(options)["Response Body"]
        ) {
          log += `\nResponse body: ${await this.format.formatXhrBody(consoleProps(options)["Response Body"])}`;
        }

        this.collectorState.updateLog(log, severity, options.id);
      }
    });
  }

}
