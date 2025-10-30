const hre = require("hardhat");

async function main() {
  console.log("🏦 Deploying Wrapped Doichain Custodial (wDOI) Contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from account:", deployer.address);
  
  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Custodial contract deploy parameters
  const admin = deployer.address; // Deployer becomes admin
  const requiredConfirmations = 2; // Requires 2 custodian confirmations
  
  console.log("⚙️  Deploy parameters:");
  console.log("   Admin:", admin);
  console.log("   Required confirmations:", requiredConfirmations);
  console.log("");

  // Deploy custodial contract
  console.log("📦 Deploying WrappedDoichainCustodial contract...");
  const WrappedDoichainCustodial = await hre.ethers.getContractFactory("WrappedDoichainCustodial");
  const wrappedDoichain = await WrappedDoichainCustodial.deploy(admin, requiredConfirmations);

  await wrappedDoichain.waitForDeployment();
  const contractAddress = await wrappedDoichain.getAddress();

  console.log("✅ WrappedDoichainCustodial deployed to:", contractAddress);
  console.log("");

  // Contract information
  console.log("📊 Contract Information:");
  console.log("   Name:", await wrappedDoichain.name());
  console.log("   Symbol:", await wrappedDoichain.symbol());
  console.log("   Decimals:", await wrappedDoichain.decimals());
  console.log("   Total Supply:", hre.ethers.formatEther(await wrappedDoichain.totalSupply()), "wDOI");
  console.log("   Required Confirmations:", await wrappedDoichain.requiredConfirmations());
  console.log("   Total Reserves:", hre.ethers.formatEther(await wrappedDoichain.totalReserves()), "DOI");
  console.log("");

  // Check roles
  console.log("🔐 Access Control:");
  const DEFAULT_ADMIN_ROLE = await wrappedDoichain.DEFAULT_ADMIN_ROLE();
  const CUSTODIAN_ROLE = await wrappedDoichain.CUSTODIAN_ROLE();
  const MERCHANT_ROLE = await wrappedDoichain.MERCHANT_ROLE();
  const PAUSER_ROLE = await wrappedDoichain.PAUSER_ROLE();
  const RESERVE_MANAGER_ROLE = await wrappedDoichain.RESERVE_MANAGER_ROLE();
  
  console.log("   Admin has DEFAULT_ADMIN_ROLE:", await wrappedDoichain.hasRole(DEFAULT_ADMIN_ROLE, admin));
  console.log("   Admin has PAUSER_ROLE:", await wrappedDoichain.hasRole(PAUSER_ROLE, admin));
  console.log("   Admin has RESERVE_MANAGER_ROLE:", await wrappedDoichain.hasRole(RESERVE_MANAGER_ROLE, admin));
  console.log("");
  
  console.log("🔑 Role Identifiers:");
  console.log("   CUSTODIAN_ROLE:", CUSTODIAN_ROLE);
  console.log("   MERCHANT_ROLE:", MERCHANT_ROLE);
  console.log("   PAUSER_ROLE:", PAUSER_ROLE);
  console.log("   RESERVE_MANAGER_ROLE:", RESERVE_MANAGER_ROLE);
  console.log("");

  // Save contract address
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    contractType: "custodial",
    contractAddress: contractAddress,
    admin: admin,
    deployer: deployer.address,
    requiredConfirmations: requiredConfirmations,
    deploymentTime: new Date().toISOString(),
    txHash: wrappedDoichain.deploymentTransaction()?.hash,
    constructorArgs: [admin, requiredConfirmations],
    roles: {
      CUSTODIAN_ROLE,
      MERCHANT_ROLE,
      PAUSER_ROLE,
      RESERVE_MANAGER_ROLE,
      DEFAULT_ADMIN_ROLE
    }
  };

  const deploymentsDir = './deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}-custodial.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`💾 Deployment info saved to: ${deploymentsDir}/${hre.network.name}-custodial.json`);
  console.log("");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 To verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} "${admin}" ${requiredConfirmations}`);
    console.log("");
  }

  // Management examples
  console.log("📋 Management Examples:");
  console.log("");
  console.log("🏛️  Add Custodian:");
  console.log(`   await contract.addCustodian(`);
  console.log(`     "0x1234567890123456789012345678901234567890",`);
  console.log(`     "Deutsche Krypto Custodial GmbH",`);
  console.log(`     "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"`);
  console.log(`   );`);
  console.log("");
  
  console.log("🏪 Add Merchant:");
  console.log(`   await contract.addMerchant("0x1234567890123456789012345678901234567890");`);
  console.log("");
  
  console.log("💰 Update Custodian Reserves:");
  console.log(`   await contract.updateCustodianReserves(`);
  console.log(`     custodianAddress,`);
  console.log(`     ethers.parseEther("1000") // 1000 DOI`);
  console.log(`   );`);
  console.log("");

  // Next steps
  console.log("📋 Next Steps:");
  console.log("1. Add custodians using addCustodian() function");
  console.log("2. Add merchants using addMerchant() function");
  console.log("3. Update custodian reserves using updateCustodianReserves()");
  console.log("4. Test mint/burn workflow with multisig confirmations");
  console.log("5. Monitor proof-of-reserves with getReservesInfo()");
  console.log("6. Consider setting up institutional custody partnerships");
  console.log("");

  console.log("🎉 Custodial Deployment completed successfully!");
  console.log("📖 See docs/CUSTODIAL_ARCHITECTURE.md for detailed architecture description");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });