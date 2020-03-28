/*
  A utility library for working with JWT tokens.

  Currently this file is only used in the unit tests.
*/

const config = require('../../config')

const jwt = require('jsonwebtoken')

let _this

class JwtUtils {
  constructor () {
    _this = this

    _this.jwt = jwt
  }

  // validates and decodes a JWT token. Returns the decoded payload.
  decodeToken (token) {
    try {
      if (!token) throw new Error('token is empty')

      // default value
      let decoded = false

      decoded = _this.jwt.verify(token, config.tokenSecret)

      return decoded
    } catch (err) {
      console.error('Error in jwt.js/decodeToken')
      throw err
    }
  }

  // Returns an ISO string of the expiration date of the JWT token.
  getExpiration (token) {
    try {
      const tokenData = _this.decodeToken(token)

      let exp = tokenData.exp * 1000
      exp = new Date(exp)
      // console.log(`${exp.toISOString()}`)
      exp = exp.toISOString()

      return exp
    } catch (err) {
      console.error('Error in jwt.js/getExpiration')
      throw err
    }
  }
}

module.exports = JwtUtils
