describe('Print Logs onFail prints only failing tests.', () => {

  it('Print Logs Success', () => {
    cy.visit('/');
    cy.contains('cypress');
  });
  it('Print Logs Fail', () => {
    cy.visit('/');
    cy.contains('sserpyc');
  });
});
