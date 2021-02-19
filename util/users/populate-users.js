/*
  This script is used to port users from an old installation into a new
  installation. This script expects a JSON file of all the old users. It
  will then create new users using this same information, for any user that
  has a credit higher than zero.
*/

const mongoose = require('mongoose')

const config = require('../../config')

const oldUsers = require('./test.json')

async function populateUsers () {
  try {
    // Connect to the Mongo Database.
    mongoose.Promise = global.Promise
    mongoose.set('useCreateIndex', true) // Stop deprecation warning.
    await mongoose.connect(config.database, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })

    // console.log(`oldUsers: ${JSON.stringify(oldUsers, null, 2)}`)

    if (!Array.isArray(oldUsers)) {
      throw new Error('oldUsers needs to be an array.')
    }

    const User = require('../../src/models/users')

    for (let i = 0; i < oldUsers.length; i++) {
      const thisUser = oldUsers[i]
      // console.log(`thisUser: ${JSON.stringify(thisUser, null, 2)}`)

      const user = new User(thisUser)

      await user.save()

      console.log(`Added user ${i}`)
    }

    await mongoose.connection.close()
  } catch (err) {
    console.log('Error in populateUsers(): ', err)
  }
}
populateUsers()
