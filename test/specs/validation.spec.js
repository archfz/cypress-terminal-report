import {
  runTest,
  commandBase, logLastRun,
} from "../utils";
import { expect } from 'chai'

describe('Validation.', () => {

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      logLastRun();
    }
  });

  it('Should print proper validation error on invalid plugin install options.', async () => {
    await runTest(commandBase(['pluginBadConfig=1'], ['happyFlow.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(` => printLogsToConsole: Expected one of \`"onFail","always","never"\`, but received: true
 => printLogsToFile: Expected one of \`"onFail","always","never"\`, but received: true
 => compactLogs: Expected a number, but received: false
 => outputRoot: Expected a string, but received: 0
 => outputTarget.any: Expected the value to satisfy a union of \`string | func\`, but received: 100
 => outputTarget.any: Expected a string, but received: 100
 => outputTarget.any: Expected a function, but received: 100
 => collectTestLogs: Expected a function, but received: ""
 => outputVerbose: Expected a value of type \`boolean\`, but received: \`"false"\`
 => shouldNotBeHere: Expected a value of type \`never\`, but received: \`""\``);
    });
  }).timeout(60000);

  it('Should not fail with proper config.', async () => {
    await runTest(commandBase(['supportGoodConfig=1'], ['happyFlow.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.not.contain(`cypress-terminal-report: Invalid plugin install options:`);
    });
  }).timeout(60000);

  it('Should print proper validation error on invalid support install options.', async () => {
    await runTest(commandBase(['supportBadConfig=1'], ['happyFlow.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(` => collectTypes: Expected an array value, but received: 0
 => filterLog: Expected a function, but received: "string"
 => processLog: Expected a function, but received: true
 => collectTestLogs: Expected a function, but received: "string"
 => xhr.printHeaderData: Expected a value of type \`boolean\`, but received: \`""\`
 => xhr.printRequestData: Expected a value of type \`boolean\`, but received: \`""\`
 => xhr.shouldNotBeHere: Expected a value of type \`never\`, but received: \`""\`
 => shouldNotBeHere: Expected a value of type \`never\`, but received: \`""\``);
    });
  }).timeout(60000);

});
