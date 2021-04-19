describe('XHR all types.', () => {

  it('XHR body formats', () => {
    cy.visit('/commands/network-requests');

    cy.server();

    cy.route({
      method: 'PUT',
      url: 'comments/*',
      status: 403,
      headers: {
        'Test-Header': 'data',
      },
      response: {
        'key': 'data'
      },
    }).as('putComment');

    cy.get('.network-put').click();
    cy.wait('@putComment');

    cy.get('.breaking-get', {timeout: 1});
  });

  it('POST should give 400 response status', () => {
    cy.request({
      method: 'POST',
      url: 'http://www.mocky.io/v2/5ec993803000009700a6ce1f',
      headers: {
        'token': 'test',
      },
      body: {
        testitem: 'ha'
      }
    });

    cy.get('.breaking-get', {timeout: 1});
  });

  it('XHR responses not handled by cy.route', () => {
    cy.visit('/commands/network-requests');

    // Succeeding GET request
    cy.get('.network-comment').should('not.contain', 'laudantium enim quasi');
    cy.wait(300, {log: false});
    cy.get('.network-btn').click();
    cy.get('.network-comment').should('contain', 'laudantium enim quasi');

    // Failing GET request
    cy.window().then((window) => {
      const document = window.document;

      // Create a div to put a message to after receiving the XHR response
      const networkErrorMessage = document.createElement('div');
      networkErrorMessage.className = 'network-error-message';
      const networkComment = document.querySelector('.network-comment');
      networkComment.after(networkErrorMessage);

      // Crate a button that triggers the XHR to a failing URL
      const networkErrorButton = document.createElement('button');
      networkErrorButton.className = 'network-error btn btn-primary';
      networkErrorButton.innerHTML = 'Request error';
      networkErrorButton.addEventListener('click', () =>
        window.fetch('https://www.mocky.io/v2/5ec993803000009700a6ce1f')
          .then(() => {
            networkErrorMessage.innerHTML = 'received response';
          }));
      networkErrorMessage.before(networkErrorButton);
    });
    cy.get('.network-error-message').should('not.contain', 'received response');
    cy.get('.network-error').click();
    cy.get('.network-error-message').should('contain', 'received response');

    cy.get('.breaking-get', {timeout: 100}); // longer timeout to ensure XHR log update is included
  });

  /**
   * Covers timeout.
   */
  it('Timeout', () => {
    cy.visit('/commands/network-requests');

    cy.server();

    cy.route({
      method: 'PUT',
      url: 'comments/*',
    }).as('req:timeout');

    cy.window().then((w) => {
      const script = w.document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js';
      script.onload = () => {
        w.axios.get('/comments/10', {timeout: 10});
      };
      w.document.head.appendChild(script);
    });

    cy.get('.breaking-get', {timeout: 100});
  });

});
