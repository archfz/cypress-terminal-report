module.exports = () =>
  Number(Cypress.version.split('.')[0]) >= 16 ? Cypress.expose() : Cypress.env();
