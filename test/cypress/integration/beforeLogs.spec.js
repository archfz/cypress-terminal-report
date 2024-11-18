describe('before fails', () => {
  before(() => {
    cy.log('some before command');
    cy.get('.breaking.get', {timeout: 1});
  });

  it('the test', () => {
    cy.log('log');
  });

  after(() => cy.log('after'));
});

describe('before succeeds', () => {
  before(() => {
    cy.log('some before command');
    cy.log('some other before command');
  });

  before(() => {
    cy.log('some before command from second before hook');
  });

  it('the test fails', () => {
    cy.log('log');
    cy.get('.breaking.get', {timeout: 1});
  });

  after(() => cy.log('after before succeeds'));
});

describe('nested before fails', () => {
  before(() => {
    cy.log('some before command not in nested');
  });

  it('not nested', () => {
    cy.log('not nested');
  });

  describe('nested context', () => {
    before(() => {
      cy.log('some before command in nested');
      cy.get('.breaking.get', {timeout: 1});
    });

    it('the test nested', () => {
      cy.log('log');
    });

    after(() => {
      cy.log('after nested');
    });
  });

  after(() => {
    cy.log('after not nested');
  });
});
