const { ethers } = require('hardhat');

async function main() {
    console.log("🧪 Testing mint function on Sepolia...\n");

    // Contract address from deployment
    const contractAddress = "0x46338E2ba4983Dc8E3853DD6A7E6e9F55225ff32";
    
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
        console.log("❌ Deployer doesn't have CUSTODIAN_ROLE. Cannot mint.");
        return;
    }

    // Test mint parameters
    const testAmount = ethers.parseEther("1.0"); // 1 wDOI
    const testTxHash = "test_doi_tx_" + Date.now();
    const testRecipient = deployer.address;

    console.log("\n🔨 Testing mint function:");
    console.log("Amount:", ethers.formatEther(testAmount), "wDOI");
    console.log("DOI TX Hash:", testTxHash);
    console.log("Recipient:", testRecipient);

    try {
        // Check if transaction hash already processed
        const isProcessed = await wdoi.isDoiTxProcessed(testTxHash);
        console.log("TX already processed:", isProcessed);

        if (isProcessed) {
            console.log("❌ Transaction hash already used. Using new hash...");
            const newTestTxHash = "test_doi_tx_" + (Date.now() + 1);
            console.log("New TX hash:", newTestTxHash);
            
            // Try with new hash
            console.log("⏳ Sending mint transaction...");
            const mintTx = await wdoi.mint(testRecipient, testAmount, newTestTxHash);
            console.log("📄 Transaction sent:", mintTx.hash);
            
            const receipt = await mintTx.wait();
            console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
        } else {
            console.log("⏳ Sending mint transaction...");
            const mintTx = await wdoi.mint(testRecipient, testAmount, testTxHash);
            console.log("📄 Transaction sent:", mintTx.hash);
            
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
        } else {
            console.log("💡 Unknown error. Contract might be paused or have other issues.");
        }
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