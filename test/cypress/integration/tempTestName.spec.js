describe('Log for every hook', function () {
  before(function () {
    //cy.window().then(w => w.console.log("something before"));
    cy.log('from before');
    cy.log('from before again');
  });
  beforeEach(function () {
    //cy.window().then(w => w.console.log("something beforeEach"));
    cy.log('from beforeEach');
    cy.log('from beforeEach again');
  });
  after(function () {
    //cy.window().then(w => w.console.log("something after"));
    cy.log('from after');
    cy.log('from after again');
  });
  afterEach(function () {
    //cy.window().then(w => w.console.log("something afterEach"));
    cy.log('from afterEach');
    cy.log('from afterEach again');
  });
  it('passed it', function () {
    //cy.window().then(w => w.console.log("something it"));
    cy.log('from it');
    cy.log('from it again');
  });
});