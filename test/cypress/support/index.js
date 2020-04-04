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

require('../../../index').installSupport(config);

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
