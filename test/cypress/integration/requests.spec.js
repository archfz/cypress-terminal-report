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
      url: 'https://run.mocky.io/v3/6108634c-2ef1-4c61-9df4-456b7421b084',
    });
  });

  it('POST should give 400 response status', () => {
    cy.request({
      method: 'POST',
      url: 'https://run.mocky.io/v3/141f4175-05e5-41dd-aa97-4d8f425bd823',
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
      url: 'https://run.mocky.io/v3/141f4175-05e5-41dd-aa97-4d8f425bd823',
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
