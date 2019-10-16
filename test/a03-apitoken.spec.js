const testUtils = require('./utils')
const rp = require('request-promise')
const assert = require('chai').assert
const config = require('../config')

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const LOCALHOST = `http://localhost:${config.port}`

const context = {}

describe('API Token', () => {
  before(async () => {
    context.testUser = await testUtils.loginTestUser()
    // console.log(`context.testUser: ${JSON.stringify(context.testUser, null, 2)}`)

    // Get the JWT used to log in as the admin 'system' user.
    const adminJWT = await testUtils.getAdminJWT()
    // console.log(`adminJWT: ${adminJWT}`)
    context.adminJWT = adminJWT

    // const admin = await testUtils.loginAdminUser()
    // context.adminJWT = admin.token

    // const admin = await adminLib.loginAdmin()
    // console.log(`admin: ${JSON.stringify(admin, null, 2)}`)
  })

  describe('GET /apitoken/bchaddr/:id', () => {
    it('should not fetch user if auth header is missing', async () => {
      try {
        const id = context.testUser.id
        // const token = context.testUser.token

        const options = {
          method: 'GET',
          uri: `${LOCALHOST}/apitoken/bchaddr/${id}`,
          resolveWithFullResponse: true,
          json: true,
          headers: {
            Accept: 'application/json'
          }
        }

        await rp(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.statusCode, 401)
      }
    })

    it('should not fetch user if token is invalid', async () => {
      try {
        const id = context.testUser.id
        // const token = context.testUser.token

        const options = {
          method: 'GET',
          uri: `${LOCALHOST}/apitoken/bchaddr/${id}`,
          resolveWithFullResponse: true,
          json: true,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer 1`
          }
        }

        await rp(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.statusCode, 401)
      }
    })

    it('should get BCH address for user', async () => {
      const id = context.testUser.id
      const token = context.testUser.token

      const options = {
        method: 'GET',
        uri: `${LOCALHOST}/apitoken/bchaddr/${id}`,
        resolveWithFullResponse: true,
        json: true,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      }

      const result = await rp(options)
      const user = result.body
      // console.log(`user: ${util.inspect(user)}`)

      assert.property(user, 'bchAddr', 'Has BCH address')
      assert.notProperty(user, 'password', 'Does not have password property')
    })
  })

  describe('POST /apitoken/new', () => {
    it('should throw error if credit is too low', async () => {
      try {
        const token = context.testUser.token

        const options = {
          method: 'POST',
          uri: `${LOCALHOST}/apitoken/new`,
          resolveWithFullResponse: true,
          json: true,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }

        await rp(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.statusCode, 402)
      }
    })

    it('should get a new API key', async () => {
      // const id = context.testUser.id
      const token = context.testUser.token

      // Update the credit level of the test user.
      context.testUser.credit = 100.00
      await testUtils.updateUser(context.testUser)

      const options = {
        method: 'POST',
        uri: `${LOCALHOST}/apitoken/new`,
        resolveWithFullResponse: true,
        json: true,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      }

      const result = await rp(options)
      const apiToken = result.body
      // console.log(`apiToken: ${util.inspect(apiToken)}`)

      assert.isString(apiToken)

      // TODO: Get user data and assert that the apiTokenIsValid flag is set
      // to true.
    })
  })
})
