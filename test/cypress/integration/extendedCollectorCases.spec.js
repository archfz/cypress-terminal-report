describe('template spec', () => {
  it('passes', () => {
    cy.log('Test is running');
    cy.visit('https://example.cypress.io');
  });

  it('can find button', () => {
    cy.log('Go to query page');
    cy.visit('https://example.cypress.io/commands/querying');

    cy.get('.banner').within(() => {
      cy.get('h1').should('have.text', 'Querying');
    });
  });
});
