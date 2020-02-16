import './commands'
require('../../../index').installSupport();

enableFetchWorkaround();
function enableFetchWorkaround() {
  let polyfill;

  before(() => {
    console.info('Load fetch XHR polyfill.');
    cy.request('https://cdn.jsdelivr.net/npm/fetch-polyfill@0.8.2/fetch.min.js').then((response) => {
      polyfill = response.body;
    });
  });

  Cypress.on('window:before:load', (win) => {
    delete win.fetch;
    win.eval(polyfill);
  });
}
