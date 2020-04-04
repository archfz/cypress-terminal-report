const installLogsPrinter = require('./src/installLogsPrinter');
const installLogsCollector = require('./src/installLogsCollector');

module.exports = {
  /**
   * Installs the cypress plugin for printing logs to terminal.
   *
   * Needs to be added to plugins file.
   *
   * @param {Function} on
   *    Cypress event listen handler.
   * @param {object} options
   *    Options for displaying output:
   *      - defaultTrimLength?: Trim length for console and cy.log.
   *      - commandTrimLength?: Trim length for cy commands.
   */
  installPlugin: (on, options = {}) => installLogsPrinter(on, options),

  /**
   * Installs the logs collector for cypress.
   *
   * Needs to be added to support file.
   *
   * @param {object} config
   *    Options for collection logs:
   *      - printLogs?: string; Default: 'onFail'. When to print logs, possible values: 'always', 'onFail'.
   *      - collectTypes?: array; Collect only these types of logs. Defaults to all types.
   *      - filterLog?: ([type, message, severity]) => boolean; Callback to filter logs manually.
   */
  installSupport: config => installLogsCollector(config),
};
