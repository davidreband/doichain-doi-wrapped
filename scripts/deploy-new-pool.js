const hre = require("hardhat");

async function main() {
  console.log("🔄 Deploying new wDOI/USDT pool with correct addresses...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);

  // Use existing wDOI contract as both wDOI and USDT for testing
  const wdoiAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const usdtAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Same contract for testing

  console.log("✅ Using wDOI contract:", wdoiAddress);
  console.log("✅ Using same contract as Mock USDT:", usdtAddress);

  // Deploy new wDOI/USDT pool
  console.log("📦 Deploying new wDOIUSDTPool contract...");
  const USDTPool = await hre.ethers.getContractFactory("wDOIUSDTPool");
  const newPool = await USDTPool.deploy(wdoiAddress, usdtAddress, deployer.address);

  await newPool.waitForDeployment();
  const newPoolAddress = await newPool.getAddress();

  console.log("✅ New wDOIUSDTPool deployed to:", newPoolAddress);
  console.log("");

  // Pool information
  console.log("📊 New Pool Information:");
  console.log("   wDOI Token:", wdoiAddress);
  console.log("   USDT Token:", usdtAddress);
  console.log("   Pool Address:", newPoolAddress);
  console.log("   Pool Owner:", deployer.address);
  console.log("");

  console.log("📋 Update frontend addresses:");
  console.log("   USDT_POOL_ADDRESS =", `'${newPoolAddress}'`);
  console.log("");

  console.log("🎉 New pool deployment completed!");
  console.log("⚠️  Remember to update the frontend with the new pool address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });