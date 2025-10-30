// Simple deployment script using ethers v5 syntax
async function main() {
  console.log("🏗️ Deploying fresh wDOI/USDT pool...\n");

  // Use ethers v5 syntax
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);

  // Use existing wDOI contract as both tokens for testing
  const wdoiAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  console.log("✅ Using wDOI contract:", wdoiAddress);
  console.log("✅ Using same contract as Mock USDT for testing");

  // Deploy pool
  const USDTPool = await ethers.getContractFactory("wDOIUSDTPool");
  const pool = await USDTPool.deploy(wdoiAddress, wdoiAddress, deployer.address);
  
  await pool.deployed(); // v5 syntax
  console.log("✅ Pool deployed to:", pool.address);

  console.log("\n📋 Update frontend:");
  console.log("USDT_POOL_ADDRESS =", `'${pool.address}'`);
  console.log("\n🎉 Deployment completed!");
}

main().catch(console.error);