describe('Print Logs Success.', () => {
  it('Print Logs Success', () => {
    cy.visit('/');
    cy.contains('cypress', {timeout: 1});
  });
});
