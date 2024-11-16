describe('Compact logs.', () => {
  it('Compact logs', () => {
    cy.visit('/commands/network-requests');

    let message = 'whoa, this comment does not exist';

    cy.intercept('GET', 'comments/*').as('getComment');

    // we have code that gets a comment when
    // the button is clicked in scripts.js
    cy.wait(300, {log: false});
    cy.get('.network-btn').click();

    cy.wait('@getComment').its('response.statusCode').should('eq', 200);

    cy.intercept('POST', '/comments').as('postComment');

    // we have code that posts a comment when
    // the button is clicked in scripts.js
    cy.get('.network-post').click();
    cy.wait('@postComment').should((xhr) => {
      expect(xhr.request.body).to.include('email');
      expect(xhr.request.headers).to.have.property('content-type');
      expect(xhr.request.body).to.contain('name=Using+POST+in+cy.intercept()');
    });

    cy.window().then((w) => w.console.error(null, undefined, '', false, function () {}));
    cy.window().then((w) => w.console.log({a: 'b'}, {c: 'd'}, 10, 'string'));
    cy.window().then((w) => w.console.warn('This is a warning message'));
    cy.window().then((w) => w.console.error('This is an error message'));
    cy.window().then((w) => w.console.error(new Error('This is an error message with stack.')));
    cy.window().then((w) => w.console.log('This should console.log appear.'));
    cy.window().then((w) => w.console.log({this: 'Is an object', with: {keys: 12512}}));
    cy.window().then((w) => w.console.info('This should console.info appear.'));

    // Stub a response to PUT comments/ ****
    cy.intercept(
      {
        method: 'PUT',
        url: 'comments/*',
      },
      {
        statusCode: 404,
        body: {error: message},
      }
    ).as('putComment');

    // we have code that puts a comment when
    // the button is clicked in scripts.js
    cy.get('.network-put').click();

    cy.wait('@putComment');

    // our 404 statusCode logic in scripts.js executed
    cy.get('.network-put-comment').should('contain', message);
    cy.get('.breaking-get', {timeout: 1});
  });
});
