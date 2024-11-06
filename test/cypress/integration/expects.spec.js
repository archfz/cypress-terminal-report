/// <reference types="cypress" />
// remove no check once Cypress.sinon is typed
// https://github.com/cypress-io/cypress/issues/6720

context('Expects', () => {
  it('expects', () => {
    // https://on.cypress.io/spy
    cy.visit('https://example.cypress.io/commands/spies-stubs-clocks')

    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).to.eq([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
  it('expects with circular', () => {
    // https://on.cypress.io/spy
    cy.visit('https://example.cypress.io/commands/spies-stubs-clocks')

    const data = {};
    data.data = data;

    expect(data).to.eq({})
  })
})
