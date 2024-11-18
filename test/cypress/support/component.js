import './commands';
import {mount} from 'cypress/react';

Cypress.Commands.add('mount', mount);

const config = {};
const env = Cypress.env();

if (env.enableContinuousLogging == '1') {
  config.enableContinuousLogging = true;
}

require('../../../src/installLogsCollector.js')(config);
