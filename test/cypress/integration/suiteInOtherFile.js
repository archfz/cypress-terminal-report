module.exports = {
  callSuite: function (){
    context('sub-suite in different file', () => {
      it('subsuite test 1', () => {
        cy.log('subsuite test 1');
      });
      it('subsuite test 2', () => {
        expect(1).to.equal(2);
      });
    })
  }
};