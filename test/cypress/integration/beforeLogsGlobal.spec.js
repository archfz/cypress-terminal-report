before(() => {
  cy.visit('https://www.example.com');
  cy.location('origin').should('eq', 'https://someothersite.example.com');
});
describe('template spec', () => {
  it('passes', () => {
    cy.log('Test is running');
    cy.visit('https://example.cypress.io');
  });
});
