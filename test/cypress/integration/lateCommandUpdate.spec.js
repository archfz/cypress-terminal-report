describe("Late command update.", () => {

  it('Late command update', () => {
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

    cy.get('.breaking-get', {timeout: 1});
  });
});
