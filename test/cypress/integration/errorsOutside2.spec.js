throw new Error('Error thrown outside of describe.');

describe('error outside 2', () => {
  it('should work', () => {
    cy.log('works');
  });
});
