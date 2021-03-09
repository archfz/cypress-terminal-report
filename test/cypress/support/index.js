import './commands';

const env = Cypress.env();
let config = {};

if (env.setLogTypes == '1') {
  config.collectTypes = ['cy:request', 'cy:log', 'cons:warn'];
}
if (env.setFilterLogs == '1') {
  config.filterLog = ([,log]) => log.indexOf('[filter-out-string]') !== -1;
}
if (env.setProcessLogs == '1') {
  config.processLog = ([sev, log]) => {
    if (sev == 'cy:request'){
      log = log.length.toString();
    }
    else{
      debugger;
      let reg = /\[[^\[]+]/;
      let secret = log.match(reg);
      if (secret){
        log = log.replace(reg, '[******]');
      }
    }
    return log;
  }
}
if (env.collectTestLogsSupport == '1') {
  config.collectTestLogs = ({mochaRunnable, testTitle, testState, testLevel}, logs) =>
    Cypress.backend('task', {
      task: 'ctrLogMessages',
      arg: {
        spec: mochaRunnable.invocationDetails.relativeFile,
        test: testTitle,
        messages: [['cy:log', `Collected ${logs.length} logs for test "${mochaRunnable.title}", last log: ${logs[logs.length - 1]}`, '']],
        state: testState,
        level: testLevel,
      }
    })
}
if (env.printHeaderData == '1') {
  config.xhr = config.xhr || {};
  config.xhr.printHeaderData = true;
}
if (env.printRequestData == '1') {
  config.xhr = config.xhr || {};
  config.xhr.printRequestData = true;
}
if (env.filterOutCyCommand == '1') {
  config.filterLog = ([type]) => type !== 'cy:command';
}
if (env.supportBadConfig == '1') {
  config = {
    collectTypes: 0,
    filterLog: "string",
    processLog: true,
    collectTestLogs: "string",
    xhr: {
      printRequestData: "",
      printHeaderData: "",
      shouldNotBeHere: ""
    },
    shouldNotBeHere: ""
  };
}
if (env.enableExtendedCollector == '1') {
  config.enableExtendedCollector = true;
}

require('../../../src/installLogsCollector')(config);

enableFetchWorkaround();
function enableFetchWorkaround() {
  let polyfill;

  before(() => {
    console.info('Load fetch XHR polyfill.');
    cy.request({url: 'https://cdn.jsdelivr.net/npm/fetch-polyfill@0.8.2/fetch.min.js', log: false, method: 'GET'}).then(response => {
      polyfill = response.body;
    }, {log: false});
  });

  console.log(Cypress);

  Cypress.on('window:before:load', win => {
    delete win.fetch;
    win.eval(polyfill);
  });
}
