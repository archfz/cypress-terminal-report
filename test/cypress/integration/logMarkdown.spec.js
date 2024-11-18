describe('cy.log markdown.', () => {
  /**
   * Covers: cy.log markdown to console
   */
  it('cy.log markdown.', () => {
    cy.log('_This is an_italic* log._');
    cy.log('*This is an_italic* log.*');
    cy.log('**This is a__bold* log.**');
    cy.log('__This is a__bold* log.__');
    cy.log('***This is a_bold and italic* log.***');
    cy.log('___This is a_bold and italic* log.___');
    cy.log('_This is a normal log');
    cy.log('This is a normal log_');
    cy.log('__This is a normal log');
    cy.log('This is a normal log__');
    cy.log('*This is a normal log');
    cy.log('This is a normal log*');
    cy.log('**This is a normal log');
    cy.log('This is a normal log**');
  });
});
