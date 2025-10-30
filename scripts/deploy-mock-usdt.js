const hre = require("hardhat");

async function main() {
  console.log("💰 Deploying Mock USDT...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy Mock USDT
  console.log("📦 Deploying MockUSDT contract...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();

  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();

  console.log("✅ MockUSDT deployed to:", usdtAddress);
  console.log("");

  // Token information
  console.log("📊 Token Information:");
  console.log("   Name:", await mockUSDT.name());
  console.log("   Symbol:", await mockUSDT.symbol());
  console.log("   Decimals:", await mockUSDT.decimals());
  
  const totalSupply = await mockUSDT.totalSupply();
  console.log("   Total Supply:", hre.ethers.formatUnits(totalSupply, 6), "USDT");
  console.log("   Owner:", await mockUSDT.owner());
  console.log("");

  // Save deployment information
  const deploymentInfo = {
    network: hre.network.name,
    contractType: "mock-usdt",
    contractAddress: usdtAddress,
    owner: deployer.address,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    txHash: mockUSDT.deploymentTransaction()?.hash,
    totalSupply: totalSupply.toString(),
    decimals: 6
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

  console.log(`💾 Mock USDT deployment info saved to: ${deploymentsDir}/${hre.network.name}-mock-usdt.json`);
  console.log("");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 To verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${usdtAddress}`);
    console.log("");
  }

  // Faucet examples
  console.log("🚰 Faucet Usage Examples:");
  console.log("");
  console.log("// Get 1000 USDT for testing");
  console.log(`await mockUSDT.faucet("${deployer.address}", ethers.parseUnits("1000", 6));`);
  console.log("");
  console.log("// In frontend JavaScript:");
  console.log(`await usdtContract.faucet(userAddress, ethers.utils.parseUnits("1000", 6));`);
  console.log("");

  console.log("🎉 Mock USDT deployment completed successfully!");
  console.log(`📋 Next: Update USDT_TOKEN_ADDRESS in frontend to: ${usdtAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Mock USDT deployment failed:");
    console.error(error);
    process.exit(1);
  });