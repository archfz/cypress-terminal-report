describe('Nested log Test', () => {
  afterEach(() => {
  });

  it('test1', () => {
  });

  it('test2', () => {
  });

  it('test3', () => {
    cy.state('runnable').ctx.skip();
  });

  it('test4', () => {
  });
});
