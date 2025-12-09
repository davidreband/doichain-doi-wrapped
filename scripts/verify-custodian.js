const { ethers } = require("hardhat");

async function main() {
    const MAINNET_CONTRACT_ADDRESS = "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72"; // wDOI Mainnet Contract
    const CUSTODIAN_ADDRESS = "0x8f45ef7172a81cdd57dc2b8cde1fe3cba3973dea"; // REPLACE WITH CUSTODIAN TO CHECK
    
    if (MAINNET_CONTRACT_ADDRESS === "0x..." || CUSTODIAN_ADDRESS === "0x...") {
        console.log("❌ Please provide contract and custodian addresses");
        return;
    }
    
    console.log("🔍 Verifying custodian status...");
    console.log("Contract:", MAINNET_CONTRACT_ADDRESS);
    console.log("Custodian:", CUSTODIAN_ADDRESS);
    
    const WrappedDoichain = await ethers.getContractFactory("WrappedDoichainV2");
    const wdoi = WrappedDoichain.attach(MAINNET_CONTRACT_ADDRESS);
    
    try {
        const CUSTODIAN_ROLE = await wdoi.CUSTODIAN_ROLE();
        const isCustodian = await wdoi.hasRole(CUSTODIAN_ROLE, CUSTODIAN_ADDRESS);
        
        console.log("\n📊 Result:");
        console.log("Is Custodian:", isCustodian ? "✅ YES" : "❌ NO");
        
        if (isCustodian) {
            console.log("\n🎉 SUCCESS: Address has custodian privileges");
            console.log("   Can access: /custodian, /custodian/enhanced, /custodian/liquidity");
            console.log("   Can call: mint(), burn() functions");
        } else {
            console.log("\n❌ Address does NOT have custodian privileges");
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main();