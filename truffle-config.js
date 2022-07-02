const HDWalletProvider = require('truffle-hdwallet-provider')
const infuraKey = '771559fe394e4e8d9e71e9e237cfb746'
const fs = require('fs')
const mnemonic = fs.readFileSync('.secret').toString().trim()

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    /*development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },*/
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraKey}`),
      network_id: 3,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },
    compilers: {
      solc: {
        version: "pragma"
      }
   },
    develop: {
      port: 8545
    }
};
