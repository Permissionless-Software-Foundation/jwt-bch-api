const Validator = require('../../middleware/validators')
const validator = new Validator()

const ApiTokenController = require('./controller')
const apiTokenController = new ApiTokenController()

// export const baseUrl = '/users'
module.exports.baseUrl = '/apitoken'

module.exports.routes = [
  {
    method: 'GET',
    route: '/bchaddr/:id',
    handlers: [validator.ensureUser, apiTokenController.getBchAddr]
  },
  {
    method: 'POST',
    route: '/new',
    handlers: [validator.ensureUser, apiTokenController.newToken]
  },
  {
    method: 'POST',
    route: '/isvalid',
    handlers: [apiTokenController.isValid]
  },
  {
    method: 'GET',
    route: '/update-credit/:id',
    handlers: [validator.ensureUser, apiTokenController.updateCredit]
  },
  {
    method: 'GET',
    route: '/',
    handlers: [validator.ensureUser, apiTokenController.getExistingToken]
  }
]
