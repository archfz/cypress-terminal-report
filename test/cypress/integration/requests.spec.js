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
      url: 'http://localhost:6521/v3/4b2d23ec-4516-4a94-967e-995596d01a32',
    });
  });

  it('POST should give 400 response status', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:6521/v3/57a00707-bccf-4653-ac50-ba1c00cad431',
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
      url: 'http://localhost:6521/v3/57a00707-bccf-4653-ac50-ba1c00cad431',
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
