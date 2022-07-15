import { HTTP_METHODS } from '../../src/constants'
import { METHODS } from 'http'

const { expect } = require('chai')

describe('HTTP Methods', () => {
  it('Should match Node\'s supported methods', async () => {
    expect(HTTP_METHODS).to.deep.equal(METHODS)
  })
})
