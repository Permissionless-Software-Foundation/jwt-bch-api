// Public npm libraries.
const jwt = require("jsonwebtoken");
const BchUtil = require("bch-util");

// Local libraries.
const User = require("../../models/users");
const apiTokenLib = require("../../lib/api-token");
const config = require("../../../config");

const JwtLib = require("../../lib/jwt");
const jwtLib = new JwtLib();

const wlogger = require("../../lib/wlogger");

// Business logic library for dealing with BCH.
const BCH = require("../../lib/bch");
const bch = new BCH();

const BCHJS = require("@psf/bch-js");

// This app is intended to run on the same machine as the mainnet bch-api REST API.
const bchjs = new BCHJS({ restURL: config.apiServer, apiToken: config.apiJwt });

const NodeMailer = require("../../lib/nodemailer");
const nodemailer = new NodeMailer();

let _this;

class ApiTokenController {
  constructor() {
    this.bchjs = bchjs;
    this.bch = bch;
    this.jwtLib = jwtLib;
    this.nodemailer = nodemailer;
    this.config = config;
    this.bchUtil = new BchUtil({ bchjs: this.bchjs });

    _this = this;
  }

  /**
   * @api {get} /apitoken/bchaddr/:id Get BCH payment address for user by user id
   * @apiPermission user
   * @apiName GetBchAddr
   * @apiGroup API Token
   *
   * @apiDescription The endpoint is used to get a payment BCH address for the user.
   * Payment for this user account can be sent to address returned by this endpoint.
   * However, the update-credit endpoint needs to be called afterward to convert
   * the BCH into account credit.
   */
  //
  // Given a user GUID, return the BCH payment address for that user.
  async getBchAddr(ctx, next) {
    try {
      // Get user data
      const user = await User.findById(ctx.params.id, "-password");
      if (!user) {
        ctx.throw(404);
      }
      // wlogger.error(`user: ${JSON.stringify(user, null, 2)}`)

      // Return the BCH address
      ctx.body = {
        bchAddr: user.bchAddr
      };
    } catch (err) {
      if (err === 404 || err.name === "CastError") {
        ctx.throw(404);
      }

      wlogger.error("Error in apitoken/controller.js/getBchAddr()", err);
      ctx.throw(500);
    }

    if (next) {
      return next();
    }
  }

