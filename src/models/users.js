const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
// const jwt = require('jsonwebtoken')

const config = require('../../config')
const wlogger = require('../lib/wlogger')
const JwtUtils = require('../lib/jwt')

const jwtUtils = new JwtUtils()

const User = new mongoose.Schema({
  type: { type: String, default: 'user' },
  name: { type: String },
  username: { type: String },
  password: { type: String, required: true },

  apiToken: { type: String },
  apiTokenExp: { type: String },
  apiLevel: { type: Number, default: 0 }, // Access level. 0 = public access.
  rateLimit: { type: Number, default: 3 }, // Requests per minute
  bchAddr: { type: String, defaut: '' }, // BCH address.
  hdIndex: { type: Number, default: 1 }, // Index in the hd wallet associated with this user.
  satBal: { type: Number, default: 0 }, // balance of BCH in satoshis
  credit: { type: Number, default: 0 }, // account credit in USD.

  // Newer properties for finer-grained rate limits with bch-api
  rpmLimit: { type: Number, default: 20 },
  duration: { type: Number, default: 30 },

  email: {
    type: String,
    required: true,
    unique: true
    // validate: {
    //   validator: function (email) {
    //     // eslint-disable-next-line no-useless-escape
    //     return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
    //   },
    //   message: props => `${props.value} is not a valid Email format!`
    // }
  }
})

User.pre('save', function preSave (next) {
  try {
    const user = this

    if (!user.isModified('password')) {
      return next()
    }

    new Promise((resolve, reject) => {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          return reject(err)
        }
        resolve(salt)
      })
    })
      .then(salt => {
        bcrypt.hash(user.password, salt, (err, hash) => {
          if (err) {
            throw new Error(err)
          }

          user.password = hash

          next(null)
        })
      })
      .catch(err => next(err))
  } catch (err) {
    wlogger.error('Error in models/users.js/pre-save()')
    throw err
  }
})

User.methods.validatePassword = function validatePassword (password) {
  try {
    const user = this

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return reject(err)
        }

        resolve(isMatch)
      })
    })
  } catch (err) {
    wlogger.error('Error in models/users.js/validatePassword()')
    throw err
  }
}

User.methods.generateToken = function generateToken () {
  try {
    const user = this

    // const jwtOptions = {
    //   expiresIn: config.jwtExpiration
    //   // algorithm: 'ES256'
    // }
    // // const token = jwt.sign({ id: user.id }, config.token)
    //
    // const jwtPayload = {
    //   id: user.id,
    //   apiLevel: user.apiLevel,
    //   rateLimit: user.rateLimit
    // }
    //
    // const token = jwt.sign(jwtPayload, config.tokenSecret, jwtOptions)
    // // console.log(`config.token: ${config.token}`)
    // // console.log(`generated token: ${token}`)
    // return token

    // JWT expiration time for auth users
    const expTime = config.jwtAuthExpiration
    return jwtUtils.generateToken(user, expTime)
  } catch (err) {
    // console.log('err: ', err)
    wlogger.error('Error in models/user.js/generateToken()')
    throw err
  }
}

// export default mongoose.model('user', User)
module.exports = mongoose.model('user', User)
