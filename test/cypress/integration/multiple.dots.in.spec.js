describe('Multiple dots.', () => {
  it('Multiple dots.', () => {
    cy.visit('/commands/network-requests');
    cy.get('.breaking-wait', {timeout: 1});
  });
});
