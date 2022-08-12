describe('Cypress grep', () => {
  it("run only this", () => {
    cy.visit('/');
    cy.contains('cypress', { timeout: 1 });
  })
  it("this should be skipped", () => {
    cy.log('should not be logged');
  })
})
