const User = require('../../models/users')
const util = require('../../lib/utils/json-files')

const wlogger = require('../../lib/wlogger')

const GetAddress = require('slp-cli-wallet/src/commands/get-address')
const getAddress = new GetAddress()

const walletFilename = `${__dirname}/../../../config/wallet.json`
// const validator = require('koa-validate').Validator

/**
 * @api {post} /users Create a new user
 * @apiPermission
 * @apiName CreateUser
 * @apiGroup Users
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X POST -d '{ "user": { "username": "johndoe", "password": "secretpasas" } }' localhost:5000/users
 *
 * @apiParam {Object} user          User object (required)
 * @apiParam {String} user.username Username.
 * @apiParam {String} user.password Password.
 *
 * @apiSuccess {Object}   users           User object
 * @apiSuccess {ObjectId} users._id       User id
 * @apiSuccess {String}   user.type       User type (admin or user)
 * @apiSuccess {String}   users.name      User name
 * @apiSuccess {String}   users.username  User username
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "user": {
 *          "_id": "56bd1da600a526986cf65c80"
 *          "name": "John Doe"
 *          "username": "johndoe"
 *       }
 *     }
 *
 * @apiError UnprocessableEntity Missing required parameters
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 422 Unprocessable Entity
 *     {
 *       "status": 422,
 *       "error": "Unprocessable Entity"
 *     }
 */

async function createUser (ctx) {
  try {
    const user = new User(ctx.request.body.user)

    // Enforce default value of 'user'
    user.type = 'user'

    // Get the HD index for the next wallet address.
    const walletData = await util.readJSON(walletFilename)
    // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)
    user.hdIndex = walletData.nextAddress

    // Generate a BCH address for this user.
    user.bchAddr = await getAddress.getAddress(walletFilename)

    try {
      await user.save()
    } catch (err) {
      console.error(`Error: could not save user!`)
      ctx.throw(422, err.message)
    }

    const token = user.generateToken()
    const response = user.toJSON()

    delete response.password

    ctx.body = {
      user: response,
      token
    }
  } catch (err) {
    wlogger.error(`Error in modules/user/controller.js/createUser()`)
    throw err
  }
}

/**
 * @api {get} /users Get all users
 * @apiPermission user
 * @apiName GetUsers
 * @apiGroup Users
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X GET localhost:5000/users
 *
 * @apiSuccess {Object[]} users           Array of user objects
 * @apiSuccess {ObjectId} users._id       User id
 * @apiSuccess {String}   user.type       User type (admin or user)
 * @apiSuccess {String}   users.name      User name
 * @apiSuccess {String}   users.username  User username
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "users": [{
 *          "_id": "56bd1da600a526986cf65c80"
 *          "name": "John Doe"
 *          "username": "johndoe"
 *       }]
 *     }
 *
 * @apiUse TokenError
 */
async function getUsers (ctx) {
  const users = await User.find({}, '-password')
  ctx.body = { users }
}

/**
 * @api {get} /users/:id Get user by id
 * @apiPermission user
 * @apiName GetUser
 * @apiGroup Users
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X GET localhost:5000/users/56bd1da600a526986cf65c80
 *
 * @apiSuccess {Object}   users           User object
 * @apiSuccess {ObjectId} users._id       User id
 * @apiSuccess {String}   user.type       User type (admin or user)
 * @apiSuccess {String}   users.name      User name
 * @apiSuccess {String}   users.username  User username
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "user": {
 *          "_id": "56bd1da600a526986cf65c80"
 *          "name": "John Doe"
 *          "username": "johndoe"
 *       }
 *     }
 *
 * @apiUse TokenError
 */

async function getUser (ctx, next) {
  try {
    const user = await User.findById(ctx.params.id, '-password')
    if (!user) {
      ctx.throw(404)
    }

    ctx.body = {
      user
    }
  } catch (err) {
    if (err === 404 || err.name === 'CastError') {
      ctx.throw(404)
    }

    ctx.throw(500)
  }

  if (next) {
    return next()
  }
}

/**
 * @api {put} /users/:id Update a user
 * @apiPermission
 * @apiName UpdateUser
 * @apiGroup Users
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X PUT -d '{ "user": { "name": "Cool new Name" } }' localhost:5000/users/56bd1da600a526986cf65c80
 *
 * @apiParam {Object} user          User object (required)
 * @apiParam {String} user.name     Name.
 * @apiParam {String} user.username Username.
 *
 * @apiSuccess {Object}   users           User object
 * @apiSuccess {ObjectId} users._id       User id
 * @apiSuccess {String}   user.type      User type (admin or user)
 * @apiSuccess {String}   users.name      Updated name
 * @apiSuccess {String}   users.username  Updated username
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "user": {
 *          "_id": "56bd1da600a526986cf65c80"
 *          "name": "Cool new name"
 *          "username": "johndoe"
 *       }
 *     }
 *
 * @apiError UnprocessableEntity Missing required parameters
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 422 Unprocessable Entity
 *     {
 *       "status": 422,
 *       "error": "Unprocessable Entity"
 *     }
 *
 * @apiUse TokenError
 */
async function updateUser (ctx) {
  const user = ctx.body.user

  // Save a copy of the original user type.
  const userType = user.type

  Object.assign(user, ctx.request.body.user)

  // Unless the calling user is an admin, they can not change the user type.
  if (userType !== 'admin') {
    user.type = userType
  }

  await user.save()

  ctx.body = {
    user
  }
}

/**
 * @api {delete} /users/:id Delete a user
 * @apiPermission
 * @apiName DeleteUser
 * @apiGroup Users
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X DELETE localhost:5000/users/56bd1da600a526986cf65c80
 *
 * @apiSuccess {StatusCode} 200
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true
 *     }
 *
 * @apiUse TokenError
 */

async function deleteUser (ctx) {
  const user = ctx.body.user

  await user.remove()

  ctx.status = 200
  ctx.body = {
    success: true
  }
}

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
}
