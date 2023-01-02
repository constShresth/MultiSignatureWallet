require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  gasReporter:{
    enabled:true,
    currency:"INR",
    noColors:true,
    outputFile:"gasReport.txt",
    coinmarketcap:"a1f1c4b1-22f1-4d42-8d52-8b852acaff78",
    token: "matic"
  }
};
