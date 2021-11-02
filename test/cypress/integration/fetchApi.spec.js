describe('Fetch Api', () => {
  it('Stubbed failed fetch API', () => {
    cy.visit('/commands/network-requests');

    cy.intercept(
      {
        method: 'PUT',
        url: 'comments/*',
      },
      {
        statusCode: 404,
        body: {error: 'Test message.'},
        delay: 500,
      }
    ).as('putComment');

    cy.window().then((w) => {
      fetch('/comments/10', {
        method: 'PUT',
        body: 'test',
      });
    });

    cy.wait('@putComment');

    cy.get('.breaking-get', {timeout: 1});
  });

  context('Real Fetch Requests', () => {
    const testRealFetchRequest = (options) => {
      cy.visit('/commands/network-requests');

      if (options.interceptPath) {
        // only intercepted fetch requests logs a response body. Read more at https://github.com/cypress-io/cypress/issues/17656
        cy.intercept(options.interceptPath);
      }

      cy.window().then((window) => {
        const document = window.document;

        // Create a div to put a message to after receiving the fetch response
        const containerDiv = document.createElement('div');
        containerDiv.className = 'network-request-message';
        const networkComment = document.querySelector('.network-comment');
        networkComment.after(containerDiv);

        // Crate a button that triggers the fetch
        const button = document.createElement('button');
        button.className = 'network-request btn btn-primary';
        button.innerHTML = 'Fetch Request ';
        button.addEventListener('click', () =>
          fetch(options.url).then(() => {
            containerDiv.innerHTML = 'received response';
          })
        );
        containerDiv.before(button);
      });

      cy.get('.network-request-message').should('not.contain', 'received response');
      cy.get('.network-request').click();
      cy.get('.network-request-message').should('contain', 'received response');

      cy.get('.breaking-get', {timeout: 100}); // longer timeout to ensure fetch log update is included
    };

    it('Fetch successful without interceptor', () =>
      testRealFetchRequest({
        url: 'https://jsonplaceholder.cypress.io/comments/1',
      }));

    it('Fetch failed without interceptors', () =>
      testRealFetchRequest({
        url: 'https://www.mocky.io/v2/5ec993803000009700a6ce1f',
      }));

    it('Fetch failed with interceptors', () =>
      testRealFetchRequest({
        url: 'https://www.mocky.io/v2/5ec993803000009700a6ce1f',
        interceptPath: 'https://www.mocky.io/**/*',
      }));
  });
});
