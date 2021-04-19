const {exec} = require('child_process');
const {expect} = require('chai');
const chalk = require('chalk');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const os = require('os');
const glob = require('glob');

let commandPrefix = 'node ./node_modules/.bin/cypress';

if (process.platform === 'win32') {
  commandPrefix = 'npx cypress';
}

const ICONS = (() => {
  if (process.platform !== 'win32' || process.env.CI || process.env.TERM === 'xterm-256color') {
    return {error: '✘', warning: '❖', success: '✔', info: '✱', route: '➟', debug: '⚈'};
  } else {
    return {error: 'x', warning: '!', success: '+', info: 'i', route: '~', debug: '%'};
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
      if (from !== -1 && to !== -1) {
        stdout = stdout.slice(from, to);
      }

      lastRunOutput = stdout;
      // Normalize line endings for unix.
      const normalizedStdout = stdout.replace(/\r\n/g, "\n");
      callback(error, normalizedStdout, stderr);
      expect(normalizedStdout).to.not.contain("CypressError: `cy.task('ctrLogMessages')` failed");

      resolve();
    });
  });
};

const outputCleanUpAndInitialization = (testOutputs, outRoot) => {
  outRoot.value = path.join(__dirname, 'output');
  testOutputs.value = ['out.txt', 'out.json', 'out.cst'];
  testOutputs.value.forEach((out) => {
    if (fs.existsSync(path.join(outRoot.value, out))) {
      fs.unlinkSync(path.join(outRoot.value, out));
    }
  });
}

const osSpecificEol = (str) =>
  // Change line endings to win32 if needed
  (os.EOL === '\r\n' ? str.replace(/\n/g, '\r\n') : str);

const clean = (str) =>
  // Clean error trace as it changes from test to test.
  str.replace(/at [^(]+ \([^)]+\)/g, '')
    // Replace durations with constant values as they vary all the time
    .replace(/\([\d.]+ m?s\)/g, '(X ms)')
    // Clean new line of white space at the end.
    .replace(/\s+$/, '')
    // Clean slow test.
    .replace(/\(\d+m?s\)/, '(X ms)')
    // Normalize line endings across os.
    .replace(/\r\n/g, "\n");

const expectOutFilesMatch = (outputPath, specPath) => {
  const expectedBuffer = fs.readFileSync(specPath);
  const valueBuffer = fs.readFileSync(outputPath);
  let value = clean(valueBuffer.toString());
  if (path.sep === '\\') {
    if (outputPath.endsWith('json')) {
      value = value.replace(/cypress\\\\integration\\\\/g, 'cypress/integration/');
    }

    value = value.replace(/cypress\\integration\\/g, 'cypress/integration/');
  }

  let expected = clean(expectedBuffer.toString());
  if (outputPath.endsWith('.txt')) {
    expected = osSpecificEol(expected);
  }

  expect(clean(value), `Check ${outputPath} matched ${specPath}.`).to.eq(clean(expected));
}

const expectOutputFilesToBeCorrect = (testOutputs, outRoot, specFiles, specExtName) => {
  testOutputs.value.forEach((out) => {
    expectOutFilesMatch(
      path.join(outRoot.value, out),
      path.join(outRoot.value, out.replace(/\.([a-z]+)$/, '.spec.' + specExtName + '.$1'))
    );
  });
}

