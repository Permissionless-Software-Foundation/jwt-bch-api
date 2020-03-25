/*
  A utility library for working with JWT tokens.

  Currently this file is only used in the unit tests.
*/

const config = require('../../config')

const jwt = require('jsonwebtoken')

// const KeyEncoder = require('key-encoder').default
// const keyEncoder = new KeyEncoder('secp256k1')

// const jwtOptions = {
//   algorithms: ['ES256']
// }

let _this

class JwtUtils {
  constructor () {
    _this = this

    _this.jwt = jwt
    // _this.keyEncoder = keyEncoder
  }

  // validates and decodes a JWT token. Returns the decoded payload.
  decodeToken (token) {
    try {
      if (!token) throw new Error('token is empty')

      // default value
      let decoded = false

      // const pemPublicKey = _this.keyEncoder.encodePublic(
      //   config.publicKey,
      //   'raw',
      //   'pem'
      // )

      // decoded = _this.jwt.verify(token, pemPublicKey, jwtOptions)
      decoded = _this.jwt.verify(token, config.token)

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
