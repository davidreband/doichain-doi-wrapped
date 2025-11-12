const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Testing Simple Token Swap...\n");

    const [deployer] = await ethers.getSigners();
    
    // Use Uniswap pool instead of custom pool
    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";
    const UNISWAP_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"; // Sepolia V3 SwapRouter

    // Small test amounts
    const USDT_AMOUNT = ethers.parseUnits("1", 6); // 1 USDT

    console.log(`Testing swap: 1 USDT → wDOI`);
    console.log(`Using Uniswap V3 Router: ${UNISWAP_ROUTER}`);

    const ERC20_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)"
    ];

    const ROUTER_ABI = [
        "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
    ];

    try {
        const usdtToken = new ethers.Contract(USDT_TOKEN, ERC20_ABI, deployer);
        const wdoiToken = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, deployer);
        const router = new ethers.Contract(UNISWAP_ROUTER, ROUTER_ABI, deployer);

        // Check balances before
        const usdtBefore = await usdtToken.balanceOf(deployer.address);
        const wdoiBefore = await wdoiToken.balanceOf(deployer.address);
        
        console.log("\n💰 Balances Before:");
        console.log(`USDT: ${ethers.formatUnits(usdtBefore, 6)}`);
        console.log(`wDOI: ${ethers.formatEther(wdoiBefore)}`);

        // Approve USDT
        console.log("\n🔑 Approving USDT...");
        const approveTx = await usdtToken.approve(UNISWAP_ROUTER, USDT_AMOUNT);
        await approveTx.wait();
        console.log("✅ USDT approved");

        // Prepare swap parameters
        const swapParams = {
            tokenIn: USDT_TOKEN,
            tokenOut: WDOI_TOKEN,
            fee: 3000, // 0.3%
            recipient: deployer.address,
            deadline: Math.floor(Date.now() / 1000) + 300, // 5 minutes
            amountIn: USDT_AMOUNT,
            amountOutMinimum: 0, // Accept any amount of wDOI
            sqrtPriceLimitX96: 0 // No price limit
        };

        console.log("\n🔄 Executing swap...");
        console.log(`Swapping ${ethers.formatUnits(USDT_AMOUNT, 6)} USDT for wDOI`);

        const swapTx = await router.exactInputSingle(swapParams, {
            gasLimit: 300000
        });

        console.log(`Transaction submitted: ${swapTx.hash}`);
        const receipt = await swapTx.wait();

        if (receipt.status === 1) {
            console.log("✅ Swap successful!");
            
            // Check balances after
            const usdtAfter = await usdtToken.balanceOf(deployer.address);
            const wdoiAfter = await wdoiToken.balanceOf(deployer.address);
            
            console.log("\n💰 Balances After:");
            console.log(`USDT: ${ethers.formatUnits(usdtAfter, 6)}`);
            console.log(`wDOI: ${ethers.formatEther(wdoiAfter)}`);
            
            const usdtUsed = usdtBefore - usdtAfter;
            const wdoiReceived = wdoiAfter - wdoiBefore;
            
            console.log("\n📊 Swap Results:");
            console.log(`USDT spent: ${ethers.formatUnits(usdtUsed, 6)}`);
            console.log(`wDOI received: ${ethers.formatEther(wdoiReceived)}`);
            
            if (wdoiReceived > 0) {
                const rate = Number(ethers.formatUnits(usdtUsed, 6)) / Number(ethers.formatEther(wdoiReceived));
                console.log(`Exchange rate: 1 wDOI = ${rate.toFixed(6)} USDT`);
            }
            
            console.log("\n🎉 Uniswap integration works!");
            console.log("💡 You can now use this in the frontend");
            
        } else {
            console.log("❌ Swap failed");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        
        if (error.message.includes("STF")) {
            console.log("💡 STF = 'Swap To Fork' - usually means insufficient liquidity or wrong price");
        } else if (error.message.includes("Too little received")) {
            console.log("💡 Try with amountOutMinimum: 0");
        }
    }
}

main().catch(console.error);