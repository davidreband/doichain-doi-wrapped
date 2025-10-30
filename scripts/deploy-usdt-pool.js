const hre = require("hardhat");

async function main() {
  console.log("💵 Deploying wDOI/USDT Liquidity Pool...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Load wDOI token information
  const fs = require('fs');
  let wdoiAddress;
  
  // Check if wDOI contract is already deployed
  const custodialFile = `./deployments/${hre.network.name}-custodial.json`;
  const bridgeFile = `./deployments/${hre.network.name}.json`;
  
  if (fs.existsSync(custodialFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(custodialFile));
    wdoiAddress = deploymentInfo.contractAddress;
    console.log("✅ Found custodial wDOI contract:", wdoiAddress);
  } else if (fs.existsSync(bridgeFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(bridgeFile));
    wdoiAddress = deploymentInfo.contractAddress;
    console.log("✅ Found bridge wDOI contract:", wdoiAddress);
  } else {
    console.log("❌ No wDOI contract found. Please deploy wDOI first using:");
    console.log("   npx hardhat run scripts/deploy.js --network", hre.network.name);
    console.log("   or");
    console.log("   npx hardhat run scripts/deploy-custodial.js --network", hre.network.name);
    process.exit(1);
  }

  // USDT addresses for different networks
  const USDT_ADDRESSES = {
    mainnet: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT on Ethereum mainnet
    sepolia: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", // USDT on Sepolia (may vary)
    polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
    bsc: "0x55d398326f99059fF775485246999027B3197955", // USDT on BSC
    arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT on Arbitrum
    localhost: "0x1234567890123456789012345678901234567890" // Test address for localhost
  };

  let usdtAddress = USDT_ADDRESSES[hre.network.name];
  
  if (!usdtAddress) {
    console.log("❌ USDT address not configured for network:", hre.network.name);
    console.log("Available networks:", Object.keys(USDT_ADDRESSES));
    console.log("\nFor custom USDT address, update the script or provide via environment variable:");
    console.log("USDT_ADDRESS=0x... npx hardhat run scripts/deploy-usdt-pool.js --network", hre.network.name);
    
    // Check environment variable
    if (process.env.USDT_ADDRESS) {
      usdtAddress = process.env.USDT_ADDRESS;
      console.log("📝 Using USDT address from environment:", usdtAddress);
    } else {
      process.exit(1);
    }
  }

  console.log("💵 Using USDT address:", usdtAddress);
  console.log("");

  // Deploy wDOI/USDT liquidity pool
  console.log("📦 Deploying wDOIUSDTPool contract...");
  const USDTPool = await hre.ethers.getContractFactory("wDOIUSDTPool");
  const usdtPool = await USDTPool.deploy(wdoiAddress, usdtAddress, deployer.address);

  await usdtPool.waitForDeployment();
  const poolAddress = await usdtPool.getAddress();

  console.log("✅ wDOIUSDTPool deployed to:", poolAddress);
  console.log("");

  // Pool information
  console.log("📊 Pool Information:");
  console.log("   wDOI Token:", wdoiAddress);
  console.log("   USDT Token:", usdtAddress);
  console.log("   Pool Owner:", deployer.address);
  console.log("   LP Token Name:", await usdtPool.name());
  console.log("   LP Token Symbol:", await usdtPool.symbol());
  console.log("");

  // Get initial pool information
  const poolInfo = await usdtPool.getPoolInfo();
  console.log("💵 Initial Pool State:");
  console.log("   wDOI Reserve:", hre.ethers.formatEther(poolInfo[0]), "wDOI");
  console.log("   USDT Reserve:", hre.ethers.formatUnits(poolInfo[1], 6), "USDT"); // USDT has 6 decimals
  console.log("   LP Total Supply:", hre.ethers.formatEther(poolInfo[2]), "LP");
  console.log("   wDOI Price:", poolInfo[3] > 0 ? hre.ethers.formatUnits(poolInfo[3], 6) : "0", "USDT");
  console.log("");

  // Save deployment information
  const deploymentInfo = {
    network: hre.network.name,
    contractType: "usdt-liquidity-pool",
    poolAddress: poolAddress,
    wdoiAddress: wdoiAddress,
    usdtAddress: usdtAddress,
    owner: deployer.address,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    txHash: usdtPool.deploymentTransaction()?.hash,
    constructorArgs: [wdoiAddress, usdtAddress, deployer.address]
  };

  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}-usdt-pool.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`💾 USDT Pool deployment info saved to: ${deploymentsDir}/${hre.network.name}-usdt-pool.json`);
  console.log("");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 To verify the USDT pool contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${poolAddress} "${wdoiAddress}" "${usdtAddress}" "${deployer.address}"`);
    console.log("");
  }

  // Usage examples
  console.log("📋 Usage Examples:");
  console.log("");
  
  console.log("💧 Add Initial Liquidity (wDOI/USDT):");
  console.log(`   // Approve tokens first`);
  console.log(`   await wdoiToken.approve(poolAddress, ethers.parseEther("1000"));`);
  console.log(`   await usdtToken.approve(poolAddress, ethers.parseUnits("1000", 6));`);
  console.log(`   `);
  console.log(`   // Add liquidity`);
  console.log(`   await pool.addLiquidity(`);
  console.log(`     ethers.parseEther("1000"), // 1000 wDOI`);
  console.log(`     ethers.parseUnits("1000", 6), // 1000 USDT`);
  console.log(`     ethers.parseEther("990"),  // min wDOI (1% slippage)`);
  console.log(`     ethers.parseUnits("990", 6), // min USDT (1% slippage)`);
  console.log(`   );`);
  console.log("");
  
  console.log("🔄 Swap USDT for wDOI:");
  console.log(`   // Approve USDT first`);
  console.log(`   await usdtToken.approve(poolAddress, ethers.parseUnits("100", 6));`);
  console.log(`   `);
  console.log(`   // Execute swap`);
  console.log(`   await pool.swapUSDTForWDOI(`);
  console.log(`     ethers.parseUnits("100", 6), // 100 USDT input`);
  console.log(`     ethers.parseEther("95") // min 95 wDOI output (5% slippage)`);
  console.log(`   );`);
  console.log("");

  console.log("🔄 Swap wDOI for USDT:");
  console.log(`   // Approve wDOI first`);
  console.log(`   await wdoiToken.approve(poolAddress, ethers.parseEther("100"));`);
  console.log(`   `);
  console.log(`   // Execute swap`);
  console.log(`   await pool.swapWDOIForUSDT(`);
  console.log(`     ethers.parseEther("100"), // 100 wDOI input`);
  console.log(`     ethers.parseUnits("95", 6) // min 95 USDT output (5% slippage)`);
  console.log(`   );`);
  console.log("");

  // Next steps
  console.log("📋 Next Steps:");
  console.log("1. Approve wDOI and USDT tokens for the pool");
  console.log("2. Add initial liquidity to establish price");
  console.log("3. Test swapping functionality");
  console.log("4. Create frontend interface for USDT swaps");
  console.log("5. Integrate with existing MetaMask interface");
  console.log("6. Add multi-token support to frontend");
  console.log("");

  console.log("🎉 USDT Liquidity Pool deployment completed successfully!");
  console.log("💵 Users can now trade wDOI ↔ USDT through the AMM!");
  
  // Additional USDT information
  console.log("");
  console.log("ℹ️  Important Notes about USDT:");
  console.log("- USDT has 6 decimal places (not 18 like ETH)");
  console.log("- Make sure to use parseUnits(amount, 6) for USDT amounts");
  console.log("- USDT contract may have different behavior on different networks");
  console.log("- Always test on testnet before mainnet deployment");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ USDT Pool deployment failed:");
    console.error(error);
    process.exit(1);
  });