import {callSuite} from './suiteInOtherFile'

describe('Calls function in another file that creates a sub-suite.', () => {
  it('the test 1', () => {
    cy.log('log test 1');
    expect(1).to.equal(1);
  });
  it('the test 2', () => {
    cy.log('log test 2');
    expect(1).to.equal(2);
  });

  callSuite()
});
