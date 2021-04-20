describe('Retries', () => {
  it('fails', () => {
    cy.get('breaking', {timeout: 1});
  });
});
