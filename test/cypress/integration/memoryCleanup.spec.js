describe('Trigger issue:', () => {
  describe('tests that take', () => {
    it('1 second', () => {
      cy.wait(1000);
    });
  });
  describe('more tests that take', () => {
    it('10 seconds', () => {
      cy.wait(10000);
    });
    it('15 seconds', () => {
      cy.wait(15000);
    });
    it('10 seconds', () => {
      cy.wait(10000);
    });
  });
});
