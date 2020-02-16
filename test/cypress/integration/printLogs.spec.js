import {happyFlow} from './happyFlow';

describe('Print Logs', () => {
  /**
   * Covers:
   * - printing of cy.commands
   * - printing xhr with STUBBED
   * - printing of console warn and console error
   * - printing of cy.route in case of XMLHTTPREQUEST API
   */
  it('Print Logs', () => {
    happyFlow();
  });
});
