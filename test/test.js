const { exec } = require('child_process');
const { expect } = require('chai');

const commandBase = 'node ./node_modules/.bin/cypress run --headless -s cypress/integration/';

describe("cypress-terminal-report", () => {
  it("Happy flow", async () => {
    await new Promise((resolve) => {
      exec(commandBase + "happyflow.spec.ts", (error, stdout, stderr) => {
        // cy.command logs.
        expect(stdout).to.contain('cy:command ✔  visit\t/commands/network-requests\n');
        expect(stdout).to.contain('cy:command ✔  get\t.network-post\n');
        expect(stdout).to.contain('cy:command ✔  xhr\t STUBBED PUT https://jsonplaceholder.cypress.io/comments/1\n');

        // cy.route logs.
        expect(stdout).to.contain('cy:route ⛗  Status: 200 (getComment)\n');
        expect(stdout).to.contain('Method: GET\n');
        expect(stdout).to.contain('Url: https://jsonplaceholder.cypress.io/comments/1\n');
        expect(stdout).to.contain('Response: {"postId":1,"id":1,"name":"id labore ex et quam laborum","email":"Eliseo@gardner.biz"');

        // console.error and console.warn.
        expect(stdout).to.contain('cons.warn ⚠  This is a warning message\n');
        expect(stdout).to.contain('cons.error ⚠  Error: This is an error message\n');

        resolve();
      });
    });
  }).timeout(60000);
});
