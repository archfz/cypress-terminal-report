import './commands';

const env = Cypress.env();
const config = {};

if (env.setLogTypes == '1') {
  config.collectTypes = ['cy:request', 'cy:log', 'cons:warn'];
}
if (env.setFilterLogs == '1') {
  config.filterLog = ([,log]) => log.indexOf('[filter-out-string]') !== -1;
}
if (env.printLogsAlways == '1') {
  config.printLogs = 'always';
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

  Cypress.on('window:before:load', win => {
    delete win.fetch;
    win.eval(polyfill);
  });
}
