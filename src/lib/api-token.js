/*
  This is a library function that handles the creation and validtion of JWT
  tokens for handling API tokens.
*/

'use strict'

const config = require('../../config')
const jwt = require('jsonwebtoken')

// Generate a JWT token, given an user model as input.
function generateToken (user) {
  // console.log(`user data: ${JSON.stringify(user, null, 2)}`)

  const jwtOptions = {
    expiresIn: config.jwtExpiration
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    apiLevel: user.apiLevel,
    rateLimit: user.rateLimit,
    pointsToConsume: user.pointsToConsume,
    duration: user.duration
  }

  const token = jwt.sign(jwtPayload, config.tokenSecret, jwtOptions)
  // console.log(`config.token: ${config.token}`)
  // console.log(`generated token: ${token}`)
  return token
}

module.exports = {
  generateToken
}
