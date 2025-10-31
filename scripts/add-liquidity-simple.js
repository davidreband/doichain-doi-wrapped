const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("💧 Adding liquidity to USDT/wDOI pool...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  // Load deployment info
  const deploymentFile = `./deployments/sepolia-deployment.json`;
  const deployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  const mockUSDT = await hre.ethers.getContractAt("MockUSDT", deployments.mockUSDT.address);
  const wdoiCustodial = await hre.ethers.getContractAt("WrappedDoichainCustodial", deployments.wdoiCustodial.address);
  const usdtPool = await hre.ethers.getContractAt("wDOIUSDTPool", deployments.usdtPool.address);

  // Check balances
  const usdtBalance = await mockUSDT.balanceOf(deployer.address);
  const wdoiBalance = await wdoiCustodial.balanceOf(deployer.address);
  
  console.log("💰 Current balances:");
  console.log("   USDT:", hre.ethers.formatUnits(usdtBalance, 6), "USDT");
  console.log("   wDOI:", hre.ethers.formatEther(wdoiBalance), "wDOI");
  console.log("");

  // Get more USDT from faucet
  console.log("1️⃣ Getting test USDT...");
  const usdtAmount = hre.ethers.parseUnits("1000", 6);
  await mockUSDT.faucet(deployer.address, usdtAmount);
  console.log("✅ Got 1000 USDT from faucet");

  // Approve tokens for pool
  console.log("2️⃣ Approving tokens for pool...");
  const wdoiToAdd = hre.ethers.parseEther("500"); // 500 wDOI
  const usdtToAdd = hre.ethers.parseUnits("500", 6); // 500 USDT
  
  await wdoiCustodial.approve(deployments.usdtPool.address, wdoiToAdd);
  await mockUSDT.approve(deployments.usdtPool.address, usdtToAdd);
  console.log("✅ Approved tokens for pool");

  // Add liquidity
  console.log("3️⃣ Adding liquidity to pool...");
  const minWDOI = hre.ethers.parseEther("490"); // 2% slippage
  const minUSDT = hre.ethers.parseUnits("490", 6); // 2% slippage
  
  const tx = await usdtPool.addLiquidity(wdoiToAdd, usdtToAdd, minWDOI, minUSDT);
  await tx.wait();
  console.log("✅ Added liquidity: 500 wDOI + 500 USDT");

  // Check pool status
  console.log("4️⃣ Pool status:");
  const poolInfo = await usdtPool.getPoolInfo();
  const wdoiPrice = await usdtPool.getWDOIPrice();
  
  console.log("   wDOI Reserve:", hre.ethers.formatEther(poolInfo[0]), "wDOI");
  console.log("   USDT Reserve:", hre.ethers.formatUnits(poolInfo[1], 6), "USDT");
  console.log("   LP Total Supply:", hre.ethers.formatEther(poolInfo[2]), "LP");
  console.log("   wDOI Price:", hre.ethers.formatUnits(wdoiPrice, 18), "USDT per wDOI");

  // Test swap
  console.log("5️⃣ Testing swap: 10 USDT → wDOI");
  const swapUSDT = hre.ethers.parseUnits("10", 6);
  const expectedWDOI = await usdtPool.getAmountOut(swapUSDT, poolInfo[1], poolInfo[0]);
  const minWDOIOut = expectedWDOI * 95n / 100n; // 5% slippage
  
  await mockUSDT.approve(deployments.usdtPool.address, swapUSDT);
  const swapTx = await usdtPool.swapUSDTForWDOI(swapUSDT, minWDOIOut);
  await swapTx.wait();
  console.log("✅ Swapped 10 USDT for", hre.ethers.formatEther(expectedWDOI), "wDOI");

  console.log("\n🎉 Liquidity setup completed successfully!");
  console.log("\n📋 Contract addresses for MetaMask:");
  console.log("   wDOI Token:", deployments.wdoiCustodial.address);
  console.log("   USDT Token:", deployments.mockUSDT.address);
  console.log("   Pool Address:", deployments.usdtPool.address);
}

main().catch(console.error);