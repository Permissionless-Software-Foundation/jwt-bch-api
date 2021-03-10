/*
  This script is used to manipulate user accounts, such as for system testing.
  use the `getUsers.js` program to get a list of users in the system. Use
  the `_id` for a particular user by setting USERID variable in this script.
  You can the rerieve and update that users DB model.
*/

const mongoose = require('mongoose')

const config = require('../../config')

const User = require('../../src/models/users')

const USEREMAIL = 'new123@test.com'

async function updateUser () {
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

    console.log(`Old user data: ${JSON.stringify(user, null, 2)}`)

    /* Edit these lines to manipulate the user model */
    user.credit = 100.0
    await user.save()

    console.log(`New user data: ${JSON.stringify(user, null, 2)}`)

    mongoose.connection.close()
  } catch (err) {
    console.log('Error: ', err)
  }
}
updateUser()