  /**
   * @api {post} /apitoken/new Request a new JWT token for accessing the API.
   * @apiPermission user
   * @apiName GetApiToken
   * @apiGroup API Token
   *
   * @apiDescription This endpoint is used to request a new JWT token for accessing
   * bch-api. This endpoint will automatically calculate a refund and
   * credit the account for an old JWT token, *before* issuing a new JWT token
   * and debiting the account for the new JWT token.
   *
   * CT 3/7/21: Not yet implemented
   * Body parameters:
   * - apiLevel: 0 or 40, to signal legacy teir (free or paid)
   * - rpmLimit: 100, 250, or 600
   *   - Must have apiLevel set to 40.
   * - duration: The value for the expiration data of the JWT token.
   *   - 10: 24 hours
   *   - 20: 1 week
   *   - 30: 1 month (default)
   */
  // Request a new API JWT token.
  async newToken(ctx, next) {
    // Assumed values:
    // 0 = anonymous
    // 40 = Full Access ($14.99)
    // TODO: Add 20% discount if paid in BCHA or PSF tokens.
    try {
      console.log(
        `ctx.request.body: ${JSON.stringify(ctx.request.body, null, 2)}`
      );
      let newApiLevel = ctx.request.body.apiLevel;
      console.log(`Requesting API level: ${newApiLevel}`);

      let pointsToConsume = Number(ctx.request.body.pointsToConsume);
      if (!pointsToConsume) pointsToConsume = 100; // Default value.
      console.log(`Points to consume: ${pointsToConsume}`);
      console.log(
        `RPM rate limit will be: ${Math.floor(10000 / pointsToConsume)}`
      );

      let duration = ctx.request.body.duration;
      if (!duration) duration = 30; // Default value
      console.log(`JWT duration tier: ${duration}`);

      // Throw error if apiLevel is not included.
      if ((newApiLevel !== 0 && !newApiLevel) || isNaN(newApiLevel)) {
        ctx.throw(422, "apiLevel must be an integer number");
      }

      // Force newApiLevel to be an integer.
      newApiLevel = Math.round(newApiLevel);

      // Get user data
      const user = ctx.state.user;
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)
      // console.log(`old credit: ${user.credit}`)

      // If the user already has a JWT token, calculate a refund for the time
      // they've paid for.
      if (user.apiLevel > 10) {
        const refund = _this._calculateRefund(user);

        console.log(`refund: ${refund}`);

        user.credit += refund;
      }

      const apiTokenPrice = _this._getTokenPrice(newApiLevel);
      console.log(`apiTokenPrice: ${apiTokenPrice}`);

      // Check against balance.
      if (user.credit < apiTokenPrice) {
        ctx.throw(402, "Not enough credit");
      }

      // Deduct credit for the new token.
      if (newApiLevel > 10) {
        user.credit = user.credit - apiTokenPrice;

        // Round to the nearest cent
        user.credit = _this.bchUtil.util.round2(user.credit);
      }
      console.log(`user.credit after new token: ${user.credit}`);

      // Set the new API level
      // Dev note: this must be done before generating a new token.
      user.apiLevel = newApiLevel;

      // TODO: These properties need more control and tests
      user.pointsToConsume = pointsToConsume;
      user.duration = duration;

      // Generate new JWT token.
      const token = apiTokenLib.generateToken(user);
      // console.log(`token: ${token}`)

      const tokenExp = jwtLib.getExpiration(token);

      // Update the user model in the DB with the new token.
      user.apiToken = token;
      user.apiTokenExp = tokenExp;

      // Update the user data in the DB.
      try {
        // console.log(`new user data: ${JSON.stringify(user, null, 2)}`)
        await user.save();
      } catch (err) {
        ctx.throw(422, err.message);
      }

      // Return the BCH address
      ctx.body = {
        apiToken: token,
        apiTokenExp: tokenExp,
        apiLevel: newApiLevel,
        credit: user.credit
      };
    } catch (err) {
      if (err.status) ctx.throw(err.status, err.message);

      wlogger.error("Error in apitoken/controller.js/newToken()", err);
      ctx.throw(500);
    }

