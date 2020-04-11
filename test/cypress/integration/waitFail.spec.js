describe('Wait fail.', () => {
  /**
   * Covers:
   * - waiting proper fail marking when commands are logged after
   */
  it('Wait fail.', () => {
    cy.visit('/commands/network-requests');

    cy.server();
    cy.route('GET', 'comments/*').as('getComment');

    cy.window().then((w) => {
      setTimeout(() => {
        w.document.querySelector('.network-btn').click();
      }, 1000)
    });
    cy.get('.breaking-wait', {timeout: 3000});
  });
});
