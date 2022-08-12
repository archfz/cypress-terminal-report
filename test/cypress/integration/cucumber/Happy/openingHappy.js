import { Given, Then } from "@badeball/cypress-cucumber-preprocessor";

Given(`I open Happy page`, () => {
  cy.visit('/commands/network-requests');

});

Then(`I can load comments`, title => {
  cy.wait(300, {log: false});
  cy.get('.network-btn').click();

  cy.wait('@getComment')
    .its('status')
    .should('eq', 200);
});
