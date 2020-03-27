
const assert = require('chai').assert

const JwtUtils = require('../../src/lib/jwt')
const jwtUtils = new JwtUtils()

describe('#jwt.js', () => {
  describe('#getExpiration', () => {
    it('should get an expiration date for a JWT token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlN2JiNjUxYjFkYWMyMzkxYmZmOWMxZSIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImFwaUxldmVsIjowLCJyYXRlTGltaXQiOjMsImlhdCI6MTU4NTE2NTkwNywiZXhwIjoxNTg3NzU3OTA3fQ.bpOQT3DzGfAZEU4NvwsiU61rRtNAxZfjo-a87Xq2l-U'

      const result = jwtUtils.getExpiration(token)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      // jwtUtils
      assert.isString(result)
    })
  })
})
