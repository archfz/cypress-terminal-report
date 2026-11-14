describe('Log delivery failure.', () => {
  /**
   * The printer task fails for this test only (see `ctrLogDeliveryFailure` in
   * cypress.config.js). That must not fail the test or skip the ones after it.
   */
  it('first test [ctr-delivery-fails]', () => {
    cy.log('log of first test');
  });

  it('second test', () => {
    cy.log('log of second test');
  });

  it('third test', () => {
    cy.log('log of third test');
  });
});
