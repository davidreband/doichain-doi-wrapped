const { ethers } = require("hardhat");

// Uniswap V3 Factory ABI (только нужные функции)
const FACTORY_ABI = [
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
];

// Uniswap V3 Pool ABI (только нужные функции)
const POOL_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    "function liquidity() external view returns (uint128)",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
];

// ERC20 ABI (только нужные функции)
const ERC20_ABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
];

async function main() {
    console.log("🔍 Verifying Uniswap V3 Pool...\n");

    const provider = ethers.provider;
    
    // Contract addresses
    const UNISWAP_V3_FACTORY = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c"; // Sepolia
    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";
    const EXPECTED_POOL = "0xa23e7d3FF97A989B3f09B4Ea8b64A5f104e8721B";
    const FEE_TIER = 3000; // 0.3%

    try {
        // 1. Check if pool exists through factory
        const factory = new ethers.Contract(UNISWAP_V3_FACTORY, FACTORY_ABI, provider);
        const poolAddress = await factory.getPool(WDOI_TOKEN, USDT_TOKEN, FEE_TIER);
        
        console.log("📋 Pool Verification Results:");
        console.log("─".repeat(50));
        console.log(`Expected Pool:  ${EXPECTED_POOL}`);
        console.log(`Factory Says:   ${poolAddress}`);
        console.log(`Match:          ${poolAddress.toLowerCase() === EXPECTED_POOL.toLowerCase() ? '✅ YES' : '❌ NO'}`);
        console.log();

        if (poolAddress === ethers.ZeroAddress) {
            console.log("❌ Pool does not exist!");
            return;
        }

        // 2. Get pool details
        const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
        
        const token0Address = await pool.token0();
        const token1Address = await pool.token1();
        const fee = await pool.fee();
        const liquidity = await pool.liquidity();
        const slot0 = await pool.slot0();

        console.log("🏊 Pool Information:");
        console.log("─".repeat(50));
        console.log(`Pool Address:   ${poolAddress}`);
        console.log(`Token0:         ${token0Address}`);
        console.log(`Token1:         ${token1Address}`);
        console.log(`Fee Tier:       ${Number(fee) / 10000}% (${fee})`);
        console.log(`Liquidity:      ${liquidity.toString()}`);
        console.log(`Current Price:  ${slot0.sqrtPriceX96.toString()}`);
        console.log(`Current Tick:   ${slot0.tick}`);
        console.log();

        // 3. Get token information
        const token0 = new ethers.Contract(token0Address, ERC20_ABI, provider);
        const token1 = new ethers.Contract(token1Address, ERC20_ABI, provider);

        const token0Name = await token0.name();
        const token0Symbol = await token0.symbol();
        const token0Decimals = await token0.decimals();

        const token1Name = await token1.name();
        const token1Symbol = await token1.symbol();
        const token1Decimals = await token1.decimals();

        console.log("🪙 Token Details:");
        console.log("─".repeat(50));
        console.log(`Token0: ${token0Symbol} (${token0Name})`);
        console.log(`  Address:  ${token0Address}`);
        console.log(`  Decimals: ${token0Decimals}`);
        console.log();
        console.log(`Token1: ${token1Symbol} (${token1Name})`);
        console.log(`  Address:  ${token1Address}`);
        console.log(`  Decimals: ${token1Decimals}`);
        console.log();

        // 4. Verify token order (Uniswap sorts by address)
        const expectedOrder = WDOI_TOKEN.toLowerCase() < USDT_TOKEN.toLowerCase() ? 
            { token0: WDOI_TOKEN, token1: USDT_TOKEN } : 
            { token0: USDT_TOKEN, token1: WDOI_TOKEN };

        console.log("🔄 Token Order Verification:");
        console.log("─".repeat(50));
        console.log(`Expected Token0: ${expectedOrder.token0}`);
        console.log(`Actual Token0:   ${token0Address}`);
        console.log(`Order Correct:   ${token0Address.toLowerCase() === expectedOrder.token0.toLowerCase() ? '✅ YES' : '❌ NO'}`);
        console.log();

        // 5. Calculate current price
        if (liquidity > 0) {
            // Convert sqrtPriceX96 to human readable price
            const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96.toString());
            const Q96 = BigInt(2) ** BigInt(96);
            const price = (sqrtPriceX96 * sqrtPriceX96) / (Q96 * Q96);
            
            // Adjust for decimals
            const decimal0 = BigInt(10) ** BigInt(token0Decimals);
            const decimal1 = BigInt(10) ** BigInt(token1Decimals);
            const adjustedPrice = (price * decimal0) / decimal1;
            
            console.log("💰 Price Information:");
            console.log("─".repeat(50));
            console.log(`Raw sqrtPriceX96: ${sqrtPriceX96.toString()}`);
            console.log(`Price (token1/token0): ${adjustedPrice.toString()}`);
            console.log(`Readable Price: 1 ${token0Symbol} = ${ethers.formatUnits(adjustedPrice.toString(), 0)} ${token1Symbol}`);
        } else {
            console.log("💰 Price Information:");
            console.log("─".repeat(50));
            console.log("❌ No liquidity in pool - price unavailable");
        }

        console.log();
        console.log("🎯 Verification Summary:");
        console.log("─".repeat(50));
        console.log(`✅ Pool exists: ${poolAddress !== ethers.ZeroAddress}`);
        console.log(`✅ Correct address: ${poolAddress.toLowerCase() === EXPECTED_POOL.toLowerCase()}`);
        console.log(`✅ Correct fee tier: ${Number(fee) === FEE_TIER}`);
        console.log(`✅ Has liquidity: ${liquidity > 0}`);
        console.log(`✅ Correct tokens: ${
            (token0Address.toLowerCase() === WDOI_TOKEN.toLowerCase() || token0Address.toLowerCase() === USDT_TOKEN.toLowerCase()) &&
            (token1Address.toLowerCase() === WDOI_TOKEN.toLowerCase() || token1Address.toLowerCase() === USDT_TOKEN.toLowerCase())
        }`);

    } catch (error) {
        console.error("❌ Error verifying pool:", error.message);
        
        if (error.message.includes("could not detect network")) {
            console.log("\n💡 Make sure you're connected to Sepolia testnet");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });