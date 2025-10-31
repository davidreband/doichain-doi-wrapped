const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying doichain-doi-wrapped to Sepolia testnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low ETH balance! Get more from https://sepoliafaucet.com/");
  }
  console.log("");

  const deployments = {};

  // 1. Deploy Mock USDT first
  console.log("1️⃣ Deploying Mock USDT...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();
  
  deployments.mockUSDT = {
    address: usdtAddress,
    deployer: deployer.address,
    network: hre.network.name,
    deploymentTime: new Date().toISOString()
  };
  
  console.log("✅ Mock USDT deployed to:", usdtAddress);
  console.log("");

  // 2. Deploy Custodial wDOI
  console.log("2️⃣ Deploying Custodial wDOI...");
  const requiredConfirmations = 2;
  const WrappedDoichainCustodial = await hre.ethers.getContractFactory("WrappedDoichainCustodial");
  const wdoiCustodial = await WrappedDoichainCustodial.deploy(deployer.address, requiredConfirmations);
  await wdoiCustodial.waitForDeployment();
  const wdoiAddress = await wdoiCustodial.getAddress();
  
  deployments.wdoiCustodial = {
    address: wdoiAddress,
    admin: deployer.address,
    requiredConfirmations: requiredConfirmations,
    deployer: deployer.address,
    network: hre.network.name,
    deploymentTime: new Date().toISOString()
  };
  
  console.log("✅ Custodial wDOI deployed to:", wdoiAddress);
  console.log("");

  // 3. Deploy USDT/wDOI Pool
  console.log("3️⃣ Deploying USDT/wDOI Pool...");
  const WDOIUSDTPool = await hre.ethers.getContractFactory("wDOIUSDTPool");
  const pool = await WDOIUSDTPool.deploy(wdoiAddress, usdtAddress, deployer.address);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  
  deployments.usdtPool = {
    address: poolAddress,
    wdoiToken: wdoiAddress,
    usdtToken: usdtAddress,
    owner: deployer.address,
    deployer: deployer.address,
    network: hre.network.name,
    deploymentTime: new Date().toISOString()
  };
  
  console.log("✅ USDT Pool deployed to:", poolAddress);
  console.log("");

  // 4. Setup initial permissions
  console.log("4️⃣ Setting up permissions...");
  
  // Add deployer as merchant and custodian for testing
  await wdoiCustodial.addMerchant(deployer.address);
  await wdoiCustodial.addCustodian(deployer.address, "Test Custodian", "DOI_test_address");
  
  console.log("✅ Added deployer as merchant and custodian");
  console.log("");

  // 5. Save deployment info
  const networkName = hre.network.name;
  const deploymentFile = `./deployments/${networkName}-deployment.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('./deployments')) {
    fs.mkdirSync('./deployments');
  }
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
  
  console.log("📄 Deployment info saved to:", deploymentFile);
  console.log("");

  // 6. Contract verification instructions
  console.log("🔍 To verify contracts on Etherscan:");
  console.log(`npx hardhat verify --network ${networkName} ${usdtAddress}`);
  console.log(`npx hardhat verify --network ${networkName} ${wdoiAddress} "${deployer.address}" ${requiredConfirmations}`);
  console.log(`npx hardhat verify --network ${networkName} ${poolAddress} "${wdoiAddress}" "${usdtAddress}" "${deployer.address}"`);
  console.log("");

  // 7. Next steps
  console.log("📋 Next steps:");
  console.log("1. Verify contracts on Etherscan (optional)");
  console.log("2. Add initial liquidity to the pool:");
  console.log(`   npx hardhat run scripts/add-testnet-liquidity.js --network ${networkName}`);
  console.log("3. Update frontend with new contract addresses");
  console.log("4. Test the full flow!");
  console.log("");

  console.log("🎉 Testnet deployment completed successfully!");
  
  return {
    mockUSDT: usdtAddress,
    wdoiCustodial: wdoiAddress,
    usdtPool: poolAddress,
    deployer: deployer.address,
    network: networkName
  };
}

// Handle deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });