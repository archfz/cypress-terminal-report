describe('Print Logs.', () => {

  it('Print Logs', () => {
    cy.visit('/');
    cy.contains('cypress');
  });
});
