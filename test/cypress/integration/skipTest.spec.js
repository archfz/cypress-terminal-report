describe('Describe 1', () => {
  before(() => {
    cy.visit(`https://www.google.co.uk`);
  });

  it.skip('Skipped test 1', () => {
    cy.log('first skip');
  });

  it('Test 2', () => {
    cy.log('test 2');
  });
});

describe('Describe 2', () => {
  beforeEach(() => {
    cy.visit(`https://www.google.co.uk`);
  });

  // The tests gets hang here
  it.skip('Skipped test 2', () => {
    cy.log('Skipped test 2');
  });

  //This second skipped test seems to be the culprit
  it.skip('Skipped test 3', () => {
    cy.log('Skipped test 3');
  });

  it('Test 3', () => {
    cy.log('Test 3');
  });

  it('Test 4', () => {
    cy.log('Test 4');
  });
});
