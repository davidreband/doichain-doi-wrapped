const { ethers } = require("hardhat");

async function main() {
    const POOL_ADDRESS = "0xa23e7d3FF97A989B3f09B4Ea8b64A5f104e8721B";
    
    console.log(`🔍 Checking Pool Address: ${POOL_ADDRESS}\n`);

    try {
        const provider = ethers.provider;
        
        // 1. Check if address contains code (is a contract)
        const code = await provider.getCode(POOL_ADDRESS);
        console.log("📋 Basic Checks:");
        console.log("─".repeat(40));
        console.log(`Is Contract: ${code !== "0x" ? "✅ YES" : "❌ NO"}`);
        
        if (code === "0x") {
            console.log("❌ Address is not a contract!");
            return;
        }
        
        // 2. Try to read pool data
        const POOL_ABI = [
            "function token0() external view returns (address)",
            "function token1() external view returns (address)", 
            "function fee() external view returns (uint24)",
            "function factory() external view returns (address)"
        ];
        
        const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);
        
        const token0 = await pool.token0();
        const token1 = await pool.token1();
        const fee = await pool.fee();
        const factory = await pool.factory();
        
        console.log(`Is Uniswap Pool: ✅ YES`);
        console.log();
        
        console.log("🏊 Pool Details:");
        console.log("─".repeat(40));
        console.log(`Address: ${POOL_ADDRESS}`);
        console.log(`Token0:  ${token0}`);
        console.log(`Token1:  ${token1}`);
        console.log(`Fee:     ${Number(fee) / 10000}%`);
        console.log(`Factory: ${factory}`);
        console.log();
        
        // 3. Check if our tokens
        const EXPECTED_WDOI = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
        const EXPECTED_USDT = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";
        
        const hasWDOI = token0.toLowerCase() === EXPECTED_WDOI.toLowerCase() || 
                       token1.toLowerCase() === EXPECTED_WDOI.toLowerCase();
        const hasUSDT = token0.toLowerCase() === EXPECTED_USDT.toLowerCase() || 
                       token1.toLowerCase() === EXPECTED_USDT.toLowerCase();
        
        console.log("✅ Token Verification:");
        console.log("─".repeat(40));
        console.log(`Contains wDOI: ${hasWDOI ? "✅ YES" : "❌ NO"}`);
        console.log(`Contains USDT: ${hasUSDT ? "✅ YES" : "❌ NO"}`);
        console.log(`Correct Pool: ${hasWDOI && hasUSDT ? "✅ YES" : "❌ NO"}`);
        
        // 4. Get token names for confirmation
        if (hasWDOI && hasUSDT) {
            const ERC20_ABI = ["function symbol() external view returns (string)"];
            const token0Contract = new ethers.Contract(token0, ERC20_ABI, provider);
            const token1Contract = new ethers.Contract(token1, ERC20_ABI, provider);
            
            const symbol0 = await token0Contract.symbol();
            const symbol1 = await token1Contract.symbol();
            
            console.log();
            console.log("🪙 Token Symbols:");
            console.log("─".repeat(40));
            console.log(`Token0: ${symbol0}`);
            console.log(`Token1: ${symbol1}`);
        }
        
    } catch (error) {
        if (error.message.includes("call revert")) {
            console.log("❌ Address exists but is not a Uniswap pool");
        } else {
            console.log("❌ Error:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });