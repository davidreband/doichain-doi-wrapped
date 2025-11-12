const hre = require("hardhat");
const fs = require('fs');
const axios = require('axios');

/**
 * Simple Price System Check - Проверка системы поддержания цены
 */

async function main() {
    console.log("🔍 ПРОВЕРКА СИСТЕМЫ ПОДДЕРЖАНИЯ ЦЕНЫ");
    console.log("=".repeat(50));
    console.log("");
    
    const [signer] = await hre.ethers.getSigners();
    console.log("📝 Using account:", signer.address);
    console.log("");
    
    let systemReady = true;
    
    // 1. Проверка Price Oracle
    console.log("1️⃣  ПРОВЕРКА PRICE ORACLE");
    console.log("-".repeat(30));
    
    const oracleFile = `./deployments/${hre.network.name}-price-oracle.json`;
    if (fs.existsSync(oracleFile)) {
        try {
            const oracle = JSON.parse(fs.readFileSync(oracleFile, 'utf8'));
            console.log("✅ Oracle развернут:", oracle.address);
            
            const priceOracle = await hre.ethers.getContractAt("DOIPriceOracle", oracle.address);
            const { price, isStale } = await priceOracle.getPrice();
            const priceUSD = Number(price) / 100000000;
            
            console.log(`📈 DOI цена: $${priceUSD.toFixed(8)}`);
            console.log(`📅 Актуальность: ${!isStale ? '✅ Свежая' : '⚠️ Устарела'}`);
            
            if (isStale) {
                console.log("💡 Обновите цену: npm run update-doi-price");
                systemReady = false;
            }
            
        } catch (error) {
            console.log("❌ Ошибка подключения к oracle:", error.message);
            systemReady = false;
        }
    } else {
        console.log("❌ Price Oracle не развернут");
        console.log("💡 Запустите: npm run deploy-price-oracle");
        systemReady = false;
    }
    
    console.log("");
    
    // 2. Проверка wDOI контракта
    console.log("2️⃣  ПРОВЕРКА wDOI КОНТРАКТА");
    console.log("-".repeat(30));
    
    const deploymentFile = `./deployments/${hre.network.name}-deployment.json`;
    let wdoiContract = null;
    
    if (fs.existsSync(deploymentFile)) {
        try {
            const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
            
            if (deployment.WrappedDoichainV3) {
                wdoiContract = await hre.ethers.getContractAt("WrappedDoichainV3", deployment.WrappedDoichainV3);
                console.log("✅ wDOI контракт найден:", deployment.WrappedDoichainV3);
            } else if (deployment.proxy) {
                // Legacy deployment format
                wdoiContract = await hre.ethers.getContractAt("WrappedDoichain", deployment.proxy);
                console.log("✅ wDOI контракт найден (legacy):", deployment.proxy);
                
                // Проверка ролей
                const CUSTODIAN_ROLE = await wdoiContract.CUSTODIAN_ROLE();
                const isCustodian = await wdoiContract.hasRole(CUSTODIAN_ROLE, signer.address);
                
                console.log(`🔐 Custodian права: ${isCustodian ? '✅ Есть' : '❌ Нет'}`);
                
                if (!isCustodian) {
                    console.log("💡 Добавьте себя как кастодиана:");
                    console.log(`   await wdoi.grantRole(CUSTODIAN_ROLE, "${signer.address}")`);
                    systemReady = false;
                }
                
                // Проверка резервов
                try {
                    const reserves = await wdoiContract.declaredReserves();
                    const totalSupply = await wdoiContract.totalSupply();
                    
                    console.log(`💰 Объявленные резервы: ${hre.ethers.formatEther(reserves)} DOI`);
                    console.log(`🪙 Выпущено wDOI: ${hre.ethers.formatEther(totalSupply)} wDOI`);
                    
                    if (reserves === 0n && totalSupply === 0n) {
                        console.log("ℹ️  Система готова к первому минту");
                    }
                } catch (error) {
                    console.log("⚠️  Не удалось проверить резервы:", error.message);
                }
                
            } else {
                console.log("❌ wDOI контракт не найден в deployment");
                systemReady = false;
            }
            
        } catch (error) {
            console.log("❌ Ошибка загрузки deployment:", error.message);
            systemReady = false;
        }
    } else {
        console.log("❌ Deployment файл не найден");
        console.log("💡 Запустите: npm run deploy:v3:sepolia");
        systemReady = false;
    }
    
    console.log("");
    
    // 3. Проверка Uniswap пула
    console.log("3️⃣  ПРОВЕРКА UNISWAP ПУЛА");
    console.log("-".repeat(30));
    
    if (fs.existsSync(deploymentFile)) {
        try {
            const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
            
            if (deployment.WDOI_USDT_POOL) {
                console.log("✅ Uniswap пул найден:", deployment.WDOI_USDT_POOL);
                
                try {
                    const pool = await hre.ethers.getContractAt("IUniswapV2Pair", deployment.WDOI_USDT_POOL);
                    const reserves = await pool.getReserves();
                    const token0 = await pool.token0();
                    const token1 = await pool.token1();
                    
                    console.log("💧 Резервы пула:");
                    console.log(`   Token0 (${token0}): ${hre.ethers.formatEther(reserves[0])}`);
                    console.log(`   Token1 (${token1}): ${hre.ethers.formatUnits(reserves[1], 6)}`); // Assuming USDT = 6 decimals
                    
                    // Попробуем определить какой токен какой
                    const wdoiAddress = deployment.WrappedDoichainV3;
                    let wdoiReserve, usdtReserve;
                    
                    if (token0.toLowerCase() === wdoiAddress.toLowerCase()) {
                        wdoiReserve = reserves[0];
                        usdtReserve = reserves[1];
                    } else {
                        wdoiReserve = reserves[1]; 
                        usdtReserve = reserves[0];
                    }
                    
                    const wdoiBalance = Number(hre.ethers.formatEther(wdoiReserve));
                    const usdtBalance = Number(hre.ethers.formatUnits(usdtReserve, 6));
                    
                    if (wdoiBalance > 0 && usdtBalance > 0) {
                        const poolPrice = usdtBalance / wdoiBalance;
                        console.log(`📊 Цена wDOI в пуле: $${poolPrice.toFixed(8)}`);
                        console.log(`💧 Ликвидность: ${wdoiBalance.toFixed(2)} wDOI + ${usdtBalance.toFixed(2)} USDT`);
                        
                        // Сравнение с oracle если доступен
                        if (fs.existsSync(oracleFile)) {
                            try {
                                const oracle = JSON.parse(fs.readFileSync(oracleFile, 'utf8'));
                                const priceOracle = await hre.ethers.getContractAt("DOIPriceOracle", oracle.address);
                                const { price } = await priceOracle.getPrice();
                                const oraclePrice = Number(price) / 100000000;
                                
                                const deviation = Math.abs((poolPrice - oraclePrice) / oraclePrice) * 100;
                                console.log(`📐 Отклонение от oracle: ${deviation.toFixed(2)}%`);
                                
                                if (deviation < 1) {
                                    console.log("✅ Цена в пределах нормы (<1%)");
                                } else if (deviation < 5) {
                                    console.log("🟡 Небольшое отклонение (1-5%)");
                                } else {
                                    console.log("🔴 Значительное отклонение (>5%) - требуется корректировка");
                                }
                            } catch (error) {
                                console.log("⚠️  Не удалось сравнить с oracle");
                            }
                        }
                        
                    } else {
                        console.log("⚠️  Пул пустой - добавьте ликвидность");
                        systemReady = false;
                    }
                    
                } catch (error) {
                    console.log("❌ Ошибка подключения к пулу:", error.message);
                    systemReady = false;
                }
                
            } else {
                console.log("❌ Uniswap пул не настроен");
                console.log("💡 Создайте пул и добавьте ликвидность:");
                console.log("   npm run manage-liquidity:sepolia");
                systemReady = false;
            }
            
        } catch (error) {
            console.log("❌ Ошибка проверки пула:", error.message);
            systemReady = false;
        }
    }
    
    console.log("");
    
    // 4. Проверка доступности CoinPaprika
    console.log("4️⃣  ПРОВЕРКА COINPAPRIKA API");
    console.log("-".repeat(30));
    
    try {
        const response = await axios.get('https://api.coinpaprika.com/v1/search', {
            params: { q: 'doichain', limit: 5 },
            timeout: 5000
        });
        
        console.log("✅ CoinPaprika API доступно");
        
        if (response.data.currencies && response.data.currencies.length > 0) {
            console.log("✅ DOI найден в CoinPaprika");
            const coin = response.data.currencies[0];
            console.log(`   ${coin.name} (${coin.symbol}) - ID: ${coin.id}`);
        } else {
            console.log("⚠️  DOI не найден в поиске CoinPaprika");
        }
        
    } catch (error) {
        console.log("❌ CoinPaprika API недоступно:", error.message);
        console.log("💡 Проверьте интернет соединение");
        systemReady = false;
    }
    
    console.log("");
    
    // 5. Итоговая оценка
    console.log("🎯 ИТОГОВАЯ ОЦЕНКА СИСТЕМЫ");
    console.log("=".repeat(50));
    
    if (systemReady) {
        console.log("✅ СИСТЕМА ГОТОВА К АВТОМАТИЧЕСКОМУ ПОДДЕРЖАНИЮ ЦЕНЫ!");
        console.log("");
        console.log("🚀 Следующие шаги:");
        console.log("   1. Откройте дашборд: http://localhost:5173/custodian/enhanced");
        console.log("   2. Запустите мониторинг: npm run pool-maintenance monitor");
        console.log("   3. Система будет автоматически корректировать цену каждые 3 минуты");
        console.log("");
        console.log("📊 Логи будут сохраняться в:");
        console.log(`   - ./price-history-${hre.network.name}.json`);
        console.log(`   - ./emergency-logs-${hre.network.name}.json`);
        
    } else {
        console.log("❌ СИСТЕМА НЕ ГОТОВА");
        console.log("");
        console.log("🔧 Устраните проблемы выше и запустите проверку снова:");
        console.log("   npx hardhat run scripts/check-price-system.js --network sepolia");
    }
    
    console.log("");
    console.log("📖 Дополнительные команды:");
    console.log("   npm run update-doi-price       - Обновить цену DOI");
    console.log("   npm run pool-maintenance monitor - Запустить мониторинг");
    console.log("   npm run explain-amm            - Понять механику AMM");
    console.log("   npm run demo-price-keeper       - Демо системы");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Check failed:", error);
        process.exit(1);
    });