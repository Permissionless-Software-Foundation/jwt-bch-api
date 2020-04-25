const assert = require('chai').assert

const JwtUtils = require('../../src/lib/jwt')
const jwtUtils = new JwtUtils()

const mockData = require('./mocks/jwt-lib-mocks')

describe('#jwt.js', () => {
  let tempToken

  before(() => {
    const user = mockData.user

    tempToken = jwtUtils.generateToken(user)
  })

  describe('#decodeToken', () => {
    it('should return decoded data', () => {
      const token = tempToken

      const result = jwtUtils.decodeToken(token)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'apiLevel')
      assert.property(result, 'rateLimit')
      assert.property(result, 'iat')
      assert.property(result, 'exp')
    })

    it('should throw an expired error for expired token', () => {
      try {
        jwtUtils.decodeToken(mockData.expiredJwt)
      } catch (err) {
        // console.log('err: ', err)

        assert.property(err, 'name')
        assert.property(err, 'message')
        assert.property(err, 'expiredAt')

        assert.equal(err.name, 'TokenExpiredError')
        assert.equal(err.message, 'jwt expired')
      }
    })

    it('should throw an invalid error for token with wrong signature', () => {
      try {
        jwtUtils.decodeToken(mockData.invalidSigJwt)
      } catch (err) {
        // console.log('err: ', err)

        assert.property(err, 'name')
        assert.property(err, 'message')

        assert.equal(err.name, 'JsonWebTokenError')
        assert.equal(err.message, 'invalid signature')
      }
    })
  })

  describe('#getExpiration', () => {
    it('should throw an expired error for expired JWT', () => {
      try {
        const token = mockData.expiredJwt

        jwtUtils.getExpiration(token)
      } catch (err) {
        // console.log('err: ', err)

        assert.property(err, 'name')
        assert.property(err, 'message')
        assert.property(err, 'expiredAt')

        assert.equal(err.name, 'TokenExpiredError')
        assert.equal(err.message, 'jwt expired')
      }
    })

    it('should throw an invalid error for token with wrong signature', () => {
      try {
        jwtUtils.getExpiration(mockData.invalidSigJwt)
      } catch (err) {
        // console.log('err: ', err)

        assert.property(err, 'name')
        assert.property(err, 'message')

        assert.equal(err.name, 'JsonWebTokenError')
        assert.equal(err.message, 'invalid signature')
      }
    })

    it('should get an expiration date for a JWT token', () => {
      const token = tempToken

      const result = jwtUtils.getExpiration(token)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      // jwtUtils
      assert.isString(result)
    })
  })
})
