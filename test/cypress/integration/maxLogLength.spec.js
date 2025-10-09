describe('Max log length.', () => {
  it('Should collect a very long log and then fail so logs print.', () => {
    const over = 1000;
    const longMsg = 'X'.repeat(over);

    cy.log(longMsg);

    cy.get('.this-element-does-not-exist', {timeout: 1});
  });
});
