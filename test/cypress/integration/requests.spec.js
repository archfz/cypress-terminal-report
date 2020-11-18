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
      url: 'http://www.mocky.io/v2/5ec993353000007900a6ce1e',
    });
  });

  it('POST should give 400 response status', () => {
    cy.request({
      method: 'POST',
      url: 'http://www.mocky.io/v2/5ec993803000009700a6ce1f',
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
      url: 'http://www.mocky.io/v2/5ec993803000009700a6ce1f',
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
