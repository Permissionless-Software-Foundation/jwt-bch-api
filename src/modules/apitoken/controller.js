const User = require('../../models/users')

/**
 * @api {get} /apitoken/:id Get BCH payment address for user by user id
 * @apiPermission public
 * @apiName GetBchAddr
 * @apiGroup API Token
 *
 * @apiExample Example usage:
 * curl -H "Content-Type: application/json" -X GET localhost:5001/apitoken/56bd1da600a526986cf65c80
 *
 * @apiSuccess {Object}   bchAddr         String
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "bchAddr": "bitcoincash:qr9pnzql9ddh3lt3xcyefss0e7x70pr3ngzms6dun7"
 *     }
 */

// Given a user GUID, return the BCH payment address for that user.
async function getBchAddr (ctx, next) {
  try {
    // Get user data
    const user = await User.findById(ctx.params.id, '-password')
    if (!user) {
      ctx.throw(404)
    }
    // console.log(`user: ${JSON.stringify(user, null, 2)}`)

    // Return the BCH address
    ctx.body = {
      bchAddr: user.bchAddr
    }
  } catch (err) {
    if (err === 404 || err.name === 'CastError') {
      ctx.throw(404)
    }

    console.log(`Error in apitoken/controller.js/getBchAddr()`, err)
    ctx.throw(500)
  }

  if (next) {
    return next()
  }
}

module.exports = {
  getBchAddr
}
