const {exec} = require('child_process');
const {expect} = require('chai');
const chalk = require('chalk');

let commandPrefix = 'node ./node_modules/.bin/cypress';

if (process.platform === 'win32') {
  commandPrefix = 'npx cypress';
}

const commandBase = (env = '') =>
  `${commandPrefix} run --env ${env} --headless -s cypress/integration/`;

let lastRunOutput = '';
const runTest = async (command, callback) => {
  await new Promise(resolve => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        console.error(stderr);
      }

      let from = stdout.indexOf('Running:  ');
      let to = stdout.lastIndexOf('(Results)');
      stdout = stdout.slice(from, to);

      lastRunOutput = stdout;
      // Normalize line endings for unix.
      callback(error, stdout.replace(/\r\n/g, "\n"), stderr);

      resolve();
    });
  });
};

describe('cypress-terminal-report', () => {

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      console.log(chalk.yellow('-- Cypress output start --\n\n'));
      console.log(lastRunOutput);
      console.log(chalk.yellow('-- Cypress output end --\n\n\n\n'));
    }
  });

  it('Always print logs happy flows with no errors.', async () => {
    await runTest(commandBase('printLogs=always') + 'alwaysPrintLogs.spec.js', (error, stdout, stderr) => {
      // cy.command logs.
      expect(stdout).to.contain('cy:command ✔  visit\t/\n');
      expect(stdout).to.contain('cy:command ✔  contains\tcypress\n');
    });
  }).timeout(60000);

  it('Logs happy flows with errors.', async () => {
    await runTest(commandBase() + 'happyFlow.spec.js', (error, stdout, stderr) => {
      // cy.command logs.
      expect(stdout).to.contain('cy:command ✔  visit\t/commands/network-requests\n');
      expect(stdout).to.contain('cy:command ✔  get\t.network-post\n');
      expect(stdout).to.contain(
        'cy:command ✔  xhr\t STUBBED PUT https://jsonplaceholder.cypress.io/comments/1\n'
      );
      // cy.route logs.
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
      // by default console.log should not be printed
      expect(stdout).to.not.contain('This console.log should not appear.');
    });
  }).timeout(60000);

  it('Logs FETCH API routes.', async () => {
    await runTest(commandBase() + 'apiRoutes.spec.js', (error, stdout, stderr) => {
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
    });
  }).timeout(60000);

  it('Logs cy.requests', async () => {
    await runTest(commandBase('printLogs=always') + 'requests.spec.js', (error, stdout, stderr) => {
      expect(stdout).to.contain(
        'cy:request ✔  https://jsonplaceholder.cypress.io/todos/1\n\t\t    Status: 200 \n      \t\t    Response: {\n\t\t      "userId": 1,\n\t\t      "id": 1,\n\t\t      "title": "delectus aut autem",\n\t\t      "completed": false\n\t\t    }'
      );
      expect(stdout).to.contain(
        'cy:request ✔  POST https://jsonplaceholder.cypress.io/comments\n\t\t    Status: 201 \n      \t\t    Response: {\n\t\t      "id": 501\n\t\t    }\n\n\n\n\r'
      );
      // log failed command
      expect(stdout).to.contain(
        'cy:request ✘  PUT https://jsonplaceholder.cypress.io/comments\n\t\t    Status: 404 - Not Found\n      \t\t    Response: {}\n\n\n\n'
      );

      expect(stdout).to.contain(
        'cy:request ✘  GET https://cypress.free.beeceptor.com/response500\n\t\t    Status: 500 - Server Error\n      \t\t    Response: Hey ya! Great to see you here. Btw, nothing is configured for this request path. Create a rule and start building a mock API.\n\n\n\n\r'
      );

      expect(stdout).to.contain(
        'cy:request ✘  POST https://cypress.free.beeceptor.com/create/object/fail\n\t\t    Status: 400 - Bad Request\n      \t\t    Response: {\n\t\t      "status": "Wrong!",\n\t\t      "data": {\n\t\t        "corpo": "corpo da resposta",\n\t\t        "titulo": "titulo da resposta"\n\t\t      }\n\t\t    }\n\n\n\n'
      );
    });
  }).timeout(60000);

  it('Prints console.log and console.info when enabled.', async () => {
    await runTest(commandBase('printConsoleInfo=true') + 'consoleLogs.spec.js', (error, stdout, stderr) => {
      // console.log logs.
      expect(stdout).to.contain('cons:log ⓘ  This text is for log.');
      // console.info logs.
      expect(stdout).to.contain('cons:info ⓘ  This text is for info.');
    });
  }).timeout(60000);
});
