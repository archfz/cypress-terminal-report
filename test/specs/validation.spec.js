import {
  runTest,
  commandBase, logLastRun,
} from "../utils";

const {expect} = require('chai');

describe('Validation.', () => {

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      logLastRun();
    }
  });

  it('Should print proper validation error on invalid plugin install options.', async () => {
    await runTest(commandBase(['pluginBadConfig=1'], ['happyFlow.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`Error: cypress-terminal-report: Invalid plugin install options:`);
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
      expect(stdout).to.contain(`cypress-terminal-report: Invalid plugin install options:`);
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

});
