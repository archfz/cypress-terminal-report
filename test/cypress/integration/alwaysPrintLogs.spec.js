describe('Always print Logs', () => {
  /**
   * Covers:
   * - printing of cy.commands
   * - printing xhr with STUBBED
   * - printing of console warn and console error
   * - printing of cy.route in case of XMLHTTPREQUEST API
   */
  it('Always print Logs', () => {
    cy.visit('/');
    cy.contains('cypress');
  });
});
