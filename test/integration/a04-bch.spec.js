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

  describe('#isValidUtxo', () => {
    it('should return true for a valid UTXO', async () => {
      const utxo = {
        txid:
          '7774e449c5a3065144cefbc4c0c21e6b69c987f095856778ef9f45ddd8ae1a41',
        vout: 0,
        value: '1000',
        height: 604392,
        confirmations: 877,
        satoshis: 1000
      }

      const result = await bch.isValidUtxo(utxo)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, true)
    })
  })

  describe('#sendAllAddr', () => {
    it('should generate hex transaction for address with balance', async () => {
      const fromAddr = 'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf'
      const index = 0
      const toAddr = 'bitcoincash:qr9pnzql9ddh3lt3xcyefss0e7x70pr3ngzms6dun7'

      const result = await bch.sendAllAddr(fromAddr, index, toAddr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
      assert.isAbove(result.indexOf('02000'), -1)
    })
  })
})
