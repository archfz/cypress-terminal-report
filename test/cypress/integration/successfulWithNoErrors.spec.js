describe('Successful with not errors.', () => {
  it('Successful with not errors', () => {
    cy.visit('/commands/network-requests');

    let message = 'whoa, this comment does not exist';

    cy.intercept('GET', 'comments/*').as('getComment');

    // we have code that gets a comment when
    // the button is clicked in scripts.js
    cy.wait(300, {log: false});
    cy.get('.network-btn').click();

    cy.wait('@getComment')
      .its('response.statusCode')
      .should('eq', 200);

    cy.intercept('POST', '/comments').as('postComment');

    // we have code that posts a comment when
    // the button is clicked in scripts.js
    cy.get('.network-post').click();
    cy.wait('@postComment').should(xhr => {
      expect(xhr.request.body).to.include('email');
      expect(xhr.request.headers).to.have.property('content-type');
      expect(xhr.request.body).to.contain('name=Using+POST+in+cy.intercept()');
    });

    cy.window().then(w => w.console.log({a: 'b'}, {c: 'd'}, 10, 'string'));
    cy.window().then(w => w.console.warn('This is a warning message'));

    // Stub a response to PUT comments/ ****
    cy.intercept({
      method: 'PUT',
      url: 'comments/*',
    }, {
      statusCode: 404,
      body: {error: message},
    }).as('putComment');

    // we have code that puts a comment when
    // the button is clicked in scripts.js
    cy.get('.network-put').click();

    cy.wait('@putComment');

    // our 404 statusCode logic in scripts.js executed
    cy.get('.network-put-comment').should('contain', message);
  });
});
