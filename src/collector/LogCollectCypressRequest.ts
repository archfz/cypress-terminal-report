import CONSTANTS from '../constants';
import LogFormat from "./LogFormat";
import LogCollectorState from "./LogCollectorState";
import type {ExtendedSupportOptions} from "../installLogsCollector.types";
import LogCollectBase from "./LogCollectBase";

export default class LogCollectCypressRequest extends LogCollectBase {
  register() {
    const isValidHttpMethod = (str: any) => typeof str === 'string' && CONSTANTS.HTTP_METHODS.some((s) => str.toUpperCase().includes(s));

    const isNetworkError = (e: any) => e.message && e.message.startsWith('`cy.request()` failed trying to load:');

    const isStatusCodeFailure = (e: any) => e.message && e.message.startsWith('`cy.request()` failed on:');

    const RESPONSE_START = '\n\nThe response we got was:\n\n';
    const STATUS_START = 'Status: ';
    const HEADERS_START = '\nHeaders: ';
    const BODY_START = '\nBody: ';
    const ERROR_START_PART = 'We received this error at the network level:\n\n  > ';
    const ERROR_PREFIX = 'Error: ';

    const parseRequestStatusCodeFailureMessage = (message: string) => {
      if (
        message.indexOf(RESPONSE_START) === -1 ||
        message.indexOf(STATUS_START) === -1 ||
        message.indexOf(HEADERS_START) === -1 ||
        message.indexOf(BODY_START) === -1
      ) {
        return {status: 'Cannot parse cy.request status code failure message!'};
      }
      const response = message.substr(message.indexOf(RESPONSE_START) + RESPONSE_START.length);
      const statusStr = response.substr(
        response.indexOf(STATUS_START) + STATUS_START.length,
        response.indexOf(HEADERS_START) - (response.indexOf(STATUS_START) + STATUS_START.length)
      );
      const headersStr = response.substr(
        response.indexOf(HEADERS_START) + HEADERS_START.length,
        response.indexOf(BODY_START) - (response.indexOf(HEADERS_START) + HEADERS_START.length)
      );
      const bodyStr = response.substr(response.indexOf(BODY_START) + BODY_START.length);
      return {status: statusStr, headers: headersStr, body: bodyStr.trimEnd()};
    };

    const parseRequestNetworkError = (message: string) => {
      if (message.indexOf(ERROR_START_PART) === -1) {
        return {status: 'Cannot parse cy.request network error message!'};
      }
      let fromError = message.substr(message.indexOf(ERROR_START_PART) + ERROR_START_PART.length);
      let errorPart = fromError.substr(0, fromError.indexOf('\n'));
      if (errorPart.startsWith(ERROR_PREFIX)) {
        return errorPart.substr(ERROR_PREFIX.length).trim();
      }
      return errorPart.trim();
    };

    Cypress.Commands.overwrite('request', (originalFn: any, ...args: any[]) => {
      if (typeof args === 'object' && args !== null && args[0]['log'] === false){
        return originalFn(...args);
      }

      let log: string;
      let requestBody;
      let requestHeaders;

      // args can have up to 3 arguments
      // https://docs.cypress.io/api/commands/request.html#Syntax
      if (args[0].method) {
        log = `${args[0].method} ${args[0].url ? `${args[0].url}` : args[0]}`;
        requestBody = args[0].body;
        requestHeaders = args[0].headers;
      } else if (isValidHttpMethod(args[0])) {
        log = `${args[0]} ${args[1]}`;
        requestBody = args[3];
      } else {
        log = `${args[0]}`;
      }

      return Promise.all([
        this.format.formatXhrData(requestHeaders),
        this.format.formatXhrData(requestBody)
      ])
        .then(([formattedRequestHeaders, formattedRequestBody]) => {
          const requestData = {
            headers: formattedRequestHeaders,
            body: formattedRequestBody,
          };

          return originalFn(...args).catch(async (e: any) => {
            if (isNetworkError(e)) {
              log +=
                `\n` +
                this.format.formatXhrLog({
                  request: requestData,
                  networkError: parseRequestNetworkError(e.message),
                });
            } else if (isStatusCodeFailure(e)) {
              const xhr = parseRequestStatusCodeFailureMessage(e.message);
              log +=
                `\n` +
                this.format.formatXhrLog({
                  request: requestData,
                  response: {
                    status: xhr.status,
                    headers: await this.format.formatXhrData(xhr.headers),
                    body: await this.format.formatXhrData(xhr.body),
                  },
                });
            } else if (e.message.match(/timed out/)) {
              log += `\n` + 'Timed out!';
            } else {
              log += `\n` + 'Cannot parse cy.request error content!';
            }

            this.collectorState.addLog([CONSTANTS.LOG_TYPES.CYPRESS_REQUEST, log, CONSTANTS.SEVERITY.ERROR]);
            throw e;
          })
            .then((response: any) => {
              return Promise.all([
                this.format.formatXhrData(response.headers),
                this.format.formatXhrData(response.body)
              ])
                .then(([formattedResponseHeaders, formattedResponseBody]) => {
                  log +=
                    `\n` +
                    this.format.formatXhrLog({
                      request: requestData,
                      response: {
                        status: response.status,
                        headers: formattedResponseHeaders,
                        body: formattedResponseBody,
                      },
                    });

                  this.collectorState.addLog([CONSTANTS.LOG_TYPES.CYPRESS_REQUEST, log, CONSTANTS.SEVERITY.SUCCESS]);
                  return response;
                });
            });
        });
    });
  }
}
