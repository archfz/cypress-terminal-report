/// <reference types="cypress" />

describe('Output compact logs', ()=>{
  // create logs to check that using outputCompactLogs overrides compactLogs for output file
  it('Output compact logs', ()=>{
    for (let i = 0; i <20 ; i++) {
        expect(1).to.equal(1)
      }

    expect(1).to.equal(0)
  })
})