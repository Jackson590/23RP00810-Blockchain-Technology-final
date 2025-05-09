// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
const hre = require("hardhat");

async function main() {
  console.log("Deploying FarmProduceSaleLog contract...");

  // Get the contract factory
  const FarmProduceSaleLog = await hre.ethers.getContractFactory("FarmProduceSaleLog");
  
  // Deploy the contract
  const farmProduceSaleLog = await FarmProduceSaleLog.deploy();

  // Wait for the contract to be deployed
  await farmProduceSaleLog.waitForDeployment();

  // Get the contract address
  const contractAddress = await farmProduceSaleLog.getAddress();
  
  console.log(`FarmProduceSaleLog deployed to: ${contractAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });