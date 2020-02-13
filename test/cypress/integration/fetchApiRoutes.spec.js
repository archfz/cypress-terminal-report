describe("Fetch API", () => {

  /**
   * Covers:
   * - printing of cy.route in case of FETCH API
   */
  it('Fetch API', () => {
    cy.visit('/commands/network-requests');

    cy.server();

    cy.route({
      method: 'PUT',
      url: 'comments/*',
      status: 404,
      response: { error: 'Test message.' },
      delay: 500,
    }).as('putComment');

    cy.window().then((w) => {
      return w.fetch('/comments/10', {
        method: 'PUT',
        body: 'test',
      });
    });

    cy.wait('@putComment');

    cy.get('breaking-get');
  })
});
