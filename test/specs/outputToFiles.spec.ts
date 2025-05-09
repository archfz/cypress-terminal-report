import {
  runTest,
  commandBase,
  expectConsoleLogForOutput,
  expectOutputFilesToBeCorrect,
  expectOutFilesMatch,
  outputCleanUpAndInitialization,
  logLastRun,
} from '../utils';
import {expect} from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as fsExtra from 'fs-extra';

describe('Output to files.', () => {
  afterEach(function () {
    if (this.currentTest?.state == 'failed') {
      logLastRun();
    }
  });

  // Tests in general the log formatting in files.
  it('Should generate proper log output files, and print only failing ones if config is on default. [backward-compatibility-skip]', async function () {
    this.retries(2);

    const {outRoot, outFiles} = outputCleanUpAndInitialization();

    const not = path.join(outRoot, 'not');
    if (fs.existsSync(not)) {
      fsExtra.removeSync(not);
    }

    const specFiles = [
      'happyFlow.spec.js',
      'mochaContexts.spec.js',
      'requests.spec.js',
      'printLogsSuccess.spec.js',
    ];
    await runTest(commandBase(['generateOutput=1'], specFiles), (error, stdout, stderr) => {
      expectOutputFilesToBeCorrect(outFiles, outRoot, 'onFail');
      outFiles.push(path.join('not', 'existing', 'path', 'out.txt'));
      expectConsoleLogForOutput(stdout, outRoot, outFiles);
    });
  }).timeout(90000);

  it('Should print all tests to output files when configured so. [backward-compatibility-skip]', async () => {
    const {outRoot, outFiles} = outputCleanUpAndInitialization();

    const specFiles = [
      'happyFlow.spec.js',
      'mochaContexts.spec.js',
      'printLogsSuccess.spec.js',
      'requests.spec.js',
    ];
    await runTest(
      commandBase(['generateOutput=1', 'printLogsToFileAlways=1'], specFiles),
      (error, stdout, stderr) => {
        expectOutputFilesToBeCorrect(outFiles, outRoot, 'always');
        expectConsoleLogForOutput(stdout, outRoot, outFiles);
      }
    );
  }).timeout(90000);

  it('Should not generate and print to output files when configured so.', async () => {
    const {outRoot, outFiles} = outputCleanUpAndInitialization();

    const specFiles = ['requests.spec.js', 'happyFlow.spec.js', 'printLogsSuccess.spec.js'];
    await runTest(
      commandBase(['generateOutput=1', 'printLogsToFileNever=1'], specFiles),
      (error, stdout, stderr) => {
        outFiles.forEach((out) => {
          expect(fs.existsSync(path.join(outRoot, out))).false;
        });
        expectConsoleLogForOutput(stdout, outRoot, outFiles, true);
      }
    );
  }).timeout(90000);

  it('Should generate proper nested log output files. [backward-compatibility-skip]', async () => {
    const specFiles = [
      'requests.spec.js',
      'happyFlow.spec.js',
      'printLogsSuccess.spec.js',
      'multiple.dots.in.spec.js',
      'callsSuiteInAnotherFile.spec.js',
    ];
    await runTest(commandBase(['generateNestedOutput=1'], specFiles), (error, stdout) => {
      const specs = glob.sync('./output_nested_spec/**/*', {nodir: true});
      specs.forEach((specFile) => {
        const actualFile = specFile.replace('output_nested_spec', 'output_nested');
        expect(fs.existsSync(actualFile), `Expected output file ${actualFile} to exist.`).to.be
          .true;
        expectOutFilesMatch(actualFile, specFile);
      });

      const shouldNotExist = glob.sync('./output_nested/**/suiteInOtherFile*', {nodir: true});
      expect(shouldNotExist, `Expect no output file for suiteInOtherFile to exist.`).to.have.length(
        0
      );
    });
  }).timeout(90000);

  it('Should generate output only for failing tests if set to onFail.', async () => {
    const outRoot = path.join(__dirname, '../output');
    const outFiles = ['out.txt'];

    const specFiles = ['printLogsOnFail.spec.js'];
    await runTest(commandBase(['generateSimpleOutput=1'], specFiles), (error, stdout, stderr) => {
      expectOutputFilesToBeCorrect(outFiles, outRoot, 'onFailCheck');
      expectConsoleLogForOutput(stdout, outRoot, outFiles);
    });
  }).timeout(90000);

  it('Should still output to files when fail fast is installed and log to files on after run enabled.', async () => {
    const {outRoot, outFiles} = outputCleanUpAndInitialization();

    const specFiles = ['requests.spec.js'];
    await runTest(
      commandBase(['failFast=1', 'generateOutput=1', 'logToFilesOnAfterRun=1'], specFiles),
      (error, stdout, stderr) => {
        expectOutputFilesToBeCorrect(outFiles, outRoot, 'failFast');
      }
    );
  }).timeout(90000);

  it('Should generate correct output with extended collector and additional logging pass.', async () => {
    const {outRoot, outFiles} = outputCleanUpAndInitialization();

    const specFiles = ['allHooks.spec.js'];
    await runTest(
      commandBase(
        [
          'enableExtendedCollector=1',
          'generateOutput=1',
          'printLogsToFileAlways=1',
          'logToFilesOnAfterRun=1',
          'globalAfter=1',
        ],
        specFiles
      ),
      (error, stdout, stderr) => {
        expectOutputFilesToBeCorrect(outFiles, outRoot, 'globalAfter');
      }
    );
  }).timeout(90000);
});
