// Simple script to create wDOI/USDT pool on Uniswap V3 using Factory
const { ethers } = require("hardhat");

async function main() {
  console.log("🏊 Creating wDOI/USDT pool via Factory...\n");

  // Contract addresses
  const ADDRESSES = {
    UNISWAP_V3_FACTORY: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    WDOI_TOKEN: "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5",
    USDT_TOKEN: "0x584d5D62adaa8123E1726777AA6EEa154De6c76f"
  };

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Factory ABI
  const factoryAbi = [
    "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
  ];

  try {
    const factory = new ethers.Contract(ADDRESSES.UNISWAP_V3_FACTORY, factoryAbi, deployer);

    // Fee tier (0.3% = 3000)
    const feeTier = 3000;

    console.log("🪙 Creating pool for:");
    console.log(`wDOI: ${ADDRESSES.WDOI_TOKEN}`);
    console.log(`USDT: ${ADDRESSES.USDT_TOKEN}`);
    console.log(`Fee: ${feeTier / 10000}%\n`);

    // Check if pool already exists
    const existingPool = await factory.getPool(ADDRESSES.WDOI_TOKEN, ADDRESSES.USDT_TOKEN, feeTier);
    
    if (existingPool !== ethers.ZeroAddress) {
      console.log("✅ Pool already exists!");
      console.log("🏊 Pool Address:", existingPool);
      return;
    }

    // Create pool
    console.log("🏊 Creating pool...");
    const createTx = await factory.createPool(
      ADDRESSES.WDOI_TOKEN,
      ADDRESSES.USDT_TOKEN,
      feeTier,
      { gasLimit: 5000000 }
    );

    console.log("⏳ Transaction submitted:", createTx.hash);
    const receipt = await createTx.wait();
    console.log("✅ Transaction confirmed!");

    // Get the pool address
    const poolAddress = await factory.getPool(ADDRESSES.WDOI_TOKEN, ADDRESSES.USDT_TOKEN, feeTier);
    
    console.log("\n🎉 Pool Created Successfully!");
    console.log("🏊 Pool Address:", poolAddress);
    console.log("💱 Trading Pair: wDOI/USDT");
    console.log("💰 Fee Tier: 0.3%");
    
    console.log("\n🔗 Next Steps:");
    console.log("1. Initialize pool with price");
    console.log("2. Add initial liquidity");
    console.log("3. Test trading");
    
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