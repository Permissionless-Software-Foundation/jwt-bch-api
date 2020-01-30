/*
  These are the environment settings for the DEVELOPMENT environment.
  This is the environment run by default with `npm start` if KOA_ENV is not
  specified.
*/

module.exports = {
  session: 'secret-boilerplate-token',
  // token: 'secret-jwt-token',
  privateKey: '5e821b0fe2fb1529d7b0a2ab0fb5533a7e7893d0bcfa1fc7ef1f3ee5a4842a5a', // Hexadecimal
  publicKey: '03e6c358092a459f7da9420de770eef3e16cf3c9c54a3d3d14ac2d7f0b82af4d7d', // Hexadecimal
  database: 'mongodb://localhost:27017/jwt-fullstack-dev',
  env: 'dev'
}
