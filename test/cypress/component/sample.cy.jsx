it('uses custom text for the button label', () => {
  cy.mount(<div>Click me!</div>)
  cy.wait(1000);
  cy.get('nope', {timeout: 1});
})
