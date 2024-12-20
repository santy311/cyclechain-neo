require("@nomiclabs/hardhat-waffle");
require('@nomicfoundation/hardhat-verify');
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    'base-sepolia': {
      url: process.env.BASE_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    neoxMainnet: {
      url: "https://mainnet-1.rpc.banelabs.org",
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 40000000000,
      gas: 3000000
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      'base-sepolia': process.env.BASESCAN_API_KEY,
      'neox-mainnet': "any_non_empty_string"
    },
    customChains: [
      {
        network: "neox-mainnet",
        chainId: 47763,
        urls: {
          apiURL: "https://xexplorer.neo.org/api",
          browserURL: "https://xexplorer.neo.org"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
}; 