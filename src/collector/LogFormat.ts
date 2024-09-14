export default class LogFormat {
  config: any;

  constructor(config: any) {
    this.config = config;
  }

  formatXhrLog(xhrLog: any) {
    let logMessage = '';
    if (xhrLog.response) {
      logMessage += `Status: ${xhrLog.response.status}\n`;
    } else if (xhrLog.networkError) {
      logMessage += `Network error: ${xhrLog.networkError}\n`;
    }

    if (xhrLog.request) {
      if (this.config.collectRequestData) {
        if (this.config.collectHeaderData) {
          logMessage += `Request headers: ${xhrLog.request.headers}\n`;
        }
        if (this.config.collectBody) {
          logMessage += `Request body: ${xhrLog.request.body}\n`;
        }
      }
    }

    if (xhrLog.response) {
      if (this.config.collectHeaderData) {
        logMessage += `Response headers: ${xhrLog.response.headers}\n`;
      }
      if (this.config.collectBody) {
        logMessage += `Response body: ${xhrLog.response.body}`;
      }
    }

    return logMessage.trimEnd();
  }

  formatXhrBody(body: any) {
    if (!body) {
      return Promise.resolve('<EMPTY>');
    } else if (typeof body === 'string') {
      // @TODO: Legacy support code. On older version body might be string but infact JSON.
      if (body.charAt(0) === '{' && body.charAt(body.length - 1) === '}') {
        try {
          return Promise.resolve(JSON.stringify(JSON.parse(body), null, 2));
        } catch (e) {/* noop */}
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
