describe('XHR all types.', () => {

  it('XHR body formats', () => {
    cy.visit('/commands/network-requests');

    cy.server();

    cy.route({
      method: 'PUT',
      url: 'comments/*',
      status: 403,
      headers: {
        'Test-Header': 'data',
      },
      response: {
        'key': 'data'
      },
    }).as('putComment');

    cy.get('.network-put').click();
    cy.wait('@putComment');

    cy.get('.breaking-get', {timeout: 1});
  });

  it('POST should give 400 response status', () => {
    cy.request({
      method: 'POST',
      url: 'http://www.mocky.io/v2/5ec993803000009700a6ce1f',
      headers: {
        'token': 'test',
      },
      body: {
        testitem: 'ha'
      }
    });

    cy.get('.breaking-get', {timeout: 1});
  });

});
