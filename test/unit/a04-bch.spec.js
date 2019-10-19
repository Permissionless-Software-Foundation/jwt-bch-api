// const testUtils = require('../utils')
// const rp = require('request-promise')
const assert = require('chai').assert
// const config = require('../../config')
const sinon = require('sinon')

const BCH = require('../../src/lib/bch')
const bch = new BCH()

describe('Users', () => {
  let sandbox

  before(async () => {
    // console.log(`config: ${JSON.stringify(config, null, 2)}`)

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#bch.js', () => {
    describe('#changeAddrFromMnemonic', () => {
      it('should get a change address', async () => {
        const index = 4

        const change = await bch.changeAddrFromMnemonic(index)
        // console.log(`change: ${JSON.stringify(change, null, 2)}`)

        assert.property(change, 'keyPair')
      })
    })
  })
})
