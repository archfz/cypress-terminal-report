const {exec} = require('child_process');
const {expect} = require('chai');

let commandPrefix = 'node ./node_modules/.bin/cypress';

if (process.platform === 'win32') {
  commandPrefix = 'npx cypress';
}

const commandBase = (env = '') =>
  `${commandPrefix} run --env ${env} --headless -s cypress/integration/`;

describe('cypress-terminal-report', () => {
  it('Always print logs happy flows with no errors.', async () => {
    await new Promise(resolve => {
      exec(commandBase('printLogs=always') + 'alwaysPrintLogs.spec.js', (error, stdout, stderr) => {
        if (stderr) {
          console.error(stderr);
        }
        // cy.command logs.
        expect(stdout).to.contain('cy:command ✔  visit\t/\n');
        expect(stdout).to.contain('cy:command ✔  contains\tcypress\n');
        expect(stdout).to.contain('All specs passed!');
        resolve();
      });
    });
  }).timeout(60000);
  it('Logs happy flows with errors.', async () => {
    await new Promise(resolve => {
      exec(commandBase() + 'happyFlow.spec.js', (error, stdout, stderr) => {
        if (stderr) {
          console.error(stderr);
        }
        // cy.command logs.
        expect(stdout).to.contain('cy:command ✔  visit\t/commands/network-requests\n');
        expect(stdout).to.contain('cy:command ✔  get\t.network-post\n');
        expect(stdout).to.contain(
          'cy:command ✔  xhr\t STUBBED PUT https://jsonplaceholder.cypress.io/comments/1\n'
        );
        // // cy.route logs.
        expect(stdout).to.contain('cy:route ⛗');
        expect(stdout).to.contain('Status: 200 (getComment)\n');
        expect(stdout).to.contain('Method: GET\n');
        expect(stdout).to.contain('Url: https://jsonplaceholder.cypress.io/comments/1\n');
        expect(stdout).to.contain(
          'Response: {\n\t\t      "postId": 1,\n\t\t      "id": 1,\n\t\t      "name": "id labore ex et quam laborum",\n\t\t      "email": "Eliseo@gardner.biz",\n\t\t      "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\\ntempora quo necessitatibus\\ndolor quam autem quasi\\nreiciendis et nam sapiente accusantium"\n\t\t    }\n'
        );
        // console.error and console.warn.
        expect(stdout).to.contain('cons.warn ⚠  This is a warning message\n');
        expect(stdout).to.contain('cons.error ⚠  Error: This is an error message\n');
        // log failed command
        expect(stdout).to.contain('cy:command ✘  get\tbreaking-get\n');
        resolve();
      });
    });
  }).timeout(60000);
  it('Logs FETCH API routes.', async () => {
    await new Promise(resolve => {
      exec(commandBase() + 'apiRoutes.spec.js', (error, stdout, stderr) => {
        if (stderr) {
          console.error(stderr);
        }
        expect(stdout).to.contain('Method: PUT\n');
        expect(stdout).to.contain('Url: https://example.cypress.io/comments/10\n');
        // cy.route empty body.
        expect(stdout).to.contain('cy:route ⛗');
        expect(stdout).to.contain('Status: 200 (getComment)\n');
        expect(stdout).to.contain('Response: EMPTY_BODY\n');
        // cy.route text.
        expect(stdout).to.contain('cy:route ⛗');
        expect(stdout).to.contain('Status: 403 (putComment)\n');
        expect(stdout).to.contain('Response: This is plain text data.\n');
        // cy.route unknown.
        expect(stdout).to.contain('cy:route ⛗');
        expect(stdout).to.contain('Status: 401 (putComment)\n');
        expect(stdout).to.contain('Response: UNKNOWN_BODY\n');
        // cy.route logs.
        expect(stdout).to.contain('cy:route ⛗');
        expect(stdout).to.contain('Status: 404 (putComment)\n');
        expect(stdout).to.contain('Response: {"error":"Test message."}\n');
        // log failed command
        expect(stdout).to.contain('cy:command ✘  get\tbreaking-get\n');
        resolve();
      });
    });
  }).timeout(60000);
  it('Logs cy.requests', async () => {
    await new Promise(resolve => {
      exec(commandBase('printLogs=always') + 'requests.spec.js', (error, stdout, stderr) => {
        expect(stdout).to.contain(
          'cy:request ✔  https://jsonplaceholder.cypress.io/todos/1\n\t\t    Status: 200 \n      \t\t    Response: {\n\t\t      "userId": 1,\n\t\t      "id": 1,\n\t\t      "title": "delectus aut autem",\n\t\t      "completed": false\n\t\t    }'
        );
        expect(stdout).to.contain(
          'cy:request ✔  POST https://jsonplaceholder.cypress.io/comments\n\t\t    Status: 201 \n      \t\t    Response: {\n\t\t      "id": 501\n\t\t    }\n\n\n\n\r'
        );
        // log failed command
        expect(stdout).to.contain(
          'cy:request ✘  PUT https://jsonplaceholder.cypress.io/comments\n\t\t    Status: 404 - Not Found\n      \t\t    Response: {}\n\n\n\n\n\n'
        );

        expect(stdout).to.contain(
          'cy:request ✘  GET https://cypress.free.beeceptor.com/response500\n\t\t    Status: 500 - Server Error\n      \t\t    Response: Hey ya! Great to see you here. Btw, nothing is configured for this request path. Create a rule and start building a mock API.\n\n\n\n\r'
        );

        expect(stdout).to.contain(
          'cy:request ✘  POST https://cypress.free.beeceptor.com/create/object/fail\n\t\t    Status: 400 - Bad Request\n      \t\t    Response: {\n\t\t      "status": "Wrong!",\n\t\t      "data": {\n\t\t        "corpo": "corpo da resposta",\n\t\t        "titulo": "titulo da resposta"\n\t\t      }\n\t\t    }\n\n\n\n'
        );
        resolve();
      });
    });
  }).timeout(60000);
});
