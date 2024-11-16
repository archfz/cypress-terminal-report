describe('API routes with new intercept', () => {
  /**
   * Covers XHR:
   * - printing of cy.intercept in case of plain text data
   * - printing of cy.intercept in case of unrecognizable data
   */
  it('XHR body formats', () => {
    cy.visit('/commands/network-requests');

    cy.intercept('GET', '/test', () => {
      return 'test';
    });

    cy.intercept(
      {
        method: 'GET',
        url: /comments\/.*/,
      },
      {statusCode: 200, body: ''}
    ).as('getComment');

    cy.wait(300);
    cy.get('.network-btn').click({force: true});
    cy.wait('@getComment');

    cy.intercept(
      {
        method: 'PUT',
        url: /comments\/.*/,
        headers: {Accept: '*/*'},
      },
      {
        statusCode: 403,
        body: 'This is plain text data.',
        headers: {Custom: 'Header'},
      }
    ).as('putComment1');

    cy.get('.network-put').click();
    cy.wait('@putComment1');

    cy.intercept(
      {
        method: 'PUT',
        url: /comments\/.*/,
      },
      {statusCode: 401, body: true}
    ).as('putComment2');

    cy.get('.network-put').click();
    cy.wait('@putComment2');

    cy.get('.breaking-get', {timeout: 1});
  });
});
