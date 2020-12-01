/*
  This file is used to store unsecure, application-specific data common to all
  environments.
*/

module.exports = {
  port: process.env.PORT || 5001,
  jwtAuthExpiration: '24 hours', // Sets the default expiration time for auth users
  jwtExpiration: '30 days', // Sets the default expiration time for newly issued JWT tokens.
  // jwtExpiration: '2 seconds',
  companyAddr: 'bitcoincash:qqsrke9lh257tqen99dkyy2emh4uty0vky9y0z0lsr', // PSF Burn address
  // apiServer: 'http://localhost:3000/v3/',
  apiServer: 'https://bchn.fullstack.cash/v3/',
  apiJwt: process.env.BCHJSTOKEN,
  emailLogin: process.env.EMAILLOGIN ? process.env.EMAILLOGIN : 'test@bchtest.net',
  emailPass: process.env.EMAILPASS ? process.env.EMAILPASS : 'testtest',
  tokenSecret: process.env.TOKENSECRET ? process.env.TOKENSECRET : 'secret-jwt-token',
  logPass: 'test',

  // Price in USD for a bch-js JWT token.
  apiTokenPrice: process.env.TOKENPRICE ? process.env.TOKENPRICE : 14.99
}
