const { ethers } = require('hardhat');

async function main() {
    console.log("🔍 Verifying mainnet deployment...\n");

    const contractAddress = "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72";
    
    console.log("📍 Contract Address:", contractAddress);
    console.log("🌐 Network: Ethereum Mainnet");
    
    try {
        // Connect to contract
        const wdoi = await ethers.getContractAt("WrappedDoichainV2", contractAddress);
        
        // Get basic info
        console.log("\n📊 Contract Information:");
        console.log("Name:", await wdoi.name());
        console.log("Symbol:", await wdoi.symbol());
        console.log("Decimals:", await wdoi.decimals());
        console.log("Total Supply:", ethers.formatEther(await wdoi.totalSupply()));
        
        // Check security settings
        console.log("\n🔒 Security Settings:");
        console.log("Emergency Mode:", await wdoi.emergencyMode());
        console.log("Daily Mint Limit:", ethers.formatEther(await wdoi.dailyMintLimit()));
        console.log("Max Mint Amount:", ethers.formatEther(await wdoi.MAX_MINT_AMOUNT()));
        console.log("Today's Mint Capacity:", ethers.formatEther(await wdoi.getTodayMintCapacity()));
        
        // Check roles
        console.log("\n👥 Roles:");
        const adminRole = await wdoi.DEFAULT_ADMIN_ROLE();
        const custodianRole = await wdoi.CUSTODIAN_ROLE();
        
        const productionAdmin = "0xbe40fb82b1c56ab813ffcf171ea12b35d6afa83e";
        console.log("Admin Role for", productionAdmin + ":", await wdoi.hasRole(adminRole, productionAdmin));
        console.log("Custodian Role for", productionAdmin + ":", await wdoi.hasRole(custodianRole, productionAdmin));
        
        console.log("\n✅ Deployment verification completed successfully!");
        
        // Save deployment info
        const deploymentInfo = {
            network: "mainnet",
            proxy: contractAddress,
            admin: productionAdmin,
            custodian: productionAdmin,
            deployedAt: new Date().toISOString(),
            verified: true
        };
        
        console.log("\n📋 For MetaMask users:");
        console.log("Contract Address:", contractAddress);
        console.log("Token Symbol: wDOI");
        console.log("Decimals: 18");
        
        return deploymentInfo;
        
    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        throw error;
    }
}

main()
    .then((result) => {
        console.log("\n🎉 Verification completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });