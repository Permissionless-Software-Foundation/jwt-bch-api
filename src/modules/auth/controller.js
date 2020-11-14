const passport = require('koa-passport')
const getToken = require('../../lib/auth')
const JWTLIB = require('../../lib/jwt')
const jwtLib = new JWTLIB()

let _this
class Auth {
  constructor () {
    _this = this
    this.passport = passport
    this.getToken = getToken
    this.jwtLib = jwtLib
  }
  /**
 * @apiDefine TokenError
 * @apiError Unauthorized Invalid JWT token
 *
 * @apiErrorExample {json} Unauthorized-Error:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "status": 401,
 *       "error": "Unauthorized"
 *     }
 */

  /**
 * @api {post} /auth Authenticate user
 * @apiName AuthUser
 * @apiGroup Auth
 *
 * @apiParam {String} username  User username.
 * @apiParam {String} password  User password.
 *
 * @apiExample {js} JavaScript Example:
 * const options = {
 *   method: "POST",
 *   url: `http://localhost:5001/auth`,
 *   data: {
 *     email: "test@test.com",
 *     password: "test"
 *   }
 * };
 *
 * const result = await axios.request(options);
 * console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`);
 * //   {
 * //     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlMzEwNTBjMzdjMGQyM2MwZmIxYjFiYyIsImlhdCI6MTU4MDI3MjI2Mn0.FZM2cvsz_szMR9nNWVQhZ5o_7rV9Lq1l8xE9zMrZ7JQ",
 * //     "user": {
 * //     "type": "user",
 * //     "apiLevel": 0,
 * //     "satBal": 0,
 * //     "credit": 0,
 * //     "_id": "5e31050c37c0d23c0fb1b1bc",
 * //     "email": "test@test.com",
 * //     "hdIndex": 8,
 * //     "bchAddr": "bitcoincash:qrr2antjd287pf4gzcnhkx9stfnswm5acumhergkl4",
 * //     "__v": 0,
 * //     "apiToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlMzEwNTBjMzdjMGQyM2MwZmIxYjFiYyIsImlhdCI6MTU4MDI3MjI1NiwiZXhwIjoxNTgyODY0MjU2fQ.E4je3pFpp1PRgTyKQ-HK1KIsrBLCXm8OhrHXwewl2Ak"
 * //   }
 *
 * @apiExample {curl} curl Example:
 * curl -H "Content-Type: application/json" -X POST -d '{ "username": "johndoe@gmail.com", "password": "foo" }' localhost:5000/auth
 *
 * @apiSuccess {Object}   user           User object
 * @apiSuccess {ObjectId} user._id       User id
 * @apiSuccess {String}   user.name      User name
 * @apiSuccess {String}   user.username  User username
 * @apiSuccess {String}   token          Encoded JWT
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "user": {
 *          "_id": "56bd1da600a526986cf65c80"
 *          "username": "johndoe"
 *        },
 *       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"
 *     }
 *
 * @apiError Unauthorized Incorrect credentials
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "status": 401,
 *       "error": "Unauthorized"
 *     }
 */
  async authUser (ctx, next) {
    try {
      return _this.passport.authenticate('local', (err, user) => {
        if (err) throw err

        if (!user) {
          ctx.throw(401)
        }

        const token = user.generateToken()

        const response = user.toJSON()

        delete response.password

        ctx.body = {
          token,
          user: response
        }
      })(ctx, next)
    } catch (error) {
      ctx.throw(401)
    }
  }

  // returns the expiration time of a token
  async getExpirationDate (ctx) {
    try {
      const token = _this.getToken(ctx)
      const exp = _this.jwtLib.getExpiration(token)

      const now = new Date().toISOString()

      ctx.body = {
        exp,
        now
      }
    } catch (error) {
      ctx.throw(500)
    }
  }
}
module.exports = Auth
