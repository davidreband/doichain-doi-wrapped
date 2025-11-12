const { ethers } = require("hardhat");

// Полный ABI для Uniswap V3 Pool
const POOL_ABI = [
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    "function factory() external view returns (address)",
    "function liquidity() external view returns (uint128)",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function tickSpacing() external view returns (int24)",
    "function maxLiquidityPerTick() external view returns (uint128)",
    "function feeGrowthGlobal0X128() external view returns (uint256)",
    "function feeGrowthGlobal1X128() external view returns (uint256)",
    "function protocolFees() external view returns (uint128 token0, uint128 token1)"
];

const ERC20_ABI = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
];

async function main() {
    const POOL_ADDRESS = "0xa23e7d3FF97A989B3f09B4Ea8b64A5f104e8721B";
    
    console.log("🏊 COMPLETE UNISWAP V3 POOL PARAMETERS");
    console.log("═".repeat(60));
    console.log(`Pool Address: ${POOL_ADDRESS}`);
    console.log("═".repeat(60));
    console.log();

    try {
        const provider = ethers.provider;
        const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

        // === BASIC POOL INFO ===
        console.log("📋 BASIC POOL INFORMATION");
        console.log("─".repeat(50));
        
        const token0Address = await pool.token0();
        const token1Address = await pool.token1();
        const fee = await pool.fee();
        const factory = await pool.factory();
        const tickSpacing = await pool.tickSpacing();
        
        console.log(`Token0 Address:    ${token0Address}`);
        console.log(`Token1 Address:    ${token1Address}`);
        console.log(`Fee Tier:          ${Number(fee) / 10000}% (${fee} basis points)`);
        console.log(`Factory:           ${factory}`);
        console.log(`Tick Spacing:      ${tickSpacing}`);
        console.log();

        // === TOKEN DETAILS ===
        console.log("🪙 TOKEN DETAILS");
        console.log("─".repeat(50));
        
        const token0 = new ethers.Contract(token0Address, ERC20_ABI, provider);
        const token1 = new ethers.Contract(token1Address, ERC20_ABI, provider);
        
        const [
            token0Name, token0Symbol, token0Decimals, token0Supply, token0PoolBalance,
            token1Name, token1Symbol, token1Decimals, token1Supply, token1PoolBalance
        ] = await Promise.all([
            token0.name(),
            token0.symbol(),
            token0.decimals(),
            token0.totalSupply(),
            token0.balanceOf(POOL_ADDRESS),
            token1.name(),
            token1.symbol(),
            token1.decimals(),
            token1.totalSupply(),
            token1.balanceOf(POOL_ADDRESS)
        ]);

        console.log(`Token0 (${token0Symbol}):`);
        console.log(`  Name:            ${token0Name}`);
        console.log(`  Symbol:          ${token0Symbol}`);
        console.log(`  Decimals:        ${token0Decimals}`);
        console.log(`  Total Supply:    ${ethers.formatUnits(token0Supply, token0Decimals)}`);
        console.log(`  Pool Balance:    ${ethers.formatUnits(token0PoolBalance, token0Decimals)}`);
        console.log();
        
        console.log(`Token1 (${token1Symbol}):`);
        console.log(`  Name:            ${token1Name}`);
        console.log(`  Symbol:          ${token1Symbol}`);
        console.log(`  Decimals:        ${token1Decimals}`);
        console.log(`  Total Supply:    ${ethers.formatUnits(token1Supply, token1Decimals)}`);
        console.log(`  Pool Balance:    ${ethers.formatUnits(token1PoolBalance, token1Decimals)}`);
        console.log();

        // === LIQUIDITY & PRICE INFO ===
        console.log("💰 LIQUIDITY & PRICE INFORMATION");
        console.log("─".repeat(50));
        
        const liquidity = await pool.liquidity();
        const slot0 = await pool.slot0();
        const maxLiquidityPerTick = await pool.maxLiquidityPerTick();
        
        console.log(`Current Liquidity:      ${liquidity.toString()}`);
        console.log(`Max Liquidity Per Tick: ${maxLiquidityPerTick.toString()}`);
        console.log(`Square Root Price X96:  ${slot0.sqrtPriceX96.toString()}`);
        console.log(`Current Tick:           ${slot0.tick}`);
        console.log(`Observation Index:      ${slot0.observationIndex}`);
        console.log(`Observation Cardinality: ${slot0.observationCardinality}`);
        console.log(`Fee Protocol:           ${slot0.feeProtocol}`);
        console.log(`Pool Unlocked:          ${slot0.unlocked}`);
        console.log();

        // === PRICE CALCULATION ===
        if (liquidity > 0) {
            console.log("📊 PRICE CALCULATION");
            console.log("─".repeat(50));
            
            const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96.toString());
            const Q96 = BigInt(2) ** BigInt(96);
            
            // Calculate price = (sqrtPriceX96 / 2^96)^2
            const numerator = sqrtPriceX96 * sqrtPriceX96;
            const denominator = Q96 * Q96;
            
            // Adjust for decimals difference
            const decimal0 = BigInt(10) ** BigInt(token0Decimals);
            const decimal1 = BigInt(10) ** BigInt(token1Decimals);
            
            // Price of token1 in terms of token0
            const price1in0 = (numerator * decimal0) / (denominator * decimal1);
            // Price of token0 in terms of token1  
            const price0in1 = (denominator * decimal1) / (numerator / decimal0);
            
            console.log(`Price (1 ${token0Symbol} = X ${token1Symbol}): ${ethers.formatUnits(price1in0.toString(), 0)}`);
            console.log(`Price (1 ${token1Symbol} = X ${token0Symbol}): ${ethers.formatUnits(price0in1.toString(), token0Decimals - token1Decimals)}`);
            console.log();
        } else {
            console.log("📊 PRICE CALCULATION");
            console.log("─".repeat(50));
            console.log("❌ No liquidity - price unavailable");
            console.log();
        }

        // === FEE INFORMATION ===
        console.log("💸 FEE INFORMATION");
        console.log("─".repeat(50));
        
        const feeGrowthGlobal0 = await pool.feeGrowthGlobal0X128();
        const feeGrowthGlobal1 = await pool.feeGrowthGlobal1X128();
        
        try {
            const protocolFees = await pool.protocolFees();
            console.log(`Fee Growth Global 0:    ${feeGrowthGlobal0.toString()}`);
            console.log(`Fee Growth Global 1:    ${feeGrowthGlobal1.toString()}`);
            console.log(`Protocol Fees Token0:   ${protocolFees.token0.toString()}`);
            console.log(`Protocol Fees Token1:   ${protocolFees.token1.toString()}`);
        } catch (e) {
            console.log(`Fee Growth Global 0:    ${feeGrowthGlobal0.toString()}`);
            console.log(`Fee Growth Global 1:    ${feeGrowthGlobal1.toString()}`);
            console.log(`Protocol Fees:          Not available (older contract)`);
        }
        console.log();

        // === TICK RANGE INFO ===
        console.log("📏 TICK RANGE INFORMATION");
        console.log("─".repeat(50));
        
        const tickSpacingNum = Number(tickSpacing);
        const minTick = Math.floor(-887272 / tickSpacingNum) * tickSpacingNum;
        const maxTick = Math.floor(887272 / tickSpacingNum) * tickSpacingNum;
        
        console.log(`Min Tick:               ${minTick}`);
        console.log(`Max Tick:               ${maxTick}`);
        console.log(`Current Tick:           ${slot0.tick}`);
        console.log(`Tick Spacing:           ${tickSpacing}`);
        console.log(`Available Ticks:        ${(maxTick - minTick) / tickSpacingNum + 1}`);
        console.log();

        // === POOL UTILIZATION ===
        console.log("📈 POOL UTILIZATION");
        console.log("─".repeat(50));
        
        const utilizationPercent = liquidity > 0 ? 
            (Number(liquidity) / Number(maxLiquidityPerTick) * 100).toFixed(4) : 0;
        
        console.log(`Liquidity Utilization:  ${utilizationPercent}%`);
        console.log(`Pool Status:            ${liquidity > 0 ? '🟢 Active' : '🔴 Empty'}`);
        console.log(`Ready for Trading:      ${liquidity > 0 ? '✅ YES' : '❌ NO (needs liquidity)'}`);
        console.log();

        // === SUMMARY ===
        console.log("📋 SUMMARY");
        console.log("─".repeat(50));
        console.log(`Pool Type:              Uniswap V3`);
        console.log(`Trading Pair:           ${token0Symbol}/${token1Symbol}`);
        console.log(`Fee Tier:               ${Number(fee) / 10000}%`);
        console.log(`Network:                Ethereum Sepolia Testnet`);
        console.log(`Pool Address:           ${POOL_ADDRESS}`);
        console.log(`Status:                 ${liquidity > 0 ? '🟢 READY' : '🟡 NEEDS LIQUIDITY'}`);

    } catch (error) {
        console.error("❌ Error fetching pool parameters:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });