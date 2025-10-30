const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Running test deployment to get working addresses...\n");

  const [owner] = await ethers.getSigners();
  console.log("📝 Deploying from account:", owner.address);

  const INITIAL_SUPPLY = ethers.parseEther("10000");

  // Deploy wDOI token (using custodial version)
  console.log("📦 Deploying wDOI token...");
  const WrappedDoichainCustodial = await ethers.getContractFactory("WrappedDoichainCustodial");
  const wdoiToken = await WrappedDoichainCustodial.deploy(owner.address, 1);
  
  // Setup wDOI token
  await wdoiToken.addCustodian(owner.address, "Test Custodian", "test_address");
  await wdoiToken.addMerchant(owner.address);
  await wdoiToken.requestMint(owner.address, INITIAL_SUPPLY, "test_tx_1", "test_custodian");
  await wdoiToken.confirmMint(1);

  const wdoiAddress = await wdoiToken.getAddress();
  console.log("✅ wDOI deployed to:", wdoiAddress);

  // Create mock USDT (using same contract type for simplicity)
  console.log("📦 Deploying Mock USDT token...");
  const usdtToken = await WrappedDoichainCustodial.deploy(owner.address, 1);
  await usdtToken.addCustodian(owner.address, "USDT Custodian", "usdt_address");
  await usdtToken.addMerchant(owner.address);
  await usdtToken.requestMint(owner.address, INITIAL_SUPPLY, "test_tx_2", "usdt_custodian");
  await usdtToken.confirmMint(1);

  const usdtAddress = await usdtToken.getAddress();
  console.log("✅ Mock USDT deployed to:", usdtAddress);

  // Deploy wDOI/USDT liquidity pool
  console.log("📦 Deploying wDOI/USDT pool...");
  const USDTPool = await ethers.getContractFactory("wDOIUSDTPool");
  const usdtPool = await USDTPool.deploy(wdoiAddress, usdtAddress, owner.address);

  const poolAddress = await usdtPool.getAddress();
  console.log("✅ Pool deployed to:", poolAddress);

  console.log("\n📋 Frontend addresses to update:");
  console.log("WDOI_TOKEN_ADDRESS =", `'${wdoiAddress}'`);
  console.log("USDT_TOKEN_ADDRESS =", `'${usdtAddress}'`);
  console.log("USDT_POOL_ADDRESS =", `'${poolAddress}'`);
  
  console.log("\n🎉 Test deployment completed!");
}

main().catch(console.error);