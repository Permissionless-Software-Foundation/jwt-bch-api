/*
  This file is used to store unsecure, application-specific data common to all
  environments.
*/

module.exports = {
  port: process.env.PORT || 5001,
  monthlyPrice: 0.05 // Monthly price for API access in USD.
}
