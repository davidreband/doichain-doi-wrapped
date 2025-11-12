const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Wrapped Doichain V3 (Enhanced Centralized Custodian)...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Contract deploy parameters
  const admin = deployer.address;
  const name = "Wrapped Doichain V3";
  const symbol = "wDOI";
  
  console.log("⚙️  Deploy parameters:");
  console.log("   Admin:", admin);
  console.log("   Token Name:", name);
  console.log("   Token Symbol:", symbol);
  console.log("");

  // Deploy implementation contract
  console.log("📦 Deploying WrappedDoichainV3 implementation...");
  const WrappedDoichainV3 = await hre.ethers.getContractFactory("WrappedDoichainV3");
  const implementation = await WrappedDoichainV3.deploy();
  await implementation.waitForDeployment();
  const implementationAddress = await implementation.getAddress();
  
  console.log("✅ Implementation deployed to:", implementationAddress);

  // Deploy proxy
  console.log("📦 Deploying ERC1967 Proxy...");
  const initData = implementation.interface.encodeFunctionData("initialize", [admin, name, symbol]);
  
  const ERC1967Proxy = await hre.ethers.getContractFactory("ERC1967Proxy");
  const proxy = await ERC1967Proxy.deploy(implementationAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log("✅ Proxy deployed to:", proxyAddress);
  console.log("");

  // Get proxy contract instance
  const wrappedDoichain = WrappedDoichainV3.attach(proxyAddress);

  // Contract information
  console.log("📊 Contract Information:");
  console.log("   Name:", await wrappedDoichain.name());
  console.log("   Symbol:", await wrappedDoichain.symbol());
  console.log("   Decimals:", await wrappedDoichain.decimals());
  console.log("   Total Supply:", hre.ethers.formatEther(await wrappedDoichain.totalSupply()), "wDOI");
  console.log("");

  // Check enhanced features
  const reserveStatus = await wrappedDoichain.getReserveStatus();
  const rateLimitStatus = await wrappedDoichain.getRateLimitStatus();
  const emergencyStatus = await wrappedDoichain.getEmergencyStatus();

  console.log("🔍 Enhanced Features Status:");
  console.log("   Declared Reserves:", hre.ethers.formatEther(reserveStatus.reserves), "DOI");
  console.log("   Reserve Ratio:", (reserveStatus.reserveRatio / 100).toFixed(2), "%");
  console.log("   Is Fully Backed:", reserveStatus.isFullyBacked);
  console.log("   Time Since Last Audit:", reserveStatus.timeSinceLastAudit.toString(), "seconds");
  console.log("   Daily Mint Limit:", hre.ethers.formatEther(rateLimitStatus.mintLimitRemaining), "wDOI");
  console.log("   Daily Burn Limit:", hre.ethers.formatEther(rateLimitStatus.burnLimitRemaining), "wDOI");
  console.log("   Emergency Pause Active:", emergencyStatus.isEmergencyPaused);
  console.log("");

  // Check roles
  console.log("🔐 Access Control:");
  const DEFAULT_ADMIN_ROLE = await wrappedDoichain.DEFAULT_ADMIN_ROLE();
  const CUSTODIAN_ROLE = await wrappedDoichain.CUSTODIAN_ROLE();
  const MERCHANT_ROLE = await wrappedDoichain.MERCHANT_ROLE();
  const PAUSER_ROLE = await wrappedDoichain.PAUSER_ROLE();
  const UPGRADER_ROLE = await wrappedDoichain.UPGRADER_ROLE();
  const AUDITOR_ROLE = await wrappedDoichain.AUDITOR_ROLE();
  
  console.log("   Admin has DEFAULT_ADMIN_ROLE:", await wrappedDoichain.hasRole(DEFAULT_ADMIN_ROLE, admin));
  console.log("   Admin has PAUSER_ROLE:", await wrappedDoichain.hasRole(PAUSER_ROLE, admin));
  console.log("   Admin has UPGRADER_ROLE:", await wrappedDoichain.hasRole(UPGRADER_ROLE, admin));
  console.log("   Admin has AUDITOR_ROLE:", await wrappedDoichain.hasRole(AUDITOR_ROLE, admin));
  console.log("");
  
  console.log("🔑 Role Identifiers:");
  console.log("   CUSTODIAN_ROLE:", CUSTODIAN_ROLE);
  console.log("   MERCHANT_ROLE:", MERCHANT_ROLE);
  console.log("   PAUSER_ROLE:", PAUSER_ROLE);
  console.log("   UPGRADER_ROLE:", UPGRADER_ROLE);
  console.log("   AUDITOR_ROLE:", AUDITOR_ROLE);
  console.log("");

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractVersion: "v3",
    proxyAddress: proxyAddress,
    implementationAddress: implementationAddress,
    admin: admin,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    initializationParams: {
      name: name,
      symbol: symbol
    },
    roles: {
      CUSTODIAN_ROLE,
      MERCHANT_ROLE,
      PAUSER_ROLE,
      UPGRADER_ROLE,
      AUDITOR_ROLE,
      DEFAULT_ADMIN_ROLE
    },
    features: {
      automaticReserveAuditing: true,
      emergencyPauseSystem: true,
      rateLimiting: true,
      doiBalanceVerification: true,
      upgradeableProxy: true
    }
  };

  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}-v3-deployment.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`💾 Deployment info saved to: ${deploymentsDir}/${hre.network.name}-v3-deployment.json`);
  console.log("");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 To verify contracts on Etherscan:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${implementationAddress}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${proxyAddress} "${implementationAddress}" "${initData}"`);
    console.log("");
  }

  // Setup examples
  console.log("📋 Initial Setup Examples:");
  console.log("");
  console.log("🏛️  Add Custodian (yourself as initial custodian):");
  console.log(`   await contract.addCustodian("${admin}");`);
  console.log("");
  
  console.log("💰 Declare Initial Reserves:");
  console.log(`   await contract.declareReserves(ethers.parseEther("1000")); // 1000 DOI`);
  console.log("");
  
  console.log("🏪 Add Merchant:");
  console.log(`   await contract.addMerchant("0x1234567890123456789012345678901234567890");`);
  console.log("");
  
  console.log("🔄 Mint with DOI Verification:");
  console.log(`   await contract.mint(`);
  console.log(`     recipientAddress,`);
  console.log(`     ethers.parseEther("100"), // 100 wDOI`);
  console.log(`     "doi_tx_hash_abc123",`);
  console.log(`     ethers.parseEther("1100") // Current DOI balance`);
  console.log(`   );`);
  console.log("");

  console.log("📊 Enhanced Features:");
  console.log("   ✅ Automatic reserve ratio monitoring");
  console.log("   ✅ Daily rate limiting for mint/burn operations");
  console.log("   ✅ Emergency pause system with detailed reasons");
  console.log("   ✅ DOI balance verification before minting");
  console.log("   ✅ Real-time audit alerts and warnings");
  console.log("   ✅ Comprehensive event logging");
  console.log("   ✅ Upgradeable proxy pattern");
  console.log("   ✅ Reentrancy protection");
  console.log("");

  console.log("🔧 Management Commands:");
  console.log("   getReserveStatus() - Check current reserve status");
  console.log("   getRateLimitStatus() - Check daily rate limits");
  console.log("   isAuditRequired() - Check if audit is needed");
  console.log("   getEmergencyStatus() - Check emergency pause status");
  console.log("   setRateLimits(mint, burn) - Update rate limits");
  console.log("   setMinimumReserveRatio(ratio) - Update reserve requirements");
  console.log("");

  console.log("🎉 Enhanced Centralized Custodian Deployment completed successfully!");
  console.log("📖 Ready for production use with comprehensive safety features");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });