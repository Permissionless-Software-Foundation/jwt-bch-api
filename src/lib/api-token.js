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
  const jwtOptions = {
    expiresIn: config.jwtExpiration,
    algorithm: 'ES256'
  }

  const pemPrivateKey = keyEncoder.encodePrivate(config.privateKey, 'raw', 'pem')
  const token = jwt.sign({ id: user.id }, pemPrivateKey, jwtOptions)
  // console.log(`config.token: ${config.token}`)
  // console.log(`generated token: ${token}`)
  return token
}

module.exports = {
  generateToken
}
