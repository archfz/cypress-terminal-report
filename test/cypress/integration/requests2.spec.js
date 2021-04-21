describe('Requests 2.', () => {
  it('Timeout', () => {
    cy.request({
      method: 'POST',
      url: 'http://timeout',
      timeout: 10,
    });
  });
});
