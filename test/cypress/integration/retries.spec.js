describe('Retries', () => {
  it('fails', () => {
    cy.get('breaking', {timeout: 1});
  });
});

it('fail but win', () => {
  const currentRetry = cy.state('runnable')._currentRetry;

  cy.log('Hello. currentRetry:', currentRetry);

  if (currentRetry < 2) {
    cy.contains('Foobar', {timeout: 0});
  }

  cy.log('Done.');
});
