const hre = require("hardhat");
const fs = require('fs');

// Router ABI для Uniswap V2
const UNISWAP_V2_ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

// Pair ABI
const UNISWAP_V2_PAIR_ABI = [
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)"
];

// Enhanced wDOI V3 ABI
const WDOI_V3_ABI = [
    "function mint(address to, uint256 amount, string doiTxHash, uint256 custodianDoiBalance) external",
    "function declareReserves(uint256 amount) external",
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

// ERC20 ABI
const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

async function main() {
    const command = process.argv[2];
    
    if (!command) {
        showHelp();
        return;
    }

    console.log(`🔧 Liquidity Management: ${command}\n`);

    // Загружаем конфигурацию
    const config = await loadConfig();
    const [signer] = await hre.ethers.getSigners();
    
    console.log("📝 Using account:", signer.address);
    console.log("🌐 Network:", hre.network.name);
    console.log("");

    try {
        switch (command) {
            case 'add':
                await addLiquidity(config, signer);
                break;
            case 'remove':
                await removeLiquidity(config, signer);
                break;
            case 'mint-and-add':
                await mintAndAddLiquidity(config, signer);
                break;
            case 'rebalance':
                await rebalancePool(config, signer);
                break;
            case 'emergency-withdraw':
                await emergencyWithdraw(config, signer);
                break;
            default:
                console.log("❌ Unknown command:", command);
                showHelp();
        }
    } catch (error) {
        console.error("❌ Operation failed:", error.message);
        process.exit(1);
    }
}

async function loadConfig() {
    // Загружаем адреса из deployment файлов
    const deploymentsDir = './deployments';
    let deploymentInfo = null;

    try {
        const deploymentFile = `${deploymentsDir}/${hre.network.name}-v3-deployment.json`;
        if (fs.existsSync(deploymentFile)) {
            deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        }
    } catch (error) {
        console.log("⚠️  No deployment info found");
    }

    const config = {
        WDOI_ADDRESS: deploymentInfo?.proxyAddress || process.env.WDOI_ADDRESS,
        USDT_ADDRESS: process.env.USDT_ADDRESS || "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", // Sepolia USDT
        ROUTER_ADDRESS: process.env.UNISWAP_ROUTER || "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
        POOL_ADDRESS: process.env.WDOI_USDT_POOL,
        SLIPPAGE: 0.5, // 0.5% slippage tolerance
        DEADLINE_MINUTES: 20
    };

    if (!config.WDOI_ADDRESS || !config.POOL_ADDRESS) {
        throw new Error("Missing required addresses. Please configure WDOI_ADDRESS and WDOI_USDT_POOL");
    }

    return config;
}

async function addLiquidity(config, signer) {
    const wdoiAmount = process.argv[3];
    const usdtAmount = process.argv[4];

    if (!wdoiAmount || !usdtAmount) {
        console.log("❌ Usage: npm run manage-liquidity add <wdoiAmount> <usdtAmount>");
        console.log("Example: npm run manage-liquidity add 1000 1000");
        return;
    }

    console.log("💧 Adding Liquidity...");
    console.log(`wDOI Amount: ${wdoiAmount}`);
    console.log(`USDT Amount: ${usdtAmount}`);
    console.log("");

    // Подключаемся к контрактам
    const router = new hre.ethers.Contract(config.ROUTER_ADDRESS, UNISWAP_V2_ROUTER_ABI, signer);
    const wdoiContract = new hre.ethers.Contract(config.WDOI_ADDRESS, ERC20_ABI, signer);
    const usdtContract = new hre.ethers.Contract(config.USDT_ADDRESS, ERC20_ABI, signer);

    // Получаем decimals
    const wdoiDecimals = await wdoiContract.decimals();
    const usdtDecimals = await usdtContract.decimals();

    // Конвертируем amounts в wei
    const wdoiAmountWei = hre.ethers.parseUnits(wdoiAmount, wdoiDecimals);
    const usdtAmountWei = hre.ethers.parseUnits(usdtAmount, usdtDecimals);

    // Проверяем баланс
    const wdoiBalance = await wdoiContract.balanceOf(signer.address);
    const usdtBalance = await usdtContract.balanceOf(signer.address);

    console.log("💰 Current Balances:");
    console.log(`wDOI: ${hre.ethers.formatUnits(wdoiBalance, wdoiDecimals)}`);
    console.log(`USDT: ${hre.ethers.formatUnits(usdtBalance, usdtDecimals)}`);

    if (wdoiBalance < wdoiAmountWei) {
        throw new Error(`Insufficient wDOI balance. Need ${wdoiAmount}, have ${hre.ethers.formatUnits(wdoiBalance, wdoiDecimals)}`);
    }
    if (usdtBalance < usdtAmountWei) {
        throw new Error(`Insufficient USDT balance. Need ${usdtAmount}, have ${hre.ethers.formatUnits(usdtBalance, usdtDecimals)}`);
    }

    // Проверяем и устанавливаем allowance
    console.log("🔐 Checking approvals...");
    
    const wdoiAllowance = await wdoiContract.allowance(signer.address, config.ROUTER_ADDRESS);
    if (wdoiAllowance < wdoiAmountWei) {
        console.log("Approving wDOI...");
        const approveTx = await wdoiContract.approve(config.ROUTER_ADDRESS, wdoiAmountWei);
        await approveTx.wait();
    }

    const usdtAllowance = await usdtContract.allowance(signer.address, config.ROUTER_ADDRESS);
    if (usdtAllowance < usdtAmountWei) {
        console.log("Approving USDT...");
        const approveTx = await usdtContract.approve(config.ROUTER_ADDRESS, usdtAmountWei);
        await approveTx.wait();
    }

    // Вычисляем минимальные amounts с учетом slippage
    const wdoiAmountMin = wdoiAmountWei * BigInt(Math.floor((100 - config.SLIPPAGE) * 100)) / BigInt(10000);
    const usdtAmountMin = usdtAmountWei * BigInt(Math.floor((100 - config.SLIPPAGE) * 100)) / BigInt(10000);

    // Deadline
    const deadline = Math.floor(Date.now() / 1000) + (config.DEADLINE_MINUTES * 60);

    console.log("🚀 Adding liquidity to pool...");
    
    const addLiquidityTx = await router.addLiquidity(
        config.WDOI_ADDRESS,
        config.USDT_ADDRESS,
        wdoiAmountWei,
        usdtAmountWei,
        wdoiAmountMin,
        usdtAmountMin,
        signer.address,
        deadline
    );

    console.log("⏳ Waiting for confirmation...");
    const receipt = await addLiquidityTx.wait();
    
    console.log("✅ Liquidity added successfully!");
    console.log("📄 Transaction hash:", receipt.hash);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
}

async function mintAndAddLiquidity(config, signer) {
    const wdoiAmount = process.argv[3];
    const doiTxHash = process.argv[4];
    const custodianDoiBalance = process.argv[5];

    if (!wdoiAmount || !doiTxHash || !custodianDoiBalance) {
        console.log("❌ Usage: npm run manage-liquidity mint-and-add <wdoiAmount> <doiTxHash> <custodianDoiBalance>");
        console.log("Example: npm run manage-liquidity mint-and-add 1000 doi_tx_abc123 5000");
        return;
    }

    console.log("🏭 Minting wDOI and Adding Liquidity...");
    console.log(`wDOI to mint: ${wdoiAmount}`);
    console.log(`DOI TX Hash: ${doiTxHash}`);
    console.log(`Custodian DOI Balance: ${custodianDoiBalance}`);
    console.log("");

    // Подключаемся к контракту wDOI V3
    const wdoiV3Contract = new hre.ethers.Contract(config.WDOI_ADDRESS, WDOI_V3_ABI, signer);

    // Конвертируем amounts
    const wdoiAmountWei = hre.ethers.parseEther(wdoiAmount);
    const custodianBalanceWei = hre.ethers.parseEther(custodianDoiBalance);

    console.log("🏭 Minting wDOI tokens...");
    
    const mintTx = await wdoiV3Contract.mint(
        signer.address,
        wdoiAmountWei,
        doiTxHash,
        custodianBalanceWei
    );

    console.log("⏳ Waiting for mint confirmation...");
    await mintTx.wait();
    console.log("✅ wDOI tokens minted successfully!");

    // Теперь добавляем ликвидность
    console.log("");
    console.log("💧 Adding minted wDOI to liquidity pool...");
    
    // Получаем текущую цену из пула для определения нужного количества USDT
    const pair = new hre.ethers.Contract(config.POOL_ADDRESS, UNISWAP_V2_PAIR_ABI, signer);
    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    
    const isWDOIToken0 = token0.toLowerCase() === config.WDOI_ADDRESS.toLowerCase();
    const wdoiReserve = isWDOIToken0 ? reserves.reserve0 : reserves.reserve1;
    const usdtReserve = isWDOIToken0 ? reserves.reserve1 : reserves.reserve0;
    
    const currentPrice = Number(hre.ethers.formatUnits(usdtReserve, 6)) / Number(hre.ethers.formatEther(wdoiReserve));
    const usdtNeeded = parseFloat(wdoiAmount) * currentPrice;

    console.log(`Current wDOI price: ${currentPrice.toFixed(4)} USDT`);
    console.log(`USDT needed for balanced liquidity: ${usdtNeeded.toFixed(2)}`);

    // Проверяем баланс USDT
    const usdtContract = new hre.ethers.Contract(config.USDT_ADDRESS, ERC20_ABI, signer);
    const usdtBalance = await usdtContract.balanceOf(signer.address);
    const usdtBalanceFormatted = parseFloat(hre.ethers.formatUnits(usdtBalance, 6));

    if (usdtBalanceFormatted < usdtNeeded) {
        console.log(`⚠️  Warning: Insufficient USDT balance`);
        console.log(`Available: ${usdtBalanceFormatted.toFixed(2)} USDT`);
        console.log(`Needed: ${usdtNeeded.toFixed(2)} USDT`);
        console.log("Adding liquidity with available USDT...");
        
        // Рассчитываем пропорциональное количество wDOI
        const wdoiToUse = (usdtBalanceFormatted / currentPrice).toFixed(6);
        
        // Рекурсивно вызываем addLiquidity с правильными пропорциями
        process.argv[3] = wdoiToUse;
        process.argv[4] = usdtBalanceFormatted.toString();
        await addLiquidity(config, signer);
    } else {
        // Добавляем ликвидность с рассчитанными amounts
        process.argv[3] = wdoiAmount;
        process.argv[4] = usdtNeeded.toFixed(6);
        await addLiquidity(config, signer);
    }

    console.log("🎉 Mint and add liquidity operation completed!");
}

async function rebalancePool(config, signer) {
    console.log("⚖️  Rebalancing pool to target 1:1 price...");

    // Получаем текущее состояние пула
    const pair = new hre.ethers.Contract(config.POOL_ADDRESS, UNISWAP_V2_PAIR_ABI, signer);
    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    
    const isWDOIToken0 = token0.toLowerCase() === config.WDOI_ADDRESS.toLowerCase();
    const wdoiReserve = isWDOIToken0 ? reserves.reserve0 : reserves.reserve1;
    const usdtReserve = isWDOIToken0 ? reserves.reserve1 : reserves.reserve0;
    
    const wdoiReserveFormatted = parseFloat(hre.ethers.formatEther(wdoiReserve));
    const usdtReserveFormatted = parseFloat(hre.ethers.formatUnits(usdtReserve, 6));
    const currentPrice = usdtReserveFormatted / wdoiReserveFormatted;

    console.log(`Current reserves: ${wdoiReserveFormatted.toFixed(2)} wDOI, ${usdtReserveFormatted.toFixed(2)} USDT`);
    console.log(`Current price: ${currentPrice.toFixed(4)} USDT per wDOI`);

    const targetPrice = 1.0;
    const priceDeviation = Math.abs(currentPrice - targetPrice) / targetPrice;

    if (priceDeviation < 0.02) { // 2% tolerance
        console.log("✅ Pool is already balanced (within 2% of target price)");
        return;
    }

    if (currentPrice > targetPrice) {
        // wDOI is expensive, need to add wDOI liquidity
        const wdoiNeeded = (usdtReserveFormatted / targetPrice) - wdoiReserveFormatted;
        console.log(`💧 Adding ${wdoiNeeded.toFixed(2)} wDOI to reduce price...`);
        
        // Check if we have enough wDOI or need to mint
        const wdoiContract = new hre.ethers.Contract(config.WDOI_ADDRESS, ERC20_ABI, signer);
        const wdoiBalance = await wdoiContract.balanceOf(signer.address);
        const wdoiBalanceFormatted = parseFloat(hre.ethers.formatEther(wdoiBalance));
        
        if (wdoiBalanceFormatted < wdoiNeeded) {
            console.log(`⚠️  Need to mint ${(wdoiNeeded - wdoiBalanceFormatted).toFixed(2)} more wDOI`);
            console.log("Please mint wDOI first using: npm run manage-liquidity mint-and-add");
            return;
        }
        
        // Add liquidity
        process.argv[3] = wdoiNeeded.toFixed(6);
        process.argv[4] = wdoiNeeded.toFixed(6); // Equal amounts for balanced addition
        await addLiquidity(config, signer);
        
    } else {
        // USDT is expensive, need to add USDT or remove wDOI
        console.log("⚠️  wDOI is underpriced - consider removing some wDOI liquidity or adding USDT");
        const usdtNeeded = (wdoiReserveFormatted * targetPrice) - usdtReserveFormatted;
        console.log(`USDT needed: ${usdtNeeded.toFixed(2)}`);
    }
}

async function emergencyWithdraw(config, signer) {
    const lpAmount = process.argv[3];
    
    if (!lpAmount) {
        // Показываем текущий баланс LP токенов
        const pair = new hre.ethers.Contract(config.POOL_ADDRESS, UNISWAP_V2_PAIR_ABI, signer);
        const lpBalance = await pair.balanceOf(signer.address);
        const lpBalanceFormatted = hre.ethers.formatEther(lpBalance);
        
        console.log("💰 Current LP Token Balance:", lpBalanceFormatted);
        console.log("❌ Usage: npm run manage-liquidity emergency-withdraw <lpAmount>");
        console.log(`Example: npm run manage-liquidity emergency-withdraw ${lpBalanceFormatted}`);
        return;
    }

    console.log("🚨 Emergency Liquidity Withdrawal...");
    console.log(`LP Amount to withdraw: ${lpAmount}`);
    
    const router = new hre.ethers.Contract(config.ROUTER_ADDRESS, UNISWAP_V2_ROUTER_ABI, signer);
    const pair = new hre.ethers.Contract(config.POOL_ADDRESS, UNISWAP_V2_PAIR_ABI, signer);
    
    const lpAmountWei = hre.ethers.parseEther(lpAmount);
    
    // Approve LP tokens
    console.log("🔐 Approving LP tokens...");
    const approveTx = await pair.approve(config.ROUTER_ADDRESS, lpAmountWei);
    await approveTx.wait();
    
    // Remove liquidity
    const deadline = Math.floor(Date.now() / 1000) + (config.DEADLINE_MINUTES * 60);
    
    console.log("⏳ Removing liquidity...");
    const removeTx = await router.removeLiquidity(
        config.WDOI_ADDRESS,
        config.USDT_ADDRESS,
        lpAmountWei,
        0, // Accept any amount of token A
        0, // Accept any amount of token B
        signer.address,
        deadline
    );
    
    const receipt = await removeTx.wait();
    
    console.log("✅ Emergency withdrawal completed!");
    console.log("📄 Transaction hash:", receipt.hash);
}

function showHelp() {
    console.log("🔧 Liquidity Management Tools\n");
    console.log("Available commands:");
    console.log("  add <wdoiAmount> <usdtAmount>                 - Add liquidity to pool");
    console.log("  mint-and-add <amount> <doiTx> <balance>       - Mint wDOI and add to pool");
    console.log("  rebalance                                     - Rebalance pool to 1:1 price");
    console.log("  remove <lpAmount>                            - Remove liquidity from pool");
    console.log("  emergency-withdraw <lpAmount>                 - Emergency liquidity withdrawal");
    console.log("");
    console.log("Examples:");
    console.log("  npm run manage-liquidity add 1000 1000");
    console.log("  npm run manage-liquidity mint-and-add 500 doi_tx_123 2000");
    console.log("  npm run manage-liquidity rebalance");
    console.log("");
    console.log("Environment variables needed:");
    console.log("  WDOI_USDT_POOL=<pool_address>");
    console.log("  USDT_ADDRESS=<usdt_address>");
    console.log("  UNISWAP_ROUTER=<router_address>");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });