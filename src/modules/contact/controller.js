/* eslint-disable no-useless-escape */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'


const NodeMailer =  require('../../lib/nodemailer')
const nodemailer =  new NodeMailer()

let _this

class Contact {
  constructor () {
    this.nodemailer = nodemailer
    _this = this
  }

  async email (ctx) {
    try {
      const data = ctx.request.body
      console.log(`data: ${JSON.stringify(data, null, 2)}`)

      const emailObj = data.obj
      // Validate input
      if (!emailObj.email || typeof emailObj.email !== 'string') {
        throw new Error('Property \'email\' must be a string!')
      }
      const isEmail = await _this.nodemailer.validateEmail(emailObj.email)

      if (!isEmail) {
        throw new Error('Property \'email\' must be email format!')
      }

      if (!emailObj.formMessage || typeof emailObj.formMessage !== 'string') {
        throw new Error('Property \'message\' must be a string!')
      }

      emailObj.subject = 'Contact Form'
      emailObj.to = 'chris@bchtest.net'

      await _this.nodemailer.sendEmail(emailObj)

      ctx.body = {
        success: true
      }
    } catch (err) {
      ctx.body = {
        success: false
      }
      // console.error(`Error: `, err)
      throw err
    }
  }
}
module.exports = Contact
