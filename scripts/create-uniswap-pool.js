const { ethers } = require('hardhat');

async function main() {
    console.log("🦄 Creating Uniswap V3 Pool: wDOI/USDT...\n");

    // Addresses
    const WDOI_ADDRESS = "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("📝 Creating pool with account:", signer.address);
    
    // Check balances
    const ethBalance = await ethers.provider.getBalance(signer.address);
    console.log("💰 ETH balance:", ethers.formatEther(ethBalance), "ETH");

    // Connect to factory
    const factoryABI = [
        "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
        "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
    ];
    
    const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryABI, signer);
    
    // Pool parameters
    const fee = 3000; // 0.3%
    
    // Check if pool already exists
    console.log("🔍 Checking if pool already exists...");
    const existingPool = await factory.getPool(WDOI_ADDRESS, USDT_ADDRESS, fee);
    
    if (existingPool !== ethers.ZeroAddress) {
        console.log("✅ Pool already exists at:", existingPool);
        return { poolAddress: existingPool };
    }
    
    // Create pool
    console.log("⏳ Creating new pool...");
    console.log("Token A (wDOI):", WDOI_ADDRESS);
    console.log("Token B (USDT):", USDT_ADDRESS);
    console.log("Fee:", fee / 10000 + "%");
    
    const createTx = await factory.createPool(WDOI_ADDRESS, USDT_ADDRESS, fee);
    console.log("📄 Transaction sent:", createTx.hash);
    
    const receipt = await createTx.wait();
    console.log("✅ Pool created in block:", receipt.blockNumber);
    
    // Get pool address
    const poolAddress = await factory.getPool(WDOI_ADDRESS, USDT_ADDRESS, fee);
    console.log("🎯 Pool Address:", poolAddress);
    
    console.log("\n📋 Next steps:");
    console.log("1. Initialize pool price using Position Manager");
    console.log("2. Add initial liquidity");
    console.log("3. Test swaps");
    
    return { poolAddress };
}

main()
    .then((result) => {
        console.log("\n🎉 Pool creation completed!");
        if (result.poolAddress) {
            console.log("🏊‍♂️ Pool Address:", result.poolAddress);
            console.log("🔗 View on Etherscan:", `https://etherscan.io/address/${result.poolAddress}`);
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Pool creation failed:", error);
        process.exit(1);
    });