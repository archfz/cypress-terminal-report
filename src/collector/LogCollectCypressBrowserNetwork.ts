import CONSTANTS from '../constants';
import LogCollectorState from "./LogCollectorState";
import type {ExtendedSupportOptions} from "../installLogsCollector.types";
import LogCollectBase from "./LogCollectBase";

export default class LogCollectCypressBrowserNetwork extends LogCollectBase {
  protected messageProcessors: Array<(props: any, isSuccess: boolean) => Promise<string>> = []
  protected typeString;

  constructor(
    protected type: 'xhr' | 'fetch',
    protected collectorState: LogCollectorState,
    protected config: ExtendedSupportOptions
  ) {
    super(collectorState, config);
    let format = this.format;

    this.typeString = type === 'xhr' ? CONSTANTS.LOG_TYPES.CYPRESS_XHR : CONSTANTS.LOG_TYPES.CYPRESS_FETCH;

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
    const getConsoleProps = (options: Cypress.ObjectLike) =>
      options.consoleProps?.props || options.consoleProps

    const formatXhr = (options: Cypress.ObjectLike, props: Cypress.ObjectLike) =>
      (options.alias !== undefined ? '(' + options.alias + ') ' : '') +
      (options.renderProps.wentToOrigin || props["Request went to origin?"] === 'yes' ? '' : 'STUBBED ') +
      props.Method + ' ' + props.URL;

    const formatDuration = (durationInMs: number) =>
      durationInMs < 1000 ? `${durationInMs} ms` : `${durationInMs / 1000} s`;

    Cypress.on('log:added', (options) => {
      const props = getConsoleProps(options);

      if (props && options.instrument === 'command' && options.displayName === this.type) {
        const log = formatXhr(options, props);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.WARNING : CONSTANTS.SEVERITY.SUCCESS;
        this.collectorState.addLog([this.typeString, log, severity], options.id);
      }
    });

    Cypress.on('log:changed', async (options) => {
      const props = getConsoleProps(options);

      if (props && options.instrument === 'command' && options.displayName === this.type && options.state !== 'pending') {
        let statusCode = props['Response Status Code'];

        const isSuccess = statusCode && (statusCode + '')[0] === '2';
        const severity = isSuccess ? CONSTANTS.SEVERITY.SUCCESS : CONSTANTS.SEVERITY.WARNING;
        let log = formatXhr(options, props);

        // @TODO: Not supported anymore :(
        if (props.Duration) {
          log += ` (${formatDuration(props.Duration)})`;
        }
        if (statusCode) {
          log += `\nStatus: ${statusCode}`;
        }
        if (options.err?.message) {
          if (options.err.message.match(/abort/)) {
            log += ' - ABORTED';
          } else {
            log += ' - ' + options.err.message;
          }
        }

        await Promise.all(this.messageProcessors.map((proc) => proc(props, isSuccess)))
          .then(results => {log += results.join('')});

        this.collectorState.updateLog(log, severity, options.id);
      }
    });
  }
}
