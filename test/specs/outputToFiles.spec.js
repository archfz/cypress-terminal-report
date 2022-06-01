import {
  runTest,
  commandBase,
  expectConsoleLogForOutput,
  expectOutputFilesToBeCorrect,
  expectOutFilesMatch,
  outputCleanUpAndInitialization, logLastRun,
} from "../utils";

const {expect} = require('chai');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const glob = require('glob');

describe('Output to files.', () => {

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      logLastRun();
    }
  });


  // Tests in general the log formatting in files.
  it('Should generate proper log output files, and print only failing ones if config is on default.', async () => {
    const outRoot = {};
    const testOutputs = {};
    outputCleanUpAndInitialization(testOutputs, outRoot);

    if (fs.existsSync(path.join(outRoot.value, 'not'))) {
      fsExtra.removeSync(path.join(outRoot.value, 'not'));
    }

    const specFiles = [
      'happyFlow.spec.js',
      'mochaContexts.spec.js',
      'requests.spec.js',
      'printLogsSuccess.spec.js',
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
      'happyFlow.spec.js',
      'mochaContexts.spec.js',
      'printLogsSuccess.spec.js',
      'requests.spec.js',
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

  it('Should generate proper nested log output files.', async () => {
    const specFiles = [
      'requests.spec.js', 
      'happyFlow.spec.js', 
      'printLogsSuccess.spec.js', 
      'multiple.dots.in.spec.js', 
      'callsSuiteInAnotherFile.spec.js'
    ];
    await runTest(commandBase(['generateNestedOutput=1'], specFiles), (error, stdout) => {
      const specs = glob.sync('./output_nested_spec/**/*', {nodir: true});
      specs.forEach(specFile => {
        const actualFile = specFile.replace('output_nested_spec', 'output_nested');
        expect(fs.existsSync(actualFile), `Expected output file ${actualFile} to exist.`).to.be.true;
        expectOutFilesMatch(actualFile, specFile);
      });

      const shouldNotExist = glob.sync('./output_nested/**/suiteInOtherFile*', {nodir: true});
      expect(shouldNotExist, `Expect no output file for suiteInOtherFile to exist.`).to.have.length(0);
    });
  }).timeout(90000);

  it('Should generate output only for failing tests if set to onFail.', async () => {
    const outRoot = {value: path.join(__dirname, '../output')};
    const testOutputs = {value: ["out.txt"]};

    const specFiles = ['printLogsOnFail.spec.js'];
    await runTest(commandBase(['generateSimpleOutput=1'], specFiles), (error, stdout, stderr) => {
      expectOutputFilesToBeCorrect(testOutputs, outRoot, specFiles, 'onFailCheck');
      expectConsoleLogForOutput(stdout, outRoot, testOutputs.value);
    });
  }).timeout(90000);

  it('Should still output to files when fail fast is installed and log to files on after run enabled.', async () => {
    const outRoot = {};
    const testOutputs = {};
    outputCleanUpAndInitialization(testOutputs, outRoot);

    const specFiles = ['requests.spec.js'];
    await runTest(commandBase(['failFast=1', 'generateOutput=1', 'logToFilesOnAfterRun=1'], specFiles), (error, stdout, stderr) => {
      expectOutputFilesToBeCorrect(testOutputs, outRoot, specFiles, 'failFast');
    });
  }).timeout(90000);

});
