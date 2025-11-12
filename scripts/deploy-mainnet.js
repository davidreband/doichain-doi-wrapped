const { ethers, upgrades } = require('hardhat');
const fs = require('fs');

async function main() {
    console.log("🚀 Deploying wDOI to Ethereum Mainnet...\n");

    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying from account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    if (parseFloat(ethers.formatEther(balance)) < 0.05) {
        console.log("❌ Insufficient ETH for deployment. Need at least 0.05 ETH for gas.");
        console.log("💡 Add ETH to:", deployer.address);
        return;
    }

    console.log("\n🔨 Deploying WrappedDoichainV2...");

    // Deploy upgradeable contract
    const WrappedDoichainV2 = await ethers.getContractFactory("WrappedDoichainV2");
    
    // Production admin address
    const productionAdmin = "0xbe40fb82b1c56ab813ffcf171ea12b35d6afa83e";
    
    console.log("⏳ Deploying proxy contract...");
    console.log("🏦 Production admin will be:", productionAdmin);
    
    const wdoi = await upgrades.deployProxy(
        WrappedDoichainV2,
        [
            productionAdmin, // admin
            "Wrapped Doichain", // name
            "wDOI" // symbol
        ],
        { 
            initializer: 'initialize',
            kind: 'uups'
        }
    );

    await wdoi.waitForDeployment();
    const proxyAddress = await wdoi.getAddress();
    
    console.log("✅ Proxy deployed to:", proxyAddress);
    
    // Get implementation address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("🔧 Implementation deployed to:", implementationAddress);

    // Setup roles
    console.log("\n👥 Setting up roles...");
    
    // Grant custodian role to production admin
    const custodianRole = await wdoi.CUSTODIAN_ROLE();
    await wdoi.grantRole(custodianRole, productionAdmin);
    console.log("✅ Granted CUSTODIAN_ROLE to:", productionAdmin);

    // Get contract info
    console.log("\n📊 Contract Information:");
    console.log("Name:", await wdoi.name());
    console.log("Symbol:", await wdoi.symbol());
    console.log("Total Supply:", ethers.formatEther(await wdoi.totalSupply()));
    console.log("Daily Mint Limit:", ethers.formatEther(await wdoi.dailyMintLimit()));
    console.log("Emergency Mode:", await wdoi.emergencyMode());

    // Save deployment info
    const deploymentInfo = {
        network: "mainnet",
        proxy: proxyAddress,
        implementation: implementationAddress,
        admin: deployer.address,
        custodian: deployer.address,
        merchant: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        txHash: wdoi.deploymentTransaction()?.hash || "unknown"
    };

    const deploymentFile = './deployments/mainnet-deployment.json';
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("📁 Deployment info saved to:", deploymentFile);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Next steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network mainnet ${proxyAddress}`);
    console.log("2. Update backend WDOI_CONTRACT_ADDRESS to:", proxyAddress);
    console.log("3. Update frontend configuration");
    console.log("4. Grant roles to production addresses");
    console.log("5. Test mint/burn operations");

    console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
    console.log("- Change admin from deployer to multi-sig wallet");
    console.log("- Revoke deployer's custodian role after setting up production custodians");
    console.log("- Test all functions on small amounts first");
    console.log("- Monitor events and daily limits");

    return {
        proxy: proxyAddress,
        implementation: implementationAddress,
        deployer: deployer.address
    };
}

main()
    .then((result) => {
        if (result) {
            console.log("\n✅ Script completed successfully");
            console.log("🏦 Proxy Address:", result.proxy);
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });