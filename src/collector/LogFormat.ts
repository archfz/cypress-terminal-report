import type {ExtendedSupportOptions} from '../installLogsCollector.types';

export default class LogFormat {
  protected messageProcessors: Array<(log: any) => string> = [];

  constructor(protected config: ExtendedSupportOptions) {
    if (this.config.collectRequestData) {
      if (this.config.collectHeaderData) {
        this.messageProcessors.push((log) =>
          log.request ? `Request headers: ${log.request.headers}\n` : ''
        );
      }
      if (this.config.collectBody) {
        this.messageProcessors.push((log) =>
          log.request ? `Request body: ${log.request.body}\n` : ''
        );
      }
    }

    if (this.config.collectHeaderData) {
      this.messageProcessors.push((log) =>
        log.response ? `Response headers: ${log.response.headers}\n` : ''
      );
    }
    if (this.config.collectBody) {
      this.messageProcessors.push((log) =>
        log.response ? `Response body: ${log.response.body}` : ''
      );
    }
  }

  formatXhrLog(xhrLog: any) {
    let logMessage = xhrLog.response
      ? `Status: ${xhrLog.response.status}\n`
      : xhrLog.networkError
        ? `Network error: ${xhrLog.networkError}\n`
        : '';

    this.messageProcessors.forEach((processor) => (logMessage += processor(xhrLog)));

    return logMessage.trimEnd();
  }

  formatXhrData(body: any) {
    if (!body) {
      return Promise.resolve('<EMPTY>');
    } else if (typeof body === 'string') {
      // @TODO: Legacy support code. On older version body might be string but infact JSON.
      if (body.charAt(0) === '{' && body.charAt(body.length - 1) === '}') {
        try {
          return Promise.resolve(JSON.stringify(JSON.parse(body), null, 2));
        } catch (e) {
          /* noop */
        }
      }

      return Promise.resolve(body);
    } else if (typeof body === 'object') {
      if (typeof body.text === 'function') {
        return body.text();
      }
      return Promise.resolve(`${JSON.stringify(body, null, 2)}`);
    }
    return Promise.resolve('<UNKNOWN>');
  }
}
