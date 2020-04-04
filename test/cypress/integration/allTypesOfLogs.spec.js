describe('All types of logs.', () => {
  /**
   * Covers: Types to log and filtering logs.
   */
  it('All types of logs.', () => {
    cy.visit('/commands/network-requests');

    cy.request('http://google.com');

    cy.server();
    cy.route('GET', 'comments/*').as('getComment');

    cy.get('.network-btn').click();
    cy.wait('@getComment');

    cy.log('This is a cypress log. [filter-out-string]');
    cy.window().then(w => w.console.warn('This is a warning message'));
    cy.window().then(w => w.console.error(new Error('This is an error message')));
    cy.window().then((w) => w.console.log('This should console.log appear. [filter-out-string]'));
    cy.window().then((w) => w.console.info('This should console.info appear.'));

    cy.get('.breaking-get [filter-out-string]', {timeout: 1});
  });
});
