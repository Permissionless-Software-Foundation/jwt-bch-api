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
    _this.config = config
  }

  // validates and decodes a JWT token. Returns the decoded payload.
  // If the JWT token has expired, it will return false.
  decodeToken (token) {
    try {
      if (!token) throw new Error('token is empty')

      // default value
      let decoded = false

      decoded = _this.jwt.verify(token, config.tokenSecret)

      return decoded
    } catch (err) {
      // console.log('err: ', err)
      // console.log(`Expiration: ${err.expiredAt}`)
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

  // Generate a new JWT token.
  generateToken (user, expTime) {
    try {
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)

      const jwtOptions = {
        expiresIn: expTime || _this.config.jwtExpiration
      }

      const jwtPayload = {
        id: user.id,
        apiLevel: user.apiLevel,
        rateLimit: user.rateLimit
      }

      const token = _this.jwt.sign(jwtPayload, _this.config.tokenSecret, jwtOptions)
      // console.log(`config.token: ${config.token}`)
      // console.log(`generated token: ${token}`)
      return token
    } catch (err) {
      console.error('Error in jwt.js/generateToken()')
      throw err
    }
  }
}

module.exports = JwtUtils
