const { ethers } = require("hardhat");
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

function askSecretQuestion(question) {
    return new Promise((resolve) => {
        process.stdout.write(question);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        let input = '';
        process.stdin.on('data', function(key) {
            if (key === '\u0003') { // Ctrl+C
                process.exit();
            } else if (key === '\r' || key === '\n') {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdout.write('\n');
                resolve(input);
            } else if (key === '\u007f') { // Backspace
                if (input.length > 0) {
                    input = input.slice(0, -1);
                    process.stdout.write('\b \b');
                }
            } else {
                input += key;
                process.stdout.write('*');
            }
        });
    });
}

async function main() {
    console.log("🚨 MAINNET CUSTODIAN ADDITION - INTERACTIVE MODE 🚨");
    console.log("=" .repeat(60));
    
    const MAINNET_CONTRACT_ADDRESS = "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72";
    
    try {
        // Ask for private key (hidden input)
        const privateKey = await askSecretQuestion("🔑 Enter your private key (hidden): ");
        
        if (!privateKey.startsWith('0x')) {
            console.log("❌ Private key must start with 0x");
            process.exit(1);
        }
        
        // Ask for RPC URL
        const rpcUrl = await askQuestion("🌐 Enter Mainnet RPC URL: ");
        
        if (!rpcUrl.startsWith('https://')) {
            console.log("❌ RPC URL must start with https://");
            process.exit(1);
        }
        
        // Ask for new custodian address
        const newCustodianAddress = await askQuestion("👨‍💼 Enter new custodian address: ");
        
        if (!ethers.isAddress(newCustodianAddress)) {
            console.log("❌ Invalid custodian address");
            process.exit(1);
        }
        
        rl.close();
        
        console.log("\n📋 Configuration:");
        console.log("   Contract:", MAINNET_CONTRACT_ADDRESS);
        console.log("   New Custodian:", newCustodianAddress);
        console.log("   RPC URL:", rpcUrl.substring(0, 30) + "...");
        
        // Create provider
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        console.log("   Admin Account:", wallet.address);
        
        // Check balance
        const balance = await provider.getBalance(wallet.address);
        console.log("   Balance:", ethers.formatEther(balance), "ETH");
        
        if (balance < ethers.parseEther("0.01")) {
            console.log("❌ STOP: Insufficient balance for gas fees");
            process.exit(1);
        }
        
        // Connect to contract
        console.log("\n🔗 Connecting to mainnet contract...");
        const WrappedDoichain = await ethers.getContractFactory("WrappedDoichainV2");
        const wdoi = WrappedDoichain.attach(MAINNET_CONTRACT_ADDRESS).connect(wallet);
        
        // Verify contract
        const name = await wdoi.name();
        const symbol = await wdoi.symbol();
        console.log("   Contract Name:", name);
        console.log("   Symbol:", symbol);
        
        // Check permissions
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const CUSTODIAN_ROLE = await wdoi.CUSTODIAN_ROLE();
        
        const isAdmin = await wdoi.hasRole(DEFAULT_ADMIN_ROLE, wallet.address);
        
        if (!isAdmin) {
            console.log("❌ STOP: You don't have admin privileges on this contract");
            process.exit(1);
        }
        
        console.log("✅ Admin privileges confirmed");
        
        // Check if already custodian
        const isAlreadyCustodian = await wdoi.hasRole(CUSTODIAN_ROLE, newCustodianAddress);
        
        if (isAlreadyCustodian) {
            console.log("ℹ️  Address is already a custodian - no action needed");
            process.exit(0);
        }
        
        // Get gas estimate
        const gasEstimate = await wdoi.addCustodian.estimateGas(newCustodianAddress);
        const feeData = await provider.getFeeData();
        const estimatedCost = gasEstimate * (feeData.gasPrice || BigInt(0));
        
        console.log("\n💸 Transaction Details:");
        console.log("   Estimated Gas:", gasEstimate.toString());
        console.log("   Gas Price:", ethers.formatUnits(feeData.gasPrice || 0, "gwei"), "gwei");
        console.log("   Estimated Cost:", ethers.formatEther(estimatedCost), "ETH");
        
        // Final confirmation
        console.log("\n🚨 FINAL CONFIRMATION 🚨");
        console.log("This will add custodian privileges to:", newCustodianAddress);
        
        const confirm = await askQuestion("Type 'CONFIRM' to proceed: ");
        if (confirm !== "CONFIRM") {
            console.log("❌ Operation cancelled");
            process.exit(1);
        }
        
        console.log("\n🚀 Executing transaction...");
        
        // Execute transaction
        const tx = await wdoi.addCustodian(newCustodianAddress, {
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
            
            // Verify
            const isNowCustodian = await wdoi.hasRole(CUSTODIAN_ROLE, newCustodianAddress);
            console.log("   Verification:", isNowCustodian ? "✅ Role granted" : "❌ Role not found");
            
        } else {
            console.log("❌ FAILED: Transaction was reverted");
            process.exit(1);
        }
        
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        process.exit(1);
    }
}

main();