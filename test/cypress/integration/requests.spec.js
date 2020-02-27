describe('Requests.', () => {

  it('GET should pass', () => {
    cy.request('https://jsonplaceholder.cypress.io/todos/1');
  });

  it('POST should pass', () => {
    cy.request({
      method: 'POST',
      url: 'https://jsonplaceholder.cypress.io/comments',
    });
  });

  it('GET should give 500 response status', () => {
    cy.request({
      method: 'GET',
      url: 'https://cypress.free.beeceptor.com/response500',
    });
  });

  it('POST should give 400 response status', () => {
    cy.request({
      method: 'POST',
      url: 'https://cypress.free.beeceptor.com/create/object/fail',
    });
  });

  it('PUT should fail', () => {
    cy.request({
      method: 'PUT',
      url: 'https://jsonplaceholder.cypress.io/comments',
    });
  });
});
