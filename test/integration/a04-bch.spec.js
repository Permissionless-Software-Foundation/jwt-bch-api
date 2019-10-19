/*
  Integration tests for the bch.js library.
*/

// const testUtils = require('../utils')
// const rp = require('request-promise')
const assert = require('chai').assert
const config = require('../../config')
// const sinon = require('sinon')

const BCH = require('../../src/lib/bch')
const bch = new BCH()

describe('bch.js', () => {
  describe('#getBalance', () => {
    it('should get a balance for a cash address', async () => {
      const addr = 'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'

      const result = await bch.getBalance(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isAbove(result, 1)
    })
  })

  describe('#getUtxos', () => {
    it('should get utxos for a cash address', async () => {
      const addr = 'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'

      const result = await bch.getUtxos(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.property(result[0], 'txid')
      assert.property(result[0], 'vout')
      assert.property(result[0], 'satoshis')
    })
  })
})
