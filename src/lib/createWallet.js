/*
  Generates a wallet for unit tests.
*/

const config = require('../../config')
const jsonUtils = require('./utils/json-files')

const walletFilename = `${__dirname.toString()}/../../config/wallet.json`

async function createWallet () {
  let walletInfo
  // Use hardcoded wallet for tests.
  if (config.env === 'test') {
    walletInfo = {
      network: 'mainnet',
      mnemonic:
        'reopen nuclear cloud resist video parrot dose flavor step lucky account muffin',
      derivation: 245,
      rootAddress: 'bitcoincash:qr9pnzql9ddh3lt3xcyefss0e7x70pr3ngzms6dun7',
      balance: 0,
      nextAddress: 1,
      hasBalance: []
    }

    await jsonUtils.writeJSON(walletInfo, walletFilename)
  } else {
    // Open wallet file for development or production.
    walletInfo = require(walletFilename)
  }
}

module.exports = createWallet
