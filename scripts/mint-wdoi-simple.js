const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🪙 Minting wDOI tokens for testing...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  // Load deployment info
  const deploymentFile = `./deployments/sepolia-deployment.json`;
  const deployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  const wdoiCustodial = await hre.ethers.getContractAt("WrappedDoichainCustodial", deployments.wdoiCustodial.address);
  
  // Temporarily change required confirmations to 1 for easy testing
  console.log("⚙️ Changing required confirmations to 1 for testing...");
  await wdoiCustodial.setRequiredConfirmations(1);
  console.log("✅ Set required confirmations to 1");
  
  // Create mint request
  const mintAmount = hre.ethers.parseEther("1000");
  const doichainTxHash = "test_tx_hash_" + Date.now();
  const custodianAddress = "DOI_test_custodian_address";
  
  console.log("📝 Creating mint request...");
  const tx1 = await wdoiCustodial.requestMint(
    deployer.address,
    mintAmount,
    doichainTxHash,
    custodianAddress
  );
  await tx1.wait();
  console.log("✅ Created mint request");
  
  // Get the request ID
  const nextRequestId = await wdoiCustodial.nextMintRequestId();
  const requestId = nextRequestId - 1n;
  
  // Confirm with deployer (who is custodian)
  console.log("✅ Confirming mint request...");
  const tx2 = await wdoiCustodial.confirmMint(requestId);
  await tx2.wait();
  console.log("✅ Mint confirmed and executed!");
  
  // Check balance
  const balance = await wdoiCustodial.balanceOf(deployer.address);
  console.log("💰 wDOI balance:", hre.ethers.formatEther(balance), "wDOI");
  
  console.log("🎉 wDOI minting completed!");
}

main().catch(console.error);