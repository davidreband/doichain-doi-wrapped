const hre = require("hardhat");

async function main() {
  console.log("💰 Deploying Mock USDT (using custodial contract)...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);

  // Deploy custodial contract as mock USDT
  const WrappedDoichainCustodial = await hre.ethers.getContractFactory("WrappedDoichainCustodial");
  const mockUSDT = await WrappedDoichainCustodial.deploy(deployer.address, 1);
  
  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();

  console.log("✅ Mock USDT deployed to:", usdtAddress);

  // Setup mock USDT
  await mockUSDT.addCustodian(deployer.address, "Mock USDT Custodian", "mock_usdt");
  await mockUSDT.addMerchant(deployer.address);
  
  // Mint 1 million USDT (using 18 decimals like our mock)
  const mintAmount = hre.ethers.parseEther("1000000");
  await mockUSDT.requestMint(deployer.address, mintAmount, "initial_mint", "mock_usdt");
  await mockUSDT.confirmMint(1);

  console.log("💰 Minted 1,000,000 Mock USDT to deployer");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractType: "mock-usdt",
    contractAddress: usdtAddress,
    owner: deployer.address,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    txHash: mockUSDT.deploymentTransaction()?.hash
  };

  const fs = require('fs');
  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}-mock-usdt.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`💾 Saved deployment info to: ${deploymentsDir}/${hre.network.name}-mock-usdt.json`);
  console.log("");
  console.log("🎉 Mock USDT ready for testing!");
  console.log(`📋 Update frontend USDT_TOKEN_ADDRESS to: ${usdtAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });