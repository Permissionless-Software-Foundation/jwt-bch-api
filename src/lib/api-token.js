/*
  This is a library function that handles the creation and validtion of JWT
  tokens for handling API tokens.
*/

'use strict'

const config = require('../../config')
const jwt = require('jsonwebtoken')

// Generate a JWT token, given an user model as input.
function generateToken (user) {
  const token = jwt.sign({ id: user.id }, config.token)
  // console.log(`config.token: ${config.token}`)
  // console.log(`generated token: ${token}`)
  return token
}

module.exports = {
  generateToken
}
