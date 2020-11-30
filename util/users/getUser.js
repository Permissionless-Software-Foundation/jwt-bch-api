/*
  This script is used to get data on user accounts.
*/

const mongoose = require('mongoose')

const config = require('../../config')

const User = require('../../src/models/users')

const USEREMAIL = 'ken@sweet.io'

async function getUser () {
  try {
    // Connect to the Mongo Database.
    mongoose.Promise = global.Promise
    mongoose.set('useCreateIndex', true) // Stop deprecation warning.
    await mongoose.connect(
      config.database,
      { useNewUrlParser: true }
    )

    // const user = await User.findById(USERID, '-password')
    const user = await User.findOne({ email: USEREMAIL }, '-password')
    if (!user) {
      throw new Error(`Couldn't find user with email ${USEREMAIL}`)
    }

    console.log(`user data: ${JSON.stringify(user, null, 2)}`)

    mongoose.connection.close()
  } catch (err) {
    console.log('Error: ', err)
  }
}
getUser()
