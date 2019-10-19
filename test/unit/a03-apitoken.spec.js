const testUtils = require('./utils')
const rp = require('request-promise')
const assert = require('chai').assert
const config = require('../../config')
const sinon = require('sinon')

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const LOCALHOST = `http://localhost:${config.port}`

// Instantiate the Class for testing with mocking
const ApiTokenController = require('../../src/modules/apitoken/controller')
const apiTokenController = new ApiTokenController()

const context = {}

describe('API Token', () => {
  let sandbox

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

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

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
      context.testUser.credit = 100.0
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

      assert.isString(apiToken.apiToken)

      // TODO: Get user data and assert that the apiTokenIsValid flag is set
      // to true.
    })
  })

  describe('GET /isvalid/:jwt', () => {
    it('should validate a valid jwt token', async () => {
      // Get updated user data on the test user.
      // Assumption: this test if run after the apitoken/new tests, so the
      // test user has a new, valid API token attached to their model.
      context.testUser = await testUtils.loginTestUser()
      // console.log(`testUser: ${JSON.stringify(context.testUser, null, 2)}`)

      const token = context.testUser.apiToken

      const options = {
        method: 'GET',
        uri: `${LOCALHOST}/apitoken/isvalid/${token}`,
        resolveWithFullResponse: true,
        json: true,
        headers: {
          Accept: 'application/json'
          // Authorization: `Bearer ${token}`
        }
      }

      const result = await rp(options)

      assert.equal(result.body, true)
    })

    it('should return false for expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVkYTc5NWI2ODAwZWNlNjIyMDkwYTU4ZSIsImlhdCI6MTU3MTI2MzkyNywiZXhwIjoxNTcxMjYzOTI5fQ.AGPnVHnZDDKqz8a6sp8YK9OUzdv0xHIbCur3EpTrSBo'

      const options = {
        method: 'GET',
        uri: `${LOCALHOST}/apitoken/isvalid/${expiredToken}`,
        resolveWithFullResponse: true,
        json: true,
        headers: {
          Accept: 'application/json'
          // Authorization: `Bearer ${token}`
        }
      }

      const result = await rp(options)

      assert.equal(result.body, false)
    })
  })

  describe('GET /update-credit/:id', () => {
    it('should throw 401 error if auth header is missing', async () => {
      try {
        const id = context.testUser.id
        // const token = context.testUser.token

        const options = {
          method: 'GET',
          uri: `${LOCALHOST}/apitoken/update-credit/${id}`,
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

    it('should throw 401 error if token is invalid', async () => {
      try {
        const id = context.testUser.id
        // const token = context.testUser.token

        const options = {
          method: 'GET',
          uri: `${LOCALHOST}/apitoken/update-credit/${id}`,
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

    it('should return same credit if BCH balance is zero', async () => {
      // Mock live network calls.
      sandbox.stub(apiTokenController.bchjs.Blockbook, 'balance').resolves({
        page: 1,
        totalPages: 1,
        itemsOnPage: 1000,
        address: context.testUser.bchAddr,
        balance: '0',
        totalReceived: '0',
        totalSent: '0',
        unconfirmedBalance: '0',
        unconfirmedTxs: 0,
        txs: 0
      })

      const id = context.testUser.id
      const token = context.testUser.token

      const startCredit = context.testUser.credit

      const options = {
        method: 'GET',
        uri: `${LOCALHOST}/apitoken/update-credit/${id}`,
        resolveWithFullResponse: true,
        json: true,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      }

      const result = await rp(options)
      const credit = result.body
      // console.log(`credit: ${util.inspect(credit)}`)

      assert.equal(credit, startCredit)
    })

    it('should return new credit if BCH is deposited', async () => {
      // Mock live network calls.
      sandbox.stub(apiTokenController.bchjs.Blockbook, 'balance').resolves({
        page: 1,
        totalPages: 1,
        itemsOnPage: 1000,
        address: context.testUser.bchAddr,
        balance: '0',
        totalReceived: '0',
        totalSent: '0',
        unconfirmedBalance: '10000000',
        unconfirmedTxs: 0,
        txs: 0
      })
      sandbox.stub(apiTokenController.bchjs.Price, 'current').resolves(21665)

      const id = context.testUser.id
      const token = context.testUser.token

      const startCredit = context.testUser.credit

      const options = {
        method: 'GET',
        uri: `${LOCALHOST}/apitoken/update-credit/${id}`,
        resolveWithFullResponse: true,
        json: true,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      }

      const result = await rp(options)
      const credit = result.body
      // console.log(`credit: ${util.inspect(credit)}`)

      assert.isAbove(credit, startCredit)
    })
  })
})
