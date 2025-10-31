const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("💧 Adding initial liquidity to USDT/wDOI pool on testnet...\n");

  // Get deployer account and second account for custodian
  const [deployer, custodian2] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  // Load deployment info
  const networkName = hre.network.name;
  const deploymentFile = `./deployments/${networkName}-deployment.json`;
  
  if (!fs.existsSync(deploymentFile)) {
    console.log("❌ Deployment file not found:", deploymentFile);
    console.log("Please run deploy-testnet.js first");
    return;
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  console.log("📄 Using deployment info:");
  console.log("   Mock USDT:", deployments.mockUSDT.address);
  console.log("   wDOI Custodial:", deployments.wdoiCustodial.address);
  console.log("   USDT Pool:", deployments.usdtPool.address);
  console.log("");

  // Get contract instances
  const mockUSDT = await hre.ethers.getContractAt("MockUSDT", deployments.mockUSDT.address);
  const wdoiCustodial = await hre.ethers.getContractAt("WrappedDoichainCustodial", deployments.wdoiCustodial.address);
  const usdtPool = await hre.ethers.getContractAt("wDOIUSDTPool", deployments.usdtPool.address);

  // Check initial balances
  const usdtBalance = await mockUSDT.balanceOf(deployer.address);
  const wdoiBalance = await wdoiCustodial.balanceOf(deployer.address);
  
  console.log("💰 Current balances:");
  console.log("   USDT:", hre.ethers.formatUnits(usdtBalance, 6), "USDT");
  console.log("   wDOI:", hre.ethers.formatEther(wdoiBalance), "wDOI");
  console.log("");

  // Step 1: Mint new wDOI tokens
  console.log("1️⃣ Minting wDOI tokens...");
  
  // Add second custodian
  try {
    await wdoiCustodial.addCustodian(custodian2.address, "Second Custodian", "DOI_test_address_2");
    console.log("✅ Added second custodian");
  } catch (error) {
    console.log("ℹ️ Second custodian already exists");
  }
  
  // Create mint request
  const mintAmount = hre.ethers.parseEther("1000");
  const doichainTxHash = "test_tx_hash_" + Date.now();
  const custodianAddress = "DOI_test_custodian_address";
  
  const tx1 = await wdoiCustodial.requestMint(
    deployer.address,
    mintAmount,
    doichainTxHash,
    custodianAddress
  );
  await tx1.wait();
  console.log("✅ Created mint request");
  
  // Confirm with first custodian
  const tx2 = await wdoiCustodial.confirmMint(1);
  await tx2.wait();
  console.log("✅ First custodian confirmation");
  
  // Use second account as second custodian 
  const tx3 = await wdoiCustodial.connect(custodian2).confirmMint(1);
  await tx3.wait();
  console.log("✅ Second custodian confirmation - tokens minted!");
  
  // Step 2: Get test USDT from faucet
  console.log("2️⃣ Getting test USDT...");
  const usdtAmount = hre.ethers.parseUnits("1000", 6); // 1000 USDT
  await mockUSDT.faucet(deployer.address, usdtAmount);
  console.log("✅ Got 1000 USDT from faucet");
  console.log("");

  // Step 3: Approve tokens for pool
  console.log("3️⃣ Approving tokens for pool...");
  
  const wdoiToAdd = hre.ethers.parseEther("500"); // 500 wDOI
  const usdtToAdd = hre.ethers.parseUnits("500", 6); // 500 USDT
  
  await wdoiCustodial.approve(deployments.usdtPool.address, wdoiToAdd);
  await mockUSDT.approve(deployments.usdtPool.address, usdtToAdd);
  
  console.log("✅ Approved tokens for pool");
  console.log("");

  // Step 4: Add liquidity
  console.log("4️⃣ Adding liquidity to pool...");
  
  const minWDOI = hre.ethers.parseEther("490"); // 2% slippage
  const minUSDT = hre.ethers.parseUnits("490", 6); // 2% slippage
  
  const tx4 = await usdtPool.addLiquidity(
    wdoiToAdd,
    usdtToAdd,
    minWDOI,
    minUSDT
  );
  await tx4.wait();
  
  console.log("✅ Added liquidity: 500 wDOI + 500 USDT");
  console.log("");

  // Step 5: Check pool status
  console.log("5️⃣ Pool status:");
  const poolInfo = await usdtPool.getPoolInfo();
  const wdoiPrice = await usdtPool.getWDOIPrice();
  
  console.log("   wDOI Reserve:", hre.ethers.formatEther(poolInfo[0]), "wDOI");
  console.log("   USDT Reserve:", hre.ethers.formatUnits(poolInfo[1], 6), "USDT");
  console.log("   LP Total Supply:", hre.ethers.formatEther(poolInfo[2]), "LP");
  console.log("   wDOI Price:", hre.ethers.formatUnits(wdoiPrice, 18), "USDT per wDOI");
  console.log("");

  // Step 6: Test a small swap
  console.log("6️⃣ Testing swap: 10 USDT → wDOI");
  
  const swapUSDT = hre.ethers.parseUnits("10", 6); // 10 USDT
  const expectedWDOI = await usdtPool.getAmountOut(swapUSDT, poolInfo[1], poolInfo[0]);
  const minWDOIOut = expectedWDOI * 95n / 100n; // 5% slippage
  
  await mockUSDT.approve(deployments.usdtPool.address, swapUSDT);
  const tx5 = await usdtPool.swapUSDTForWDOI(swapUSDT, minWDOIOut);
  await tx5.wait();
  
  console.log("✅ Swapped 10 USDT for", hre.ethers.formatEther(expectedWDOI), "wDOI");
  console.log("");

  // Final balances
  const finalUSDT = await mockUSDT.balanceOf(deployer.address);
  const finalWDOI = await wdoiCustodial.balanceOf(deployer.address);
  const lpBalance = await usdtPool.balanceOf(deployer.address);
  
  console.log("💰 Final balances:");
  console.log("   USDT:", hre.ethers.formatUnits(finalUSDT, 6), "USDT");
  console.log("   wDOI:", hre.ethers.formatEther(finalWDOI), "wDOI");
  console.log("   LP tokens:", hre.ethers.formatEther(lpBalance), "LP");
  console.log("");

  console.log("🎉 Liquidity setup completed successfully!");
  console.log("");
  console.log("📋 Ready for frontend testing:");
  console.log("   1. Update frontend with contract addresses");
  console.log("   2. Connect MetaMask to Sepolia network");
  console.log("   3. Import test tokens to MetaMask");
  console.log("   4. Test trading wDOI ↔ USDT");
  console.log("");
  
  return {
    success: true,
    poolReserves: {
      wdoi: hre.ethers.formatEther(poolInfo[0]),
      usdt: hre.ethers.formatUnits(poolInfo[1], 6)
    },
    price: hre.ethers.formatUnits(wdoiPrice, 18)
  };
}

// Handle execution
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Liquidity setup failed:", error);
    process.exit(1);
  });