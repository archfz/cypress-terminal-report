import CONSTANTS from '../constants';

export default class LogCollectCypressLog {
  collectorState: any;
  config: any;

  constructor(collectorState: any, config: any) {
    this.config = config;
    this.collectorState = collectorState;
  }

  register() {
    Cypress.Commands.overwrite('log', (subject: any, ...args: any[]) => {
      this.collectorState.addLog([CONSTANTS.LOG_TYPES.CYPRESS_LOG, args.join(' ')]);
      subject(...args);
    });
  }
}
