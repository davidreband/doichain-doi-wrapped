const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging Pool Contract Issues...\n");

    const [deployer] = await ethers.getSigners();
    const USDT_POOL = "0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C";
    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";

    console.log(`Failed transaction: 0x1bb4ce28165ff5699adad6536c01a5b1482960e77f1eb074a65eaa108f9c7748`);
    console.log(`Pool address: ${USDT_POOL}`);
    console.log(`Your address: ${deployer.address}`);
    console.log();

    const POOL_ABI = [
        "function reserveUSDT() external view returns (uint256)",
        "function reserveWDOI() external view returns (uint256)",
        "function swapUSDTForWDOI(uint256 amountIn, uint256 minAmountOut) external",
        "function swapWDOIForUSDT(uint256 amountIn, uint256 minAmountOut) external",
        "function addLiquidity(uint256 amountUSDT, uint256 amountWDOI) external",
        "function getOutputAmount(uint256 amountIn, bool isUSDTToWDOI) external view returns (uint256)"
    ];

    const ERC20_ABI = [
        "function balanceOf(address account) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)"
    ];

    try {
        const pool = new ethers.Contract(USDT_POOL, POOL_ABI, deployer);
        const wdoiToken = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, deployer);
        const usdtToken = new ethers.Contract(USDT_TOKEN, ERC20_ABI, deployer);

        // Check pool reserves
        console.log("🏊 Pool Status:");
        console.log("─".repeat(40));
        
        const reserveUSDT = await pool.reserveUSDT();
        const reserveWDOI = await pool.reserveWDOI();
        
        console.log(`Reserve USDT: ${ethers.formatUnits(reserveUSDT, 6)}`);
        console.log(`Reserve wDOI: ${ethers.formatUnits(reserveWDOI, 18)}`);
        
        if (reserveUSDT === 0n || reserveWDOI === 0n) {
            console.log("❌ Pool has no liquidity!");
            console.log("💡 Need to add liquidity first");
        } else {
            console.log("✅ Pool has liquidity");
        }
        console.log();

        // Check user balances
        console.log("💰 Your Balances:");
        console.log("─".repeat(40));
        
        const yourUSDT = await usdtToken.balanceOf(deployer.address);
        const yourWDOI = await wdoiToken.balanceOf(deployer.address);
        
        console.log(`Your USDT: ${ethers.formatUnits(yourUSDT, 6)}`);
        console.log(`Your wDOI: ${ethers.formatUnits(yourWDOI, 18)}`);
        console.log();

        // Check allowances
        console.log("🔑 Allowances:");
        console.log("─".repeat(40));
        
        const usdtAllowance = await usdtToken.allowance(deployer.address, USDT_POOL);
        const wdoiAllowance = await wdoiToken.allowance(deployer.address, USDT_POOL);
        
        console.log(`USDT allowance: ${ethers.formatUnits(usdtAllowance, 6)}`);
        console.log(`wDOI allowance: ${ethers.formatUnits(wdoiAllowance, 18)}`);
        console.log();

        // Test pool calculations
        if (reserveUSDT > 0 && reserveWDOI > 0) {
            console.log("📊 Testing Pool Calculations:");
            console.log("─".repeat(40));
            
            try {
                const testAmount = ethers.parseUnits("1", 6); // 1 USDT
                const expectedOutput = await pool.getOutputAmount(testAmount, true);
                console.log(`1 USDT → ${ethers.formatEther(expectedOutput)} wDOI`);
            } catch (e) {
                console.log("❌ Pool calculation failed:", e.message);
            }
        }

        // Diagnosis
        console.log("🔧 Diagnosis:");
        console.log("─".repeat(40));
        
        if (reserveUSDT === 0n || reserveWDOI === 0n) {
            console.log("❌ Issue: Pool has no liquidity");
            console.log("💡 Solution: Add liquidity first");
        } else if (usdtAllowance === 0n && wdoiAllowance === 0n) {
            console.log("❌ Issue: No token approvals");
            console.log("💡 Solution: Approve tokens first");
        } else {
            console.log("❓ Need to check transaction details on Etherscan");
            console.log(`🔗 https://sepolia.etherscan.io/tx/0x1bb4ce28165ff5699adad6536c01a5b1482960e77f1eb074a65eaa108f9c7748`);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        
        if (error.message.includes("call revert")) {
            console.log("💡 Contract might not exist or have different ABI");
        }
    }
}

main().catch(console.error);