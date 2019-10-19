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
  async getBalance (addr) {
    try {
      // Convert to a cash address.
      const bchAddr = this.bchjs.Address.toCashAddress(addr)

      // Get balance for address from Blockbook
      const balance = this.bchjs.Blockbook.balance(bchAddr)

      return balance
    } catch (err) {
      console.error(`Error in bch.js/getBalance()`)
      throw err
    }
  }
}

module.exports = BCH
