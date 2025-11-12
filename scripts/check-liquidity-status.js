const hre = require("hardhat");
const fs = require('fs');

// Uniswap V2 Pair ABI (основные функции)
const UNISWAP_V2_PAIR_ABI = [
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)"
];

// ERC20 ABI
const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)"
];

async function main() {
    console.log("🔍 Checking Liquidity Pool Status...\n");

    // Загружаем адреса контрактов
    const deploymentsDir = './deployments';
    let deploymentInfo = null;

    try {
        const deploymentFile = `${deploymentsDir}/${hre.network.name}-v3-deployment.json`;
        if (fs.existsSync(deploymentFile)) {
            deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        }
    } catch (error) {
        console.log("⚠️  No deployment info found, using default addresses");
    }

    // Адреса контрактов (нужно настроить для вашей сети)
    const WDOI_ADDRESS = deploymentInfo?.proxyAddress || "0x0000000000000000000000000000000000000000";
    const USDT_ADDRESS = "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06"; // Sepolia USDT
    const POOL_ADDRESS = process.env.WDOI_USDT_POOL || "0x0000000000000000000000000000000000000000";

    if (POOL_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.log("❌ Pool address not configured");
        console.log("Please set WDOI_USDT_POOL environment variable");
        return;
    }

    const [signer] = await hre.ethers.getSigners();
    console.log("📝 Using account:", signer.address);

    try {
        // Подключаемся к контрактам
        const poolContract = new hre.ethers.Contract(POOL_ADDRESS, UNISWAP_V2_PAIR_ABI, signer);
        const wdoiContract = new hre.ethers.Contract(WDOI_ADDRESS, ERC20_ABI, signer);
        const usdtContract = new hre.ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

        // Получаем информацию о пуле
        console.log("💧 Pool Information:");
        console.log("─".repeat(50));
        console.log("Pool Address:", POOL_ADDRESS);
        console.log("Pool Name:", await poolContract.name());
        console.log("Pool Symbol:", await poolContract.symbol());
        console.log("");

        // Проверяем токены в пуле
        const token0Address = await poolContract.token0();
        const token1Address = await poolContract.token1();
        
        console.log("🪙 Pool Tokens:");
        console.log("Token 0:", token0Address);
        console.log("Token 1:", token1Address);
        
        // Определяем какой токен wDOI, какой USDT
        const isWDOIToken0 = token0Address.toLowerCase() === WDOI_ADDRESS.toLowerCase();
        console.log("wDOI is Token0:", isWDOIToken0);
        console.log("");

        // Получаем резервы
        const reserves = await poolContract.getReserves();
        const reserve0 = reserves.reserve0;
        const reserve1 = reserves.reserve1;

        let wdoiReserve, usdtReserve;
        if (isWDOIToken0) {
            wdoiReserve = reserve0;
            usdtReserve = reserve1;
        } else {
            wdoiReserve = reserve1;
            usdtReserve = reserve0;
        }

        // Получаем информацию о токенах
        const wdoiDecimals = await wdoiContract.decimals();
        const usdtDecimals = await usdtContract.decimals();
        const wdoiSymbol = await wdoiContract.symbol();
        const usdtSymbol = await usdtContract.symbol();

        // Форматируем резервы
        const wdoiReserveFormatted = parseFloat(hre.ethers.formatUnits(wdoiReserve, wdoiDecimals));
        const usdtReserveFormatted = parseFloat(hre.ethers.formatUnits(usdtReserve, usdtDecimals));

        console.log("💰 Current Reserves:");
        console.log("─".repeat(50));
        console.log(`${wdoiSymbol} Reserve:`, wdoiReserveFormatted.toLocaleString());
        console.log(`${usdtSymbol} Reserve:`, usdtReserveFormatted.toLocaleString());
        console.log("");

        // Вычисляем текущую цену
        const currentPrice = usdtReserveFormatted / wdoiReserveFormatted;
        console.log("💲 Price Information:");
        console.log("─".repeat(50));
        console.log(`Current Price: 1 ${wdoiSymbol} = ${currentPrice.toFixed(6)} ${usdtSymbol}`);
        
        // Отклонение от целевой цены 1.0
        const targetPrice = 1.0;
        const priceDeviation = ((currentPrice - targetPrice) / targetPrice) * 100;
        console.log(`Target Price: 1 ${wdoiSymbol} = ${targetPrice.toFixed(6)} ${usdtSymbol}`);
        console.log(`Price Deviation: ${priceDeviation > 0 ? '+' : ''}${priceDeviation.toFixed(2)}%`);
        console.log("");

        // Получаем общее предложение LP токенов
        const totalLPSupply = await poolContract.totalSupply();
        const totalLPFormatted = parseFloat(hre.ethers.formatEther(totalLPSupply));

        // Total Value Locked (TVL)
        const tvl = (wdoiReserveFormatted * currentPrice) + usdtReserveFormatted;
        
        console.log("📊 Pool Statistics:");
        console.log("─".repeat(50));
        console.log(`Total LP Tokens: ${totalLPFormatted.toLocaleString()}`);
        console.log(`Total Value Locked: $${tvl.toLocaleString()}`);
        console.log("");

        // Анализ ликвидности
        console.log("🔍 Liquidity Analysis:");
        console.log("─".repeat(50));
        
        // Статус wDOI ликвидности
        let wdoiLiquidityStatus = "Good";
        let liquidityRecommendation = "";
        
        if (wdoiReserveFormatted < 100) {
            wdoiLiquidityStatus = "CRITICAL";
            liquidityRecommendation = `URGENT: Add ${(500 - wdoiReserveFormatted).toFixed(0)} wDOI immediately`;
        } else if (wdoiReserveFormatted < 500) {
            wdoiLiquidityStatus = "Low";
            liquidityRecommendation = `Warning: Consider adding ${(1000 - wdoiReserveFormatted).toFixed(0)} wDOI`;
        } else if (wdoiReserveFormatted < 1000) {
            wdoiLiquidityStatus = "Moderate";
            liquidityRecommendation = "Monitor closely, may need replenishment soon";
        }

        console.log(`wDOI Liquidity Status: ${wdoiLiquidityStatus}`);
        if (liquidityRecommendation) {
            console.log(`Recommendation: ${liquidityRecommendation}`);
        }

        // Анализ цены
        let priceStatus = "Stable";
        let priceRecommendation = "";
        
        if (Math.abs(priceDeviation) > 10) {
            priceStatus = "HIGH DEVIATION";
            if (priceDeviation > 0) {
                priceRecommendation = "Price too high - add wDOI liquidity to reduce price";
            } else {
                priceRecommendation = "Price too low - remove wDOI or add USDT";
            }
        } else if (Math.abs(priceDeviation) > 5) {
            priceStatus = "Moderate Deviation";
            priceRecommendation = "Monitor price closely";
        }

        console.log(`Price Status: ${priceStatus}`);
        if (priceRecommendation) {
            console.log(`Price Recommendation: ${priceRecommendation}`);
        }
        console.log("");

        // Симуляция торговли
        console.log("🎯 Trading Impact Simulation:");
        console.log("─".repeat(50));
        
        // Симуляция покупки 100 USDT worth of wDOI
        const usdtIn = 100;
        const wdoiOut = simulateSwap(usdtReserveFormatted, wdoiReserveFormatted, usdtIn, true);
        const effectivePrice = usdtIn / wdoiOut;
        const priceImpact = ((effectivePrice - currentPrice) / currentPrice) * 100;
        
        console.log(`Buying $100 worth of wDOI:`);
        console.log(`  You get: ${wdoiOut.toFixed(6)} wDOI`);
        console.log(`  Effective price: ${effectivePrice.toFixed(6)} USDT per wDOI`);
        console.log(`  Price impact: ${priceImpact.toFixed(2)}%`);

        // Симуляция покупки 1000 USDT worth of wDOI
        const usdtIn2 = 1000;
        const wdoiOut2 = simulateSwap(usdtReserveFormatted, wdoiReserveFormatted, usdtIn2, true);
        const effectivePrice2 = usdtIn2 / wdoiOut2;
        const priceImpact2 = ((effectivePrice2 - currentPrice) / currentPrice) * 100;
        
        console.log(`Buying $1000 worth of wDOI:`);
        console.log(`  You get: ${wdoiOut2.toFixed(6)} wDOI`);
        console.log(`  Effective price: ${effectivePrice2.toFixed(6)} USDT per wDOI`);
        console.log(`  Price impact: ${priceImpact2.toFixed(2)}%`);
        console.log("");

        // Рекомендации по пополнению
        console.log("💡 Custodian Recommendations:");
        console.log("─".repeat(50));
        
        if (wdoiReserveFormatted < 500) {
            const recommendedWDOI = 1000 - wdoiReserveFormatted;
            const recommendedUSDT = recommendedWDOI * currentPrice;
            console.log("🚨 IMMEDIATE ACTION REQUIRED:");
            console.log(`  1. Mint ${recommendedWDOI.toFixed(0)} wDOI tokens`);
            console.log(`  2. Add liquidity: ${recommendedWDOI.toFixed(0)} wDOI + ${recommendedUSDT.toFixed(0)} USDT`);
        } else if (priceDeviation > 5) {
            console.log("⚠️  PRICE ADJUSTMENT NEEDED:");
            if (priceDeviation > 0) {
                const wdoiToAdd = (usdtReserveFormatted - wdoiReserveFormatted * targetPrice) / (1 + targetPrice);
                console.log(`  Add ${wdoiToAdd.toFixed(0)} wDOI to lower price`);
            }
        } else {
            console.log("✅ Pool status is good, continue monitoring");
        }

        // Прибыльность LP
        console.log("");
        console.log("💰 LP Profitability (24h estimate):");
        console.log("─".repeat(50));
        
        // Оценка дневного объема (предположим 10% от TVL)
        const estimatedDailyVolume = tvl * 0.1;
        const dailyFees = estimatedDailyVolume * 0.003; // 0.3% комиссия
        const lpShare = 1000 / totalLPFormatted; // Если кастодиан владеет 1000 LP токенов
        const dailyEarnings = dailyFees * lpShare;
        
        console.log(`Estimated daily volume: $${estimatedDailyVolume.toLocaleString()}`);
        console.log(`Daily protocol fees: $${dailyFees.toLocaleString()}`);
        console.log(`Your daily earnings (if 1000 LP): $${dailyEarnings.toFixed(2)}`);
        console.log(`Annual yield estimate: ${((dailyEarnings * 365) / (1000 * 2) * 100).toFixed(2)}%`);

    } catch (error) {
        console.error("❌ Error checking liquidity status:", error.message);
    }
}

// Функция симуляции Uniswap V2 swap
function simulateSwap(reserveIn, reserveOut, amountIn, isExactIn) {
    // Uniswap V2 formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
    const amountInWithFee = amountIn * 997;
    const numerator = amountInWithFee * reserveOut;
    const denominator = (reserveIn * 1000) + amountInWithFee;
    return numerator / denominator;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });