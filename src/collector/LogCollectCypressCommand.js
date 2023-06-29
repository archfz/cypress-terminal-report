const LOG_TYPE = require('../constants').LOG_TYPES;
const CONSTANTS = require('../constants');
const stringify = require('safe-json-stringify');

module.exports = class LogCollectCypressCommand {

  constructor(collectorState, config) {
    this.config = config;
    this.collectorState = collectorState;
  }

  register() {
    const isOfInterest = (options) =>
      options.instrument === 'command' &&
      options.consoleProps &&
      !['xhr', 'log', 'request'].includes(options.name) &&
      !(options.name === 'task' && options.message.match(/ctrLogMessages/));

    const formatLogMessage = (options) => {
      let message = options.name + '\t' + options.message;

      if (options.expected && options.actual) {
        message += '\nActual: \t' + stringify(options.actual);
        message += '\nExpected: \t' + stringify(options.expected);
      }

      return message;
    };

    Cypress.on('log:added', (options) => {
      if (isOfInterest(options)) {
        const log = formatLogMessage(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.ERROR : '';
        this.collectorState.addLog([LOG_TYPE.CYPRESS_COMMAND, log, severity], options.id);
      }
    });

    Cypress.on('log:changed', (options) => {
      if (isOfInterest(options)) {
        const log = formatLogMessage(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.ERROR : CONSTANTS.SEVERITY.SUCCESS;
        this.collectorState.updateLog(log, severity, options.id);
      }
    });
  }

}
