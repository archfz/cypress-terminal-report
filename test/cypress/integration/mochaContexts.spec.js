context('main context', () => {
  it('first level test', () => {
    if (!Cypress.env('pass')) {
      cy.get('.breaking-get 1', {timeout: 1});
    } else {
      cy.log('Test');
    }
  })

  context('second context', () => {
    it('second level test', () => {
      cy.get('.breaking-get 2', {timeout: 1});
    })

    context('third context', () => {
      it('third level test', () => {
        if (!Cypress.env('pass')) {
          cy.get('.breaking-get 3', {timeout: 1});
        } else {
          cy.log('Test');
        }
      })
    })
  })
})
