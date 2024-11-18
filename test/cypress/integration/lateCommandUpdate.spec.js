describe('Late command update.', () => {
  it('Late command update', () => {
    cy.visit('/commands/network-requests');

    cy.intercept(
      {
        method: 'PUT',
        url: 'comments/*',
      },
      {
        statusCode: 404,
        body: {error: 'Test message.'},
        delayMs: 500,
      }
    ).as('putComment');

    cy.window().then((w) => {
      return w.fetch('/comments/10', {
        method: 'PUT',
        body: 'test',
      });
    });

    cy.get('.breaking-get', {timeout: 5});
  });
});
