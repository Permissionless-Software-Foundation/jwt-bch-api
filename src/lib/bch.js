/*
  A library for controlling the sending of BCH.
*/

'use strict'

// Create a Promise queue.
// const { default: PQueue } = require('p-queue')
// const queue = new PQueue({
//   concurrency: 1
// })

// Retry promises
const pRetry = require('p-retry')

const config = require('../../config')

let walletInfo
// Use hardcoded wallet for tests.
if (config.env === 'test') {
  walletInfo = {
    network: 'mainnet',
    mnemonic:
      'reopen nuclear cloud resist video parrot dose flavor step lucky account muffin',
    derivation: 245,
    rootAddress: 'bitcoincash:qr9pnzql9ddh3lt3xcyefss0e7x70pr3ngzms6dun7',
    balance: 0,
    nextAddress: 1,
    hasBalance: []
  }
} else {
  // Open wallet file for development or production.
  walletInfo = require(`${__dirname.toString()}/../../config/wallet.json`)
}

// Instantiate the bch-js library.
const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

let _this

class BCH {
  constructor () {
    this.bchjs = bchjs

    this.TIMEOUT = 1000 // timeout between intervals when retrying transactions.

    _this = this
  }

  // Retrieve the balance for a given address from an indexer.
  // Current indexer used: Blockbook
  // Returns value in satoshis.
  async getBalance (addr) {
    try {
      // Convert to a cash address.
      const bchAddr = this.bchjs.Address.toCashAddress(addr)
      // console.log(`bchAddr: ${bchAddr}`)

      // Get balance for address from Blockbook
      // const addrInfo = await this.bchjs.Blockbook.balance(bchAddr)
      const fulcrumBalance = await _this.bchjs.Electrumx.balance(bchAddr)
      // console.log(`addrInfo: ${JSON.stringify(addrInfo, null, 2)}`)

      // Calculate the spot-balance
      // const balance =
      //   Number(addrInfo.balance) + Number(addrInfo.unconfirmedBalance)
      const balance =
        fulcrumBalance.balance.confirmed + fulcrumBalance.balance.unconfirmed
      // console.log(`balance: ${JSON.stringify(balance, null, 2)}`)

      return balance
    } catch (err) {
      console.error('Error in bch.js/getBalance()')
      throw err
    }
  }

  // Retrieve the utxos for a given address from an indexer.
  // Current indexer used: Blockbook
  async getUtxos (addr) {
    try {
      // Convert to a cash address.
      const bchAddr = this.bchjs.Address.toCashAddress(addr)
      // console.log(`bchAddr: ${bchAddr}`)

      // Get balance for address from Blockbook
      // const utxos = await this.bchjs.Blockbook.utxo(bchAddr)
      const utxos = await this.bchjs.Electrumx.utxo(bchAddr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      return utxos.utxos
    } catch (err) {
      console.error('Error in bch.js/getUtxos()')
      throw err
    }
  }

  // Generate a change address from a Mnemonic of a private key.
  async changeAddrFromMnemonic (index) {
    try {
      // console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)

      if (!walletInfo.derivation) {
        throw new Error('walletInfo must have integer derivation value.')
      }
      // console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)

      // console.log(`index: ${index}`)
      if (!index && index !== 0) {
        throw new Error('index must be a non-negative integer.')
      }

      // root seed buffer
      const rootSeed = await this.bchjs.Mnemonic.toSeed(walletInfo.mnemonic)

      // master HDNode
      const masterHDNode = this.bchjs.HDNode.fromSeed(rootSeed)

      // HDNode of BIP44 account
      // console.log(`derivation path: m/44'/${walletInfo.derivation}'/0'`)
      const account = this.bchjs.HDNode.derivePath(
        masterHDNode,
        `m/44'/${walletInfo.derivation}'/0'`
      )

      // derive the first external change address HDNode which is going to spend utxo
      const change = this.bchjs.HDNode.derivePath(account, `0/${index}`)

      return change
    } catch (err) {
      console.log('Error in bch.js/changeAddrFromMnemonic()')
      throw err
    }
  }

  // Call the full node to validate that UTXO has not been spent.
  // Returns true if UTXO is unspent.
  // Returns false if UTXO is spent.
  async isValidUtxo (utxo) {
    try {
      // Input validation.
      if (!utxo.tx_hash) throw new Error('utxo does not have a tx_hash property')
      if (!utxo.tx_pos && utxo.tx_pos !== 0) {
        throw new Error('utxo does not have a tx_pos property')
      }

      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

      const txout = await this.bchjs.Blockchain.getTxOut(utxo.tx_hash, utxo.tx_pos)
      // console.log(`txout: ${JSON.stringify(txout, null, 2)}`)

      if (txout === null) return false
      return true
    } catch (err) {
      console.error('Error in bch.js/validateUtxo()')
      throw err
    }
  }

  // Sends all funds from fromAddr to toAddr.
  // Throws an address if the address at hdIndex does not match fromAddr.
  async sendAllAddr (fromAddr, hdIndex, toAddr) {
    try {
      const utxos = await this.getUtxos(fromAddr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      if (!Array.isArray(utxos)) throw new Error('utxos must be an array.')

      if (utxos.length === 0) throw new Error('No utxos found.')

      // instance of transaction builder
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      let originalAmount = 0

      // Calulate the original amount in the wallet and add all UTXOs to the
      // transaction builder.
      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        originalAmount = originalAmount + utxo.value

        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      }

      if (originalAmount < 1) {
        throw new Error('Original amount is zero. No BCH to send.')
      }

      // original amount of satoshis in vin
      // console.log(`originalAmount: ${originalAmount}`)

      // get byte count to calculate fee. paying 1 sat/byte
      const byteCount = this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: utxos.length },
        { P2PKH: 1 }
      )
      const fee = Math.ceil(1.1 * byteCount)
      // console.log(`fee: ${byteCount}`)

      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      const sendAmount = originalAmount - fee
      // console.log(`sendAmount: ${sendAmount}`)

      // add output w/ address and amount to send
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(toAddr),
        sendAmount
      )

