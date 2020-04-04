describe('Console log and info.', () => {

  it('Logs to console.', () => {
    cy.visit('http://openexchangerates.github.io/javascript-sandbox-console/');
    cy.get('textarea').first().type('console.log("This text is for log."){enter}');
    cy.get('textarea').first().type('console.info("This text is for info."){enter}');
    cy.get('.breaking-get', {timeout: 1});
  });

});
