const { ethers } = require('hardhat');

async function main() {
    console.log("🧪 Testing mint function on Mainnet...\n");

    // Production contract address
    const contractAddress = "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72";
    const custodianAddress = "0xbe40fb82b1c56ab813ffcf171ea12b35d6afa83e";
    
    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("📝 Testing with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Connect to contract
    console.log("🔗 Connecting to contract:", contractAddress);
    const wdoi = await ethers.getContractAt("WrappedDoichainV2", contractAddress);

    // Check contract info
    console.log("\n📊 Contract Status:");
    console.log("Name:", await wdoi.name());
    console.log("Symbol:", await wdoi.symbol());
    console.log("Total Supply:", ethers.formatEther(await wdoi.totalSupply()));
    console.log("Emergency Mode:", await wdoi.emergencyMode());
    console.log("Daily Mint Limit:", ethers.formatEther(await wdoi.dailyMintLimit()));
    console.log("Today's Mint Capacity:", ethers.formatEther(await wdoi.getTodayMintCapacity()));

    // Check roles
    console.log("\n👥 Role Check:");
    const custodianRole = await wdoi.CUSTODIAN_ROLE();
    const hasRole = await wdoi.hasRole(custodianRole, deployer.address);
    console.log("CUSTODIAN_ROLE for deployer:", hasRole);

    if (!hasRole) {
        console.log("❌ Deployer doesn't have CUSTODIAN_ROLE.");
        console.log("💡 Contract custodian is:", custodianAddress);
        console.log("💡 You need to use the custodian wallet or grant role to this account.");
        return;
    }

    // Test mint parameters
    const testAmount = ethers.parseEther("1.0"); // 1 wDOI
    const testTxHash = "mainnet_test_doi_tx_" + Date.now();
    const testRecipient = custodianAddress; // Mint to custodian address

    console.log("\n🔨 Testing mint function:");
    console.log("Amount:", ethers.formatEther(testAmount), "wDOI");
    console.log("DOI TX Hash:", testTxHash);
    console.log("Recipient:", testRecipient);

    // Estimate gas first
    let estimatedCost = BigInt(0);
    try {
        const gasEstimate = await wdoi.mint.estimateGas(testRecipient, testAmount, testTxHash);
        console.log("⛽ Estimated gas:", gasEstimate.toString());
        
        const gasPrice = await ethers.provider.getFeeData();
        console.log("💸 Gas price:", ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"), "gwei");
        
        estimatedCost = gasEstimate * (gasPrice.gasPrice || BigInt(0));
        console.log("💰 Estimated cost:", ethers.formatEther(estimatedCost), "ETH");

    } catch (error) {
        console.error("❌ Gas estimation failed:", error.message);
        return;
    }

    // Confirm before proceeding
    console.log("\n⚠️  This will execute a REAL transaction on Mainnet!");
    console.log("💰 Cost: ~", ethers.formatEther(estimatedCost), "ETH");
    console.log("\nProceed? (This script will continue automatically in 5 seconds...)");
    
    // Wait 5 seconds for user to cancel if needed
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        // Check if transaction hash already processed
        const isProcessed = await wdoi.isDoiTxProcessed(testTxHash);
        console.log("TX already processed:", isProcessed);

        if (isProcessed) {
            console.log("❌ Transaction hash already used. Using new hash...");
            const newTestTxHash = "mainnet_test_doi_tx_" + (Date.now() + 1);
            console.log("New TX hash:", newTestTxHash);
            
            // Try with new hash
            console.log("⏳ Sending mint transaction...");
            const mintTx = await wdoi.mint(testRecipient, testAmount, newTestTxHash);
            console.log("📄 Transaction sent:", mintTx.hash);
            console.log("🔗 Etherscan:", `https://etherscan.io/tx/${mintTx.hash}`);
            
            const receipt = await mintTx.wait();
            console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
        } else {
            console.log("⏳ Sending mint transaction...");
            const mintTx = await wdoi.mint(testRecipient, testAmount, testTxHash);
            console.log("📄 Transaction sent:", mintTx.hash);
            console.log("🔗 Etherscan:", `https://etherscan.io/tx/${mintTx.hash}`);
            
            const receipt = await mintTx.wait();
            console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
        }

        // Check updated contract state
        console.log("\n📊 After Mint:");
        console.log("New Total Supply:", ethers.formatEther(await wdoi.totalSupply()));
        console.log("New Total Reserves:", ethers.formatEther(await wdoi.totalReserves()));
        console.log("Recipient Balance:", ethers.formatEther(await wdoi.balanceOf(testRecipient)));
        console.log("Today's Remaining Capacity:", ethers.formatEther(await wdoi.getTodayMintCapacity()));
        
        console.log("\n🎉 MAINNET MINT SUCCESSFUL!");
        console.log("👀 Check Etherscan for transaction details");
        console.log("📱 Add wDOI to MetaMask to see balance");

    } catch (error) {
        console.error("❌ Mint failed:", error.message);
        
        // Detailed error analysis
        if (error.message.includes("emergency mode")) {
            console.log("💡 Contract is in emergency mode");
        } else if (error.message.includes("exceeds max mint")) {
            console.log("💡 Amount exceeds maximum mint limit");
        } else if (error.message.includes("daily mint limit")) {
            console.log("💡 Daily mint limit exceeded");
        } else if (error.message.includes("already processed")) {
            console.log("💡 DOI transaction already processed");
        } else if (error.message.includes("CUSTODIAN_ROLE")) {
            console.log("💡 Sender doesn't have custodian role");
        } else if (error.message.includes("insufficient funds")) {
            console.log("💡 Insufficient ETH for gas fees");
        } else {
            console.log("💡 Unknown error. Check Etherscan for more details.");
        }
        
        console.log("\n🔗 Contract on Etherscan:", `https://etherscan.io/address/${contractAddress}`);
    }
}

main()
    .then(() => {
        console.log("\n🎉 Test completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });