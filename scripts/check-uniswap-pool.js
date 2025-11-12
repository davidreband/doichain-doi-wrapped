// Script to check Uniswap V3 pool status
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Uniswap V3 pool status...\n");

  const POOL_ADDRESS = "0xa23e7d3FF97A989B3f09B4Ea8b64A5f104e8721B";
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Address:", deployer.address);

  const poolAbi = [
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
    "function liquidity() external view returns (uint128)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)"
  ];

  try {
    const pool = new ethers.Contract(POOL_ADDRESS, poolAbi, deployer);
    
    const [slot0, liquidity, token0, token1, fee] = await Promise.all([
      pool.slot0(),
      pool.liquidity(),
      pool.token0(),
      pool.token1(),
      pool.fee()
    ]);

    console.log("📊 Pool Information:");
    console.log(`Pool Address: ${POOL_ADDRESS}`);
    console.log(`Token0: ${token0}`);
    console.log(`Token1: ${token1}`);
    console.log(`Fee: ${Number(fee) / 10000}%`);
    console.log(`Current Price (sqrtPriceX96): ${slot0.sqrtPriceX96.toString()}`);
    console.log(`Current Tick: ${slot0.tick}`);
    console.log(`Total Liquidity: ${liquidity.toString()}`);
    console.log(`Pool Unlocked: ${slot0.unlocked}`);

    if (slot0.sqrtPriceX96 > 0) {
      console.log("\n✅ Pool is initialized and ready for trading!");
      console.log("🔗 Trade URL:");
      console.log(`https://app.uniswap.org/#/swap?inputCurrency=${token0}&outputCurrency=${token1}&chain=sepolia`);
    } else {
      console.log("\n❌ Pool is not initialized yet");
    }

  } catch (error) {
    console.error("❌ Error checking pool:", error.message);
  }
}

main().catch(console.error);