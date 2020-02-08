const User = require('../../models/users')
const apiTokenLib = require('../../lib/api-token')
const config = require('../../../config')
const jwt = require('jsonwebtoken')

const KeyEncoder = require('key-encoder').default
const keyEncoder = new KeyEncoder('secp256k1')

const wlogger = require('../../lib/wlogger')

// Business logic library for dealing with BCH.
const BCH = require('../../lib/bch')
const bch = new BCH()

const BCHJS = require('@chris.troutner/bch-js')

// This app is intended to run on the same machine as the mainnet bch-api REST API.
const bchjs = new BCHJS({ restURL: config.apiServer, apiToken: config.apiJwt })

let _this

class ApiTokenController {
  constructor () {
    this.bchjs = bchjs
    this.bch = bch

    _this = this
  }

  /**
   * @api {get} /apitoken/bchaddr/:id Get BCH payment address for user by user id
   * @apiPermission user
   * @apiName GetBchAddr
   * @apiGroup API Token
   *
   * @apiDescription The endpoint is used to get a payment BCH address for the user.
   * Payment for this user account can be sent to address returned by this endpoint.
   * However, the update-credit endpoint needs to be called afterward to convert
   * the BCH into account credit.
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
      // wlogger.error(`user: ${JSON.stringify(user, null, 2)}`)

      // Return the BCH address
      ctx.body = {
        bchAddr: user.bchAddr
      }
    } catch (err) {
      if (err === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      wlogger.error(`Error in apitoken/controller.js/getBchAddr()`, err)
      ctx.throw(500)
    }

    if (next) {
      return next()
    }
  }

  /**
   * @api {post} /apitoken/new Request a new JWT token for accessing the API.
   * @apiPermission user
   * @apiName GetApiToken
   * @apiGroup API Token
   *
   * @apiDescription This endpoint is used to request a new JWT token for accessing
   * the Cash Stack API. This endpoint will automatically calculate a refund and
   * credit the account for an old JWT token, *before* issuing a new JWT token
   * and debiting the account for the new JWT token.
   */
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

      wlogger.error(`Error in apitoken/controller.js/newToken()`, err)
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

      let refund = (diff / 30) * oldApiLevel

      if (refund < 0) refund = 0

      wlogger.info(`refunding ${refund} dollars`)

      return refund
    } catch (err) {
      console.error(`Error in apiToken controller.js/_calculateRefund()`)
      throw err
    }
  }

  /**
   * @api {get} /isvalid/:jwt Check if JWT is valid
   * @apiPermission public
   * @apiName isValid
   * @apiGroup API Token
   *
   * @apiDescription This endpoint is used by api.fullstack.cash to validate
   * a JWT token and ensure it has permission to access the requested tier and
   * rate limits.
   */
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

      const jwtOptions = {
        algorithms: ['ES256']
      }

      const pemPublicKey = keyEncoder.encodePublic(
        config.publicKey,
        'raw',
        'pem'
      )

      // Validate the JWT token.
      const decoded = jwt.verify(token, pemPublicKey, jwtOptions)
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

      console.log(
        `valid: true, apiLevel: ${outObj.apiLevel}, JWT: ${token.slice(
          -6
        )}, user: ${user.username}`
      )

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

  /**
   * @api {get} /update-credit/:id Update the credit for a a user account
   * @apiPermission user
   * @apiName UpdateCredit
   * @apiGroup API Token
   *
   * @apiDescription This endpoint is used to convert BCH into account credit.
   * The BCH address provided by the /bchaddr/:id endpoint is checked for a
   * balance. If a balance is found, the BCH is moved to the company wallet and
   * the user account is credited with the market-value of BCH in USD.
   */
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

      wlogger.error(`Error in apitoken/controller.js/updateCredit()`, err)
      ctx.throw(500, 'Wait a couple minutes before trying again.')
    }

    if (next) {
      return next()
    }
  }

  /**
   * @api {get} / Get existing API token for user
   * @apiPermission user
   * @apiName GetToken
   * @apiGroup API Token
   *
   * @apiDescription This endpoint is used to retrieve the current API JWT token
   * issued to the user.
   *
   * @apiExample {js} Example usage:
   * const user = await loginUser()
   *
   * const options = {
   *   method: "get",
   *   url: "http://localhost:5001/apitoken/",
   *   headers: { Authorization: `Bearer ${user.token}` }
   * }
   *
   * const response = await axios.request(options)
   * console.log(response.data.apiToken)
   * // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlMzEwNTBjMzdjMGQyM2MwZmIxYjFiYyIsImlhdCI6MTU4MDI3MjI1NiwiZXhwIjoxNTgyODY0MjU2fQ.E4je3pFpp1PRgTyKQ-HK1KIsrBLCXm8OhrHXwewl2Ak"
   */
  async getExistingToken (ctx, next) {
    try {
      // Get user data
      const user = ctx.state.user
      console.log(`user: ${JSON.stringify(user, null, 2)}`)

      // If user has not yet generated an API token.
      if (!user.apiToken) {
        ctx.body = {
          apiToken: false
        }

      // Normal path
      } else {
        ctx.body = {
          apiToken: user.apiToken
        }
      }
    } catch (err) {
      if (err.status) ctx.throw(err.status, err.message)

      wlogger.error(`Error in apitoken/controller.js/getExistingToken()`, err)
      ctx.throw(500)
    }

    if (next) {
      return next()
    }
  }
}

module.exports = ApiTokenController
