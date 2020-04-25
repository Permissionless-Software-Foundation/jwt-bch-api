// const validator = require('../../middleware/validators')
const LogApi = require('./controller')
const logApi = new LogApi()

module.exports.baseUrl = '/logapi'

module.exports.routes = [
  {
    method: 'POST',
    route: '/',
    handlers: [logApi.getLogs]
  }
]
