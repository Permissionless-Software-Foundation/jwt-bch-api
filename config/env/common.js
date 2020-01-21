/*
  This file is used to store unsecure, application-specific data common to all
  environments.
*/

module.exports = {
  port: process.env.PORT || 5001,
  jwtExpiration: '30 days', // Sets the default expiration time for newly issued JWT tokens.
  // jwtExpiration: '2 seconds'
  companyAddr: 'bitcoincash:qqpv6qzaawxsgxzqwx28auncr4xupx4njgll0uzw5h',
  // apiServer: 'http://localhost:3000/v3/',
  apiServer: 'https://api.fullstack.cash/v3/',
  apiJwt: process.env.BCHJSTOKEN
}
