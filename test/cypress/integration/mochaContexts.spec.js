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

describe('unnested before with nested context', () => {
  before(() => {
    cy.log('before should display before nested context title');
  });

  describe('nested context', () => {
    it('the test nested', () => {
      cy.log('log');
    });
  });
});

describe('unnested before and test with nested context', () => {
  before(() => {
    cy.log('before should display before nested context title');
  });

  describe('nested context', () => {
    it('the test nested', () => {
      cy.log('log');
    });
  });

  it('not nested', () => {
    cy.log('log');
  });
});

describe('unnested failing before with nested context', () => {
  before(() => {
    cy.get('before should display before nested context title', {timeout: 0});
  });

  describe('nested context', () => {
    it('the test nested', () => {
      cy.log('log');
    });
  });
});
