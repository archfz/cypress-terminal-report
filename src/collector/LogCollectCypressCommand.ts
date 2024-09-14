import CONSTANTS from '../constants';
import utils from '../utils';

export default class LogCollectCypressCommand {
  collectorState: any;
  config: any;

  constructor(collectorState: any, config: any) {
    this.config = config;
    this.collectorState = collectorState;
  }

  register() {
    const isOfInterest = (options: any) => options.instrument === 'command' &&
    options.consoleProps &&
    !['xhr', 'log', 'request'].includes(options.name) &&
    !(options.name === 'task' && options.message.match(/ctrLogMessages/));

    const formatLogMessage = (options: any) => {
      let message = options.name + '\t' + options.message;

      if (options.expected && options.actual) {
        message += '\nActual: \t' + utils.jsonStringify(options.actual, false);
        message += '\nExpected: \t' + utils.jsonStringify(options.expected, false);
      }

      return message;
    };

    Cypress.on('log:added', (options: any) => {
      if (isOfInterest(options)) {
        const log = formatLogMessage(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.ERROR : '';
        this.collectorState.addLog([CONSTANTS.LOG_TYPES.CYPRESS_COMMAND, log, severity], options.id);
      }
    });

    Cypress.on('log:changed', (options: any) => {
      if (isOfInterest(options)) {
        const log = formatLogMessage(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.ERROR : CONSTANTS.SEVERITY.SUCCESS;
        this.collectorState.updateLog(log, severity, options.id);
      }
    });
  }
}
