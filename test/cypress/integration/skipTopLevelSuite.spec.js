describe.skip('It skips', () => {
  it('A skipped test', () => {
    cy.visit('/');
    cy.contains('cypress', {timeout: 1});
  });
});
