describe('continuous logging', () => {
  it('logs many', () => {
    cy.log('log 1');
    cy.wait(500);
    cy.log('log 2');
    cy.wait(2000);
    cy.log('log 3');
  });

  it('logs many again', () => {
    cy.log('log again 1');
    cy.wait(100);
    cy.wait(2000);
    cy.log('log again 2');
  });
});
