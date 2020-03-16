
const assert = require('chai').assert

const JwtUtils = require('../../src/lib/jwt')
const jwtUtils = new JwtUtils()

describe('#jwt.js', () => {
  describe('#getExpiration', () => {
    it('should get an expiration date for a JWT token', () => {
      const token = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlNmZmZDk5ZTBiNGYxNWJlZmJiYTIyMSIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImFwaUxldmVsIjo0MCwicmF0ZUxpbWl0IjozLCJpYXQiOjE1ODQzOTc3MjQsImV4cCI6MTU4Njk4OTcyNH0.OAzBhlpK6eSOo2KPJMn0i8gfrfYL5iyCwntNFDSFoiRfsSbpC-3a8OilKrZ1B3GM6cAxu1hTzvX3YRyVIP1tOQ'

      const result = jwtUtils.getExpiration(token)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      // jwtUtils
      assert.isString(result)
    })
  })
})
