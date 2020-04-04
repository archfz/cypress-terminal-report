describe('Requests.', () => {

  it('GET 200', () => {
    cy.request('https://jsonplaceholder.cypress.io/todos/1');
    cy.request('GET', 'https://jsonplaceholder.cypress.io/todos/2');
    cy.request('GET', 'https://jsonplaceholder.cypress.io/todos/3', 'mock body');
    cy.get('.breaking-get', {timeout: 1});
  });

  it('POST 200', () => {
    cy.request({
      method: 'POST',
      url: 'https://jsonplaceholder.cypress.io/comments',
    });
    cy.get('.breaking-get', {timeout: 1});
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
