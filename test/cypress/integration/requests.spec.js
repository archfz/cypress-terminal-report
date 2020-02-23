describe('cy.request test runs', () => {
  it('GET should pass', () => {
    cy.request('https://jsonplaceholder.cypress.io/todos/1');
  });

  it('POST should pass', () => {
    cy.request({
      method: 'POST',
      url: 'https://jsonplaceholder.cypress.io/comments',
    });
  });

  it('PUT should fail', () => {
    cy.request({
      method: 'PUT',
      url: 'https://jsonplaceholder.cypress.io/comments',
    });
  });
});
