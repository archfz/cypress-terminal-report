import { HTTP_METHODS } from '../../src/constants'
import { METHODS } from 'node:http'

const { expect } = require('chai')

describe('HTTP Methods', () => {
  it('Should match Node\'s supported methods', async () => {
    expect(HTTP_METHODS).to.deep.equal(METHODS)
  })
})
