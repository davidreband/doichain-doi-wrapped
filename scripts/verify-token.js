const { ethers } = require("hardhat");

async function main() {
    const WDOI_ADDRESS = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    
    console.log("🔍 Verifying wDOI Token...\n");

    try {
        const provider = ethers.provider;
        
        const ERC20_ABI = [
            "function name() external view returns (string)",
            "function symbol() external view returns (string)", 
            "function decimals() external view returns (uint8)",
            "function totalSupply() external view returns (uint256)"
        ];
        
        const token = new ethers.Contract(WDOI_ADDRESS, ERC20_ABI, provider);
        
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        const totalSupply = await token.totalSupply();
        
        console.log("✅ Token Information:");
        console.log(`Address:      ${WDOI_ADDRESS}`);
        console.log(`Name:         ${name}`);
        console.log(`Symbol:       ${symbol}`);
        console.log(`Decimals:     ${decimals}`);
        console.log(`Total Supply: ${ethers.formatEther(totalSupply)}`);
        console.log();
        console.log("📋 For Uniswap Import:");
        console.log(`Address:  ${WDOI_ADDRESS}`);
        console.log(`Symbol:   ${symbol}`);
        console.log(`Decimals: ${decimals}`);
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);