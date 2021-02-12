describe('Log for almost every hook 1', function () {
  before(function () {
    cy.log('from before');
  });
  after(function () {
    cy.log('from after');
  });
  beforeEach(function () {
    cy.log('from beforeEach');
  });
  afterEach(function () {
    cy.log('from afterEach');
  });
  it('first it', function () {
    cy.log('from first it');
  });
  it('second it', function () {
    cy.log('from second it');
  });
});

describe('Log for almost every hook 2', function () {
  before(function () {
    cy.log('from before');
    cy.get('something that doesn\'t exist').should('exist');
  });
  after(function () {
    cy.log('from after');
  });
  beforeEach(function () {
    cy.log('from beforeEach');
  });
  afterEach(function () {
    cy.log('from afterEach');
  });
  it('first it', function () {
    cy.log('from first it');
  });
});

describe('Log for almost every hook 3', function () {
  before(function () {
    cy.log('from before');
  });
  after(function () {
    cy.log('from after');
  });
  beforeEach(function () {
    cy.log('from beforeEach');
    cy.get('something that doesn\'t exist').should('exist');
  });
  afterEach(function () {
    cy.log('from afterEach');
  });
  it('first it', function () {
    cy.log('from first it');
  });
});

describe('Log for almost every hook 4', function () {
  before(function () {
    cy.log('from before');
  });
  after(function () {
    cy.log('from after');
  });
  beforeEach(function () {
    cy.log('from beforeEach');
  });
  afterEach(function () {
    cy.log('from afterEach');
  });
  it('first it', function () {
    cy.log('from first it');
    cy.get('first something that doesn\'t exist').should('exist');
  });
  it('second it', function () {
    cy.log('from second it');
  });
});