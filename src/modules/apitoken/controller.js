const User = require('../../models/users')
const apiTokenLib = require('../../lib/api-token')
const config = require('../../../config')
const jwt = require('jsonwebtoken')

const wlogger = require('../../lib/wlogger')

// Business logic library for dealing with BCH.
const BCH = require('../../lib/bch')
const bch = new BCH()

const BCHJS = require('@chris.troutner/bch-js')

// This app is intended to run on the same machine as the mainnet bch-api REST API.
const bchjs = new BCHJS({ restURL: `http://localhost:3000/v3/` })

let _this

class ApiTokenController {
  constructor () {
    this.bchjs = bchjs
    this.bch = bch

    _this = this
  }

  /**
   * @api {get} /apitoken/:id Get BCH payment address for user by user id
   * @apiPermission public
   * @apiName GetBchAddr
   * @apiGroup API Token
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:5001/apitoken/56bd1da600a526986cf65c80
   *
   * @apiSuccess {Object}   bchAddr         String
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "bchAddr": "bitcoincash:qr9pnzql9ddh3lt3xcyefss0e7x70pr3ngzms6dun7"
   *     }
   */
  //
  // Given a user GUID, return the BCH payment address for that user.
  async getBchAddr (ctx, next) {
    try {
      // Get user data
      const user = await User.findById(ctx.params.id, '-password')
      if (!user) {
        ctx.throw(404)
      }
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)

      // Return the BCH address
      ctx.body = {
        bchAddr: user.bchAddr
      }
    } catch (err) {
      if (err === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      console.log(`Error in apitoken/controller.js/getBchAddr()`, err)
      ctx.throw(500)
    }

    if (next) {
      return next()
    }
  }

  // Request a new API JWT token.
  async newToken (ctx, next) {
    try {
      // console.log(`ctx.request.body: ${JSON.stringify(ctx.request.body, null, 2)}`)
      const newApiLevel = ctx.request.body.apiLevel

      // Throw error if apiLevel is not included.
      if ((newApiLevel !== 0 && !newApiLevel) || isNaN(newApiLevel)) {
        ctx.throw(422, 'apiLevel must be an integer number')
      }

      // Get user data
      const user = ctx.state.user
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)
      // console.log(`old credit: ${user.credit}`)

      // If the user already has a JWT token, calculate a refund for the time
      // they've paid for.
      if (user.apiToken) {
        const refund = _this._calculateRefund(user)

        // console.log(`refund: ${refund}`)

        user.credit += refund
      }

      // Check against balance.
      if (user.credit < newApiLevel) ctx.throw(402, 'Not enough credit')

      // Generate new JWT token.
      const token = apiTokenLib.generateToken(user)

      // Update the user model in the DB with the new token.
      user.apiToken = token

      // Deduct credit
      user.credit = user.credit - newApiLevel

      // Set the new API level
      user.apiLevel = newApiLevel

      // Update the user data in the DB.
      try {
        await user.save()
      } catch (err) {
        ctx.throw(422, err.message)
      }

      // Return the BCH address
      ctx.body = {
        apiToken: token,
        apiLevel: newApiLevel
      }
    } catch (err) {
      if (err.status) ctx.throw(err.status, err.message)

      console.log(`Error in apitoken/controller.js/newToken()`, err)
      ctx.throw(500)
    }

    if (next) {
      return next()
    }
  }

  // Calculates the refund, to be credited before generating a new JWT token.
  _calculateRefund (user) {
    try {
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)
      const oldApiLevel = user.apiLevel

      const decoded = jwt.decode(user.apiToken)
      // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

      const exp = decoded.exp
      let now = new Date()
      now = now / 1000

      let diff = exp - now
      diff = diff * 1000 // Convert back to JS Date.
      diff = diff / (1000 * 60 * 60 * 24) // Convert to days.
      // console.log(`Time left: ${diff} days`)

      let refund = diff / 30 * oldApiLevel

      if (refund < 0) refund = 0

      wlogger.info(`refunding ${refund} dollars`)

      return refund
    } catch (err) {
      console.error(`Error in apiToken controller.js/_calculateRefund()`)
      throw err
    }
  }

  // Expects an API JWT token as input and returns true or false if it's valid.
  async isValid (ctx, next) {
    // false by default.
    let outObj = {
      isValid: false,
      apiLevel: 0
    }

    try {
      const token = ctx.params.jwt
      // console.log(`token: ${token}`)

      // Validate the JWT token.
      const decoded = jwt.verify(token, config.token)
      // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

      // Get user data
      const user = await User.findById(decoded.id, '-password')
      if (!user) {
        ctx.throw(404)
      }
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)

      // If the provided JWT does match what's in the user model, then the
      // provided JWT has been replaced and is no longer valid.
      if (user.apiToken !== token) {
        ctx.body = outObj
        return
      }

      // If an error was not thrown, then the token is valid.
      outObj.isValid = true
      outObj.apiLevel = user.apiLevel

      console.log(`valid: true, apiLevel: ${outObj.apiLevel}, JWT: ${token.slice(-6)}, user: ${user.username}`)

      ctx.body = outObj
    } catch (err) {
      console.error(`Error in apitoken/isValid(). Returning false.`)
      // If any error is thrown, return false, indicating the JWT token is invalid.
      ctx.body = outObj
    }

    if (next) {
      return next()
    }
  }

  async updateCredit (ctx, next) {
    try {
      // Get user data
      const user = await User.findById(ctx.params.id, '-password')
      if (!user) {
        ctx.throw(404)
      }
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)

      // Get the BCH balance of the users BCH address.
      const balance = await _this.bchjs.Blockbook.balance(user.bchAddr)
      // console.log(`balance: ${JSON.stringify(balance, null, 2)}`)

      let totalBalance =
        Number(balance.balance) + Number(balance.unconfirmedBalance)

      // Return existing credit if totalBalance is zero.
      if (totalBalance === 0) {
        ctx.body = user.credit
        return
      }

      // Convert the balance from satoshis to BCH
      totalBalance = _this.bchjs.BitcoinCash.toBitcoinCash(totalBalance)

      // Get the price of BCH in USD
      let bchPrice = await _this.bchjs.Price.current('usd')
      bchPrice = bchPrice / 100
      // console.log(`price: ${bchPrice}`)

      // Calculate the amount of credit.
      const newCredit = bchPrice * totalBalance

      user.credit = user.credit + newCredit

      // Update the user data in the DB.
      try {
        await user.save()
      } catch (err) {
        ctx.throw(422, err.message)
      }

      // Execute some code here to sweep funds from the users address into the
      // company wallet.
      const txid = await _this.bch.queueTransaction(user.hdIndex)
      console.log(`Funds swept to company wallet. TXID: ${txid}`)

      // Return the updated credit.
      ctx.body = user.credit
    } catch (err) {
      if (err.messsage && err.message.indexOf(`No utxos found`) > -1) {
        ctx.throw(
          409,
          'UTXO not found. Try again in a minute or send additional BCH.'
        )
      }

      if (err === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      console.log(`Error in apitoken/controller.js/updateCredit()`, err)
      ctx.throw(500, 'Wait a couple minutes before trying again.')
    }

    if (next) {
      return next()
    }
  }
}

// module.exports = {
//   getBchAddr,
//   newToken,
//   isValid,
//   updateCredit
// }

module.exports = ApiTokenController
