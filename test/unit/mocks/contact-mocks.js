/*
  Mocking data for unit tests.
*/

'use strict'

const contactMock = {
  accepted: [
    'chris@bchtest.net'
  ],
  rejected: [],
  envelopeTime: 637,
  messageTime: 355,
  messageSize: 587,
  response: '250 2.0.0 Ok: queued as 48Ggzr5Wdxz5q8H',
  envelope: {
    from: 'danielhumgon@gmail.com',
    to: [
      'chris@bchtest.net'
    ]
  },
  messageId: '<ba31f403-2f07-c7de-7365-6bd7b711e321@gmail.com>'
}

module.exports = {
  contactMock
}