    if (next) {
      return next();
    }
  }

  _getTokenPrice(apiLevel) {
    console.log(`apiLevel: ${apiLevel}`);

    // Default
    let apiTokenPrice = 9.99;

    switch (apiLevel) {
      case 40:
        apiTokenPrice = 9.99;
        break;
      case 50:
        apiTokenPrice = 19.99;
        break;
      case 60:
        apiTokenPrice = 29.99;
        break;
      default:
        apiTokenPrice = 9.99;
    }

    return apiTokenPrice;
  }

  // Calculates the refund, to be credited before generating a new JWT token.
  _calculateRefund(user) {
    try {
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)

      // Refund 0 if existing JWT token was free.
      const oldApiLevel = user.apiLevel;
      if (oldApiLevel < 11) {
        return 0;
      }

      const decoded = jwt.decode(user.apiToken);
      // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

      // Expiration date recorded in the JWT token.
      const exp = decoded.exp;

      let now = new Date();
      now = now / 1000;

      // Calculate the time difference in days.
      let diff = exp - now;
      diff = diff * 1000; // Convert back to JS Date.
      diff = diff / (1000 * 60 * 60 * 24); // Convert to days.
      // console.log(`Time left: ${diff} days`)

      const apiTokenPrice = _this._getTokenPrice(user.apiLevel);

      let refund = (diff / 30) * apiTokenPrice;

      // Handle negative amounts.
      if (refund < 0) refund = 0;

      // Round to the nearest cent.
      refund = this.bchUtil.util.round2(refund);

      wlogger.info(`refunding ${refund} dollars`);

      return refund;
    } catch (err) {
      console.error("Error in apiToken controller.js/_calculateRefund()");
      throw err;
    }
  }

  /**
   * @api {post} /isvalid Check if JWT is valid
   * @apiPermission public
   * @apiName isValid
   * @apiGroup API Token
   *
   * @apiDescription This endpoint is used by api.fullstack.cash to validate
   * a JWT token and ensure it has permission to access the requested tier and
   * rate limits.
   */
  // Expects an API JWT token as input and returns true or false if it's valid.
  async isValid(ctx, next) {
    // false by default.
    const outObj = {
      isValid: false,
      apiLevel: 0
    };

    try {
      const token = ctx.request.body.token;
      // console.log(`token: ${token}`)

      if (!token) throw new Error("Token could not be found in POST body.");

      // Validate the JWT token.
      const decoded = jwt.verify(token, config.tokenSecret);
      // console.log(`decoded: ${JSON.stringify(decoded, null, 2)}`)

      // Get user data
      const user = await User.findById(decoded.id, "-password");
      if (!user) {
        ctx.throw(404);
      }
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)

      // If the provided JWT does match what's in the user model, then the
      // provided JWT has been replaced and is no longer valid.
      if (user.apiToken !== token) {
        ctx.body = outObj;
        return;
      }

      // If an error was not thrown, then the token is valid.
      outObj.isValid = true;
      outObj.apiLevel = user.apiLevel;

      wlogger.debug(
        `valid: true, apiLevel: ${outObj.apiLevel}, JWT: ${token.slice(
          -6
        )}, user: ${user.username}`
      );

      ctx.body = outObj;
    } catch (err) {
      wlogger.debug("Error in apitoken/isValid(). Returning false.");
      // If any error is thrown, return false, indicating the JWT token is invalid.
      ctx.body = outObj;
    }

    if (next) {
      return next();
    }
  }

  /**
   * @api {get} /update-credit/:id Update the credit for a a user account
   * @apiPermission user
   * @apiName UpdateCredit
   * @apiGroup API Token
   *
   * @apiDescription This endpoint is used to convert BCH into account credit.
   * The BCH address provided by the /bchaddr/:id endpoint is checked for a
   * balance. If a balance is found, the BCH is moved to the company wallet and
   * the user account is credited with the market-value of BCH in USD.
   */
  async updateCredit(ctx, next) {
    try {
      // Get user data
      const user = await User.findById(ctx.params.id, "-password");
      if (!user) {
        ctx.throw(404);
      }

      // console.log(`user: ${JSON.stringify(user, null, 2)}`)
      console.log(`user starting credit: ${user.credit}`);

      // Get the BCH balance of the users BCH address.
      // const balance = await _this.bchjs.Blockbook.balance(user.bchAddr)
      const fulcrumBalance = await _this.bchjs.Electrumx.balance(user.bchAddr);
      console.log(`fulcrumBalance: ${JSON.stringify(fulcrumBalance, null, 2)}`);
      const balance =
        fulcrumBalance.balance.confirmed + fulcrumBalance.balance.unconfirmed;
      console.log(`balance: ${JSON.stringify(balance, null, 2)}`);

      // let totalBalance =
      //   Number(balance.balance) + Number(balance.unconfirmedBalance)
      let totalBalance = balance;

      // Return existing credit if totalBalance is zero.
      if (totalBalance === 0) {
        console.log("totalBalance is zero. Returning zero credit.");
        ctx.body = user.credit;
        return;
      }

      // Convert the balance from satoshis to BCH
      totalBalance = _this.bchjs.BitcoinCash.toBitcoinCash(totalBalance);

      // Get the price of BCH in USD
      const bchPrice = await _this.bchjs.Price.getUsd();
      // bchPrice = bchPrice / 100
      console.log(`price: ${bchPrice}`);

      // Calculate the amount of credit.
      const newCredit = bchPrice * totalBalance;
      const oldCredit = user.credit;

      user.credit = user.credit + newCredit;

      // round to the nearest cent.
      user.credit = _this.bchUtil.util.round2(user.credit);

      // Execute some code here to sweep funds from the users address into the
      // company wallet.
      // Don't let errors disrupt the UX, by using a try/catch.
      let txid = "";
      try {
        txid = await _this.bch.queueTransaction(user.hdIndex);
        wlogger.info(`Fund successfully swept. TXID: ${txid}`);
      } catch (err) {
        wlogger.error("Failed to sweep user funds to burn address: ", err);
      }

      // Only update user model or send the email if the transaction succeeded.
      // This can happen if this API endpoint is called twice rapidly, and
      // the indexer hasn't had a chance to update its state.
      if (txid) {
        // Update the user data in the DB.
        try {
          await user.save();
        } catch (err) {
          ctx.throw(422, err.message);
        }

        // Attempt to send an email, but don't let errors disrupt the flow of
        // this function.
        try {
          await _this._sendEmail(txid);
          wlogger.info(`Tokens burned, Email sent for txid: ${txid}`);
        } catch (err) {
          wlogger.error(`Failed to send email for txid: ${txid}`, err);
        }
      } else {
        console.log("Error processing transaction. Original user credit used.");
        user.credit = oldCredit;
      }

      console.log(`user ending credit: ${user.credit}`);

      // Return the updated credit.
      ctx.body = user.credit;
    } catch (err) {
      console.log("Error in updateCredit()...");
      if (err.messsage && err.message.indexOf("No utxos found") > -1) {
        ctx.throw(
          409,
          "UTXO not found. Try again in a minute or send additional BCH."
        );
      }

      if (err === 404 || err.name === "CastError") {
        ctx.throw(404);
      }

      wlogger.error("Error in apitoken/controller.js/updateCredit()", err);
      ctx.throw(500, "Wait a couple minutes before trying again.");
    }

    if (next) {
      return next();
    }
  }

  async _sendEmail(txid) {
    try {
      const msg = `
      PSF tokens burned from FullStack user. TXID:
      <a href="https://explorer.bitcoin.com/bch/tx/${txid}">${txid}</a>
      `;

      // Send email notification
      const data = {
        formMessage: msg,
        subject: "Tokens burned",
        email: config.emailLogin,
        to: [config.emailLogin]
      };

      await _this.nodemailer.sendEmail(data);
    } catch (err) {
      wlogger.error("Error in apitoken/controller.js/_sendEmail().");
      throw err;
    }
  }

  /**
   * @api {get} / Get existing API token for user
   * @apiPermission user
   * @apiName GetToken
   * @apiGroup API Token
   *
   * @apiDescription This endpoint is used to retrieve the current API JWT token
   * issued to the user.
   *
   * @apiExample {js} Example usage:
   * const user = await loginUser()
   *
   * const options = {
   *   method: "get",
   *   url: "http://localhost:5001/apitoken/",
   *   headers: { Authorization: `Bearer ${user.token}` }
   * }
   *
   * const response = await axios.request(options)
   * console.log(response.data.apiToken)
   * // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVlMzEwNTBjMzdjMGQyM2MwZmIxYjFiYyIsImlhdCI6MTU4MDI3MjI1NiwiZXhwIjoxNTgyODY0MjU2fQ.E4je3pFpp1PRgTyKQ-HK1KIsrBLCXm8OhrHXwewl2Ak"
   */
  async getExistingToken(ctx, next) {
    try {
      // Get user data
      const user = ctx.state.user;
      // console.log(`user: ${JSON.stringify(user, null, 2)}`)

      // If user has not yet generated an API token.
      if (!user.apiToken) {
        ctx.body = {
          apiToken: false
        };

        // Normal path
      } else {
        ctx.body = {
          apiToken: user.apiToken
        };
      }
    } catch (err) {
      if (err.status) ctx.throw(err.status, err.message);

      wlogger.error("Error in apitoken/controller.js/getExistingToken()", err);
      ctx.throw(500);
    }

    if (next) {
      return next();
    }
  }
}

module.exports = ApiTokenController;
