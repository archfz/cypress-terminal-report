const {exec} = require('child_process');
const {expect} = require('chai');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');

let commandPrefix = 'node ./node_modules/.bin/cypress';

if (process.platform === 'win32') {
  commandPrefix = 'npx cypress';
}

const ICONS = (() => {
  if (process.platform !== 'win32' || process.env.CI || process.env.TERM === 'xterm-256color') {
    return {error: '✘', warning: '⚠', success: '✔', info: 'ⓘ', route: '⛗'};
  } else {
    return {error: 'x', warning: '!', success: '+', info: 'i', route: '~'};
  }
})();

const PADDING = '                    ';

const commandBase = (env = [], specs = []) =>
  `${commandPrefix} run --env "${env.join(',')}" --headless --config video=false -s ${specs.map(s => `cypress/integration/${s}`)}`;

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

  it('Should run happy flow.', async () => {
    await runTest(commandBase([], ['happyFlow.spec.js']), (error, stdout, stderr) => {
      // cy.command logs.
      expect(stdout).to.contain(`cy:command ${ICONS.success}  visit\t/commands/network-requests\n`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  get\t.network-post\n`);
      expect(stdout).to.contain(
        `cy:xhr ${ICONS.info}  STUBBED PUT https://jsonplaceholder.cypress.io/comments/1\n`
      );
      // cy.route logs.
      expect(stdout).to.contain(`cy:route ${ICONS.route}  (getComment) GET https://jsonplaceholder.cypress.io/comments/1\n`);
      expect(stdout).to.contain(`Status: 200\n`);
      expect(stdout).to.contain(
        `Response body: {\n${PADDING}  "postId": 1,\n${PADDING}  "id": 1,\n${PADDING}  "name": "id labore ex et quam laborum",\n${PADDING}  "email": "Eliseo@gardner.biz",\n${PADDING}  "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\\ntempora quo necessitatibus\\ndolor quam autem quasi\\nreiciendis et nam sapiente accusantium"\n${PADDING}}\n`
      );
      // console
      expect(stdout).to.contain(`cons:warn ${ICONS.warning}  This is a warning message\n`);
      expect(stdout).to.contain(`cons:error ${ICONS.warning}  This is an error message\n`);
      expect(stdout).to.contain(`cons:error ${ICONS.warning}  Error: This is an error message with stack.\n${PADDING}    at Context.<anonymous> (https://example.cypress.io/__cypress/tests?p=`);
      expect(stdout).to.contain(`cons:log ${ICONS.info}  This should console.log appear.`);
      expect(stdout).to.contain(`cons:log ${ICONS.info}  {\n${PADDING}  "this": "Is an object",\n${PADDING}  "with": {\n${PADDING}    "keys": 12512\n${PADDING}  }\n${PADDING}}\n`);
      expect(stdout).to.contain(`cons:log ${ICONS.info}  {\n${PADDING}  "a": "b"\n${PADDING}},\n${PADDING}{\n${PADDING}  "c": "d"\n${PADDING}},\n${PADDING}10,\n${PADDING}string\n`);
      expect(stdout).to.contain(`cons:error ${ICONS.warning}  null,\n${PADDING}undefined,\n${PADDING},\n${PADDING}false,\n${PADDING}function () {}\n`);
      expect(stdout).to.contain(`cons:info ${ICONS.info}  This should console.info appear.`);
      // log failed command
      expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-get\n`);
    });
  }).timeout(60000);

  it('Should logs FETCH API routes.', async () => {
    await runTest(commandBase([], ['apiRoutes.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`(putComment) PUT https://example.cypress.io/comments/10\n`);
      // cy.route empty body.
      expect(stdout).to.contain(`cy:route ${ICONS.route}`);
      expect(stdout).to.contain(`Status: 200\n`);
      expect(stdout).to.contain(`Response body: <EMPTY>\n`);
      // cy.route text.
      expect(stdout).to.contain(`cy:route ${ICONS.route}`);
      expect(stdout).to.contain(`Status: 403\n`);
      expect(stdout).to.contain(`Response body: This is plain text data.\n`);
      // cy.route unknown.
      expect(stdout).to.contain(`cy:route ${ICONS.route}`);
      expect(stdout).to.contain(`Status: 401\n`);
      expect(stdout).to.contain(`Response body: <UNKNOWN>\n`);
      // cy.route logs.
      expect(stdout).to.contain(`cy:route ${ICONS.route}`);
      expect(stdout).to.contain(`Status: 404\n`);
      expect(stdout).to.contain(`Response body: {"error":"Test message."}\n`);
      // log failed command
      expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-get\n`);
    });
  }).timeout(60000);

  it('Should log cy.requests', async () => {
    await runTest(commandBase([], [`requests.spec.js`]), (error, stdout, stderr) => {
      expect(stdout).to.contain(
        `cy:request ${ICONS.success}  https://jsonplaceholder.cypress.io/todos/1\n${PADDING}Status: 200\n${PADDING}Response body: {\n${PADDING}  "userId": 1,\n${PADDING}  "id": 1,\n${PADDING}  "title": "delectus aut autem",\n${PADDING}  "completed": false\n${PADDING}}`
      );
      expect(stdout).to.contain(
        `cy:request ${ICONS.success}  GET https://jsonplaceholder.cypress.io/todos/2\n${PADDING}Status: 200\n${PADDING}Response body: {\n${PADDING}  "userId": 1,\n${PADDING}  "id": 2,\n${PADDING}  "title": "quis ut nam facilis et officia qui",\n${PADDING}  "completed": false\n${PADDING}}`
      );
      expect(stdout).to.contain(
        `cy:request ${ICONS.success}  GET https://jsonplaceholder.cypress.io/todos/3\n${PADDING}Status: 200\n${PADDING}Response body: {\n${PADDING}  "userId": 1,\n${PADDING}  "id": 3,\n${PADDING}  "title": "fugiat veniam minus",\n${PADDING}  "completed": false\n${PADDING}}`
      );
      expect(stdout).to.contain(
        `cy:request ${ICONS.success}  POST https://jsonplaceholder.cypress.io/comments\n${PADDING}Status: 201\n${PADDING}Response body: {\n${PADDING}  "id": 501\n${PADDING}}\n`
      );
      // log failed command
      expect(stdout).to.contain(
        `cy:request ${ICONS.error}  PUT https://jsonplaceholder.cypress.io/comments\n${PADDING}Status: 404\n${PADDING}Response body: {}\n`
      );

      expect(stdout).to.contain(
        `cy:request ${ICONS.error}  GET http://www.mocky.io/v2/5ec993353000007900a6ce1e\n${PADDING}Status: 500\n${PADDING}Response body: Hey ya! Great to see you here. Btw, nothing is configured for this request path. Create a rule and start building a mock API.\n`
      );

      expect(stdout).to.contain(
        `cy:request ${ICONS.error}  POST http://www.mocky.io/v2/5ec993803000009700a6ce1f\n${PADDING}Status: 400\n${PADDING}Response body: {\n${PADDING}  "status": "Wrong!",\n${PADDING}  "data": {\n${PADDING}    "corpo": "corpo da resposta",\n${PADDING}    "titulo": "titulo da resposta"\n${PADDING}  }\n${PADDING}}\n`
      );
    });
  }).timeout(60000);

  it('Should log request data and response headers.', async () => {
    await runTest(commandBase(['printHeaderData=1', 'printRequestData=1'], [`xhrTypes.spec.js`]), (error, stdout, stderr) => {
      expect(stdout).to.contain(`Status: 403\n${PADDING}Request headers: {\n${PADDING}  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",\n`);
      expect(stdout).to.contain(`\n${PADDING}  "test-header": "data",\n${PADDING}  "vary": "Accept-Encoding"\n${PADDING}}\n${PADDING}Response body: {\n${PADDING}  "key": "data"\n${PADDING}}\n`);
      expect(stdout).to.contain(`POST http://www.mocky.io/v2/5ec993803000009700a6ce1f\n${PADDING}Status: 400\n${PADDING}Request headers: {\n${PADDING}  "token": "test"\n${PADDING}}\n${PADDING}Request body: {\n${PADDING}  "testitem": "ha"\n${PADDING}}\n${PADDING}Response headers: {\n${PADDING}  "vary": "Accept-Encoding",\n${PADDING}  "access-control-allow-origin": "*",\n${PADDING}  "content-type": "application/json; charset=UTF-8",`);
      expect(stdout).to.contain(`\n${PADDING}Response body: {\n${PADDING}  "status": "Wrong!",\n${PADDING}  "data": {\n${PADDING}    "corpo": "corpo da resposta",\n${PADDING}    "titulo": "titulo da resposta"\n${PADDING}  }\n${PADDING}}\n`);
    });
  }).timeout(60000);

  it('Should properly set the breaking command in logs.', async () => {
    await runTest(commandBase([], [`waitFail.spec.js`]), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-wait`);
      expect(stdout).to.not.contain(`cy:route ${ICONS.error}`);
      expect(stdout).to.contain(`cy:route ${ICONS.route}  (getComment) GET https://jsonplaceholder.cypress.io/comments/1`);
    });
  }).timeout(60000);

  it('Should always print logs when configuration enabled.', async () => {
    await runTest(commandBase(['printLogsAlways=1'], ['alwaysPrintLogs.spec.js']), (error, stdout, stderr) => {
      // cy.command logs.
      expect(stdout).to.contain(`cy:command ${ICONS.success}  visit\t/\n`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  contains\tcypress\n`);
    });
  }).timeout(60000);

  it('Should print only logs allowed if configuration added.', async () => {
    await runTest(commandBase(['setLogTypes=1'], ['allTypesOfLogs.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:request`);
      expect(stdout).to.contain(`cy:log`);
      expect(stdout).to.contain(`cons:warn`);

      expect(stdout).to.not.contain(`cy:route`);
      expect(stdout).to.not.contain(`cy:command`);
      expect(stdout).to.not.contain(`cons:error`);
      expect(stdout).to.not.contain(`cons:log`);
      expect(stdout).to.not.contain(`cons:info`);
    });
  }).timeout(60000);

  it('Should filter logs if configuration added.', async () => {
    await runTest(commandBase(['setFilterLogs=1'], ['allTypesOfLogs.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`This should console.log appear. [filter-out-string]`);
      expect(stdout).to.contain(`This is a cypress log. [filter-out-string]`);
      expect(stdout).to.contain(`.breaking-get [filter-out-string]`);

      expect(stdout).to.not.contain(`cy:route`);
      expect(stdout).to.not.contain(`cy:request`);
      expect(stdout).to.not.contain(`cons:error`);
      expect(stdout).to.not.contain(`cons:warn`);
      expect(stdout).to.not.contain(`cons:info`);
    });
  }).timeout(60000);

  it('Should generate proper log output files.', async () => {
    const outRoot = path.join(__dirname, 'output');
    const testOutputs = ['out.txt', 'out.json', 'out.cst'];
    testOutputs.forEach((out) => {
      if (fs.existsSync(path.join(outRoot, out))) {
        fs.unlinkSync(path.join(outRoot, out));
      }
    });

    if (fs.existsSync(path.join(outRoot, 'not'))) {
      fs.rmdirSync(path.join(outRoot, 'not'), { recursive: true });
    }

    const clean = (str) =>
      // Clean error trace as it changes from test to test.
      str.replace(/at [^(]+ \([^)]+\)/g, '');

    const osSpecificEol = (str) => 
      // Change line endings to win32 if needed
      (os.EOL === '\r\n' ? str.replace(/\n/g, '\r\n') : str);

    const specFiles = ['requests.spec.js', 'happyFlow.spec.js'];
    await runTest(commandBase(['generateOutput=1'], specFiles), (error, stdout, stderr) => {
      testOutputs.forEach((out) => {
        const expectedBuffer = fs.readFileSync(
          path.join(outRoot, out.replace(/\.([a-z]+)$/, '.spec.$1'))
        );
        const valueBuffer = fs.readFileSync(path.join(outRoot, out));
        let value = clean(valueBuffer.toString());
        if (path.sep === '\\') {
          specFiles.forEach((specFile) => {
            const expectPath = 'cypress/integration/' + specFile;
            if (out.endsWith('json')) {
              const osJsonPath = 'cypress\\\\integration\\\\' + specFile;
              value = value.replace(osJsonPath, expectPath);
            } else {
              const osPath = 'cypress\\integration\\' + specFile;
              value = value.replace(osPath, expectPath);
            }
          });
        }

        let expected = clean(expectedBuffer.toString());
        if (out.endsWith('.txt')) {
          expected = osSpecificEol(expected);
        }

        expect(value, `Check ${out} matched spec.`).to.eq(clean(expected.toString()));
      });

      expect(stdout).to.contain('[cypress-terminal-report] Wrote text logs to ' + path.join(outRoot, 'not', 'existing', 'path', 'out.txt'));
      expect(stdout).to.contain('[cypress-terminal-report] Wrote text logs to ' + path.join(outRoot, 'out.txt'));
      expect(stdout).to.contain('[cypress-terminal-report] Wrote json logs to ' + path.join(outRoot, 'out.json'));
      expect(stdout).to.contain('[cypress-terminal-report] Wrote custom logs to ' + path.join(outRoot, 'out.cst'));
    });
  }).timeout(60000);

  it('Should not break normal execution.', async () => {
    await runTest(commandBase([], ['successful.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.not.contain(`error`);
      expect(stdout).to.not.contain(`CypressError`);
      expect(stdout).to.contain(`1 passing`);
    });
  }).timeout(60000);
});
