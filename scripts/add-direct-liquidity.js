const { ethers } = require("hardhat");

async function main() {
    console.log("🏊 Adding Liquidity to Direct Pool First...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // Contract addresses
    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";
    const USDT_POOL = "0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C";

    // Liquidity amounts
    const WDOI_AMOUNT = ethers.parseEther("100"); // 100 wDOI
    const USDT_AMOUNT = ethers.parseUnits("100", 6); // 100 USDT

    const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)"
    ];

    const POOL_ABI = [
        "function addLiquidity(uint256 amountUSDT, uint256 amountWDOI) external"
    ];

    try {
        // Connect to contracts
        const wdoiToken = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, deployer);
        const usdtToken = new ethers.Contract(USDT_TOKEN, ERC20_ABI, deployer);
        const pool = new ethers.Contract(USDT_POOL, POOL_ABI, deployer);

        // Check balances
        const wdoiBalance = await wdoiToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);

        console.log("💰 Current Balances:");
        console.log(`wDOI: ${ethers.formatEther(wdoiBalance)} wDOI`);
        console.log(`USDT: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log();

        if (wdoiBalance < WDOI_AMOUNT) {
            console.log(`❌ Insufficient wDOI balance. Need ${ethers.formatEther(WDOI_AMOUNT)} wDOI`);
            return;
        }

        if (usdtBalance < USDT_AMOUNT) {
            console.log(`❌ Insufficient USDT balance. Need ${ethers.formatUnits(USDT_AMOUNT, 6)} USDT`);
            return;
        }

        // Check and approve tokens
        console.log("🔑 Checking approvals...");
        
        const wdoiAllowance = await wdoiToken.allowance(deployer.address, USDT_POOL);
        const usdtAllowance = await usdtToken.allowance(deployer.address, USDT_POOL);

        if (wdoiAllowance < WDOI_AMOUNT) {
            console.log("Approving wDOI...");
            const approveTx = await wdoiToken.approve(USDT_POOL, WDOI_AMOUNT);
            await approveTx.wait();
            console.log("✅ wDOI approved");
        }

        if (usdtAllowance < USDT_AMOUNT) {
            console.log("Approving USDT...");
            const approveTx = await usdtToken.approve(USDT_POOL, USDT_AMOUNT);
            await approveTx.wait();
            console.log("✅ USDT approved");
        }

        console.log();
        console.log("🏊 Adding liquidity to direct pool...");
        console.log(`USDT Amount: ${ethers.formatUnits(USDT_AMOUNT, 6)}`);
        console.log(`wDOI Amount: ${ethers.formatEther(WDOI_AMOUNT)}`);

        // Add liquidity
        const addLiquidityTx = await pool.addLiquidity(USDT_AMOUNT, WDOI_AMOUNT, {
            gasLimit: 300000
        });

        console.log(`Transaction submitted: ${addLiquidityTx.hash}`);
        console.log("Waiting for confirmation...");

        const receipt = await addLiquidityTx.wait();
        console.log(`✅ Liquidity added! Gas used: ${receipt.gasUsed.toString()}`);
        console.log();

        console.log("🎉 Success! Now tokens should appear in Uniswap.");
        console.log("Try the Uniswap interface again.");

    } catch (error) {
        console.error("❌ Error adding liquidity:", error.message);
    }
}

main().catch(console.error);