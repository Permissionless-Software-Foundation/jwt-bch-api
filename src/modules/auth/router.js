// import * as auth from './controller'
const CONTROLLER = require('./controller')
const controller = new CONTROLLER()

const validator = require('../../middleware/validators')

// export const baseUrl = '/auth'
module.exports.baseUrl = '/auth'

// export default [
module.exports.routes = [
  {
    method: 'POST',
    route: '/',
    handlers: [controller.authUser]
  },
  {
    method: 'GET',
    route: '/expiration',
    handlers: [
      validator.ensureUser,
      controller.getExpirationDate
    ]
  }
]
