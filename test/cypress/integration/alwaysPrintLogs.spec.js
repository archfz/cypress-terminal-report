describe('Always print Logs.', () => {

  it('Always print Logs', () => {
    cy.visit('/');
    cy.contains('cypress');
  });
});
