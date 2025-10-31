const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔍 Checking mint requests status...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  // Load deployment info
  const deploymentFile = `./deployments/localhost-deployment.json`;
  const deployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  const wdoiCustodial = await hre.ethers.getContractAt("WrappedDoichainCustodial", deployments.wdoiCustodial.address);
  
  // Check next request ID
  const nextRequestId = await wdoiCustodial.nextMintRequestId();
  console.log("📋 Next mint request ID:", nextRequestId.toString());
  
  // Check existing requests
  for (let i = 1; i < nextRequestId; i++) {
    try {
      const request = await wdoiCustodial.mintRequests(i);
      console.log(`📝 Request ${i}:`);
      console.log("   To:", request.to);
      console.log("   Amount:", hre.ethers.formatEther(request.amount), "wDOI");
      console.log("   Confirmations:", request.confirmations.toString());
      console.log("   Executed:", request.executed);
      console.log("");
    } catch (error) {
      console.log(`❌ Request ${i}: Not found or error`);
    }
  }
  
  // Check balances
  const wdoiBalance = await wdoiCustodial.balanceOf(deployer.address);
  console.log("💰 Current wDOI balance:", hre.ethers.formatEther(wdoiBalance), "wDOI");
}

main().catch(console.error);