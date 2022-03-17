const testUtils = require('./utils')
// const rp = require('request-promise')
const assert = require('chai').assert
const config = require('../../config')
const sinon = require('sinon')
const axios = require('axios')

const JwtUtils = require('../../src/lib/jwt')
const jwtUtils = new JwtUtils()

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const LOCALHOST = `http://localhost:${config.port}`

// Mock data
const mockData = require('./mocks/apitoken-mocks')

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
          url: `${LOCALHOST}/apitoken/bchaddr/${id}`
        }

        await axios(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should not fetch user if token is invalid', async () => {
      try {
        const id = context.testUser.id
        // const token = context.testUser.token

        const options = {
          method: 'GET',
          url: `${LOCALHOST}/apitoken/bchaddr/${id}`,
          headers: {
            Authorization: 'Bearer 1'
          }
        }
        await axios(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should get BCH address for user', async () => {
      const id = context.testUser.id
      const token = context.testUser.token

      const options = {
        method: 'GET',
        url: `${LOCALHOST}/apitoken/bchaddr/${id}`,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }

      const result = await axios(options)
      const user = result.data
      // console.log(`user: ${util.inspect(user)}`)

      assert.property(user, 'bchAddr', 'Has BCH address')
      assert.notProperty(user, 'password', 'Does not have password property')
    })
  })

  describe('POST /apitoken/new', () => {
    it('should throw 422 error if apiLevel is not included', async () => {
      try {
        const token = context.testUser.token

        const options = {
          method: 'POST',
          url: `${LOCALHOST}/apitoken/new`,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
        await axios(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        // console.log('err: ', err)
        assert.equal(err.response.status, 422)
        assert.include(err.response.data, 'apiLevel must be an integer number')
      }
    })

    it('should throw 402 error if credit is too low', async () => {
      try {
        const token = context.testUser.token

        const options = {
          method: 'POST',
          url: `${LOCALHOST}/apitoken/new`,
          headers: {
            Authorization: `Bearer ${token}`
          },
          data: {
            apiLevel: 20
          }
        }
        await axios(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 402)
        assert.include(err.response.data, 'Not enough credit')
      }
    })

    it('should get a new, anonymous API key', async () => {
      const token = context.testUser.token

      // Update the credit level of the test user.
      context.testUser.credit = 100.0
      await testUtils.updateUser(context.testUser)

      const options = {
        method: 'POST',
        url: `${LOCALHOST}/apitoken/new`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          apiLevel: 0
        }
      }
      const result = await axios(options)

      const apiToken = result.data
      // console.log(`apiToken: ${util.inspect(apiToken)}`)

      assert.isString(apiToken.apiToken)
      assert.equal(apiToken.apiLevel, 0)

      const newUserData = await testUtils.loginTestUser()
      // console.log(`newUserData: ${JSON.stringify(newUserData, null, 2)}`)

      assert.equal(
        newUserData.credit,
        100,
        'should deduct $0 of credit from account'
      )

      assert.isString(apiToken.apiToken)
    })

    it('should get a new, free API key', async () => {
      const token = context.testUser.token

      // Update the credit level of the test user.
      context.testUser.credit = 100.0
      await testUtils.updateUser(context.testUser)

      const options = {
        method: 'POST',
        url: `${LOCALHOST}/apitoken/new`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          apiLevel: 10
        }
      }
      const result = await axios(options)

      const apiToken = result.data
      // console.log(`apiToken: ${util.inspect(apiToken)}`)

      assert.isString(apiToken.apiToken)
      assert.equal(apiToken.apiLevel, 10)

      const newUserData = await testUtils.loginTestUser()
      // console.log(`newUserData: ${JSON.stringify(newUserData, null, 2)}`)

      assert.equal(
        newUserData.credit,
        100,
        'should deduct $0 of credit from account'
      )

      assert.isString(apiToken.apiToken)
    })

    it('should deduct the cost of a JWT token from the users balance', async () => {
      const token = context.testUser.token

      // Update the credit level of the test user.
      context.testUser.credit = 100.0
      await testUtils.updateUser(context.testUser)

      const options = {
        method: 'POST',
        url: `${LOCALHOST}/apitoken/new`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          apiLevel: 40
        }
      }

      const result = await axios(options)
      const apiToken = result.data
      // console.log(`apiToken: ${util.inspect(apiToken)}`)

      // Should recieve a new API token.
      assert.isString(apiToken.apiToken)
      assert.equal(apiToken.apiLevel, 40)

      const newUserData = await testUtils.loginTestUser()
      // console.log(`newUserData: ${JSON.stringify(newUserData, null, 2)}`)

      // Should deduct the cost of a new JWT token.
      assert.equal(
        newUserData.credit,
        100 - config.apiTokenPrice,
        `should deduct ${config.apiTokenPrice} of credit from account`
      )
    })

    // it('should get a new, $10 API key', async () => {
    //   const token = context.testUser.token
    //
    //   // Update the credit level of the test user.
    //   context.testUser.credit = 100.0
    //   await testUtils.updateUser(context.testUser)
    //
    //   const options = {
    //     method: 'POST',
    //     url: `${LOCALHOST}/apitoken/new`,
    //     headers: {
    //       Authorization: `Bearer ${token}`
    //     },
    //     data: {
    //       apiLevel: 20
    //     }
    //   }
    //
    //   const result = await axios(options)
    //   const apiToken = result.data
    //   // console.log(`apiToken: ${util.inspect(apiToken)}`)
    //
    //   // Should recieve a new API token.
    //   assert.isString(apiToken.apiToken)
    //   assert.equal(apiToken.apiLevel, 20)
    //
    //   const newUserData = await testUtils.loginTestUser()
    //   // console.log(`newUserData: ${JSON.stringify(newUserData, null, 2)}`)
    //
    //   assert.equal(
    //     newUserData.credit,
    //     90,
    //     'should deduct $10 of credit from account'
    //   )
    // })
    //
    // it('should get a new, $20 API key', async () => {
    //   const token = context.testUser.token
    //
    //   // Update the credit level of the test user.
    //   context.testUser.credit = 100.0
    //   await testUtils.updateUser(context.testUser)
    //
    //   const options = {
    //     method: 'POST',
    //     url: `${LOCALHOST}/apitoken/new`,
    //     headers: {
    //       Authorization: `Bearer ${token}`
    //     },
    //     data: {
    //       apiLevel: 30
    //     }
    //   }
    //
    //   const result = await axios(options)
    //   const apiToken = result.data
    //   // console.log(`apiToken: ${util.inspect(apiToken)}`)
    //
    //   // Should recieve a new API token.
    //   assert.isString(apiToken.apiToken)
    //   assert.equal(apiToken.apiLevel, 30)
    //
    //   const newUserData = await testUtils.loginTestUser()
    //   // console.log(`newUserData: ${JSON.stringify(newUserData, null, 2)}`)
    //
    //   // Should refund $10 from last API token, so balance should be around
    //   // $90.
    //   assert.isBelow(newUserData.credit, 91)
    //   assert.isAbove(newUserData.credit, 89)
    // })
    //
    // it('should get a new, $30 API key', async () => {
    //   const token = context.testUser.token
    //
    //   // Update the credit level of the test user.
    //   context.testUser.credit = 100.0
    //   await testUtils.updateUser(context.testUser)
    //
    //   const options = {
    //     method: 'POST',
    //     url: `${LOCALHOST}/apitoken/new`,
    //     headers: {
    //       Authorization: `Bearer ${token}`
    //     },
    //     data: {
    //       apiLevel: 40
    //     }
    //   }
    //
    //   const result = await axios(options)
    //   const apiToken = result.data
    //   // console.log(`apiToken: ${util.inspect(apiToken)}`)
    //
    //   // Should recieve a new API token.
    //   assert.isString(apiToken.apiToken)
    //   assert.equal(apiToken.apiLevel, 40)
    //
    //   const newUserData = await testUtils.loginTestUser()
    //   // console.log(`newUserData: ${JSON.stringify(newUserData, null, 2)}`)
    //
    //   // Should refund $10 from last API token, so balance should be around
    //   // $90.
    //   assert.isBelow(newUserData.credit, 91)
    //   assert.isAbove(newUserData.credit, 89)
    // })

    // This test case comes from a bug that was discovered. Newly issued JWT
    // tokens were being generated with the old apiLevel, rather than the new
    // apiLevel.
    it('should reflect new API level in JWT token', async () => {
      const token = context.testUser.token

      // Update the credit level of the test user.
      context.testUser.credit = 100.0
      await testUtils.updateUser(context.testUser)

      // Get a new $10 token.
      let options = {
        method: 'POST',
        url: `${LOCALHOST}/apitoken/new`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          apiLevel: 10
        }
      }
      let result = await axios(options)

      assert.isString(result.data.apiToken)
      assert.equal(result.data.apiLevel, 10)

      // Get a new $40 token.
      options = {
        method: 'POST',
        url: `${LOCALHOST}/apitoken/new`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          apiLevel: 40
        }
      }
      result = await axios(options)

      assert.isString(result.data.apiToken)
      assert.equal(result.data.apiLevel, 40)

      // Ensure the $40 JWT has the appropriate API level.
      const jwtData = jwtUtils.decodeToken(result.data.apiToken)
      // console.log(`jwtData: ${JSON.stringify(jwtData, null, 2)}`)

      assert.equal(jwtData.apiLevel, 40)
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
        method: 'POST',
        url: `${LOCALHOST}/apitoken/isvalid`,
        data: {
          token: token
        }
      }

      const rpOut = await axios(options)
      const result = rpOut.data

      assert.property(result, 'isValid')
      assert.property(result, 'apiLevel')
      assert.equal(result.isValid, true)
    })

    it('should return false for invalid input', async () => {
      const options = {
        method: 'POST',
        url: `${LOCALHOST}/apitoken/isvalid`,
        data: {
          token: ''
        }
      }

      const rpOut = await axios(options)
      const result = rpOut.data

      assert.property(result, 'isValid')
      assert.property(result, 'apiLevel')
      assert.equal(result.isValid, false)
    })

    it('should return false for expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNDYwM2FmYjZhOWI2MzgyYjI1OWZmNCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImFwaUxldmVsIjowLCJyYXRlTGltaXQiOjMsImlhdCI6MTU4MTY0Njc2OSwiZXhwIjoxNTgxNjQ2NzcxfQ.B2it9a6i80Prs9F0cNoXtiOI20ftecVlSWbvS0GheITvSnzTcG_9ocUs2o9pFBRytQGKJShERTXSYe3onU8DAQ'

      const options = {
        method: 'POST',
        url: `${LOCALHOST}/apitoken/isvalid`,
        data: {
          token: expiredToken
        }
      }

      const rpOut = await axios(options)
      const result = rpOut.data

      assert.property(result, 'isValid')
      assert.property(result, 'apiLevel')
      assert.equal(result.isValid, false)
    })

    it('should return false if JWT token is not associated with user', async () => {
      // Get the existing API token.
      // Assumption: this test if run after the apitoken/new tests, so the
      // test user has a new, valid API token attached to their model.
      context.testUser = await testUtils.loginTestUser()
      const oldToken = context.testUser.apiToken
      // console.log(`old token: ${oldToken}`)

      // Wait 1 second so that JWT token value changes.
      await sleep(1000)

      // Request a new token
      const options = {
        method: 'POST',
        url: `${LOCALHOST}/apitoken/new`,
        headers: {
          Authorization: `Bearer ${context.testUser.token}`
        },
        data: {
          apiLevel: 0
        }
      }

      const result = await axios(options)
      const apiToken = result.data.apiToken
      // console.log(`New token: ${apiToken}`)

      // Assert that the new token is different than the old token.
      assert.notEqual(apiToken, oldToken)

      // Make an API call with the old token.
      const options2 = {
        method: 'POST',
        url: `${LOCALHOST}/apitoken/isvalid`,
        data: {
          token: oldToken
        }
      }

      const rpOut = await axios(options2)
      const result2 = rpOut.data

      assert.property(result2, 'isValid')
      assert.property(result2, 'apiLevel')
      assert.equal(result2.isValid, false)
    })
  })

  describe('_calculateRefund', () => {
    it('should calculate a refund for an anonymous account', () => {
      // Generate user mock data. Replace JWT token with up-to-date version.
      const user = Object.assign({}, mockData.userMock)
      user.apiToken = context.testUser.apiToken
      user.apiLevel = 0
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)
      // console.log(`context.testUser: ${JSON.stringify(context.testUser, null, 2)}`)

      const result = apiTokenController._calculateRefund(user)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, 0)
    })

    it('should calculate a refund for a free account', () => {
      // Generate user mock data. Replace JWT token with up-to-date version.
      const user = Object.assign({}, mockData.userMock)
      user.apiToken = context.testUser.apiToken
      user.apiLevel = 10
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)
      // console.log(`context.testUser: ${JSON.stringify(context.testUser, null, 2)}`)

      const result = apiTokenController._calculateRefund(user)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, 0)
    })

    // it('should calculate a refund for a $10 account', () => {
    //   // Generate user mock data. Replace JWT token with up-to-date version.
    //   const user = Object.assign({}, mockData.userMock)
    //   user.apiToken = context.testUser.apiToken
    //   user.apiLevel = 20
    //
    //   const result = apiTokenController._calculateRefund(user)
    //   // console.log(`result: ${JSON.stringify(result, null, 2)}`)
    //
    //   assert.isBelow(result, 10)
    //   assert.isAbove(result, 9)
    // })

    // it('should calculate a refund for a $20 account', () => {
    //   // Generate user mock data. Replace JWT token with up-to-date version.
    //   const user = Object.assign({}, mockData.userMock)
    //   user.apiToken = context.testUser.apiToken
    //   user.apiLevel = 30
    //
    //   const result = apiTokenController._calculateRefund(user)
    //   // console.log(`result: ${JSON.stringify(result, null, 2)}`)
    //
    //   assert.isBelow(result, 20)
    //   assert.isAbove(result, 19)
    // })

    it('should calculate a refund for a paid token', () => {
      // Generate user mock data. Replace JWT token with up-to-date version.
      const user = Object.assign({}, mockData.userMock)
      user.apiToken = context.testUser.apiToken
      user.apiLevel = 40

      const result = apiTokenController._calculateRefund(user)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isBelow(result, 20)
      assert.isAbove(result, 9)
    })
  })

  describe('GET /update-credit/:id', () => {
    it('should throw 401 error if auth header is missing', async () => {
      try {
        const id = context.testUser.id
        // const token = context.testUser.token

        const options = {
          method: 'GET',
          url: `${LOCALHOST}/apitoken/update-credit/${id}`
        }

        await axios(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
        assert.include(err.response.data, 'Unauthorized')
      }
    })

    it('should throw 401 error if token is invalid', async () => {
      try {
        const id = context.testUser.id
        // const token = context.testUser.token

        const options = {
          method: 'GET',
          url: `${LOCALHOST}/apitoken/update-credit/${id}`,
          headers: {
            Authorization: 'Bearer 1'
          }
        }

        await axios(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
        assert.include(err.response.data, 'Unauthorized')
      }
    })

    it('should return same credit if BCH balance is zero', async () => {
      // Mock live network calls.
      sandbox.stub(apiTokenController.bchjs.Electrumx, 'balance').resolves({
        success: true,
        balance: {
          confirmed: 0,
          unconfirmed: 0
        }
      })

      const id = context.testUser.id
      const token = context.testUser.token

      const startCredit = context.testUser.credit

      const options = {
        method: 'GET',
        url: `${LOCALHOST}/apitoken/update-credit/${id}`,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }

      const result = await axios(options)
      const credit = result.data
      // console.log(`credit: ${util.inspect(credit)}`)

      assert.isAbove(credit, startCredit - 10)
    })

    it('should return new credit if BCH is deposited', async () => {
      // Mock live network calls.
      sandbox.stub(apiTokenController.bchjs.Electrumx, 'balance').resolves({
        success: true,
        balance: {
          confirmed: 0,
          unconfirmed: 10000000
        }
      })
      sandbox.stub(apiTokenController.bchjs.Price, 'getUsd').resolves(21665)
      sandbox
        .stub(apiTokenController.bch, 'queueTransaction')
        .resolves(
          '0f333b474ecab740e78bd6ab1160c790a0fd935727d22c35e8da67e71733911d'
        )
      sandbox.stub(apiTokenController.nodemailer, 'sendEmail').resolves({})

      const id = context.testUser.id
      const token = context.testUser.token

      const startCredit = context.testUser.credit

      const options = {
        method: 'GET',
        url: `${LOCALHOST}/apitoken/update-credit/${id}`,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }

      const result = await axios(options)
      const credit = result.data
      // console.log(`credit: ${util.inspect(credit)}`)

      assert.isAbove(credit, startCredit)
    })
  })

  describe('GET /', () => {
    it('should throw 401 error if auth header is missing', async () => {
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/apitoken/`,
          headers: {
            Accept: 'application/json'
          }
        }

        await axios(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
        assert.include(err.response.data, 'Unauthorized')
      }
    })

    it('should throw 401 error if token is invalid', async () => {
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/apitoken/`,
          headers: {
            Authorization: 'Bearer 1'
          }
        }

        await axios(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
        assert.include(err.response.data, 'Unauthorized')
      }
    })

    it('should return the users existing API token.', async () => {
      const token = context.testUser.token

      const options = {
        method: 'GET',
        url: `${LOCALHOST}/apitoken/`,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }

      const result = await axios(options)
      // console.log(`data: ${JSON.stringify(result.data, null, 2)}`)

      const apiToken = result.data.apiToken

      assert.isString(apiToken)
    })

    // TODO: It should return false if the user has no JWT token.
  })
})

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
