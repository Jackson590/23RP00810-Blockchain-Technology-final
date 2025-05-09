require("@nomicfoundation/hardhat-toolbox");
// Optional: require("dotenv").config(); // For loading environment variables

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // Local development network
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Sepolia testnet (optional)
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    // Mainnet (optional)
    mainnet: {
      url: process.env.MAINNET_URL || "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
