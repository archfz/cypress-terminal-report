describe('Print Logs Fail.', () => {
  it('Print Logs Fail', () => {
    cy.visit('/');
    cy.contains('sserpyc', {timeout: 1});
  });
});