const expectConsoleLogForOutput = (stdout, outRoot, fileNames = [''], toNot = false) => {
  fileNames.forEach((fileName) => {
    let ext = path.extname(fileName).substring(1);
    if (!['json', 'txt'].includes(ext)) {
      ext = 'custom';
    }
    let logString = '[cypress-terminal-report] Wrote ' + ext +
      ' logs to ' + path.join(outRoot.value, fileName);

    if (toNot) {
      expect(stdout).to.not.contain(logString);
    } else {
      expect(stdout).to.contain(logString);
    }
  });
}

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
      expect(clean(stdout)).to.contain(
        `cy:xhr ${ICONS.warning}  STUBBED PUT https://jsonplaceholder.cypress.io/comments/1 (X ms)\n${PADDING}Status: 404 - Not Found\n`
      );
      // cy.route logs.
      expect(stdout).to.contain(`cy:route ${ICONS.route}  (getComment) GET https://jsonplaceholder.cypress.io/comments/1\n`);
      expect(stdout).to.contain(`Status: 200\n`);
      expect(stdout).to.contain(
        `Response body: {\n${PADDING}  "postId": 1,\n${PADDING}  "id": 1,\n${PADDING}  "name": "id labore ex et quam laborum",\n${PADDING}  "email": "Eliseo@gardner.biz",\n${PADDING}  "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\\ntempora quo necessitatibus\\ndolor quam autem quasi\\nreiciendis et nam sapiente accusantium"\n${PADDING}}\n`
      );
      // console
      expect(stdout).to.contain(`cons:warn ${ICONS.warning}  This is a warning message\n`);
      expect(stdout).to.contain(`cons:error ${ICONS.error}  This is an error message\n`);
      expect(stdout).to.contain(`cons:error ${ICONS.error}  Error: This is an error message with stack.\n${PADDING}    at Context.eval (`);
      expect(stdout).to.contain(`cons:log ${ICONS.info}  This should console.log appear.`);
      expect(stdout).to.contain(`cons:log ${ICONS.info}  {\n${PADDING}  "this": "Is an object",\n${PADDING}  "with": {\n${PADDING}    "keys": 12512\n${PADDING}  }\n${PADDING}}\n`);
      expect(stdout).to.contain(`cons:log ${ICONS.info}  {\n${PADDING}  "a": "b"\n${PADDING}},\n${PADDING}{\n${PADDING}  "c": "d"\n${PADDING}},\n${PADDING}10,\n${PADDING}string\n`);
      expect(stdout).to.contain(`cons:error ${ICONS.error}  null,\n${PADDING}undefined,\n${PADDING},\n${PADDING}false,\n${PADDING}function () {}\n`);
      expect(stdout).to.contain(`cons:info ${ICONS.info}  This should console.info appear.`);
      expect(stdout).to.contain(`cons:debug ${ICONS.debug}  This should console.debug appear.`);
      // log failed command
      expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-get\n`);
    });
  }).timeout(60000);

  it('Should log fetch api routes.', async () => {
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

  it('Should log cypress intercept command.', async () => {
    await runTest(commandBase([], ['apiRoutesIntercept.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:intercept ${ICONS.route}  Method: GET
                    Matcher: "/test"
                    Mocked Response: () => {
                          return 'test';
                        }`);
      expect(stdout).to.contain(`cy:intercept ${ICONS.route}  Matcher: {"method":"GET","url":"/comments\\\\/.*/"}
                    Mocked Response: {"statusCode":200,"body":""}`);
      expect(stdout).to.contain(`cy:intercept ${ICONS.route}  Matcher: {"method":"PUT","url":"/comments\\\\/.*/","headers":{"Accept":"*/*"}}
                    Mocked Response: {"statusCode":403,"body":"This is plain text data.","headers":{"Custom":"Header"}}`);
    });
  }).timeout(60000);

  it('Should log cypress requests', async () => {
    await runTest(commandBase([], [`requests.spec.js`, `requests2.spec.js`]), (error, stdout, stderr) => {
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
        `cy:request ${ICONS.error}  PUT https://jsonplaceholder.cypress.io/comments\n${PADDING}Status: 404 - Not Found\n${PADDING}Response body: {}\n`
      );

      expect(stdout).to.contain(
        `cy:request ${ICONS.error}  GET http://www.mocky.io/v2/5ec993353000007900a6ce1e\n${PADDING}Status: 500 - Internal Server Error\n${PADDING}Response body: Hey ya! Great to see you here. Btw, nothing is configured for this request path. Create a rule and start building a mock API.\n`
      );

      expect(stdout).to.contain(
        `cy:request ${ICONS.error}  POST http://www.mocky.io/v2/5ec993803000009700a6ce1f\n${PADDING}Status: 400 - Bad Request\n${PADDING}Response body: {\n${PADDING}  "status": "Wrong!",\n${PADDING}  "data": {\n${PADDING}    "corpo": "corpo da resposta",\n${PADDING}    "titulo": "titulo da resposta"\n${PADDING}  }\n${PADDING}}\n`
      );
      expect(stdout).to.contain(
        `cy:request ${ICONS.error}  POST http://this.does.not.exist\n${PADDING}Network error: getaddrinfo ENOTFOUND this.does.not.exist\n`
      );
      expect(stdout).to.contain(
        `cy:request ${ICONS.error}  POST http://timeout
                    Timed out!`
      );
      // Expect no parsing errors
      expect(stdout).not.to.contain('Cannot parse cy.request error content!');
      expect(stdout).not.to.contain('Cannot parse cy.request network error message!');
      expect(stdout).not.to.contain('Cannot parse cy.request status code failure message!');
    });
  }).timeout(60000);

  it('Should log request data and response headers.', async () => {
    await runTest(commandBase(['printHeaderData=1', 'printRequestData=1'], [`xhrTypes.spec.js`]), (error, stdout, stderr) => {
      expect(stdout).to.contain(`Status: 403\n${PADDING}Request headers: {\n${PADDING}  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",\n`);
      expect(stdout).to.contain(`\n${PADDING}  "test-header": "data",\n${PADDING}  "vary": "Accept-Encoding"\n${PADDING}}\n${PADDING}Response body: {\n${PADDING}  "key": "data"\n${PADDING}}\n`);
      expect(stdout).to.contain(`POST http://www.mocky.io/v2/5ec993803000009700a6ce1f\n${PADDING}Status: 400 - Bad Request\n${PADDING}Request headers: {\n${PADDING}  "token": "test"\n${PADDING}}\n${PADDING}Request body: {\n${PADDING}  "testitem": "ha"\n${PADDING}}\n${PADDING}Response headers: {\n${PADDING}  "vary": "Accept-Encoding",\n`);
      expect(stdout).to.contain(`${PADDING}Response body: {\n${PADDING}  "status": "Wrong!",\n${PADDING}  "data": {\n${PADDING}    "corpo": "corpo da resposta",\n${PADDING}    "titulo": "titulo da resposta"\n${PADDING}  }\n${PADDING}}\n`);
    });
  }).timeout(60000);

  it('Should only log XHR response body for non-successful requests not handled by cy.route.', async () => {
    await runTest(commandBase([], ['xhrTypes.spec.js']), (error, stdout, stderr) => {
      const cleanStdout = clean(stdout);
      expect(cleanStdout).to.contain(
        `cy:xhr ${ICONS.route}  GET https://jsonplaceholder.cypress.io/comments/1 (X ms)\n${PADDING}Status: 200 - OK\n      cy:command`,
        'success XHR log should not contain response body'
      );
      expect(cleanStdout).to.contain(
        `cy:xhr ${ICONS.warning}  GET https://www.mocky.io/v2/5ec993803000009700a6ce1f (X ms)\n${PADDING}Status: 400 - Bad Request\n${PADDING}Response body: { "status": "Wrong!","data" : {"corpo" : "corpo da resposta","titulo" : "titulo da resposta"\n${PADDING}}\n${PADDING}}\n`,
        'non-stubbed non-success XHR log should contain response body'
      );
      expect(cleanStdout).to.contain(
        `cy:xhr ${ICONS.warning}  STUBBED PUT https://jsonplaceholder.cypress.io/comments/1 (X ms)\n${PADDING}Status: 403 - Forbidden\n        cy:route`,
        'stubbed XHR log should not contain response body'
      );
      expect(stdout).to.contain(`cy:xhr ${ICONS.error}  GET https://example.cypress.io/comments/10 - ABORTED\n`);
    });
  }).timeout(60000);

  it('Should properly set the breaking command in logs.', async () => {
    await runTest(commandBase([], [`waitFail.spec.js`]), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-wait`);
      expect(stdout).to.not.contain(`cy:route ${ICONS.error}`);
      expect(stdout).to.contain(`cy:route ${ICONS.route}  (getComment) GET https://jsonplaceholder.cypress.io/comments/1`);
    });
  }).timeout(60000);

  it('Should always print logs to console when configured so.', async () => {
    await runTest(commandBase(['printLogsToConsoleAlways=1'], ['printLogsSuccess.spec.js', 'printLogsFail.spec.js']), (error, stdout, stderr) => {
      // cy.command logs.
      expect(stdout).to.contain(`cy:command ${ICONS.success}  visit\t/\n`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  contains\tcypress\n`);
      expect(stdout).to.contain(`cy:command ${ICONS.error}  contains\tsserpyc\n`);
    });
  }).timeout(60000);

  it('Should never print logs to console when configured so.', async () => {
    await runTest(commandBase(['printLogsToConsoleNever=1'], ['printLogsSuccess.spec.js', 'printLogsFail.spec.js']), (error, stdout, stderr) => {
      // cy.command logs.
      expect(stdout).to.not.contain(`cy:command ${ICONS.success}  visit\t/\n`);
      expect(stdout).to.not.contain(`cy:command ${ICONS.success}  contains\tcypress\n`);
      expect(stdout).to.not.contain(`cy:command ${ICONS.error}  contains\tsserpyc\n`);
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

  it('Should process logs if configuration added.', async () => {
    await runTest(commandBase(['setProcessLogs=1'], ['allTypesOfLogs.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`This is a cypress log. [******]`);
      expect(stdout).to.contain(`This should console.log appear. [******]`);
      expect(stdout).to.contain(`get\t.breaking-get [******]`);
    });
  }).timeout(60000);

  // Tests in general the log formatting in files.
  it('Should generate proper log output files, and print only failing ones if config is on default.', async () => {
    const outRoot = {};
    const testOutputs = {};
    outputCleanUpAndInitialization(testOutputs, outRoot);

    if (fs.existsSync(path.join(outRoot.value, 'not'))) {
      fsExtra.removeSync(path.join(outRoot.value, 'not'));
    }

    const specFiles = [
      'requests.spec.js',
      'happyFlow.spec.js',
      'printLogsSuccess.spec.js',
      'mochaContexts.spec.js',
    ];
    await runTest(commandBase(['generateOutput=1'], specFiles), (error, stdout, stderr) => {
      expectOutputFilesToBeCorrect(testOutputs, outRoot, specFiles, 'onFail');
      testOutputs.value.push(path.join('not', 'existing', 'path', 'out.txt'));
      expectConsoleLogForOutput(stdout, outRoot, testOutputs.value);
    });
  }).timeout(90000);

  it('Should print all tests to output files when configured so.', async () => {
    const outRoot = {};
    const testOutputs = {};
    outputCleanUpAndInitialization(testOutputs, outRoot);

    const specFiles = [
      'requests.spec.js',
      'happyFlow.spec.js',
      'printLogsSuccess.spec.js',
      'mochaContexts.spec.js',
    ];
    await runTest(commandBase(['generateOutput=1', 'printLogsToFileAlways=1'], specFiles), (error, stdout, stderr) => {
      expectOutputFilesToBeCorrect(testOutputs, outRoot, specFiles, 'always');
      expectConsoleLogForOutput(stdout, outRoot, testOutputs.value);
    });
  }).timeout(90000);

  it('Should not generate and print to output files when configured so.', async () => {
    const outRoot = {};
    const testOutputs = {};
    outputCleanUpAndInitialization(testOutputs, outRoot);

    const specFiles = ['requests.spec.js', 'happyFlow.spec.js', 'printLogsSuccess.spec.js'];
    await runTest(commandBase(['generateOutput=1', 'printLogsToFileNever=1'], specFiles), (error, stdout, stderr) => {
      testOutputs.value.forEach((out) => {
        expect(fs.existsSync(path.join(outRoot.value, out))).false;
      });
      expectConsoleLogForOutput(stdout, outRoot, testOutputs.value, true);
    });
  }).timeout(90000);

  it('Should generate output only for failing tests if set to \'onFail\'.', async () => {
    const outRoot = { value : path.join(__dirname, 'output') };
    const testOutputs = { value : ["out.txt"] };

    const specFiles = ['printLogsOnFail.spec.js'];
    await runTest(commandBase(['generateSimpleOutput=1'], specFiles), (error, stdout, stderr) => {
      expectOutputFilesToBeCorrect(testOutputs, outRoot, specFiles, 'onFailCheck');
      expectConsoleLogForOutput(stdout, outRoot, testOutputs.value);
    });
  }).timeout(90000);

  it('Should not break normal execution.', async () => {
    await runTest(commandBase([], ['successful.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.not.contain(`error`);
      expect(stdout).to.not.contain(`CypressError`);
      expect(stdout).to.contain(`1 passing`);
    });
  }).timeout(60000);

  it('Should compact logs when test fails.', async () => {
    await runTest(commandBase(['compactLogs=1'], ['compactLogs.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`ctr:info -  [ ... 17 omitted logs ... ]\n      cy:command ${ICONS.success}  window\t\n      cons:error ${ICONS.error}  null,`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  window\t\n        ctr:info -  [ ... 3 omitted logs ... ]\n      cy:command ${ICONS.success}  window\t\n      cons:error ${ICONS.error}  This is an error message\n      cy:command ${ICONS.success}  window\t\n      cons:error ${ICONS.error}  Error: This is an error message with stack.`);
      expect(stdout).to.contain(`ctr:info -  [ ... 11 omitted logs ... ]`);
      expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-get`);
    });
  }).timeout(60000);

  it('Should compact all logs when there is no failing test.', async () => {
    await runTest(commandBase(['compactLogs=1', 'printLogsToConsoleAlways=1'], ['successfulWithNoErrors.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`ctr:info -  [ ... 28 omitted logs ... ]`);
    });
  }).timeout(60000);

  it('Should print proper validation error on invalid plugin install options.', async () => {
    await runTest(commandBase(['pluginBadConfig=1'], ['happyFlow.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`Error: [cypress-terminal-report] Invalid plugin install options:`);
      expect(stdout).to.contain(`=> .outputRoot: Invalid type: number (expected string)`);
      expect(stdout).to.contain(`=> .outputTarget/any: Invalid type: number (expected string/function)`);
      expect(stdout).to.contain(`=> .outputVerbose: Invalid type: string (expected boolean)`);
      expect(stdout).to.contain(`=> .compactLogs: Invalid type: boolean (expected number)`);
      expect(stdout).to.contain(`=> .shouldNotBeHere: Additional properties not allowed`);
      expect(stdout).to.contain(`=> .printLogsToFile: Invalid type: boolean (expected string)`);
      expect(stdout).to.contain(`=> .printLogsToConsole: Invalid type: boolean (expected string)`);
      expect(stdout).to.contain(`=> .collectTestLogs: Invalid type: string (expected function)`);
    });
  }).timeout(60000);

  it('Should print proper validation error on invalid support install options.', async () => {
    await runTest(commandBase(['supportBadConfig=1'], ['happyFlow.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`[cypress-terminal-report] Invalid plugin install options:`);
      expect(stdout).to.contain(`=> .collectTypes: Invalid type: number (expected array)`);
      expect(stdout).to.contain(`=> .filterLog: Invalid type: string (expected function)`);
      expect(stdout).to.contain(`=> .processLog: Invalid type: boolean (expected function)`);
      expect(stdout).to.contain(`=> .collectTestLogs: Invalid type: string (expected function)`);
      expect(stdout).to.contain(`=> .xhr/printRequestData: Invalid type: string (expected boolean)`);
      expect(stdout).to.contain(`=> .xhr/printHeaderData: Invalid type: string (expected boolean)`);
      expect(stdout).to.contain(`=> .xhr/shouldNotBeHere: Additional properties not allowed`);
      expect(stdout).to.contain(`=> .shouldNotBeHere: Additional properties not allowed`);
    });
  }).timeout(60000);

  it('Should generate proper nested log output files.', async () => {
    const specFiles = ['requests.spec.js', 'happyFlow.spec.js', 'printLogsSuccess.spec.js', 'multiple.dots.in.spec.js'];
    await runTest(commandBase(['generateNestedOutput=1'], specFiles), (error, stdout) => {
      const specs = glob.sync('./output_nested_spec/**/*', { nodir: true });
      specs.forEach(specFile => {
        const actualFile = specFile.replace('output_nested_spec', 'output_nested');
        expect(fs.existsSync(actualFile), `Expected output file ${actualFile} to exist.`).to.be.true;
        expectOutFilesMatch(actualFile, specFile);
      });
    });
  }).timeout(90000);

  it('Should be able to disable verbose.', async () => {
    await runTest(commandBase(['generateNestedOutput=1', 'disableVerbose=1'], ['multiple.dots.in.spec.js']), (error, stdout) => {
      expect(stdout).to.not.contain(`[cypress-terminal-report] Wrote custom logs to txt.`);
      expect(stdout).to.not.contain(`[cypress-terminal-report] Wrote custom logs to json.`);
      expect(stdout).to.not.contain(`[cypress-terminal-report] Wrote custom logs to custom.`);
    });
  }).timeout(60000);

  it('Should collect test logs if support configuration added.', async () => {
    await runTest(commandBase(['collectTestLogsSupport=1'], ['allTypesOfLogs.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`Collected 17 logs for test "All types of logs."`);
      expect(stdout).to.contain(`last log: cy:command,get\t.breaking-get [filter-out-string],error`);
    });
  }).timeout(60000);

  it('Should display correctly in console with multiple contexts.', async () => {
    await runTest(commandBase([], ['mochaContexts.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`\n      cy:command ${ICONS.error}  get\t.breaking-get 1\n`);
      expect(stdout).to.contain(`\n        cy:command ${ICONS.error}  get\t.breaking-get 2\n`);
      expect(stdout).to.contain(`\n          cy:command ${ICONS.error}  get\t.breaking-get 3\n`);
    });
  }).timeout(60000);

  it('Should filter and process late update logs correctly.', async () => {
    await runTest(commandBase(['filterKeepOnlyWarningAndError=1,processAllLogs=1'], ['lateCommandUpdate.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:command ${ICONS.error}  | get\t.breaking-get`);
      expect(stdout).to.contain(`cy:route ${ICONS.warning}  | (putComment) PUT https://example.cypress.io/comments/10`);
    });
  }).timeout(30000);

  it('Should not send logs outside of tests and it should not break cypress errors.', async () => {
    await runTest(commandBase([], ['errorsOutside.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`Cannot call \`cy.log()\` outside a running test.`);
      expect(stdout).to.not.contain(`TypeError: Cannot read property 'relativeFile' of undefined`);
    });
  }).timeout(30000);

  /*
   * ----------------
   * Extended mode. |
   * ----------------
   */

  it('Should generate proper log output files for after and before hooks when logging is on fail.', async () => {
    const outRoot = {};
    const testOutputs = {};
    outputCleanUpAndInitialization(testOutputs, outRoot);

    const specFiles = [
      'beforeLogs.spec.js',
      'afterLogs.spec.js',
      'allHooks.spec.js',
      'mochaContexts.spec.js',
    ];
    await runTest(commandBase(['generateOutput=1', 'enableExtendedCollector=1'], specFiles), (error, stdout, stderr) => {
      expectOutputFilesToBeCorrect(testOutputs, outRoot, specFiles, 'hooks.onFail');
    });
  }).timeout(90000);

  it('Should print all tests to output files when configured so.', async () => {
    const outRoot = {};
    const testOutputs = {};
    outputCleanUpAndInitialization(testOutputs, outRoot);

    const specFiles = [
      'beforeLogs.spec.js',
      'afterLogs.spec.js',
      'allHooks.spec.js',
      'mochaContexts.spec.js',
    ];
    await runTest(commandBase(['generateOutput=1', 'printLogsToFileAlways=1', 'enableExtendedCollector=1'], specFiles), (error, stdout, stderr) => {
      expectOutputFilesToBeCorrect(testOutputs, outRoot, specFiles, 'hooks.always');
    });
  }).timeout(90000);

  it('Should display logs from before all hooks if they fail.', async function () {
    this.retries(3);

    await runTest(commandBase(['enableExtendedCollector=1'], ['beforeLogs.spec.js']), (error, stdout, stderr) => {
      expect(clean(stdout)).to.contain(clean(`  before fails
    1) "before all" hook for "the test"
          cy:log ${ICONS.info}  some before command
      cy:command ${ICONS.error}  get\t.breaking.get



  before succeeds
    2) the test fails

          cy:log ${ICONS.info}  log
      cy:command ${ICONS.error}  get\t.breaking.get


  nested before fails
    ✓ not nested
    nested context
      3) "before all" hook for "the test nested"
            cy:log ${ICONS.info}  some before command in nested
        cy:command ${ICONS.error}  get\t.breaking.get`));
    });
  }).timeout(60000);

  it('Should display logs from before all hooks even if they passed, when configured so.', async function () {
    this.retries(3);

    await runTest(commandBase(['printSuccessfulHookLogs=1','enableExtendedCollector=1'], ['beforeLogs.spec.js']), (error, stdout, stderr) => {
      expect(clean(stdout)).to.contain(clean(`  before fails
    1) "before all" hook for "the test"
          cy:log ${ICONS.info}  some before command
      cy:command ${ICONS.error}  get\t.breaking.get



    [[ after all #1 ]]
          cy:log ${ICONS.info}  after


  before succeeds
    [[ before all #1 ]]
          cy:log ${ICONS.info}  some before command
          cy:log ${ICONS.info}  some other before command


    [[ before all #2 ]]
          cy:log ${ICONS.info}  some before command from second before hook


    2) the test fails

          cy:log ${ICONS.info}  log
      cy:command ${ICONS.error}  get\t.breaking.get


    [[ after all #1 ]]
          cy:log ${ICONS.info}  after before succeeds


  nested before fails
    [[ before all #1 ]]
          cy:log ${ICONS.info}  some before command not in nested


    ✓ not nested
    nested context
      3) "before all" hook for "the test nested"
            cy:log ${ICONS.info}  some before command in nested
        cy:command ${ICONS.error}  get\t.breaking.get



      [[ after all #1 ]]
            cy:log ${ICONS.info}  after nested


    [[ after all #1 ]]
          cy:log ${ICONS.info}  after not nested`));
    });
  }).timeout(60000);

  it('Should display logs from after all hooks if they fail.', async function() {
    this.retries(3);

    await runTest(commandBase(['enableExtendedCollector=1'], ['afterLogs.spec.js']), (error, stdout, stderr) => {
      expect(clean(stdout)).to.contain(clean(`1) "after all" hook for "the test 11"

          cy:log ✱  after log simple
      cy:command ✘  get\tafter simple`));

      expect(clean(stdout)).to.contain(clean(`nested after fails
    nested context
      ✓ the test 3
      2) "after all" hook for "the test 3"
      3) "after all" hook for "the test 3"
        cy:command ${ICONS.error}  get\tafter nested


          cy:log ${ICONS.info}  log after root
      cy:command ${ICONS.error}  get\tafter root`));
    });
  }).timeout(60000);

  it('Should display logs from after all hooks even if they passed, when configured so.', async function() {
    this.retries(3);

    await runTest(commandBase(['printSuccessfulHookLogs=1', 'enableExtendedCollector=1'], ['afterLogs.spec.js']), (error, stdout, stderr) => {
      expect(clean(stdout)).to.contain(clean(`  after succeeds
    ✓ the test 2
    ✓ the test 22
    ✓ the test 222

    [[ after all #1 ]]
          cy:log ${ICONS.info}  after 1


    [[ after all #2 ]]
          cy:log ${ICONS.info}  after 2


  nested after fails`));
    });
  }).timeout(60000);

  it('Should not error with extended collector when a top level suite is skipped', async function () {
    await runTest(commandBase(['enableExtendedCollector=1'], ['skipTopLevelSuite.spec.js']), (error, stdout, stderr) => {
      expect(clean(stdout)).to.contain(clean(`1 pending`))
    });
  }).timeout(60000);

  /*
   * -------------------
   * Cucumber support. |
   * ------------------
   */

  it('Should run happy flow with cucumber preprocessor.', async () => {
    await runTest(commandBase(['enableCucumber=1', 'printLogsToConsoleAlways=1'], ['cucumber/Happy.feature']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:command ${ICONS.success}  assert\texpected **0** to be below **2**`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  step\t**I open Happy page**`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  step\t**I can load comments**`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  step\t**I can post comment**`);
    });
  }).timeout(30000);

  it('Should generate proper nested log output files with cucumber preprocessor.', async () => {
    const specFiles = ['cucumber/Happy.feature'];
    await runTest(commandBase(['generateNestedOutput=1', 'enableCucumber=1', 'printLogsToFileAlways=1'], specFiles), (error, stdout) => {
      const specs = glob.sync('./output_nested_cucumber_spec/**/*', { nodir: true });
      specs.forEach(specFile => {
        const actualFile = specFile.replace('output_nested_cucumber_spec', 'output_nested');
        expect(fs.existsSync(actualFile), `Expected output file ${actualFile} to exist.`).to.be.true;
        expectOutFilesMatch(actualFile, specFile);
      });
    });
  }).timeout(90000);
});
