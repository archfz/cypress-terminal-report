const {exec} = require('child_process');
const {expect} = require('chai');

const commandBase = (env = '') =>
  `node ./node_modules/.bin/cypress run --env ${env} --headless -s cypress/integration/`;

describe('cypress-terminal-report', () => {
  it('Print logs happy flows with no errors.', async () => {
    await new Promise(resolve => {
      exec(commandBase('printLogs=true') + 'printLogs.spec.js', (error, stdout, stderr) => {
        // cy.command logs.
        expect(stdout).to.contain('cy:command ✔  visit\t/commands/network-requests\n');
        expect(stdout).to.contain('cy:command ✔  get\t.network-post\n');
        expect(stdout).to.contain(
          'cy:command ✔  xhr\t STUBBED PUT https://jsonplaceholder.cypress.io/comments/1\n'
        );

        // cy.route logs.
        expect(stdout).to.contain('cy:route ⛗  Status: 200 (getComment)\n');
        expect(stdout).to.contain('Method: GET\n');
        expect(stdout).to.contain('Url: https://jsonplaceholder.cypress.io/comments/1\n');
        expect(stdout).to.contain(
          'Response: {"postId":1,"id":1,"name":"id labore ex et quam laborum","email":"Eliseo@gardner.biz"'
        );

        // console.error and console.warn.
        expect(stdout).to.contain('cons.warn ⚠  This is a warning message\n');
        expect(stdout).to.contain('cons.error ⚠  Error: This is an error message\n');

        // should not contained failed command
        expect(stdout).to.not.contain('cy:command ✘  get\tbreaking-get\n');
        expect(stdout).to.not.contain(
          `cy:error   ✘  CypressError: Timed out retrying: Expected to find element: 'breaking-get', but never found it.\n`
        );
        expect(stdout).to.contain('✔  All specs passed!');
        resolve();
      });
    });
  }).timeout(60000);

  it('Logs happy flows with errors.', async () => {
    await new Promise(resolve => {
      exec(commandBase() + 'happyFlow.spec.js', (error, stdout, stderr) => {
        // cy.command logs.
        expect(stdout).to.contain('cy:command ✔  visit\t/commands/network-requests\n');
        expect(stdout).to.contain('cy:command ✔  get\t.network-post\n');
        expect(stdout).to.contain(
          'cy:command ✔  xhr\t STUBBED PUT https://jsonplaceholder.cypress.io/comments/1\n'
        );

        // cy.route logs.
        expect(stdout).to.contain('cy:route ⛗  Status: 200 (getComment)\n');
        expect(stdout).to.contain('Method: GET\n');
        expect(stdout).to.contain('Url: https://jsonplaceholder.cypress.io/comments/1\n');
        expect(stdout).to.contain(
          'Response: {"postId":1,"id":1,"name":"id labore ex et quam laborum","email":"Eliseo@gardner.biz"'
        );

        // console.error and console.warn.
        expect(stdout).to.contain('cons.warn ⚠  This is a warning message\n');
        expect(stdout).to.contain('cons.error ⚠  Error: This is an error message\n');

        // log failed command
        expect(stdout).to.contain('cy:command ✘  get\tbreaking-get\n');
        expect(stdout).to.contain(
          `cy:error   ✘  CypressError: Timed out retrying: Expected to find element: 'breaking-get', but never found it.\n`
        );

        resolve();
      });
    });
  }).timeout(60000);

  it('Logs FETCH API routes.', async () => {
    await new Promise(resolve => {
      exec(commandBase() + 'apiRoutes.spec.js', (error, stdout, stderr) => {
        expect(stdout).to.contain('Method: PUT\n');
        expect(stdout).to.contain('Url: https://example.cypress.io/comments/10\n');

        // cy.route empty body.
        expect(stdout).to.contain('cy:route ⛗  Status: 200 (getComment)\n');
        expect(stdout).to.contain('Response: EMPTY_BODY\n');

        // cy.route text.
        expect(stdout).to.contain('cy:route ⛗  Status: 403 (putComment)\n');
        expect(stdout).to.contain('Response: This is plain text data.\n');

        // cy.route unknown.
        expect(stdout).to.contain('cy:route ⛗  Status: 401 (putComment)\n');
        expect(stdout).to.contain('Response: UNKNOWN_BODY\n');

        // cy.route logs.
        expect(stdout).to.contain('cy:route ⛗  Status: 404 (putComment)\n');
        expect(stdout).to.contain('Response: {"error":"Test message."}\n');

        // log failed command
        expect(stdout).to.contain('cy:command ✘  get\tbreaking-get\n');
        expect(stdout).to.contain(
          `cy:error   ✘  CypressError: Timed out retrying: Expected to find element: 'breaking-get', but never found it.\n`
        );

        resolve();
      });
    });
  }).timeout(60000);
});
