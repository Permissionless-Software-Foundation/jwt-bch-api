const config = require('../../config')
const rp = require('request-promise')
const assert = require('chai').assert
const sinon = require('sinon')

// Mock data
// const mockData = require('./mocks/contact-mocks')

const LOCALHOST = `http://localhost:${config.port}`

// Instantiate the Class for testing with mocking
const ContactController = require('../../src/modules/contact/controller')
const contactController = new ContactController()

describe('Contact', () => {
  let sandbox

  before(async () => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('sendEmail()', () => {
    it('should throw error if email property is not provided', async () => {
      try {
        const data = {
          formMessage: 'test',
          name: 'test'
        }
        await contactController.sendEmail(data)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Property \'email\' must be a string!')
      }
    })
    it('should throw error if email property is wrong format', async () => {
      try {
        const data = {
          email: 'test',
          formMessage: 'test',
          name: 'test'
        }
        await contactController.sendEmail(data)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Property \'email\' must be email format!')
      }
    })
    it('should throw error if formMessage property is not provided', async () => {
      try {
        const data = {
          email: 'test@email.com',
          name: 'test'
        }
        await contactController.sendEmail(data)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Property \'message\' must be a string!')
      }
    })
  })
  describe('POST /contact/email', () => {
    it('should throw error if email property is not provided', async () => {
      try {
        const options = {
          method: 'POST',
          uri: `${LOCALHOST}/contact/email`,
          resolveWithFullResponse: true,
          json: true,
          body: { obj: {
            formMessage: 'message'
          }

          }
        }

        let result = await rp(options)

        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        console.log(`result stringified: ${JSON.stringify(result, null, 2)}`)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.statusCode, 500)
        assert.include(err.message, 'Property \'email\' must be a string!')
      }
    })
    it('should throw error if email property is wrong format', async () => {
      try {
        const options = {
          method: 'POST',
          uri: `${LOCALHOST}/contact/email`,
          resolveWithFullResponse: true,
          json: true,
          body: { obj: {
            email: 'email',
            formMessage: 'test message'
          }

          }
        }

        let result = await rp(options)

        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        console.log(`result stringified: ${JSON.stringify(result, null, 2)}`)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.statusCode, 500)
        assert.include(err.message, 'Property \'email\' must be email format!')
      }
    })
    it('should throw error if formMessage property is not provided', async () => {
      try {
        const options = {
          method: 'POST',
          uri: `${LOCALHOST}/contact/email`,
          resolveWithFullResponse: true,
          json: true,
          body: { obj: {
            email: 'email@email.com'
          }

          }
        }

        let result = await rp(options)

        console.log(`result: ${JSON.stringify(result, null, 2)}`)

        // console.log(`result stringified: ${JSON.stringify(result, null, 2)}`)
        assert(false, 'Unexpected result')
      } catch (err) {
        assert.equal(err.statusCode, 500)
        assert.include(err.message, 'Property \'message\' must be a string!')
      }
    })
    /*I presented problems here trying to use sandbox in this test*/
    /*it('should send email with  all input', async () => {
      // Mock live network calls.

      sandbox.stub(
        contactController.transporter, 'sendMail')
        .resolves(mockData)

      try {
        const options = {
          method: 'POST',
          uri: `${LOCALHOST}/contact/email`,
          resolveWithFullResponse: true,
          json: true,
          body: {
            obj: {
              email: 'email@email.com',
              formMessage: 'test email',
              name: 'test name'
            }
          }
        }

        await rp(options)
      } catch (err) {
        // console.log(err)
        assert(false, 'Unexpected result')
      }
    }) */
  })
})
