const { ethers } = require("hardhat");

async function main() {
    console.log("💰 Checking Token Balances...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);
    console.log();

    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";

    const ERC20_ABI = [
        "function balanceOf(address account) external view returns (uint256)",
        "function symbol() external view returns (string)",
        "function decimals() external view returns (uint8)"
    ];

    try {
        // Check ETH balance
        const ethBalance = await ethers.provider.getBalance(deployer.address);
        console.log(`ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

        // Check wDOI balance
        const wdoiContract = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, deployer);
        const wdoiBalance = await wdoiContract.balanceOf(deployer.address);
        const wdoiDecimals = await wdoiContract.decimals();
        console.log(`wDOI Balance: ${ethers.formatUnits(wdoiBalance, wdoiDecimals)} wDOI`);

        // Check USDT balance  
        const usdtContract = new ethers.Contract(USDT_TOKEN, ERC20_ABI, deployer);
        const usdtBalance = await usdtContract.balanceOf(deployer.address);
        const usdtDecimals = await usdtContract.decimals();
        console.log(`USDT Balance: ${ethers.formatUnits(usdtBalance, usdtDecimals)} USDT`);

        console.log();
        console.log("📋 Status:");
        console.log(`Has ETH for gas: ${ethBalance > ethers.parseEther("0.01") ? "✅" : "❌"}`);
        console.log(`Has wDOI: ${wdoiBalance > 0 ? "✅" : "❌"}`);
        console.log(`Has USDT: ${usdtBalance > 0 ? "✅" : "❌"}`);

        if (wdoiBalance === 0n || usdtBalance === 0n) {
            console.log("\n💡 Need to mint tokens first!");
            console.log("Run: npx hardhat run scripts/mint-tokens.js --network sepolia");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);