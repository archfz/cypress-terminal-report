import {exec, ExecException, spawn} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';

const {expect} = require('chai');

let commandPrefix = 'node ./node_modules/.bin/cypress';

if (process.platform === 'win32') {
  commandPrefix = 'npx cypress';
}

export const ICONS = (() => {
  if (process.platform !== 'win32' || process.env.CI || process.env.TERM === 'xterm-256color') {
    return {error: '✘', warning: '❖', success: '✔', info: '✱', route: '➟', debug: '⚈'};
  } else {
    return {error: 'x', warning: '!', success: '+', info: 'i', route: '~', debug: '%'};
  }
})();

export const PADDING = '                    ';

export const commandBase = (env: string[] = [], specs: string[] = [], component: boolean = false) =>
  `${commandPrefix} run --env "${env.join(',')}" --headless ${component ? '--component' : ''} --config video=false -s ${specs.map((s) => (component ? `cypress/component/${s}` : `cypress/integration/${s}`))}`;

let lastRunOutput = '';
let lastRunCommand = '';
export const logLastRun = () => {
  console.log(chalk.yellow('-- Cypress output start --\n\n'));
  console.log(lastRunOutput);
  console.log(chalk.yellow('-- Cypress output end --'));
  console.log(`Command: ${lastRunCommand}`);
  console.log(lastRunCommand);
};

const splitCommandForSpawn = (command: string) => {
  const mainCommand = command.split(' ')[0];
  const args = command.split(' ').map((arg) => arg.replace(/^"/, '').replace(/"$/, ''));
  args.shift();

  return {mainCommand, args};
};

export const runTest = async (
  command: string,
  callback: (error: ExecException | null, stdout: string, stderr: string) => void
) => {
  await new Promise((resolve) => {
    exec(
      command,
      {encoding: 'utf-8', env: {...process.env, NO_COLOR: '1'}},
      (error, stdout, stderr) => {
        if (stderr) {
          console.error(stderr);
        }

        let from = stdout.indexOf('Running:  ');
        let to = stdout.lastIndexOf('(Results)');
        if (from !== -1 && to !== -1) {
          stdout = stdout.slice(from, to);
        }

        lastRunOutput = stdout;
        lastRunCommand = command;
        // Normalize line endings for unix.
        const normalizedStdout = stdout.replace(/\r\n/g, '\n');
        callback(error, normalizedStdout, stderr);
        expect(normalizedStdout).to.not.contain("CypressError: `cy.task('ctrLogMessages')` failed");

        resolve(null);
      }
    );
  });
};

export const runTestColoredConsole = async (
  command: string,
  callback: (stdout: string) => void
) => {
  await new Promise((resolve) => {
    const {mainCommand, args} = splitCommandForSpawn(command);

    const child = spawn(mainCommand, args, {
      env: {...process.env, FORCE_COLOR: '1'},
      shell: process.platform == 'win32',
    });

    let allData: string = '';
    const dataCallback = (data: Buffer) => {
      allData += data.toString();
    };

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', dataCallback);
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', dataCallback);

    child.on('close', () => {
      callback(allData.split('Running:  ')[1]);
      resolve(null);
    });
  });
};

export const runTestContinuous = async (
  command: string,
  afterOutput: string,
  callback: (data: string, startTime: number) => void
) => {
  await new Promise((resolve) => {
    const {mainCommand, args} = splitCommandForSpawn(command);

    const child = spawn(mainCommand, args, {
      env: {...process.env, NO_COLOR: '1'},
      shell: process.platform == 'win32',
    });

    let allData: string = '';
    let startTime: number;
    const dataCallback = (data: Buffer) => {
      if (data.toString().includes(afterOutput)) {
        startTime = new Date().getTime();
      }

      if (startTime) {
        allData += data.toString();
        callback(allData, (new Date().getTime() - startTime) / 1000);
      }
    };

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', dataCallback);
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', dataCallback);

    child.on('close', resolve);
  });
};

export const outputCleanUpAndInitialization = () => {
  const outRoot = path.join(__dirname, 'output');
  const outFiles = ['out.txt', 'out.json', 'out.html', 'out.cst'];
  outFiles.forEach((outFile) => {
    const outFilepath = path.join(outRoot, outFile);
    if (fs.existsSync(outFilepath)) {
      fs.unlinkSync(outFilepath);
    }
  });
  return {outRoot, outFiles};
};

const osSpecificEol = (str: string) =>
  // Change line endings to win32 if needed
  os.EOL === '\r\n' ? str.replace(/\n/g, '\r\n') : str;

export const clean = (str: string, removeSlow: boolean = false) =>
  // Clean error trace as it changes from test to test.
  str
    .replace(/at [^(]+ \([^)]+\)/g, '')
    // Clean new line of white space at the end.
    .replace(/\s+$/, '')
    // Clean slow test.
    .replace(/ \([\d.]+ ?m?s\)/g, removeSlow ? '' : ' (X ms)')
    // Normalize line endings across os.
    .replace(/\r\n/g, '\n');

export const expectOutFilesMatch = (outputPath: string, specPath: string) => {
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
};

export const expectOutputFilesToBeCorrect = (
  outFiles: string[],
  outRoot: string,
  specExtName: string
) => {
  outFiles.forEach((outFile) => {
    expectOutFilesMatch(
      path.join(outRoot, outFile),
      path.join(outRoot, outFile.replace(/\.([a-z]+)$/, '.spec.' + specExtName + '.$1'))
    );
  });
};

export const expectConsoleLogForOutput = (
  stdout: string,
  outRoot: string,
  fileNames: string[] = [''],
  toNot: boolean = false
) => {
  fileNames.forEach((fileName) => {
    let ext = path.extname(fileName).substring(1);
    if (!['json', 'txt', 'html'].includes(ext)) {
      ext = 'custom';
    }
    let logString =
      'cypress-terminal-report: Wrote ' + ext + ' logs to ' + path.join(outRoot, fileName);

    if (toNot) {
      expect(stdout).to.not.contain(logString);
    } else {
      expect(stdout).to.contain(logString);
    }
  });
};
