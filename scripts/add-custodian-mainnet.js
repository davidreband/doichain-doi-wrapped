const { ethers } = require("hardhat");

async function main() {
    console.log("🚨 MAINNET CUSTODIAN ADDITION - PROCEED WITH CAUTION! 🚨");
    console.log("=" .repeat(60));
    
    // CONFIGURATION - UPDATE THESE VALUES
    const MAINNET_CONTRACT_ADDRESS = "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72"; // wDOI Mainnet Contract
    const NEW_CUSTODIAN_ADDRESS = "0x8f45ef7172a81cdd57dc2b8cde1fe3cba3973dea"; //     
    // Safety checks
    if (MAINNET_CONTRACT_ADDRESS === "0x...") {
        console.log("❌ STOP: Please provide the actual mainnet contract address");
        console.log("   Edit MAINNET_CONTRACT_ADDRESS in this script");
        process.exit(1);
    }
    
    if (NEW_CUSTODIAN_ADDRESS === "0x...") {
        console.log("❌ STOP: Please provide the new custodian address");
        console.log("   Edit NEW_CUSTODIAN_ADDRESS in this script");
        process.exit(1);
    }
    
    if (!ethers.isAddress(MAINNET_CONTRACT_ADDRESS)) {
        console.log("❌ STOP: Invalid contract address");
        process.exit(1);
    }
    
    if (!ethers.isAddress(NEW_CUSTODIAN_ADDRESS)) {
        console.log("❌ STOP: Invalid custodian address");
        process.exit(1);
    }
    
    console.log("📋 Configuration:");
    console.log("   Contract:", MAINNET_CONTRACT_ADDRESS);
    console.log("   New Custodian:", NEW_CUSTODIAN_ADDRESS);
    
    const [admin] = await ethers.getSigners();
    console.log("   Admin Account:", admin.address);
    
    // Check balance
    const balance = await admin.provider.getBalance(admin.address);
    console.log("   Balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
        console.log("❌ STOP: Insufficient balance for gas fees");
        process.exit(1);
    }
    
    // Connect to contract
    console.log("\n🔗 Connecting to mainnet contract...");
    const WrappedDoichain = await ethers.getContractFactory("WrappedDoichainV2");
    const wdoi = WrappedDoichain.attach(MAINNET_CONTRACT_ADDRESS);
    
    try {
        // Verify contract
        const name = await wdoi.name();
        const symbol = await wdoi.symbol();
        console.log("   Contract Name:", name);
        console.log("   Symbol:", symbol);
        
        // Check permissions
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const CUSTODIAN_ROLE = await wdoi.CUSTODIAN_ROLE();
        
        const isAdmin = await wdoi.hasRole(DEFAULT_ADMIN_ROLE, admin.address);
        
        if (!isAdmin) {
            console.log("❌ STOP: You don't have admin privileges on this contract");
            console.log("   Current account is not authorized to add custodians");
            process.exit(1);
        }
        
        console.log("✅ Admin privileges confirmed");
        
        // Check if already custodian
        const isAlreadyCustodian = await wdoi.hasRole(CUSTODIAN_ROLE, NEW_CUSTODIAN_ADDRESS);
        
        if (isAlreadyCustodian) {
            console.log("ℹ️  Address is already a custodian - no action needed");
            process.exit(0);
        }
        
        // Get gas estimate
        const gasEstimate = await wdoi.addCustodian.estimateGas(NEW_CUSTODIAN_ADDRESS);
        const feeData = await admin.provider.getFeeData();
        const estimatedCost = gasEstimate * (feeData.gasPrice || BigInt(0));
        
        console.log("\n💸 Transaction Details:");
        console.log("   Estimated Gas:", gasEstimate.toString());
        console.log("   Gas Price:", ethers.formatUnits(feeData.gasPrice || 0, "gwei"), "gwei");
        console.log("   Estimated Cost:", ethers.formatEther(estimatedCost), "ETH");
        
        // Final safety prompt (in production you'd want manual confirmation)
        console.log("\n🚨 FINAL CONFIRMATION REQUIRED 🚨");
        console.log("This will permanently add custodian privileges to the address:");
        console.log(`   ${NEW_CUSTODIAN_ADDRESS}`);
        console.log("\nCustodian will be able to:");
        console.log("   • Mint new wDOI tokens");
        console.log("   • Burn wDOI tokens");
        console.log("   • Access custodian dashboards");
        console.log("\n⚠️  This action CANNOT be undone automatically!");
        console.log("⚠️  Only proceed if you trust this address completely!");
        
        // Uncomment this line to require manual confirmation in terminal:
        // await new Promise(resolve => {
        //     const readline = require('readline').createInterface({
        //         input: process.stdin,
        //         output: process.stdout
        //     });
        //     readline.question('\nType "CONFIRM" to proceed: ', (answer) => {
        //         if (answer !== "CONFIRM") {
        //             console.log("❌ Operation cancelled");
        //             process.exit(1);
        //         }
        //         readline.close();
        //         resolve();
        //     });
        // });
        
        console.log("\n🚀 Executing transaction...");
        
        // Execute the transaction
        const tx = await wdoi.addCustodian(NEW_CUSTODIAN_ADDRESS, {
            gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
        });
        
        console.log("📝 Transaction Hash:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("\n✅ SUCCESS: Custodian added successfully!");
            console.log("   Block Number:", receipt.blockNumber);
            console.log("   Gas Used:", receipt.gasUsed.toString());
            console.log("   Actual Cost:", ethers.formatEther(receipt.gasUsed * receipt.gasPrice), "ETH");
            
            // Verify the role was granted
            const isNowCustodian = await wdoi.hasRole(CUSTODIAN_ROLE, NEW_CUSTODIAN_ADDRESS);
            console.log("   Verification:", isNowCustodian ? "✅ Role granted" : "❌ Role not found");
            
            // Look for the event
            const addedEvent = receipt.logs.find(log => {
                try {
                    const parsed = wdoi.interface.parseLog(log);
                    return parsed.name === 'CustodianAdded';
                } catch {
                    return false;
                }
            });
            
            if (addedEvent) {
                const parsed = wdoi.interface.parseLog(addedEvent);
                console.log("   Event Emitted: CustodianAdded");
                console.log("     Custodian:", parsed.args.custodian);
                console.log("     Admin:", parsed.args.admin);
            }
            
        } else {
            console.log("❌ FAILED: Transaction was reverted");
            process.exit(1);
        }
        
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.log("💡 Solution: Add more ETH to your account for gas fees");
        } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            console.log("💡 This might mean the address is already a custodian");
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });