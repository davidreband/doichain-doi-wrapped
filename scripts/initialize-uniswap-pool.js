const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Initializing Uniswap Pool...\n");

    const [deployer] = await ethers.getSigners();
    
    const POOL_ADDRESS = "0xa23e7d3FF97A989B3f09B4Ea8b64A5f104e8721B";
    
    // Check if pool is initialized
    const POOL_ABI = [
        "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
        "function initialize(uint160 sqrtPriceX96) external"
    ];

    try {
        const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, deployer);
        const slot0 = await pool.slot0();
        
        console.log("🏊 Pool Status:");
        console.log(`sqrtPriceX96: ${slot0.sqrtPriceX96.toString()}`);
        console.log(`Current Tick: ${slot0.tick}`);
        console.log(`Unlocked: ${slot0.unlocked}`);
        
        // Check if price is at initial state
        const initialPrice = "79228162514264337593543950336"; // sqrt(1) * 2^96
        
        if (slot0.sqrtPriceX96.toString() === initialPrice || slot0.sqrtPriceX96.toString() === "79228162514264337593") {
            console.log("\n💡 Pool appears to be uninitialized or at default price");
            console.log("Price: 1 wDOI = 1 USDT (considering decimals)");
            
            // Calculate proper initial price for 1:1 ratio
            // wDOI has 18 decimals, USDT has 6 decimals
            // So 1 wDOI should equal 1 USDT
            // sqrtPrice = sqrt(price) * 2^96
            // price = (10^6 / 10^18) = 10^(-12)
            // But we want 1:1 ratio, so price = 1 * 10^12 = 10^12
            
            const targetPrice = BigInt("79228162514264337593543950336"); // This represents 1:1 ratio
            
            console.log(`\nTarget sqrtPriceX96: ${targetPrice.toString()}`);
            
            if (slot0.sqrtPriceX96.toString() !== targetPrice.toString()) {
                console.log("Initializing pool with 1:1 price...");
                
                const initTx = await pool.initialize(targetPrice, {
                    gasLimit: 500000
                });
                
                console.log(`Init transaction: ${initTx.hash}`);
                await initTx.wait();
                console.log("✅ Pool initialized!");
            }
        } else {
            console.log("✅ Pool already initialized");
        }
        
        console.log("\n📋 Now try these steps:");
        console.log("1. Open Uniswap: https://app.uniswap.org/#/swap?chain=sepolia");
        console.log("2. Click 'Select token'");
        console.log("3. Paste: 0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5");
        console.log("4. Click 'Import' when warned about unknown token");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        
        if (error.message.includes("Already initialized")) {
            console.log("✅ Pool is already initialized");
        }
    }
}

main().catch(console.error);