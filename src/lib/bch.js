/*
  A library for controlling the sending of BCH.
*/

'use strict'

const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

let _this

class BCH {
  constructor () {
    this.bchjs = bchjs

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
      const addrInfo = await this.bchjs.Blockbook.balance(bchAddr)
      // console.log(`addrInfo: ${JSON.stringify(addrInfo, null, 2)}`)

      // Calculate the spot-balance
      const balance = Number(addrInfo.balance) + Number(addrInfo.unconfirmedBalance)
      // console.log(`balance: ${JSON.stringify(balance, null, 2)}`)

      return balance
    } catch (err) {
      console.error(`Error in bch.js/getBalance()`)
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
      const utxos = await this.bchjs.Blockbook.utxo(bchAddr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      return utxos
    } catch (err) {
      console.error(`Error in bch.js/getUtxos()`)
      throw err
    }
  }

  // Sends all funds from fromAddr to toAddr.
  // Throws an address if the address at hdIndex does not match fromAddr.
  async sendAllAddr (fromAddr, hdIndex, toAddr) {
    try {

    } catch (err) {
      console.error(`Error in bch.js/sendAllAddr()`)
      throw err
    }
  }
}

module.exports = BCH
