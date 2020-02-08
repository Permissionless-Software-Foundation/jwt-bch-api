/*
  This is a library function that handles the creation and validtion of JWT
  tokens for handling API tokens.
*/

'use strict'

const config = require('../../config')
const jwt = require('jsonwebtoken')
const KeyEncoder = require('key-encoder').default
const keyEncoder = new KeyEncoder('secp256k1')

// Generate a JWT token, given an user model as input.
function generateToken (user) {
  console.log(`user data: ${JSON.stringify(user, null, 2)}`)

  const jwtOptions = {
    expiresIn: config.jwtExpiration,
    algorithm: 'ES256'
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    apiLevel: user.apiLevel,
    rateLimit: user.rateLimit
  }

  const pemPrivateKey = keyEncoder.encodePrivate(config.privateKey, 'raw', 'pem')
  const token = jwt.sign(jwtPayload, pemPrivateKey, jwtOptions)
  // console.log(`config.token: ${config.token}`)
  // console.log(`generated token: ${token}`)
  return token
}

module.exports = {
  generateToken
}
