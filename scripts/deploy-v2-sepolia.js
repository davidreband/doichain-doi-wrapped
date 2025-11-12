const { ethers, upgrades } = require('hardhat');
const fs = require('fs');

async function main() {
    console.log("🚀 Deploying wDOI V2 to Sepolia...\n");

    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying from account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
        console.log("❌ Insufficient ETH for deployment. Need at least 0.01 ETH for gas.");
        console.log("💡 Add Sepolia ETH to:", deployer.address);
        return;
    }

    console.log("\n🔨 Deploying WrappedDoichainV2...");

    // Deploy upgradeable contract
    const WrappedDoichainV2 = await ethers.getContractFactory("WrappedDoichainV2");
    
    console.log("⏳ Deploying proxy contract...");
    const wdoi = await upgrades.deployProxy(
        WrappedDoichainV2,
        [
            deployer.address, // admin
            "Wrapped Doichain V2", // name
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
    
    // Grant custodian role to deployer
    const custodianRole = await wdoi.CUSTODIAN_ROLE();
    await wdoi.grantRole(custodianRole, deployer.address);
    console.log("✅ Granted CUSTODIAN_ROLE to:", deployer.address);

    // Get contract info
    console.log("\n📊 Contract Information:");
    console.log("Name:", await wdoi.name());
    console.log("Symbol:", await wdoi.symbol());
    console.log("Total Supply:", ethers.formatEther(await wdoi.totalSupply()));
    console.log("Daily Mint Limit:", ethers.formatEther(await wdoi.dailyMintLimit()));
    console.log("Max Mint Amount:", ethers.formatEther(await wdoi.MAX_MINT_AMOUNT()));
    console.log("Emergency Mode:", await wdoi.emergencyMode());
    console.log("Today's Mint Capacity:", ethers.formatEther(await wdoi.getTodayMintCapacity()));

    // Test small mint
    console.log("\n🧪 Testing mint functionality...");
    try {
        const testAmount = ethers.parseEther("1.0"); // 1 wDOI
        const testTxHash = "test_doi_tx_" + Date.now();
        
        const mintTx = await wdoi.mint(deployer.address, testAmount, testTxHash);
        await mintTx.wait();
        
        console.log("✅ Test mint successful!");
        console.log("New total supply:", ethers.formatEther(await wdoi.totalSupply()));
        console.log("Test transaction hash:", testTxHash);
    } catch (error) {
        console.log("❌ Test mint failed:", error.message);
    }

    // Save deployment info
    const deploymentInfo = {
        network: "sepolia",
        proxy: proxyAddress,
        implementation: implementationAddress,
        admin: deployer.address,
        custodian: deployer.address,
        merchant: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        txHash: wdoi.deploymentTransaction()?.hash || "unknown",
        version: "V2"
    };

    const deploymentFile = './deployments/sepolia-v2-deployment.json';
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("📁 Deployment info saved to:", deploymentFile);

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Next steps:");
    console.log("1. Update backend WDOI_CONTRACT_ADDRESS to:", proxyAddress);
    console.log("2. Test security endpoints");
    console.log("3. Deploy to mainnet when ready");

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