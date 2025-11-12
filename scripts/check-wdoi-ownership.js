const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking wDOI Token Ownership and Details...\n");

    const [deployer] = await ethers.getSigners();
    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";

    const ERC20_ABI = [
        "function name() external view returns (string)",
        "function symbol() external view returns (string)",
        "function decimals() external view returns (uint8)",
        "function totalSupply() external view returns (uint256)",
        "function owner() external view returns (address)",
        "function balanceOf(address account) external view returns (uint256)",
        "function hasRole(bytes32 role, address account) external view returns (bool)"
    ];

    try {
        const wdoiToken = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, deployer);
        
        console.log("📋 Token Basic Info:");
        console.log("─".repeat(40));
        
        const name = await wdoiToken.name();
        const symbol = await wdoiToken.symbol();
        const decimals = await wdoiToken.decimals();
        const totalSupply = await wdoiToken.totalSupply();
        
        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Decimals: ${decimals}`);
        console.log(`Total Supply: ${ethers.formatEther(totalSupply)} wDOI`);
        console.log();

        // Check ownership
        console.log("👤 Ownership Info:");
        console.log("─".repeat(40));
        
        try {
            const owner = await wdoiToken.owner();
            console.log(`Owner: ${owner}`);
            console.log(`Your address: ${deployer.address}`);
            console.log(`You are owner: ${owner.toLowerCase() === deployer.address.toLowerCase() ? "✅ YES" : "❌ NO"}`);
        } catch (e) {
            console.log("Owner function not available (might use different access control)");
        }
        
        console.log();

        // Check roles (if using AccessControl)
        console.log("🔑 Role Checks:");
        console.log("─".repeat(40));
        
        try {
            // MINTER_ROLE = keccak256("MINTER_ROLE")
            const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
            const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
            
            const isMinter = await wdoiToken.hasRole(MINTER_ROLE, deployer.address);
            const isAdmin = await wdoiToken.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
            
            console.log(`Has MINTER_ROLE: ${isMinter ? "✅ YES" : "❌ NO"}`);
            console.log(`Has ADMIN_ROLE: ${isAdmin ? "✅ YES" : "❌ NO"}`);
        } catch (e) {
            console.log("Role-based access control not available");
        }
        
        console.log();

        // Check your balance
        console.log("💰 Your Token Holdings:");
        console.log("─".repeat(40));
        
        const yourBalance = await wdoiToken.balanceOf(deployer.address);
        console.log(`Your wDOI Balance: ${ethers.formatEther(yourBalance)} wDOI`);
        
        const percentage = totalSupply > 0 ? (yourBalance * 100n) / totalSupply : 0n;
        console.log(`Percentage of supply: ${percentage.toString()}%`);
        console.log();

        // Check if you can mint
        console.log("🏭 Minting Capability:");
        console.log("─".repeat(40));
        
        const MINT_ABI = [
            "function mint(address to, uint256 amount) external"
        ];
        
        try {
            const wdoiMintContract = new ethers.Contract(WDOI_TOKEN, MINT_ABI, deployer);
            
            // Try to estimate gas for a small mint (this will fail if we don't have permission)
            await wdoiMintContract.mint.estimateGas(deployer.address, ethers.parseEther("1"));
            console.log("✅ You CAN mint tokens");
        } catch (e) {
            console.log("❌ You CANNOT mint tokens");
            console.log(`Reason: ${e.message.includes("AccessControl") ? "No MINTER_ROLE" : "Unknown"}`);
        }

        console.log();
        console.log("🎯 Summary:");
        console.log("─".repeat(40));
        
        if (yourBalance > 0) {
            console.log("✅ You have wDOI tokens");
            console.log("✅ You can use them for Uniswap trading");
        } else {
            console.log("❌ You have no wDOI tokens");
            console.log("💡 You need to mint or receive some first");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);