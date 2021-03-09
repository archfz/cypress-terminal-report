describe('All hooks.', function () {
  before(function () {
    cy.log('from before');
  });
  beforeEach(function () {
    cy.log('from beforeEach');
  });
  it('passed it', function () {
    cy.log('from it');
  });
  it('passed it 2', function () {
    cy.log('from it 2');
  });
  afterEach(function () {
    cy.log('from afterEach');
  });
  after(function () {
    // cy.get('from after', {timeout: 0});
    cy.log('from after');
  });
  after(function () {
    cy.log('from after 2');
  });
});
