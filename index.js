const PADDING = {
  LOG: '\t\t    ',
};

function pipeLogsToTerminal(config = {}) {
  let oldConsoleMethods = {};
  let logs = [];

  Cypress.on('fail', error => {
    const [type, message] = logs[logs.length - 1];
    logs[logs.length - 1] = [type, message, 'failed'];
    throw error;
  });

  Cypress.on('window:before:load', () => {
    const docIframe = window.parent.document.querySelector("[id*='Your App']");
    const appWindow = docIframe.contentWindow;

    const createWrapper = (method, logType) => {
      oldConsoleMethods[method] = appWindow.console[method];

      appWindow.console[method] = (...args) => {
        logs.push([logType, args.join(' ')]);
        oldConsoleMethods[method](...args);
      };
    };

    createWrapper('warn', 'warn');
    createWrapper('error', 'error');

    if (config.printConsoleInfo) {
      createWrapper('info', 'info');
      createWrapper('log', 'log');
    }
  });

  Cypress.Commands.overwrite('log', (subject, ...args) => {
    logs.push(['cy:log', args.join(' ')]);
    subject(...args);
  });

  Cypress.on('log:added', options => {
    if (options.instrument === 'command' && options.consoleProps) {
      if (
        options.name === 'log' ||
        (options.name === 'task' && options.message.match(/terminalLogs/))
      ) {
        return;
      }
      let detailMessage = '';
      if (options.name === 'xhr') {
        detailMessage =
          (options.consoleProps.Stubbed === 'Yes' ? 'STUBBED ' : '') +
          options.consoleProps.Method +
          ' ' +
          options.consoleProps.URL;
      }
      if (options.name === 'request') {
        return;
      }
      const log =
        options.name + '\t' + options.message + (detailMessage !== '' ? ' ' + detailMessage : '');
      logs.push(['cy:command', log, options.state]);
    }
  });

  Cypress.Commands.overwrite('request', async (originalFn, options = {}) => {
    let log = `${options.method || ''}${options.url ? ` ${options.url}` : options}`;

    const response = await originalFn(options).catch(async e => {
      let body = {};
      if (
        // check the body is there
        e.onFail().toJSON().consoleProps.Yielded &&
        e.onFail().toJSON().consoleProps.Yielded.body
      ) {
        body = e.onFail().toJSON().consoleProps.Yielded.body;
      }

      log += `\n${PADDING.LOG}${e.message.match(/Status:.*\d*/g)}
      ${PADDING.LOG}Response: ${await responseBodyParser(body)}`;

      logs.push(['cy:request', log]);
      throw e;
    });

    log += `\n${PADDING.LOG}Status: ${response.status} 
      ${PADDING.LOG}Response: ${await responseBodyParser(response.body)}`;

    logs.push(['cy:request', log]);
    return response;
  });

  Cypress.Commands.overwrite('server', (originalFn, options = {}) => {
    const prevCallback = options && options.onAnyResponse;
    options.onAnyResponse = async (route, xhr) => {
      if (prevCallback) {
        prevCallback(route, xhr);
      }

      if (!route) {
        return;
      }
      logs.push([
        String(xhr.status).match(/^2[0-9]+$/) ? 'cy:route:info' : 'cy:route:warn',
        `Status: ${xhr.status} (${route.alias})\n${PADDING.LOG}Method: ${xhr.method}\n${
          PADDING.LOG
        }Url: ${xhr.url}\n${PADDING.LOG}Response: ${await responseBodyParser(xhr.response.body)}`,
      ]);
    };
    originalFn(options);
  });

  Cypress.mocha.getRunner().on('test', () => {
    logs = [];
  });

  afterEach(function() {
    if (this.currentTest.state !== 'passed' || (config && config.printLogs === 'always')) {
      cy.task('terminalLogs', logs);
    }
  });
}

async function responseBodyParser(body) {
  if (!body) {
    return 'EMPTY_BODY';
  } else if (typeof body === 'string') {
    return body;
  } else if (typeof body === 'object') {
    if (typeof body.text === 'function') {
      return await body.text();
    }
    const padding = `\n${PADDING.LOG}`;
    return `${JSON.stringify(body, null, 2).replace(/\n/g, padding)}`;
  }
  return 'UNKNOWN_BODY';
}

function nodeAddLogsPrinter(on, options = {}) {
  const chalk = require('chalk');

  on('task', {
    terminalLogs: messages => {
      messages.forEach(([type, message, status]) => {
        let color = 'white',
          typeString = '       [unknown] ',
          processedMessage = message,
          trim = options.defaultTrimLength || 200,
          icon = '-';

        if (type === 'warn') {
          color = 'yellow';
          typeString = '       cons.warn ';
          icon = '⚠';
        } else if (type === 'error') {
          color = 'red';
          typeString = '      cons.error ';
          icon = '⚠';
        } else if (type === 'cy:log') {
          color = 'green';
          typeString = '          cy:log ';
          icon = 'ⓘ';
        }else if (type === 'log') {
          color = 'white';
          typeString = '        cons:log ';
          icon = 'ⓘ';
        } else if (type === 'info') {
          color = 'white';
          typeString = '       cons:info ';
          icon = 'ⓘ';
        } else if (type === 'cy:command') {
          typeString = '      cy:command ';
          color = 'green';
          icon = '✔';
          trim = options.commandTrimLength || 600;
        } else if (type === 'cy:route:info') {
          typeString = '        cy:route ';
          color = 'green';
          icon = '⛗';
          trim = options.routeTrimLength || 5000;
        } else if (type === 'cy:route:warn') {
          typeString = '        cy:route ';
          color = 'yellow';
          icon = '⛗';
          trim = options.routeTrimLength || 5000;
        } else if (type === 'cy:request') {
          typeString = `      cy:request `;
          color = 'green';
          icon = '✔';
          trim = options.routeTrimLength || 600;
        }

        if (status && status === 'failed') {
          color = 'red';
          icon = '✘';
        }

        if (message.length > trim) {
          processedMessage = message.substring(0, trim) + ' ...';
        }
        console.log(chalk[color](typeString + icon + ' '), processedMessage);
      });

      console.log('\n\n');
      return null;
    },
  });
}

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
  installPlugin: (on, options = {}) => nodeAddLogsPrinter(on, options),

  /**
   * Installs the logs collector for cypress.
   *
   * Needs to be added to support file.
   */
  installSupport: config => pipeLogsToTerminal(config),
};
