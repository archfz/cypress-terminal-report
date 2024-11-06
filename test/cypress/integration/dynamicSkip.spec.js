describe('Dynamic skip', () => {
  beforeEach(() => {
    cy.log('before');
  });

  it('test1', () => {
    cy.log('test1');
  });

  it('test2', () => {
    cy.log('test2');
  });

  it('test3', () => {
    cy.log('test3 1');
    cy.log('test3 2');
    cy.log('test3 3');
    cy.wrap({}).then(() => {
      cy.state('runnable').ctx.skip();
    });
    cy.log('test3 skipped log');
  });

  it('test4', () => {
    cy.log('test4');
  });
});
