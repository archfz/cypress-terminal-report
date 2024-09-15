import CONSTANTS from '../constants';
import LogFormat from "./LogFormat";
import LogCollectorState from "./LogCollectorState";
import type {ExtendedSupportOptions} from "../installLogsCollector.types";

export default class LogCollectCypressXhr {
  format: LogFormat;
  protected messageProcessors: Array<(props: any, isSuccess: boolean) => Promise<string>> = []

  constructor(protected collectorState: LogCollectorState, protected config: ExtendedSupportOptions) {
    let format;
    this.format = format = new LogFormat(config);

    if (this.config.collectRequestData && this.config.collectHeaderData) {
      this.messageProcessors.push(async (props) =>
        props['Request Headers'] ? `\nRequest headers: ${await format.formatXhrData(props['Request Headers'])}` : '');
    }
    if (this.config.collectRequestData && this.config.collectBody) {
      this.messageProcessors.push(async (props) =>
        props['Request Body'] ? `\nRequest body: ${await format.formatXhrData(props['Request Body'])}` : '');
    }
    if (this.config.collectHeaderData) {
      this.messageProcessors.push(async (props) =>
        props['Response Headers'] ? `\nResponse headers: ${await format.formatXhrData(props['Response Headers'])}` : '');
    }
    if (this.config.collectBody) {
      this.messageProcessors.push(async (props, isSuccess) =>
        props['Response Body'] && !isSuccess ? `\nResponse body: ${await format.formatXhrData(props['Response Body'])}` : '');
    }
  }

  register() {
    // In Cypress 13+ this is under an extra props key
    const getConsoleProps = (options: any) => options.consoleProps?.props ? options.consoleProps.props : options.consoleProps

    const formatXhr = (options: any) => (options.renderProps.wentToOrigin ? '' : 'STUBBED ') +
      getConsoleProps(options).Method + ' ' + getConsoleProps(options).URL;

    const formatDuration = (durationInMs: number) => durationInMs < 1000 ? `${durationInMs} ms` : `${durationInMs / 1000} s`;

    Cypress.on('log:added', (options) => {
      if (
        options.instrument === 'command' &&
        getConsoleProps(options) &&
        options.displayName === 'xhr'
      ) {
        const log = formatXhr(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.WARNING : CONSTANTS.SEVERITY.SUCCESS;
        this.collectorState.addLog([CONSTANTS.LOG_TYPES.CYPRESS_XHR, log, severity], options.id);
      }
    });

    Cypress.on('log:changed', async (options) => {
      if (
        options.instrument === 'command' &&
        ['request', 'xhr'].includes(options.name) &&
        options.displayName !== 'fetch' &&
        getConsoleProps(options) &&
        options.state !== 'pending'
      ) {
        let statusCode;
        let consoleProp = getConsoleProps(options);

        if (consoleProp['Response Status Code']) {
          statusCode = consoleProp['Response Status Code'];
        }

        const isSuccess = statusCode && (statusCode + '')[0] === '2';
        const severity = isSuccess ? CONSTANTS.SEVERITY.SUCCESS : CONSTANTS.SEVERITY.WARNING;
        let log = formatXhr(options);

        // @TODO: Not supported anymore :(
        if (consoleProp.Duration) {
          log += ` (${formatDuration(consoleProp.Duration)})`;
        }
        if (statusCode) {
          log += `\nStatus: ${statusCode}`;
        }
        if (options.err && options.err.message.match(/abort/)) {
          log += ' - ABORTED';
        }

        await Promise.all(this.messageProcessors.map((proc) => proc(consoleProp, isSuccess)))
          .then(results => {
            log += results.join('');
          });

        this.collectorState.updateLog(log, severity, options.id);
      }
    });
  }
}
