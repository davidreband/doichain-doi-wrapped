const { ethers } = require("hardhat");

// Uniswap V3 Position Manager ABI (основные функции)
const POSITION_MANAGER_ABI = [
    "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
    "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
];

// ERC20 ABI
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

async function main() {
    console.log("🏊 Adding Liquidity to Uniswap V3 Pool...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // Contract addresses
    const POSITION_MANAGER = "0x1238536071E1c677A632429e3655c799b22cDA52"; // Sepolia
    const WDOI_TOKEN = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5";
    const USDT_TOKEN = "0x584d5D62adaa8123E1726777AA6EEa154De6c76f";
    const FEE_TIER = 3000; // 0.3%

    // Liquidity amounts (adjust as needed)
    const WDOI_AMOUNT = ethers.parseEther("500"); // 500 wDOI
    const USDT_AMOUNT = ethers.parseUnits("500", 6); // 500 USDT

    try {
        // Connect to contracts
        const wdoiToken = new ethers.Contract(WDOI_TOKEN, ERC20_ABI, deployer);
        const usdtToken = new ethers.Contract(USDT_TOKEN, ERC20_ABI, deployer);
        const positionManager = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, deployer);

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
        
        const wdoiAllowance = await wdoiToken.allowance(deployer.address, POSITION_MANAGER);
        const usdtAllowance = await usdtToken.allowance(deployer.address, POSITION_MANAGER);

        if (wdoiAllowance < WDOI_AMOUNT) {
            console.log("Approving wDOI...");
            const approveTx = await wdoiToken.approve(POSITION_MANAGER, WDOI_AMOUNT);
            await approveTx.wait();
            console.log("✅ wDOI approved");
        }

        if (usdtAllowance < USDT_AMOUNT) {
            console.log("Approving USDT...");
            const approveTx = await usdtToken.approve(POSITION_MANAGER, USDT_AMOUNT);
            await approveTx.wait();
            console.log("✅ USDT approved");
        }

        console.log();

        // Calculate tick range for full range liquidity (roughly -887220 to 887220)
        const tickLower = -887200; // Slightly inside to avoid edge issues
        const tickUpper = 887200;

        // Prepare mint parameters
        const mintParams = {
            token0: WDOI_TOKEN, // wDOI is token0 (lower address)
            token1: USDT_TOKEN, // USDT is token1
            fee: FEE_TIER,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: WDOI_AMOUNT,
            amount1Desired: USDT_AMOUNT,
            amount0Min: (WDOI_AMOUNT * 95n) / 100n, // 5% slippage
            amount1Min: (USDT_AMOUNT * 95n) / 100n, // 5% slippage
            recipient: deployer.address,
            deadline: Math.floor(Date.now() / 1000) + 300 // 5 minutes
        };

        console.log("📋 Mint Parameters:");
        console.log(`Token0 (wDOI): ${ethers.formatEther(mintParams.amount0Desired)}`);
        console.log(`Token1 (USDT): ${ethers.formatUnits(mintParams.amount1Desired, 6)}`);
        console.log(`Tick Range: ${tickLower} to ${tickUpper}`);
        console.log(`Fee Tier: ${FEE_TIER / 10000}%`);
        console.log();

        // Add liquidity
        console.log("🏊 Adding liquidity...");
        const mintTx = await positionManager.mint(mintParams, {
            gasLimit: 800000 // High gas limit for safety
        });

        console.log(`Transaction submitted: ${mintTx.hash}`);
        console.log("Waiting for confirmation...");

        const receipt = await mintTx.wait();
        console.log(`✅ Liquidity added! Gas used: ${receipt.gasUsed.toString()}`);

        // Parse the mint event to get position details
        const mintEvent = receipt.logs.find(log => 
            log.address.toLowerCase() === POSITION_MANAGER.toLowerCase()
        );

        if (mintEvent) {
            console.log();
            console.log("🎯 Position Created:");
            console.log(`Transaction: ${receipt.hash}`);
            console.log(`Block: ${receipt.blockNumber}`);
            
            // You can decode the event to get tokenId and liquidity amount
            console.log("Check Etherscan for full position details");
        }

        console.log();
        console.log("🎉 Success! Liquidity has been added to the Uniswap pool.");
        console.log("You can now test trading on Uniswap interface.");

    } catch (error) {
        console.error("❌ Error adding liquidity:", error.message);
        
        if (error.message.includes("insufficient funds")) {
            console.log("\n💡 Make sure you have enough ETH for gas fees");
        } else if (error.message.includes("ERC20: transfer amount exceeds balance")) {
            console.log("\n💡 Make sure you have enough tokens to add liquidity");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });