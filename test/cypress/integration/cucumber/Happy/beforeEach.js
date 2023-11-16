beforeEach(() => {
  cy.intercept('GET', 'comments/*').as('getComment');
});
