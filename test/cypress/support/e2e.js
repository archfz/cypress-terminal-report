import './commands';
import registerCypressGrep from "@cypress/grep";
import 'cypress-mochawesome-reporter/register';
import utils from "../../../src/utils";

const env = Cypress.env();
let config = {};

if (env.failFast == '1') {
  require("cypress-fail-fast");
}
if (env.cypressGrep == '1') {
  registerCypressGrep();
}

if (env.ctrDebug == '1') {
  config.debug = true;
}
if (env.setLogTypes == '1') {
  config.collectTypes = ['cy:request', 'cy:log', 'cons:warn'];
}
if (env.setFilterLogs == '1') {
  config.filterLog = ({message}) => message.indexOf('[filter-out-string]') !== -1;
}
if (env.setProcessLogs == '1') {
  config.processLog = ({type, message, severity}) => {
    if (type == 'cy:request'){
      message = message.length.toString();
    }
    else{
      let reg = /\[[^\[]+]/;
      let secret = message.match(reg);
      if (secret){
        message = message.replace(reg, '[******]');
      }
    }
    return {type, message, severity};
  }
}
if (env.collectTestLogsSupport == '1') {
  config.collectTestLogs = ({mochaRunnable, testTitle, testState, testLevel}, logs) =>
    utils.nonQueueTask('ctrLogMessages', {
      spec: mochaRunnable.invocationDetails.relativeFile,
      test: testTitle,
      messages: [{
        type: 'cy:log',
        message: `Collected ${logs.length} logs for test "${mochaRunnable.title}", last log: ${JSON.stringify(logs[logs.length - 1])}`,
        severity: '',
      }],
      state: testState,
      level: testLevel,
    });
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
  config.filterLog = ({type}) => type !== 'cy:command';
}
if (env.filterKeepOnlyWarningAndError == '1') {
  config.filterLog = ({severity}) => severity === 'error' || severity === 'warning';
}
if (env.processAllLogs == '1') {
  config.processLog = ({type,message,severity}) => ({type, message: '| ' + message, severity});
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
if (env.supportGoodConfig == '1') {
  config = {
    collectTypes: ['cons:log','cons:info', 'cons:warn', 'cons:error', 'cy:log', 'cy:xhr', 'cy:request', 'cy:intercept', 'cy:command']
  };
}
if (env.enableExtendedCollector == '1') {
  config.enableExtendedCollector = true;
}
if (env.enableContinuousLogging == '1') {
  config.enableContinuousLogging = true;
}
if (env.commandTimings) {
  config.commandTimings = env.commandTimings;
}

if (env.mochawesome == '1') {
  afterEach(() => {
    cy.wait(50, {log: false}).then(() => {
      const logs = Cypress.TerminalReport.getLogs('txt');
      cy.addTestContext(logs);
      cy.log('Global API logs: ' + logs);
    })
  });
}

if (env.globalAfter == '1') {
  after(function () {
    cy.log('global after');
  });
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

  Cypress.on('window:before:load', win => {
    delete win.fetch;
    win.eval(polyfill);
  });
}
