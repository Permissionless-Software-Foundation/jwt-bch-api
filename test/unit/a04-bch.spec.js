// const testUtils = require('../utils')
// const rp = require('request-promise')
const assert = require('chai').assert
// const config = require('../../config')
const sinon = require('sinon')

// Retry promises
const pRetry = require('p-retry')

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

    // describe('#generateTransaction', () => {
    //   it('should', async () => {
    //     const index = 4
    //
    //     const result = await bch.generateTransaction(index)
    //     console.log(`result: ${JSON.stringify(result, null, 2)}`)
    //   })
    // })

    describe('#queueTransaction', () => {
      it('should throw an error if no UTXO is found', async () => {
        // Stub out the generateTransaction() function.
        sandbox.stub(bch, 'generateTransaction').throws(new pRetry.AbortError(`No utxos found.`))
        try {
          const index = 4

          await bch.queueTransaction(index)
        } catch (err) {
          // console.log(`err: `, err)
          assert.equal(err.message, `No utxos found.`)
        }
      })

      it('should return txid on successful broadcast', async () => {
        // stub out generateTransaction()
        const txid = '0f333b474ecab740e78bd6ab1160c790a0fd935727d22c35e8da67e71733911d'
        sandbox.stub(bch, 'generateTransaction').resolves(txid)

        const index = 5

        const result = await bch.queueTransaction(index)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.equal(result, txid)
      })

      it('it should retry a transaction', async () => {
        // stub out generateTransaction()
        const txid = '0f333b474ecab740e78bd6ab1160c790a0fd935727d22c35e8da67e71733911d'
        sandbox.stub(bch, 'generateTransaction')
          .onFirstCall().throws(new Error('some random error'))
          .onSecondCall().resolves(txid)

        const index = 5

        const result = await bch.queueTransaction(index)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.equal(result, txid)
      })
    })
  })
})
