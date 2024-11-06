describe('API routes', () => {
  /**
   * Covers XHR:
   * - printing of cy.intercept in case of plain text data
   * - printing of cy.intercept in case of unrecognizable data
   */
  it('XHR body formats', () => {
    cy.visit('/commands/network-requests');

    cy.intercept(
      {
        method: 'GET',
        url: 'comments/*',
      },
      {
        statusCode: 200,
        body: '',
      }
    ).as('getComment');

    cy.wait(300, {log: false});
    cy.get('.network-btn').click();
    cy.wait('@getComment');

    cy.intercept(
      {
        method: 'PUT',
        url: 'comments/*',
      },
      {
        statusCode: 403,
        body: 'This is plain text data.',
      }
    ).as('putComment');

    cy.get('.network-put').click();
    cy.wait('@putComment');

    cy.intercept(
      {
        method: 'PUT',
        url: 'comments/*',
      },
      {
        statusCode: 401,
        body: true,
      }
    ).as('putComment');

    cy.get('.network-put').click();
    cy.wait('@putComment');

    cy.get('.breaking-get', {timeout: 100});
  });

  /**
   * Covers FETCH API:
   * - printing of cy.intercept in case of FETCH API
   */
  it('Fetch API', () => {
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

    cy.wait('@putComment');

    cy.get('.breaking-get', {timeout: 100});
  });
});
