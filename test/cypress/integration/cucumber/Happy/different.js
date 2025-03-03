import {Then, Before} from '@badeball/cypress-cucumber-preprocessor';

let myBeforeCount = 0;

// This verifies that the hooks work with bundling feature
// https://github.com/TheBrainFamily/cypress-cucumber-preprocessor/pull/234
Before(() => {
  expect(myBeforeCount).to.be.lessThan(2);
  myBeforeCount += 1;
});

Then(`I can post comment`, () => {
  cy.intercept('POST', '/comments').as('postComment');

  // we have code that posts a comment when
  // the button is clicked in scripts.js
  cy.get('.network-post').click();
  cy.wait('@postComment').should((xhr) => {
    expect(xhr.request.body).to.include('email');
    expect(xhr.request.headers).to.have.property('Content-Type');
    expect(xhr.request.body).to.have.property('name', 'Using POST in cy.intercept()');
  });
});
