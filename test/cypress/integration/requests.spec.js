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
      url: 'https://run.mocky.io/v3/cf7c4ea3-5f3e-416c-ba17-7aa842b1e2d9',
    });
  });

  it('POST should give 400 response status', () => {
    cy.request({
      method: 'POST',
      url: 'https://run.mocky.io/v3/e2df0c52-dfdd-4a83-a842-7193ef950508',
    });
  });

  it('PUT should fail', () => {
    cy.request({
      method: 'PUT',
      url: 'https://jsonplaceholder.cypress.io/comments',
    });
  });

  it('cypress logging is disabled in the request', () => {
    cy.request({
      method: 'POST',
      url: 'https://run.mocky.io/v3/e2df0c52-dfdd-4a83-a842-7193ef950508',
      log: false,
    });
  });

  it('Network error', () => {
    cy.request({
      method: 'POST',
      url: 'http://this.does.not.exist',
    });
  });
});
