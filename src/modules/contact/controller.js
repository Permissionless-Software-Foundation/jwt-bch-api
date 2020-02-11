/* eslint-disable no-useless-escape */
const nodemailer = require('nodemailer')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const config = require('../../../config')

let _this

class Contact {
  constructor () {
    this.config = config
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
      const isEmail = await _this.validateEmail(emailObj.email)

      if (!isEmail) {
        throw new Error('Property \'email\' must be email format!')
      }

      if (!emailObj.formMessage || typeof emailObj.formMessage !== 'string') {
        throw new Error('Property \'message\' must be a string!')
      }

      await _this.sendEmail(data.obj)

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

  // Handles the sending of data via email.
  async sendEmail (data) {
    try {
      // Validate input
      if (!data.email || typeof data.email !== 'string') {
        throw new Error('Property \'email\' must be a string!')
      }
      const isEmail = await _this.validateEmail(data.email)
      if (!isEmail) {
        throw new Error('Property \'email\' must be email format!')
      }

      if (!data.formMessage || typeof data.formMessage !== 'string') {
        throw new Error(`Property \'message\' must be a string!`)
      }
      // create reusable transporter object using the default SMTP transport
      const transporter = await _this.nodemailer.createTransport({
        host: 'box.bchtest.net',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'chris@bchtest.net', // generated ethereal user
          pass: _this.config.emailPassword // generated ethereal password
        }
      })
      // console.log(`transporter: ${JSON.stringify(transporter)}`)

      const msg = data.formMessage.replace(/(\r\n|\n|\r)/g, '<br />')

      const now = new Date()
      const htmlMsg = `
                    <h3>New Contact Form</h3>
                    <p>
                      time: ${now.toLocaleString()}<br />
                      name: ${data.name}<br />
                      email: ${data.email}<br />
                      message: ${msg}<br />
                    </p>
                    `

      // send mail with defined transport object
      const info = await transporter.sendMail({
        from: `${data.email}`, // sender address
        to: 'chris@bchtest.net', // list of receivers
        subject: 'bchjs.cash Contact Form', // Subject line
        // html: '<b>This is a test email</b>' // html body
        html: htmlMsg
      })
      console.log('Message sent: %s', info.messageId)
    } catch (err) {
      console.log(`Error in sendEmail()`)
      throw err
    }
  }
  // Validate email
  async validateEmail (email) {
    // eslint-disable-next-line no-useless-escape
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return (true)
    }
    return (false)
  }
}
module.exports = Contact
