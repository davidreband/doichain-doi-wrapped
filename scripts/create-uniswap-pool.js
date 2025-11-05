// Script to create wDOI/USDT pool on Uniswap V3
const { ethers } = require("hardhat");

async function main() {
  console.log("🏊 Creating wDOI/USDT pool on Uniswap V3...\n");

  // Contract addresses
  const ADDRESSES = {
    // Sepolia testnet addresses
    UNISWAP_V3_FACTORY: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    UNISWAP_V3_POSITION_MANAGER: "0x1238536071E1c677A632429e3655c799b22cDA52",
    WDOI_TOKEN: "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5",
    USDT_TOKEN: "0x584d5D62adaa8123E1726777AA6EEa154De6c76f"
  };

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Factory ABI for pool creation
  const factoryAbi = [
    "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
  ];

  // Position Manager ABI for liquidity
  const positionManagerAbi = [
    "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)"
  ];

  // ERC20 ABI for token info
  const erc20Abi = [
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function balanceOf(address owner) external view returns (uint256)"
  ];

  try {
    // Get contracts
    const factory = new ethers.Contract(ADDRESSES.UNISWAP_V3_FACTORY, factoryAbi, deployer);
    const positionManager = new ethers.Contract(ADDRESSES.UNISWAP_V3_POSITION_MANAGER, positionManagerAbi, deployer);
    const wdoiToken = new ethers.Contract(ADDRESSES.WDOI_TOKEN, erc20Abi, deployer);
    const usdtToken = new ethers.Contract(ADDRESSES.USDT_TOKEN, erc20Abi, deployer);

    // Get token info
    const [wdoiSymbol, wdoiDecimals, usdtSymbol, usdtDecimals] = await Promise.all([
      wdoiToken.symbol(),
      wdoiToken.decimals(),
      usdtToken.symbol(),
      usdtToken.decimals()
    ]);

    console.log("🪙 Token Information:");
    console.log(`${wdoiSymbol}: ${ADDRESSES.WDOI_TOKEN} (${wdoiDecimals} decimals)`);
    console.log(`${usdtSymbol}: ${ADDRESSES.USDT_TOKEN} (${usdtDecimals} decimals)\n`);

    // Fee tier (0.3% = 3000)
    const feeTier = 3000;

    // Sort tokens (Uniswap requires token0 < token1)
    const token0 = ADDRESSES.WDOI_TOKEN.toLowerCase() < ADDRESSES.USDT_TOKEN.toLowerCase() 
      ? ADDRESSES.WDOI_TOKEN 
      : ADDRESSES.USDT_TOKEN;
    const token1 = ADDRESSES.WDOI_TOKEN.toLowerCase() < ADDRESSES.USDT_TOKEN.toLowerCase() 
      ? ADDRESSES.USDT_TOKEN 
      : ADDRESSES.WDOI_TOKEN;

    console.log("🔄 Token Order:");
    console.log(`Token0: ${token0}`);
    console.log(`Token1: ${token1}`);
    console.log(`Fee Tier: ${feeTier / 10000}%\n`);

    // Check if pool already exists
    const existingPool = await factory.getPool(token0, token1, feeTier);
    
    if (existingPool !== ethers.ZeroAddress) {
      console.log("✅ Pool already exists!");
      console.log("🏊 Pool Address:", existingPool);
      return;
    }

    // Use standard Uniswap V3 initial price
    // For tokens with different decimals, we need to carefully calculate
    // Using a simpler approach: start with 1:1 ratio adjusted for decimals
    
    // Standard sqrtPriceX96 for approximately equal value tokens
    // This represents sqrt(1) * 2^96 = 2^96, adjusted for decimal differences
    
    // Since wDOI (18 decimals) and USDT (6 decimals) have 12-decimal difference
    // We need to account for this in the price calculation
    
    const sqrtPriceX96 = token0 === ADDRESSES.WDOI_TOKEN 
      ? "2505414483750479411823" // sqrt(10^-12) * 2^96 for wDOI/USDT
      : "2505414483750479411823000000000000"; // sqrt(10^12) * 2^96 for USDT/wDOI

    console.log("💰 Initial Price Setup:");
    console.log(`SqrtPriceX96: ${sqrtPriceX96}`);
    console.log("Target: 1 wDOI = 1 USDT (accounting for decimals)\n");

    // Create and initialize pool
    console.log("🏊 Creating pool...");
    const createTx = await positionManager.createAndInitializePoolIfNecessary(
      token0,
      token1,
      feeTier,
      sqrtPriceX96,
      { gasLimit: 3000000 }
    );

    console.log("⏳ Transaction submitted:", createTx.hash);
    const receipt = await createTx.wait();
    console.log("✅ Transaction confirmed!");

    // Get the pool address
    const poolAddress = await factory.getPool(token0, token1, feeTier);
    console.log("\n🎉 Pool Created Successfully!");
    console.log("🏊 Pool Address:", poolAddress);
    console.log("💱 Trading Pair: wDOI/USDT");
    console.log("💰 Fee Tier: 0.3%");
    console.log("\n🔗 Uniswap Interface:");
    console.log(`https://app.uniswap.org/#/add/${token0}/${token1}/${feeTier}`);
    console.log("\n📊 Pool Info:");
    console.log(`https://sepolia.etherscan.io/address/${poolAddress}`);

  } catch (error) {
    console.error("❌ Error creating pool:", error);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main().catch(console.error);