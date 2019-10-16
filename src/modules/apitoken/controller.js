const User = require('../../models/users')
const apiTokenLib = require('../../lib/api-token')
const config = require('../../../config')
const jwt = require('jsonwebtoken')

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

// Given a user GUID, return the BCH payment address for that user.
async function getBchAddr (ctx, next) {
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

async function newToken (ctx, next) {
  try {
    // Get user data
    const user = ctx.state.user
    // console.log(`user: ${JSON.stringify(user, null, 2)}`)

    // Check against balance.
    if (user.credit < config.monthlyPrice) ctx.throw(402, 'Not enough credit')
    // TODO: credit for unexpired time from older jot token, before deducting
    // credit.

    // Generate new JWT token.
    const token = apiTokenLib.generateToken(user)

    // Update the user model in the DB with the new token.
    user.apiToken = token

    // Deduct credit
    user.credit = user.credit - config.monthlyPrice

    // Set the isvalid flag
    user.apiTokenIsValid = true

    // Update the user data in the DB.
    try {
      await user.save()
    } catch (err) {
      ctx.throw(422, err.message)
    }

    // Return the BCH address
    ctx.body = user.apiToken
  } catch (err) {
    if (err === 404 || err.name === 'CastError') {
      ctx.throw(404)
    }

    if (err.message === 'Not enough credit') ctx.throw(err)

    console.log(`Error in apitoken/controller.js/newToken()`, err)
    ctx.throw(500)
  }

  if (next) {
    return next()
  }
}

// Expects an API JWT token as input and returns true or false if it's valid.
function isValid (ctx, next) {
  // false by default.
  let result = false

  try {
    const token = ctx.params.jwt
    // console.log(`token: ${token}`)

    // Validate the JWT token.
    const decoded = jwt.verify(token, config.token)
    // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

    // If an error was not thrown, then the token is valid.
    result = true

    ctx.body = result
  } catch (err) {
    // If any error is thrown, return false, indicating the JWT token is invalid.
    ctx.body = result
  }

  if (next) {
    return next()
  }
}

module.exports = {
  getBchAddr,
  newToken,
  isValid
}
