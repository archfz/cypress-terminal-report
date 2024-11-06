describe('Print Logs onFail prints only failing tests.', () => {

  it('Print Logs Success', () => {
    cy.visit('/');
    cy.contains('cypress', {timeout: 1});
  });
  it('Print Logs Fail', () => {
    cy.visit('/');
    cy.contains('sserpyc', {timeout: 1});
  });
});
