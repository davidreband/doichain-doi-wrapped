const { ethers } = require('hardhat');

async function main() {
    console.log("🔧 Setting up custodian role...\n");

    const contractAddress = "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72";
    const custodianAddress = "0xbe40fb82b1c56ab813ffcf171ea12b35d6afa83e";
    
    const wdoi = await ethers.getContractAt("WrappedDoichainV2", contractAddress);
    
    console.log("📍 Contract:", contractAddress);
    console.log("👤 Custodian:", custodianAddress);
    
    // Grant custodian role
    const custodianRole = await wdoi.CUSTODIAN_ROLE();
    await wdoi.grantRole(custodianRole, custodianAddress);
    
    console.log("✅ CUSTODIAN_ROLE granted!");
    
    // Verify
    const hasRole = await wdoi.hasRole(custodianRole, custodianAddress);
    console.log("✅ Role verified:", hasRole);
    
    console.log("\n🎉 Setup completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Setup failed:", error);
        process.exit(1);
    });