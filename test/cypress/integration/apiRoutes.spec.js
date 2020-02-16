describe("API routes", () => {

  /**
   * Covers XHR:
   * - printing of cy.route in case of plain text data
   * - printing of cy.route in case of unrecognizable data
   */
  it('XHR body formats', () => {
    cy.visit('/commands/network-requests');

    cy.server();

    cy.route({
      method: 'GET',
      url: 'comments/*',
      status: 200,
      response: '',
    }).as('getComment');

    cy.get('.network-btn').click();
    cy.wait('@getComment');

    cy.route({
      method: 'PUT',
      url: 'comments/*',
      status: 403,
      response: 'This is plain text data.',
    }).as('putComment');

    cy.get('.network-put').click();
    cy.wait('@putComment');

    cy.route({
      method: 'PUT',
      url: 'comments/*',
      status: 401,
      response: true,
    }).as('putComment');

    cy.get('.network-put').click();
    cy.wait('@putComment');

    cy.get('breaking-get');
  });

  /**
   * Covers FETCH API:
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
  });
});
