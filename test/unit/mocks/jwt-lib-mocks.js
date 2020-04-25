
const user = {
  type: 'user',
  apiLevel: 30,
  rateLimit: 3,
  hdIndex: 3,
  satBal: 0,
  credit: 89.99999812499976,
  _id: '5ea45f208ab149285ff3bde3',
  email: 'test@test.com',
  password: '$2a$10$oRNx6u.gTe31S6smv8W88OY0NW8vusqaZT8jGNSffbr0ncdWfgoSS',
  bchAddr: 'bitcoincash:qpjflglhgfkvg55d6e4l43wzj6ywak7dqyhuvx7l74',
  __v: 0,
  apiToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlYTQ1ZjIwOGFiMTQ5Mjg1ZmYzYmRlMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImFwaUxldmVsIjozMCwicmF0ZUxpbWl0IjozLCJpYXQiOjE1ODc4MzA1NjIsImV4cCI6MTU5MDQyMjU2Mn0.5edOfJSU9TLQYowVKE170ZjQ7E5QdA5dJahcfxVJu1A',
  apiTokenExp: '2020-05-25T16:02:42.000Z'
}

const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlN2JiNjUxYjFkYWMyMzkxYmZmOWMxZSIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImFwaUxldmVsIjowLCJyYXRlTGltaXQiOjMsImlhdCI6MTU4NTE2NTkwNywiZXhwIjoxNTg3NzU3OTA3fQ.bpOQT3DzGfAZEU4NvwsiU61rRtNAxZfjo-a87Xq2l-U'

const invalidSigJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlODhhY2JmMDIyMWMxMDAxMmFkOTNmZiIsImVtYWlsIjoiY2hyaXMudHJvdXRuZXJAZ21haWwuY29tIiwiYXBpTGV2ZWwiOjQwLCJyYXRlTGltaXQiOjMsImlhdCI6MTU4NzgyNTEyNSwiZXhwIjoxNTkwNDE3MTI1fQ.Ce-BhlFVZnHhz-ZW85eGk6o-0iJri4ZHCH7dMF20dhQ'

module.exports = {
  user,
  expiredJwt,
  invalidSigJwt
}
