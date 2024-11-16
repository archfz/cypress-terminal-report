describe('after fails', () => {
  it('the test 1', () => {
    cy.log('log test 1');
  });
  it('the test 11', () => {
    cy.log('log test 11');
  });

  after(() => {
    cy.log('after log simple');
    cy.get('after simple', {timeout: 5});
  });
});

describe('after succeeds', () => {
  it('the test 2', () => {
    cy.log('log test 2');
  });
  it('the test 22', () => {
    cy.log('log test 22');
  });
  it('the test 222', () => {
    cy.log('log test 222');
  });

  after(() => cy.log('after 1'));
  after(() => cy.log('after 2'));
});

describe('nested after fails', () => {
  describe('nested context', () => {
    it('the test 3', () => {
      cy.log('log test 3 nested');
    });

    after(() => cy.get('after nested', {timeout: 5}));
  });
  after(() => {
    cy.log('log after root');
    cy.get('after root', {timeout: 5});
  });
});
