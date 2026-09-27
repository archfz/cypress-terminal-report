import './commands';
import {mount} from 'cypress/react';
const getCypressEnv = require('./getCypressEnv');

Cypress.Commands.add('mount', mount);

const config = {};
const env = getCypressEnv();

if (env.enableContinuousLogging == '1') {
  config.enableContinuousLogging = true;
}

require('../../../src/installLogsCollector.js')(config);
