const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Wrapped Doichain (wDOI) Contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy parameters
  const admin = deployer.address; // Deployer becomes admin
  const initialBridges = []; // Empty array, bridges will be added later
  
  console.log("⚙️  Deploy parameters:");
  console.log("   Admin:", admin);
  console.log("   Initial bridges:", initialBridges.length ? initialBridges : "None (will be added later)");
  console.log("");

  // Deploy contract
  console.log("📦 Deploying WrappedDoichain contract...");
  const WrappedDoichain = await hre.ethers.getContractFactory("WrappedDoichain");
  const wrappedDoichain = await WrappedDoichain.deploy(admin, initialBridges);

  await wrappedDoichain.waitForDeployment();
  const contractAddress = await wrappedDoichain.getAddress();

  console.log("✅ WrappedDoichain deployed to:", contractAddress);
  console.log("");

  // Contract information
  console.log("📊 Contract Information:");
  console.log("   Name:", await wrappedDoichain.name());
  console.log("   Symbol:", await wrappedDoichain.symbol());
  console.log("   Decimals:", await wrappedDoichain.decimals());
  console.log("   Total Supply:", hre.ethers.formatEther(await wrappedDoichain.totalSupply()), "wDOI");
  console.log("");

  // Check roles
  console.log("🔐 Access Control:");
  const DEFAULT_ADMIN_ROLE = await wrappedDoichain.DEFAULT_ADMIN_ROLE();
  const BRIDGE_ROLE = await wrappedDoichain.BRIDGE_ROLE();
  const PAUSER_ROLE = await wrappedDoichain.PAUSER_ROLE();
  
  console.log("   Admin has DEFAULT_ADMIN_ROLE:", await wrappedDoichain.hasRole(DEFAULT_ADMIN_ROLE, admin));
  console.log("   Admin has PAUSER_ROLE:", await wrappedDoichain.hasRole(PAUSER_ROLE, admin));
  console.log("   Bridge addresses count:", initialBridges.length);
  console.log("");

  // Save contract address
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    admin: admin,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    txHash: wrappedDoichain.deploymentTransaction()?.hash,
    constructorArgs: [admin, initialBridges]
  };

  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`💾 Deployment info saved to: ${deploymentsDir}/${hre.network.name}.json`);
  console.log("");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 To verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} "${admin}" "[]"`);
    console.log("");
  }

  // Next steps
  console.log("📋 Next Steps:");
  console.log("1. Add bridge contracts using addBridge() function");
  console.log("2. Test deposit/withdraw functionality");
  console.log("3. Set up monitoring for bridge events");
  console.log("4. Consider setting up a multisig for admin role");
  console.log("");

  console.log("🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });