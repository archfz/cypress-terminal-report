import './commands';

const env = Cypress.env();
let config = {};

if (env.setLogTypes == '1') {
  config.collectTypes = ['cy:request', 'cy:log', 'cons:warn'];
}
if (env.setFilterLogs == '1') {
  config.filterLog = ([,log]) => log.indexOf('[filter-out-string]') !== -1;
}
if (env.setCollectTestLogs == '1') {
  config.collectTestLogs = (context, logs) =>
    cy.log(`Collected ${logs.length} logs for test "${context.currentTest.title}", last log: ${logs[logs.length - 1]}`);
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
    collectTestLogs: "string",
    xhr: {
      printRequestData: "",
      printHeaderData: "",
      shouldNotBeHere: ""
    },
    shouldNotBeHere: ""
  };
}

require('../../../src/installLogsCollector')(config);

enableFetchWorkaround();
function enableFetchWorkaround() {
  let polyfill;

  before(() => {
    console.info('Load fetch XHR polyfill.');
    cy.request('https://cdn.jsdelivr.net/npm/fetch-polyfill@0.8.2/fetch.min.js').then(response => {
      polyfill = response.body;
    });
  });

  console.log(Cypress);

  Cypress.on('window:before:load', win => {
    delete win.fetch;
    win.eval(polyfill);
  });
}
