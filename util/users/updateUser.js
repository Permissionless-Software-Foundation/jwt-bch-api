/*
  This script is used to manipulate user accounts, such as for system testing.
  use the `getUsers.js` program to get a list of users in the system. Use
  the `_id` for a particular user by setting USERID variable in this script.
  You can the rerieve and update that users DB model.
*/

const mongoose = require('mongoose')

const config = require('../../config')

const User = require('../../src/models/users')

const USERID = `5e4ed49894d34a6c2c154173`

async function updateUser () {
  try {
    // Connect to the Mongo Database.
    mongoose.Promise = global.Promise
    mongoose.set('useCreateIndex', true) // Stop deprecation warning.
    await mongoose.connect(
      config.database,
      { useNewUrlParser: true }
    )

    const user = await User.findById(USERID, '-password')
    if (!user) {
      throw new Error(`Couldn't find user with ID ${USERID}`)
    }

    console.log(`Old user data: ${JSON.stringify(user, null, 2)}`)

    /* Edit these lines to manipulate the user model */
    user.credit = 100.0
    await user.save()

    console.log(`New user data: ${JSON.stringify(user, null, 2)}`)

    mongoose.connection.close()
  } catch (err) {
    console.log(`Error: `, err)
  }
}
updateUser()
