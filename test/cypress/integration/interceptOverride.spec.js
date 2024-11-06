// Test is not covered. Manually can be checked only as it reproduced in browser only.
describe('Intercept override', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://example.cypress.io/**', {fixture: 'example.html'});
  });

  it('Should show test', () => {
    cy.intercept('GET', 'https://example.cypress.io/**', {fixture: 'example2.html'});

    cy.visit('https://example.cypress.io/todo');
    cy.contains('Interceptor 2').should('be.visible');
  });

  it('Should show test', () => {
    cy.intercept('GET', 'https://example.cypress.io/**', {
      body: "<html lang='en'>Interceptor 3</html>",
    });

    cy.visit('https://example.cypress.io/todo');
    cy.contains('Interceptor 3').should('be.visible');
  });
});
