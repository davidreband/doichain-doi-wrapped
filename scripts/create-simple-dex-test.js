const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Testing Token Recognition...\n");

    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";

    console.log("📋 Token Information for Manual Import:");
    console.log("═".repeat(50));
    
    const ERC20_ABI = [
        "function name() external view returns (string)",
        "function symbol() external view returns (string)",
        "function decimals() external view returns (uint8)"
    ];

    try {
        const provider = ethers.provider;
        
        // wDOI info
        const wdoiToken = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, provider);
        const wdoiName = await wdoiToken.name();
        const wdoiSymbol = await wdoiToken.symbol();
        const wdoiDecimals = await wdoiToken.decimals();
        
        // USDT info
        const usdtToken = new ethers.Contract(USDT_TOKEN, ERC20_ABI, provider);
        const usdtName = await usdtToken.name();
        const usdtSymbol = await usdtToken.symbol();
        const usdtDecimals = await usdtToken.decimals();

        console.log("🪙 wDOI Token:");
        console.log(`  Name: ${wdoiName}`);
        console.log(`  Symbol: ${wdoiSymbol}`);
        console.log(`  Address: ${WDOI_TOKEN}`);
        console.log(`  Decimals: ${wdoiDecimals}`);
        console.log();
        
        console.log("🪙 USDT Token:");
        console.log(`  Name: ${usdtName}`);
        console.log(`  Symbol: ${usdtSymbol}`);
        console.log(`  Address: ${USDT_TOKEN}`);
        console.log(`  Decimals: ${usdtDecimals}`);
        console.log();

        console.log("💡 Alternative DEX Options for Testing:");
        console.log("─".repeat(40));
        console.log("1. SushiSwap: https://www.sushi.com/swap");
        console.log("2. 1inch: https://app.1inch.io/");
        console.log("3. PancakeSwap: https://pancakeswap.finance/swap");
        console.log("4. Our Direct Interface: /direct page");
        console.log();

        console.log("🔧 Manual Import Steps for Any DEX:");
        console.log("─".repeat(40));
        console.log("Step 1: Add wDOI token");
        console.log(`  Address: ${WDOI_TOKEN}`);
        console.log(`  Symbol: ${wdoiSymbol}`);
        console.log(`  Decimals: ${wdoiDecimals}`);
        console.log();
        console.log("Step 2: Add USDT token");
        console.log(`  Address: ${USDT_TOKEN}`);
        console.log(`  Symbol: ${usdtSymbol}`);
        console.log(`  Decimals: ${usdtDecimals}`);
        console.log();

        console.log("🎯 Recommended Next Steps:");
        console.log("─".repeat(40));
        console.log("1. Try alternative DEX interfaces");
        console.log("2. Use MetaMask swap feature");
        console.log("3. Test with our direct interface first");
        console.log("4. Contact Uniswap support about Sepolia token lists");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);