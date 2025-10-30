const hre = require("hardhat");

async function main() {
  console.log("💰 Quick deploy Mock USDT using custodial contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);

  // Deploy second custodial contract as mock USDT
  const WrappedDoichainCustodial = await hre.ethers.getContractFactory("WrappedDoichainCustodial");
  const mockUSDT = await WrappedDoichainCustodial.deploy(deployer.address, 1);
  
  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();

  console.log("✅ Mock USDT deployed to:", usdtAddress);

  // Setup mock USDT
  await mockUSDT.addCustodian(deployer.address, "Mock USDT Custodian", "mock_usdt");
  await mockUSDT.addMerchant(deployer.address);
  
  // Mint 1 million Mock USDT
  const mintAmount = hre.ethers.parseEther("1000000");
  await mockUSDT.requestMint(deployer.address, mintAmount, "initial_mint", "mock_usdt");
  await mockUSDT.confirmMint(1);

  console.log("💰 Minted 1,000,000 Mock USDT to deployer");
  console.log("");
  console.log("📋 Update frontend USDT_TOKEN_ADDRESS to:", usdtAddress);
  console.log("🎉 Mock USDT ready!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });