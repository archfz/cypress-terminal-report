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
      url: 'https://run.mocky.io/v3/0ea84a27-e918-4c1c-b1cb-c019260a5ea4',
    });
  });

  it('POST should give 400 response status', () => {
    cy.request({
      method: 'POST',
      url: 'https://run.mocky.io/v3/ded564f7-0a44-435d-9113-9e16067c15f5',
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
      url: 'https://run.mocky.io/v3/ded564f7-0a44-435d-9113-9e16067c15f5',
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
