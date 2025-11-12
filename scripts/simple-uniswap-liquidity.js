const { ethers } = require("hardhat");

async function main() {
    console.log("🏊 Simple Uniswap Liquidity Addition...\n");

    const [deployer] = await ethers.getSigners();
    
    // Addresses
    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";
    const POSITION_MANAGER = "0x1238536071E1c677A632429e3655c799b22cDA52";
    
    // Small amounts first
    const WDOI_AMOUNT = ethers.parseEther("10"); // 10 wDOI
    const USDT_AMOUNT = ethers.parseUnits("10", 6); // 10 USDT

    const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)"
    ];

    try {
        // Check balances first
        const wdoiToken = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, deployer);
        const usdtToken = new ethers.Contract(USDT_TOKEN, ERC20_ABI, deployer);
        
        const wdoiBalance = await wdoiToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        
        console.log("💰 Balances:");
        console.log(`wDOI: ${ethers.formatEther(wdoiBalance)}`);
        console.log(`USDT: ${ethers.formatUnits(usdtBalance, 6)}`);
        
        // Approve tokens
        console.log("\n🔑 Approving tokens...");
        
        const wdoiApproveTx = await wdoiToken.approve(POSITION_MANAGER, WDOI_AMOUNT);
        await wdoiApproveTx.wait();
        console.log("✅ wDOI approved");
        
        const usdtApproveTx = await usdtToken.approve(POSITION_MANAGER, USDT_AMOUNT);
        await usdtApproveTx.wait();
        console.log("✅ USDT approved");
        
        // Create minimal mint params
        const mintParams = {
            token0: WDOI_TOKEN,
            token1: USDT_TOKEN,
            fee: 3000,
            tickLower: -887200,
            tickUpper: 887200,
            amount0Desired: WDOI_AMOUNT,
            amount1Desired: USDT_AMOUNT,
            amount0Min: 0,
            amount1Min: 0,
            recipient: deployer.address,
            deadline: Math.floor(Date.now() / 1000) + 300
        };
        
        console.log("\n🏊 Adding liquidity...");
        console.log("If this fails, the pool might need to be initialized differently.");
        
        // Simple call without decoding result
        const positionManager = new ethers.Contract(
            POSITION_MANAGER,
            ["function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) external payable"],
            deployer
        );
        
        const mintTx = await positionManager.mint(mintParams, {
            gasLimit: 1000000
        });
        
        console.log(`Transaction: ${mintTx.hash}`);
        const receipt = await mintTx.wait();
        
        if (receipt.status === 1) {
            console.log("✅ Success! Liquidity added to Uniswap pool.");
            console.log("Now try importing the token in Uniswap interface.");
        } else {
            console.log("❌ Transaction failed");
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        
        if (error.message.includes("Pool not initialized")) {
            console.log("\n💡 The pool might need initialization first.");
            console.log("Try using a smaller tick range or different approach.");
        }
    }
}

main().catch(console.error);