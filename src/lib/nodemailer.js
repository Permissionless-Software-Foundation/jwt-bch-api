/*
  A library for controlling the sending email.
*/

'use strict'
const nodemailer = require('nodemailer')

const config = require('../../config')

const wlogger = require('./wlogger')

let _this

class NodeMailer {
  constructor () {
    this.nodemailer = nodemailer
    this.config = config

    _this = this
    _this.transporter = _this.createTransporter()
  }

  createTransporter () {
    const transporter = _this.nodemailer.createTransport({
      host: _this.config.emailServer,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: _this.config.emailUser, // generated ethereal user
        pass: _this.config.emailPassword // generated ethereal password
      }
    })
    return transporter
  }

  // Validate email
  async validateEmail (email) {
    // eslint-disable-next-line no-useless-escape
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return true
    }
    return false
  }

  // Handles the sending of data via email.
  async sendEmail (data) {
    try {
      // Validate input
      if (!data.email || typeof data.email !== 'string') {
        throw new Error("Property 'email' must be a string!")
      }
      const isEmail = await _this.validateEmail(data.email)
      if (!isEmail) {
        throw new Error("Property 'email' must be email format!")
      }

      if (!data.to || !Array.isArray(data.to)) {
        throw new Error("Property 'to' must be a array!")
      }

      await _this.validateEmailArray(data.to)

      if (!data.formMessage || typeof data.formMessage !== 'string') {
        throw new Error("Property 'message' must be a string!")
      }

      if (!data.subject || typeof data.subject !== 'string') {
        throw new Error("Property 'subject' must be a string!")
      }

      // create reusable transporter object using the default SMTP transport
      const transporter = await _this.nodemailer.createTransport({
        host: 'box.bchtest.net',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: _this.config.emailLogin,
          pass: _this.config.emailPass
        }
      })
      // console.log(`transporter: ${JSON.stringify(transporter)}`)

      const msg = data.formMessage.replace(/(\r\n|\n|\r)/g, '<br />')

      const now = new Date()

      const subject = data.subject
      const to = data.to

      const bodyJson = data
      delete bodyJson.to
      delete bodyJson.subject
      delete bodyJson.formMessage

      bodyJson.message = msg

      // Html body
      let htmlData = ''

      // maps the object and converts it into html format
      Object.keys(bodyJson).forEach(function (key) {
        htmlData += `${key}: ${bodyJson[key]}<br/>`
      })

      const htmlMsg = `<h3>New ${subject}</h3>
                             <p>
                               time: ${now.toLocaleString()}<br/>
                               ${htmlData}
                             </p>`

      // send mail with defined transport object
      const info = await transporter.sendMail({
        from: `${data.email}`, // sender address
        to: `${to}`, // list of receivers
        subject: `bchjs.cash ${subject}`, // Subject line
        // html: '<b>This is a test email</b>' // html body
        html: htmlMsg
      })

      console.log('Message sent: %s', info.messageId)

      return info
    } catch (err) {
      console.log('Error in sendEmail()')
      throw err
    }
  }

  async validateEmailArray (emailList) {
    try {
      if (!emailList || !Array.isArray(emailList)) {
        throw new Error("Property 'emailList' must be a array!")
      }
      //  Email list can't be empty
      if (!emailList.length > 0) {
        throw new Error("Property 'emailList' cant be empty!")
      }

      // Iterates the array and validates each email format
      const isValid = await new Promise(resolve => {
        emailList.map(async (value, i) => {
          const isEmail = await _this.validateEmail(value)

          if (!isEmail) {
            resolve(false)
          }
          if (i >= emailList.length - 1) {
            resolve(true)
          }
        })
      })

      if (!isValid) {
        throw new Error('Array must contain emails format!')
      }

      return true
    } catch (err) {
      wlogger.error('Error in lib/nodemailer.js/validateEmailArray()')
      throw err
    }
  }
}

module.exports = NodeMailer
