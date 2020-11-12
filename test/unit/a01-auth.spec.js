const app = require('../../bin/server')
const utils = require('../utils')
const config = require('../../config')
const assert = require('chai').assert

const axios = require('axios').default

// const request = supertest.agent(app.listen())
const context = {}

const LOCALHOST = `http://localhost:${config.port}`

describe('Auth', () => {
  before(async () => {
    // await utils.cleanDb() // This should be first instruction.

    await app.startServer() // This should be second instruction.

    const userObj = {
      email: 'test@test.com',
      password: 'pass'
    }
    const testUser = await utils.createUser(userObj)

    context.user = testUser.user
    context.token = testUser.token
  })

  describe('POST /auth', () => {
    it('should throw 401 if credentials are incorrect', async () => {
      try {
        const options = {
          method: 'post',
          url: `${LOCALHOST}/auth`,
          data: {
            email: 'test@test.com',
            password: 'wrongpassword'
          }
        }

        const result = await axios(options)

        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })

    it('should throw 401 if email is wrong format', async () => {
      try {
        const options = {
          method: 'post',
          url: `${LOCALHOST}/auth`,
          data: {
            email: 'wrongEmail',
            password: 'wrongpassword'
          }
        }
        await axios.request(options)

        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })

    it('should auth user', async () => {
      try {
        const options = {
          method: 'post',
          url: `${LOCALHOST}/auth`,
          data: {
            email: 'test@test.com',
            password: 'pass'
          }
        }
        const result = await axios(options)
        // console.log(`result: ${JSON.stringify(result.data, null, 2)}`)
        context.token = result.data.token

        assert(result.status === 200, 'Status Code 200 expected.')
        assert(
          result.data.user.email === 'test@test.com',
          'Email of test expected'
        )
        assert(
          result.data.user.password === undefined,
          'Password expected to be omited'
        )
      } catch (err) {
        console.log('Error authenticating test user: ', err)
      }
    })
  })
  describe('GET /auth/expiration', () => {
    it('should throw 401 if the authorization header is missing', async () => {
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/auth/expiration`
        }
        await axios(options)

        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })

    it('should throw error if the authorization header is missing the scheme', async () => {
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/auth/expiration`,
          headers: {
            Accept: 'application/json',
            Authorization: '1'
          }
        }

        await axios(options)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })
    it('should throw error if the authorization header has invalid scheme', async () => {
      const { token } = context
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/auth/expiration`,
          headers: {
            Accept: 'application/json',
            Authorization: `Unknown ${token}`
          }
        }

        await axios(options)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })
    it('should throw error if token is invalid', async () => {
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/auth/expiration`,
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer 1'
          }
        }

        await axios(options)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should get token expiration date', async () => {
      const { token } = context
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/auth/expiration`,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }

        const result = await axios(options)

        assert.exists(result.data)

        assert.property(result.data, 'now')
        assert.property(result.data, 'exp')

        assert.isString(result.data.now)
        assert.isString(result.data.exp)
      } catch (err) {
        assert(false, 'Unexpected result')
      }
    })
  })
})
