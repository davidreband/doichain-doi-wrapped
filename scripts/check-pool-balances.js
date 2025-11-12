const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Pool Token Balances...\n");

    const POOL_ADDRESS = "0xa23e7d3FF97A989B3f09B4Ea8b64A5f104e8721B";
    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";

    const ERC20_ABI = [
        "function balanceOf(address account) external view returns (uint256)",
        "function symbol() external view returns (string)",
        "function decimals() external view returns (uint8)"
    ];

    try {
        const wdoiToken = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, ethers.provider);
        const usdtToken = new ethers.Contract(USDT_TOKEN, ERC20_ABI, ethers.provider);

        // Check pool balances
        const wdoiInPool = await wdoiToken.balanceOf(POOL_ADDRESS);
        const usdtInPool = await usdtToken.balanceOf(POOL_ADDRESS);
        
        const wdoiDecimals = await wdoiToken.decimals();
        const usdtDecimals = await usdtToken.decimals();

        console.log("🏊 Pool Token Balances:");
        console.log("─".repeat(40));
        console.log(`wDOI in pool: ${ethers.formatUnits(wdoiInPool, wdoiDecimals)} wDOI`);
        console.log(`USDT in pool: ${ethers.formatUnits(usdtInPool, usdtDecimals)} USDT`);
        console.log();

        if (wdoiInPool > 0 && usdtInPool > 0) {
            console.log("✅ Pool has both tokens - should be tradeable");
            
            // Calculate approximate price
            const wdoiAmount = Number(ethers.formatUnits(wdoiInPool, wdoiDecimals));
            const usdtAmount = Number(ethers.formatUnits(usdtInPool, usdtDecimals));
            const price = usdtAmount / wdoiAmount;
            
            console.log(`Approximate price: 1 wDOI ≈ ${price.toFixed(6)} USDT`);
        } else {
            console.log("❌ Pool is empty - tokens might not appear in Uniswap");
        }

        console.log();
        console.log("🔗 Direct Links to Try:");
        console.log("─".repeat(40));
        console.log("Pool on Etherscan:");
        console.log(`https://sepolia.etherscan.io/address/${POOL_ADDRESS}`);
        console.log();
        console.log("Force import via Uniswap add liquidity:");
        console.log(`https://app.uniswap.org/#/add/${USDT_TOKEN}/${WDOI_TOKEN}?chain=sepolia`);

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);