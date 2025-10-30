const hre = require("hardhat");

async function main() {
  console.log("🏊 Deploying wDOI Liquidity Pool...\n");

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

  // Deploy liquidity pool
  console.log("📦 Deploying wDOILiquidityPool contract...");
  const LiquidityPool = await hre.ethers.getContractFactory("wDOILiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(wdoiAddress, deployer.address);

  await liquidityPool.waitForDeployment();
  const poolAddress = await liquidityPool.getAddress();

  console.log("✅ wDOILiquidityPool deployed to:", poolAddress);
  console.log("");

  // Pool information
  console.log("📊 Pool Information:");
  console.log("   wDOI Token:", wdoiAddress);
  console.log("   Pool Owner:", deployer.address);
  console.log("   LP Token Name:", await liquidityPool.name());
  console.log("   LP Token Symbol:", await liquidityPool.symbol());
  console.log("");

  // Get initial pool information
  const poolInfo = await liquidityPool.getPoolInfo();
  console.log("🏊 Initial Pool State:");
  console.log("   wDOI Reserve:", hre.ethers.formatEther(poolInfo[0]), "wDOI");
  console.log("   ETH Reserve:", hre.ethers.formatEther(poolInfo[1]), "ETH");
  console.log("   LP Total Supply:", hre.ethers.formatEther(poolInfo[2]), "LP");
  console.log("   wDOI Price:", poolInfo[3] > 0 ? hre.ethers.formatEther(poolInfo[3]) : "0", "ETH");
  console.log("");

  // Save deployment information
  const deploymentInfo = {
    network: hre.network.name,
    contractType: "liquidity-pool",
    poolAddress: poolAddress,
    wdoiAddress: wdoiAddress,
    owner: deployer.address,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    txHash: liquidityPool.deploymentTransaction()?.hash,
    constructorArgs: [wdoiAddress, deployer.address]
  };

  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}-pool.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`💾 Pool deployment info saved to: ${deploymentsDir}/${hre.network.name}-pool.json`);
  console.log("");

  // Frontend configuration update
  updateFrontendConfig(wdoiAddress, poolAddress);

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 To verify the pool contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${poolAddress} "${wdoiAddress}" "${deployer.address}"`);
    console.log("");
  }

  // Usage examples
  console.log("📋 Usage Examples:");
  console.log("");
  
  console.log("💧 Add Initial Liquidity:");
  console.log(`   await pool.addLiquidity(`);
  console.log(`     ethers.parseEther("1000"), // 1000 wDOI`);
  console.log(`     ethers.parseEther("10"),   // 10 ETH`);
  console.log(`     ethers.parseEther("990"),  // min wDOI (1% slippage)`);
  console.log(`     ethers.parseEther("9.9"),  // min ETH (1% slippage)`);
  console.log(`     { value: ethers.parseEther("10") }`);
  console.log(`   );`);
  console.log("");
  
  console.log("🔄 Swap ETH for wDOI:");
  console.log(`   await pool.swapETHForWDOI(`);
  console.log(`     ethers.parseEther("95"), // min 95 wDOI output (5% slippage)`);
  console.log(`     { value: ethers.parseEther("1") } // 1 ETH input`);
  console.log(`   );`);
  console.log("");

  console.log("📱 Frontend Integration:");
  console.log(`   Open frontend/index.html and update contract addresses:`);
  console.log(`   WDOI_TOKEN_ADDRESS = "${wdoiAddress}"`);
  console.log(`   LIQUIDITY_POOL_ADDRESS = "${poolAddress}"`);
  console.log("");

  // Next steps
  console.log("📋 Next Steps:");
  console.log("1. Add initial liquidity to the pool");
  console.log("2. Test swapping functionality");
  console.log("3. Update frontend with correct contract addresses");
  console.log("4. Deploy to a web server or IPFS");
  console.log("5. Test with MetaMask on testnet");
  console.log("6. Add pool to popular DEX aggregators");
  console.log("");

  console.log("🎉 Liquidity Pool deployment completed successfully!");
  console.log("🌐 Users can now buy wDOI directly with ETH through MetaMask!");
}

function updateFrontendConfig(wdoiAddress, poolAddress) {
  try {
    const fs = require('fs');
    const frontendPath = './frontend/index.html';
    
    if (fs.existsSync(frontendPath)) {
      let content = fs.readFileSync(frontendPath, 'utf8');
      
      // Update contract addresses
      content = content.replace(
        /const WDOI_TOKEN_ADDRESS = '[^']*'/,
        `const WDOI_TOKEN_ADDRESS = '${wdoiAddress}'`
      );
      
      content = content.replace(
        /const LIQUIDITY_POOL_ADDRESS = '[^']*'/,
        `const LIQUIDITY_POOL_ADDRESS = '${poolAddress}'`
      );
      
      fs.writeFileSync(frontendPath, content);
      console.log("✅ Frontend configuration updated with contract addresses");
    }
  } catch (error) {
    console.log("⚠️  Could not update frontend config:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Pool deployment failed:");
    console.error(error);
    process.exit(1);
  });