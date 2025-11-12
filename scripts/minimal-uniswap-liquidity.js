const { ethers } = require("hardhat");

async function main() {
    console.log("🏊 Adding Minimal Liquidity to Uniswap Pool...\n");

    const [deployer] = await ethers.getSigners();
    
    // Contract addresses
    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";
    const POSITION_MANAGER = "0x1238536071E1c677A632429e3655c799b22cDA52";
    
    // Very small amounts to start
    const WDOI_AMOUNT = ethers.parseEther("1"); // 1 wDOI
    const USDT_AMOUNT = ethers.parseUnits("1", 6); // 1 USDT

    console.log(`Account: ${deployer.address}`);
    console.log(`Adding: ${ethers.formatEther(WDOI_AMOUNT)} wDOI + ${ethers.formatUnits(USDT_AMOUNT, 6)} USDT`);

    const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)"
    ];

    const POSITION_MANAGER_ABI = [
        "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
    ];

    try {
        const wdoiToken = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, deployer);
        const usdtToken = new ethers.Contract(USDT_TOKEN, ERC20_ABI, deployer);
        const positionManager = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, deployer);

        // Check balances
        const wdoiBalance = await wdoiToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        
        console.log(`\nBalances: ${ethers.formatEther(wdoiBalance)} wDOI, ${ethers.formatUnits(usdtBalance, 6)} USDT`);

        if (wdoiBalance < WDOI_AMOUNT || usdtBalance < USDT_AMOUNT) {
            console.log("❌ Insufficient balance");
            return;
        }

        // Approve tokens
        console.log("\n🔑 Approving tokens...");
        await (await wdoiToken.approve(POSITION_MANAGER, WDOI_AMOUNT)).wait();
        await (await usdtToken.approve(POSITION_MANAGER, USDT_AMOUNT)).wait();
        console.log("✅ Tokens approved");

        // Prepare mint parameters with wide tick range
        const mintParams = {
            token0: WDOI_TOKEN, // wDOI is token0
            token1: USDT_TOKEN, // USDT is token1  
            fee: 3000, // 0.3%
            tickLower: -887220, // Full range
            tickUpper: 887220,  // Full range
            amount0Desired: WDOI_AMOUNT,
            amount1Desired: USDT_AMOUNT,
            amount0Min: 0, // Accept any amount
            amount1Min: 0, // Accept any amount
            recipient: deployer.address,
            deadline: Math.floor(Date.now() / 1000) + 600 // 10 minutes
        };

        console.log("\n🏊 Minting position...");
        console.log(`Tick range: ${mintParams.tickLower} to ${mintParams.tickUpper}`);
        
        const mintTx = await positionManager.mint(mintParams, {
            gasLimit: 1000000,
            value: 0
        });

        console.log(`📋 Transaction submitted: ${mintTx.hash}`);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await mintTx.wait();
        
        if (receipt.status === 1) {
            console.log("✅ SUCCESS! Liquidity added to Uniswap pool");
            console.log(`Gas used: ${receipt.gasUsed.toString()}`);
            console.log(`Block: ${receipt.blockNumber}`);
            
            console.log("\n🎯 Now try Uniswap again:");
            console.log("1. Go to https://app.uniswap.org/#/swap?chain=sepolia"); 
            console.log("2. Search for: 0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5");
            console.log("3. The token should now be importable!");
            
        } else {
            console.log("❌ Transaction failed");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        
        if (error.message.includes("STF")) {
            console.log("💡 STF error usually means price/tick calculation issue");
        } else if (error.message.includes("revert")) {
            console.log("💡 Transaction reverted - check Etherscan for details");
        }
    }
}

main().catch(console.error);