      let redeemScript

      // Loop through each input and sign
      for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i]

        // Validte the UTXO before trying to spend it.
        const isValid = await this.isValidUtxo(utxo)
        if (!isValid) {
          throw new Error(
            'Invalid UTXO detected. Wait for indexer to catch up.'
          )
        }

        // Generate a keypair for the current address.
        const change = await this.changeAddrFromMnemonic(hdIndex)
        const keyPair = this.bchjs.HDNode.toKeyPair(change)

        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      }

      // build tx
      const tx = transactionBuilder.build()

      // output rawhex
      const hex = tx.toHex()
      // console.log(`Transaction raw hex: ${hex}`)

      return hex
    } catch (err) {
      console.error('Error in bch.js/sendAllAddr()')
      throw err
    }
  }

  // Broadcasts the transaction to the BCH network.
  // Expects a hex-encoded transaction generated by sendBCH(). Returns a TXID
  // or throws an error.
  async broadcastTx (hex) {
    try {
      const txid = await this.bchjs.RawTransactions.sendRawTransaction([hex])

      return txid
    } catch (err) {
      console.log('Error in bchjs.js/broadcastTx()')
      throw err
    }
  }

  // Generates and broadcasts a transaction to sweep funds from a users wallet.
  async generateTransaction (hdIndex) {
    console.log(`generating transaction for index ${hdIndex}`)
    try {
      // Generate the public address from the hdIndex.
      const change = await _this.changeAddrFromMnemonic(hdIndex)
      const addr = _this.bchjs.HDNode.toCashAddress(change)
      console.log(`addr: ${JSON.stringify(addr, null, 2)}`)

      // Generate the hex for the transaction.
      const hex = await _this.sendAllAddr(addr, hdIndex, config.companyAddr)

      // Broadcast the transaction
      // return hex
      const txid = await this.broadcastTx(hex)

      return txid
    } catch (err) {
      // If the error is anything other than 'no utxos found', then add
      // the transaction back into the queue to try again later.
      if (
        err.message.indexOf('No utxos found') > -1 ||
        err.message.indexOf('Invalid UTXO detected') > -1
      ) {
        throw new pRetry.AbortError('No utxos found.')
      }

      console.error(`Error in generateTransaction: ${err.message}`)
      throw err
    }
  }

  // Adds an HD index value to the queue.
  // The queue will sweep all funds from an address of the apps HD wallet, using
  // the hdIndex, and send those funds to the company wallet.
  // If the transaction fails, it will be retried until it succeeds.
  async queueTransaction (hdIndex) {
    // console.log(`hdIndex: ${hdIndex}`)
    try {
      // Wrap the call to generateTransaction into an async function.
      const run = async () => _this.generateTransaction(hdIndex)

      // Generate a transaction and try 5 times on failure.
      const txid = await pRetry(run, {
        onFailedAttempt: async error => {
          // Log failed attempt.
          console.log(
            `Attempt ${
              error.attemptNumber
            } to sweep HD index ${hdIndex} failed. There are ${
              error.retriesLeft
            } retries left. Waiting ${this.TIMEOUT} milliseconds.`
          )
          this.sleep(this.TIMEOUT)
        },
        retries: 5
      })

      return txid
    } catch (err) {
      console.error('Error in bch.js/queueTransaction()')
      // console.log(`err.message: ${err.message}`)
      throw err
    }
  }

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = BCH
