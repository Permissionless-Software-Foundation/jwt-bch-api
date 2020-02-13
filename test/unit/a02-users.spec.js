const testUtils = require('../utils')
const assert = require('chai').assert
const config = require('../../config')
const axios = require('axios')

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const LOCALHOST = `http://localhost:${config.port}`

const context = {}

describe('Users', () => {
  before(async () => {
    // console.log(`config: ${JSON.stringify(config, null, 2)}`)

    // Create a second test user.
    const userObj = {
      email: 'test2@test.com',
      password: 'pass2'
    }
    const testUser = await testUtils.createUser(userObj)
    // console.log(`testUser2: ${JSON.stringify(testUser, null, 2)}`)

    context.user2 = testUser.user
    context.token2 = testUser.token
    context.id2 = testUser.user._id

    // Get the JWT used to log in as the admin 'system' user.
    const adminJWT = await testUtils.getAdminJWT()
    // console.log(`adminJWT: ${adminJWT}`)
    context.adminJWT = adminJWT

    // const admin = await testUtils.loginAdminUser()
    // context.adminJWT = admin.token

    // const admin = await adminLib.loginAdmin()
    // console.log(`admin: ${JSON.stringify(admin, null, 2)}`)
  })

  describe('POST /users', () => {
    it('should reject signup when data is incomplete', async () => {
      try {
        const options = {
          method: 'POST',
          url: `${LOCALHOST}/users`,
          data: {
            email: 'test2@test.com'
          }
        }

        const result = await axios(options)

        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        if (err.response.status === 422) {
          assert(err.response.status === 422, 'Error code 422 expected.')
        }
      }
    })

    it('should reject signup if no email property is provided', async () => {
      try {
        const options = {
          method: 'POST',
          url: `${LOCALHOST}/users`,
          data: {
            user: {
              password: 'pass2'
            }
          }
        }
        await axios.request(options)

        assert(false, 'Unexpected result')
      } catch (err) {
        // console.log('err', err)
        assert.equal(err.response.status, 422)
        assert.include(err.response.data, "Property 'email' must be a string")
      }
    })

    it('should reject signup if email property provided is wrong format', async () => {
      try {
        const options = {
          method: 'POST',
          url: `${LOCALHOST}/users`,
          data: {
            user: {
              email: 'badEmailFormat',
              password: 'test'
            }
          }
        }
        await axios.request(options)

        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.response.status, 422)
        assert.include(
          err.response.data,
          "Property 'email' must be email format"
        )
      }
    })

    it('should reject signup if no password property is provided', async () => {
      try {
        const options = {
          method: 'POST',
          url: `${LOCALHOST}/users`,
          data: {
            user: {
              email: 'test2@test.com'
            }
          }
        }

        await axios.request(options)

        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.response.status, 422)
        assert.include(
          err.response.data,
          "Property 'password' must be a string"
        )
      }
    })

    it('should create a new user', async () => {
      const options = {
        method: 'post',
        url: `${LOCALHOST}/users`,
        data: {
          user: {
            email: 'test3@test.com',
            password: 'supersecretpassword'
          }
        }
      }

      const result = await axios.request(options)
      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`)

      context.user = result.data.user
      context.token = result.data.token

      assert.equal(result.status, 200, 'Status Code 200 expected.')
      assert.equal(
        result.data.user.email,
        'test3@test.com',
        'Email of test expected'
      )
      assert.equal(
        result.data.user.password,
        undefined,
        'Password expected to be omited'
      )

      assert.property(result.data, 'token', 'Token property exists.')
      assert.property(result.data.user, 'type')
      assert.property(result.data.user, 'apiLevel')
      assert.property(result.data.user, '_id')
      assert.property(result.data.user, 'bchAddr')
      assert.property(result.data.user, 'hdIndex')

      assert.equal(result.data.user.type, 'user')
    })
  })

  describe('GET /users', () => {
    it('should not fetch users if the authorization header is missing', async () => {
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/users`,
          headers: {
            Accept: 'application/json'
          }
        }

        await axios(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        // console.log(`err: `, err)
        assert.equal(err.response.status, 401)
      }
    })

    it('should not fetch users if the authorization header is missing the scheme', async () => {
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/users`,
          headers: {
            Accept: 'application/json',
            Authorization: '1'
          }
        }

        await axios(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should not fetch users if the authorization header has invalid scheme', async () => {
      const { token } = context
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/users`,
          headers: {
            Accept: 'application/json',
            Authorization: `Unknown ${token}`
          }
        }

        await axios(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should not fetch users if token is invalid', async () => {
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/users`,
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer 1'
          }
        }

        await axios(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should throw 401 if non-admin getting users', async () => {
      const { token } = context

      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/users`,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }

        await axios.request(options)
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        // console.log(`err: `, err)
        assert.equal(err.response.status, 401)
      }
    })

    it('should get all users if admin', async () => {
      const options = {
        method: 'GET',
        url: `${LOCALHOST}/users`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${context.adminJWT}`
        }
      }

      const result = await axios(options)
      const users = result.data.users
      // console.log(`users: ${util.inspect(users)}`)

      assert.isArray(users)
      assert.property(users[0], 'type')
      assert.property(users[0], '_id')
      assert.property(users[0], 'email')
    })
  })

  describe('GET /users/:id', () => {
    it('should not fetch user if token is invalid', async () => {
      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/users/1`,
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer 1'
          }
        }
        await axios.request(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should throw 401 if non-admin getting other user', async () => {
      const { token } = context

      try {
        const options = {
          method: 'GET',
          url: `${LOCALHOST}/users/1`,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
        await axios.request(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should fetch user if admin', async () => {
      const _id = context.id2

      const options = {
        method: 'GET',
        url: `${LOCALHOST}/users/${_id}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${context.adminJWT}`
        }
      }

      const result = await axios(options)
      const user = result.data.user
      // console.log(`user: ${util.inspect(user)}`)

      assert.property(user, 'type')
      assert.property(user, '_id')
      assert.property(user, 'email')

      assert.equal(user._id, _id)
      assert.notProperty(
        user,
        'password',
        'Password property should not be returned'
      )
    })
  })

  describe('PUT /users/:id', () => {
    it('should not update user if token is invalid', async () => {
      try {
        const options = {
          method: 'PUT',
          url: `${LOCALHOST}/users/1`,
          headers: {
            Authorization: 'Bearer 1'
          }
        }
        await axios.request(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should throw 401 if non-admin updating other user', async () => {
      const { token } = context
      const _id = context.id2

      try {
        const options = {
          method: 'PUT',
          url: `${LOCALHOST}/users/${_id}`,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
        await axios.request(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should update own user with minimum inputs', async () => {
      const _id = context.id2

      const options = {
        method: 'PUT',
        url: `${LOCALHOST}/users/${_id}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${context.token2}`
        },
        data: {
          user: { email: 'testToUpdate@test.com' }
        }
      }

      const result = await axios(options)
      const user = result.data.user
      // console.log(`user: ${util.inspect(user)}`)

      assert.hasAnyKeys(user, ['type', '_id', 'email'])
      assert.equal(user._id, _id)
      assert.notProperty(
        user,
        'password',
        'Password property should not be returned'
      )
      assert.equal(user.email, 'testToUpdate@test.com')
    })

    it('should not be able to update user type', async () => {
      try {
        const options = {
          method: 'PUT',
          url: `${LOCALHOST}/users/${context.user._id.toString()}`,
          headers: {
            Authorization: `Bearer ${context.token}`
          },
          data: {
            user: {
              name: 'new name',
              type: 'test'
            }
          }
        }

        const result = await axios(options)

        // console.log(`Users: ${JSON.stringify(result.data, null, 2)}`)

        assert(result.status === 200, 'Status Code 200 expected.')
        assert(result.data.user.type === 'user', 'Type should be unchanged.')
        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 422)
        assert.include(
          err.response.data,
          "Property 'type' just can change for Admin user"
        )
      }
    })

    it('should not be able to update other user when not admin', async () => {
      try {
        const options = {
          method: 'PUT',
          url: `${LOCALHOST}/users/${context.user2._id.toString()}`,
          headers: {
            Authorization: `Bearer ${context.token}`
          },
          data: {
            user: {
              name: 'This should not work'
            }
          }
        }

        const result = await axios(options)

        console.log(`result stringified: ${JSON.stringify(result, null, 2)}`)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should be able to update other user when admin', async () => {
      const adminJWT = context.adminJWT

      const options = {
        method: 'PUT',
        url: `${LOCALHOST}/users/${context.user2._id.toString()}`,
        headers: {
          Authorization: `Bearer ${adminJWT}`
        },
        data: {
          user: {
            name: 'This should work'
          }
        }
      }

      const result = await axios(options)
      // console.log(`result stringified: ${JSON.stringify(result, null, 2)}`)

      const userName = result.data.user.name
      assert.equal(userName, 'This should work')
    })

    it('should not be able to update if name property is wrong', async () => {
      try {
        const {
          user: { _id },
          token
        } = context

        const options = {
          method: 'PUT',
          url: `${LOCALHOST}/users/${_id}`,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          },
          data: {
            user: {
              email: 'testToUpdate@test.com',
              name: {}
            }
          }
        }

        await axios.request(options)
        // const result = await axios(options)

        assert.equal(true, false, 'unexpected result')
      } catch (error) {
        assert.equal(error.response.status, 422)
        assert.include(error.response.data, "Property 'name' must be a string!")
      }
    })

    it('should not be able to update if email property provided is wrong format', async () => {
      const {
        user: { _id },
        token
      } = context

      try {
        const options = {
          method: 'PUT',
          url: `${LOCALHOST}/users/${_id}`,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          },
          data: {
            user: {
              email: 'badEmailFormat'
            }
          }
        }
        await axios.request(options)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.equal(err.response.status, 422)
        assert.include(err.response.data, 'not a valid Email format')
      }
    })
  })

  describe('DELETE /users/:id', () => {
    it('should not delete user if token is invalid', async () => {
      try {
        const options = {
          method: 'DELETE',
          url: `${LOCALHOST}/users/1`,
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer 1'
          }
        }
        await axios.request(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should throw 401 if deleting other user', async () => {
      const { token } = context

      try {
        const options = {
          method: 'DELETE',
          url: `${LOCALHOST}/users/1`,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
        await axios.request(options)

        assert.equal(true, false, 'Unexpected behavior')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should not be able to delete other users unless admin', async () => {
      try {
        const options = {
          method: 'DELETE',
          url: `${LOCALHOST}/users/${context.user2._id.toString()}`,
          headers: {
            Authorization: `Bearer ${context.token}`
          }
        }

        const result = await axios(options)

        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.response.status, 401)
      }
    })

    it('should delete own user', async () => {
      const {
        user: { _id },
        token
      } = context

      const options = {
        method: 'DELETE',
        url: `${LOCALHOST}/users/${_id}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      }

      const result = await axios(options)
      // console.log(`result: ${util.inspect(result.data.success)}`)

      assert.equal(result.data.success, true)
    })

    it('should be able to delete other users when admin', async () => {
      const id = context.id2
      const adminJWT = context.adminJWT

      const options = {
        method: 'DELETE',
        url: `${LOCALHOST}/users/${id}`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${adminJWT}`
        }
      }

      const result = await axios(options)
      // console.log(`result: ${util.inspect(result.data)}`)

      assert.equal(result.data.success, true)
    })
  })
})
