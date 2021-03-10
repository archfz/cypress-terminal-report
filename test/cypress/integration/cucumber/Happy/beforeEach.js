beforeEach(() => {
  cy.server();
  cy.route('GET', 'comments/*').as('getComment');
});
