describe('Command log update.', () => {
  it('Happy flow', () => {
    cy.visit('/commands/network-requests');

    cy.window().then((w) => {
      setTimeout(() => {
        w.document.querySelector('[href="https://on.cypress.io/request"]').innerHTML =
          'something else';
      }, 100);
    });

    cy.get('[href="https://on.cypress.io/request"]').first().should('have.text', 'something else');
    cy.get('breaking', {timeout: 1});
  });
});
