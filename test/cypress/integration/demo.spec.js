describe('Demo spec.', () => {

  it('Demo test.', () => {
    cy.visit('/commands/network-requests');

    cy.intercept({
      method: 'PUT',
      url: 'comments/*',
    }, {
      headers: {
        'Test-Header': 'data',
      },
      statusCode: 403,
      response: {
        'key': 'data'
      },
    }).as('putComment');

    cy.get('.network-put').click();
    cy.wait('@putComment');

    cy.request({
      method: 'POST',
      url: 'https://jsonplaceholder.cypress.io/comments',
    });

    cy.window({log: false}).then(w => w.console.warn('This is a warning message'));
    cy.window({log: false}).then(w => w.console.error(new Error('This is an error message')));
    cy.window({log: false}).then((w) => w.console.log('This should console.log appear. [filter-out-string]'));
    cy.window({log: false}).then((w) => w.console.info('This should console.info appear.'));
    cy.window({log: false}).then((w) => w.console.debug('Debug message.'));

    cy.get('.breaking-get', {timeout: 1});
  });

});
