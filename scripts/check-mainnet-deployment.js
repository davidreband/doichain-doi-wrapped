const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking mainnet deployment...");
    
    // Mainnet wDOI contract address
    const MAINNET_CONTRACT_ADDRESS = "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72";
    
    if (MAINNET_CONTRACT_ADDRESS === "0x...") {
        console.log("❌ Please provide the actual mainnet contract address");
        console.log("   Edit this script and replace MAINNET_CONTRACT_ADDRESS");
        return;
    }
    
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Checking with account:", deployer.address);
    
    // Get balance to ensure we have ETH for transactions
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
        console.log("⚠️  Low balance! Need at least 0.01 ETH for gas fees");
    }
    
    // Connect to the contract
    const WrappedDoichain = await ethers.getContractFactory("WrappedDoichainV2");
    const wdoi = WrappedDoichain.attach(MAINNET_CONTRACT_ADDRESS);
    
    try {
        // Check basic contract info
        const name = await wdoi.name();
        const symbol = await wdoi.symbol();
        const totalSupply = await wdoi.totalSupply();
        
        console.log("\n📊 Contract Info:");
        console.log("   Name:", name);
        console.log("   Symbol:", symbol);
        console.log("   Total Supply:", ethers.formatEther(totalSupply), symbol);
        
        // Check roles
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const CUSTODIAN_ROLE = await wdoi.CUSTODIAN_ROLE();
        
        const isAdmin = await wdoi.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
        const isCustodian = await wdoi.hasRole(CUSTODIAN_ROLE, deployer.address);
        
        console.log("\n👤 Your Permissions:");
        console.log("   Is Admin:", isAdmin ? "✅ YES" : "❌ NO");
        console.log("   Is Custodian:", isCustodian ? "✅ YES" : "❌ NO");
        
        if (!isAdmin) {
            console.log("\n🚨 WARNING: You don't have admin privileges!");
            console.log("   You cannot add custodians with this account");
            console.log("   Contact the contract owner to add custodians");
        }
        
        // Get current gas price for estimation
        const feeData = await deployer.provider.getFeeData();
        console.log("\n⛽ Current Gas Info:");
        console.log("   Gas Price:", ethers.formatUnits(feeData.gasPrice || 0, "gwei"), "gwei");
        if (feeData.maxFeePerGas) {
            console.log("   Max Fee:", ethers.formatUnits(feeData.maxFeePerGas, "gwei"), "gwei");
        }
        
        // Estimate cost of adding custodian
        if (isAdmin) {
            try {
                // Estimate gas for addCustodian function
                // Using a dummy address for estimation
                const dummyAddress = "0x742d35Cc6c7a6123e18EBA0DA27Ad60DCD9F0dd";
                const gasEstimate = await wdoi.addCustodian.estimateGas(dummyAddress);
                const costInEth = (gasEstimate * (feeData.gasPrice || BigInt(0))) / BigInt(1e18);
                
                console.log("\n💸 Estimated Cost to Add Custodian:");
                console.log("   Gas Required:", gasEstimate.toString());
                console.log("   Estimated Cost:", ethers.formatEther(costInEth), "ETH");
            } catch (err) {
                console.log("   Could not estimate gas (address may already be custodian)");
            }
        }
        
        console.log("\n✅ Contract check completed successfully!");
        
    } catch (error) {
        console.error("❌ Error checking contract:", error.message);
        
        if (error.code === 'CALL_EXCEPTION') {
            console.log("💡 This might mean:");
            console.log("   - Contract address is incorrect");
            console.log("   - Contract is not deployed");
            console.log("   - Network mismatch");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });