const hre = require("hardhat");
const axios = require('axios');
const fs = require('fs');

// DOI ticker на CoinPaprika (нужно будет найти правильный)
const DOI_COINPAPRIKA_ID = 'doi-doichain'; // Проверить правильный ID

async function main() {
    console.log("🪙 Updating DOI Price from CoinPaprika...\n");

    try {
        // 1. Получаем цену DOI с CoinPaprika
        const doiPrice = await getDOIPriceFromCoinPaprika();
        
        if (!doiPrice) {
            console.log("❌ Failed to get DOI price from CoinPaprika");
            return;
        }

        // 2. Подключаемся к оракулу цены
        const priceOracle = await connectToPriceOracle();
        
        if (!priceOracle) {
            console.log("❌ Price oracle not deployed");
            return;
        }

        // 3. Обновляем цену в контракте
        await updatePriceInContract(priceOracle, doiPrice);

        // 4. Показываем текущий статус
        await showPriceStatus(priceOracle);

    } catch (error) {
        console.error("❌ Error updating DOI price:", error.message);
        process.exit(1);
    }
}

async function getDOIPriceFromCoinPaprika() {
    try {
        console.log("🔍 Fetching DOI price from CoinPaprika...");
        
        // Сначала найдем правильный ID для DOI
        const searchResponse = await axios.get('https://api.coinpaprika.com/v1/search', {
            params: { 
                q: 'doichain',
                limit: 10
            }
        });

        console.log("🔍 Search results for 'doichain':");
        if (searchResponse.data.currencies && searchResponse.data.currencies.length > 0) {
            searchResponse.data.currencies.forEach((currency, index) => {
                console.log(`${index + 1}. ${currency.name} (${currency.symbol}) - ID: ${currency.id}`);
            });
        }

        // Попробуем получить цену по предполагаемому ID
        let doiPriceData = null;
        const possibleIds = ['doi-doichain', 'doichain', 'doi'];

        for (const id of possibleIds) {
            try {
                console.log(`\n📊 Trying to get price for ID: ${id}`);
                const priceResponse = await axios.get(`https://api.coinpaprika.com/v1/tickers/${id}`);
                
                if (priceResponse.data) {
                    doiPriceData = priceResponse.data;
                    console.log("✅ Found DOI price data!");
                    break;
                }
            } catch (error) {
                console.log(`⚠️  ID ${id} not found`);
            }
        }

        if (!doiPriceData) {
            // Показываем все доступные криптовалюты начинающиеся с 'do'
            console.log("\n🔍 Looking for coins starting with 'do'...");
            const allCoinsResponse = await axios.get('https://api.coinpaprika.com/v1/coins');
            
            const doCoins = allCoinsResponse.data.filter(coin => 
                coin.name.toLowerCase().includes('doi') || 
                coin.symbol.toLowerCase().includes('doi') ||
                coin.id.includes('doi')
            );
            
            console.log("Found DOI-related coins:");
            doCoins.forEach(coin => {
                console.log(`- ${coin.name} (${coin.symbol}) - ID: ${coin.id}`);
            });

            if (doCoins.length > 0) {
                // Попробуем получить цену первого найденного
                const firstCoin = doCoins[0];
                console.log(`\n📊 Trying first match: ${firstCoin.id}`);
                
                const priceResponse = await axios.get(`https://api.coinpaprika.com/v1/tickers/${firstCoin.id}`);
                doiPriceData = priceResponse.data;
            }
        }

        if (doiPriceData && doiPriceData.quotes && doiPriceData.quotes.USD) {
            const priceUSD = doiPriceData.quotes.USD.price;
            const priceChange24h = doiPriceData.quotes.USD.percent_change_24h;
            const volume24h = doiPriceData.quotes.USD.volume_24h;
            const marketCap = doiPriceData.quotes.USD.market_cap;

            console.log("\n💲 DOI Price Information:");
            console.log("─".repeat(50));
            console.log(`Name: ${doiPriceData.name} (${doiPriceData.symbol})`);
            console.log(`Price: $${priceUSD.toFixed(8)}`);
            console.log(`24h Change: ${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`);
            console.log(`24h Volume: $${volume24h ? volume24h.toLocaleString() : 'N/A'}`);
            console.log(`Market Cap: $${marketCap ? marketCap.toLocaleString() : 'N/A'}`);
            console.log(`Last Updated: ${new Date(doiPriceData.last_updated).toLocaleString()}`);

            // Конвертируем в формат оракула (8 decimals)
            const priceIn8Decimals = Math.round(priceUSD * 100000000); // 8 decimals
            console.log(`Price for oracle: ${priceIn8Decimals} (8 decimals)`);

            return {
                priceUSD: priceUSD,
                priceOracle: priceIn8Decimals,
                change24h: priceChange24h,
                volume24h: volume24h,
                marketCap: marketCap,
                lastUpdated: doiPriceData.last_updated
            };
        }

    } catch (error) {
        console.error("❌ CoinPaprika API error:", error.message);
        
        if (error.response) {
            console.log("Response status:", error.response.status);
            console.log("Response data:", error.response.data);
        }
    }

    return null;
}

async function connectToPriceOracle() {
    try {
        // Загружаем адрес оракула из deployment файлов
        const deploymentsDir = './deployments';
        let oracleAddress = null;

        try {
            const deploymentFile = `${deploymentsDir}/${hre.network.name}-price-oracle.json`;
            if (fs.existsSync(deploymentFile)) {
                const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
                oracleAddress = deploymentInfo.address;
            }
        } catch (error) {
            console.log("⚠️  No price oracle deployment found");
        }

        if (!oracleAddress) {
            console.log("📋 Deploy price oracle first:");
            console.log("npx hardhat run scripts/deploy-price-oracle.js --network sepolia");
            return null;
        }

        console.log("🔗 Connecting to price oracle:", oracleAddress);
        
        const [signer] = await hre.ethers.getSigners();
        const priceOracle = await hre.ethers.getContractAt("DOIPriceOracle", oracleAddress, signer);

        return priceOracle;

    } catch (error) {
        console.error("❌ Error connecting to price oracle:", error.message);
        return null;
    }
}

async function updatePriceInContract(priceOracle, doiPriceData) {
    try {
        console.log("\n🔄 Updating price in smart contract...");

        const [signer] = await hre.ethers.getSigners();
        console.log("📝 Using account:", signer.address);

        // Проверяем права доступа
        const PRICE_UPDATER_ROLE = await priceOracle.PRICE_UPDATER_ROLE();
        const hasRole = await priceOracle.hasRole(PRICE_UPDATER_ROLE, signer.address);

        if (!hasRole) {
            console.log("❌ Account does not have PRICE_UPDATER_ROLE");
            console.log("Grant role using: await priceOracle.grantRole(PRICE_UPDATER_ROLE, 'YOUR_ADDRESS')");
            return;
        }

        // Получаем текущую цену для сравнения
        const currentPriceData = await priceOracle.getPrice();
        const currentPrice = currentPriceData.price;
        const currentPriceUSD = Number(currentPrice) / 100000000; // Convert from 8 decimals

        console.log(`Current price in oracle: $${currentPriceUSD.toFixed(8)}`);
        console.log(`New price from CoinPaprika: $${doiPriceData.priceUSD.toFixed(8)}`);

        // Вычисляем изменение
        const priceChange = ((doiPriceData.priceUSD - currentPriceUSD) / currentPriceUSD) * 100;
        console.log(`Price change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`);

        // Обновляем цену
        console.log("⏳ Sending transaction...");
        const updateTx = await priceOracle.updatePrice(doiPriceData.priceOracle);
        
        console.log("📄 Transaction hash:", updateTx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await updateTx.wait();
        console.log("✅ Price updated successfully!");
        console.log("⛽ Gas used:", receipt.gasUsed.toString());

    } catch (error) {
        console.error("❌ Error updating price in contract:", error.message);
        
        if (error.message.includes("Price deviation too high")) {
            console.log("⚠️  Price change is too large for automatic update");
            console.log("💡 Use emergency update if this price is correct:");
            console.log(`await priceOracle.emergencyUpdatePrice(${doiPriceData.priceOracle}, "CoinPaprika price update")`);
        }
    }
}

async function showPriceStatus(priceOracle) {
    try {
        console.log("\n📊 Current Oracle Status:");
        console.log("─".repeat(50));

        const priceData = await priceOracle.getPrice();
        const priceUSD = Number(priceData.price) / 100000000;
        
        console.log(`Oracle Price: $${priceUSD.toFixed(8)}`);
        console.log(`Is Stale: ${priceData.isStale}`);

        // Получаем TWAP
        const twapData = await priceOracle.getTWAP();
        const twapUSD = Number(twapData.twapPrice) / 100000000;
        
        console.log(`TWAP (1h): $${twapUSD.toFixed(8)} (${twapData.dataPoints} data points)`);

        // Получаем статистику
        const stats = await priceOracle.getPriceStatistics();
        const minUSD = Number(stats.min) / 100000000;
        const maxUSD = Number(stats.max) / 100000000;
        const avgUSD = Number(stats.avg) / 100000000;

        console.log(`Min Price: $${minUSD.toFixed(8)}`);
        console.log(`Max Price: $${maxUSD.toFixed(8)}`);
        console.log(`Avg Price: $${avgUSD.toFixed(8)}`);

        // Сохраняем данные в файл для мониторинга
        const priceHistoryFile = `./price-history-${hre.network.name}.json`;
        const historyEntry = {
            timestamp: new Date().toISOString(),
            price: priceUSD,
            twap: twapUSD,
            network: hre.network.name
        };

        let priceHistory = [];
        if (fs.existsSync(priceHistoryFile)) {
            priceHistory = JSON.parse(fs.readFileSync(priceHistoryFile, 'utf8'));
        }
        
        priceHistory.push(historyEntry);
        
        // Сохраняем только последние 100 записей
        if (priceHistory.length > 100) {
            priceHistory = priceHistory.slice(-100);
        }
        
        fs.writeFileSync(priceHistoryFile, JSON.stringify(priceHistory, null, 2));
        console.log(`📁 Price history saved to: ${priceHistoryFile}`);

    } catch (error) {
        console.error("❌ Error getting price status:", error.message);
    }
}

// Функция для создания cron job
async function setupAutomaticPriceUpdates() {
    console.log("\n⏰ Setting up automatic price updates:");
    console.log("─".repeat(50));
    
    console.log("Create a cron job to run this script every hour:");
    console.log("# Edit crontab");
    console.log("crontab -e");
    console.log("");
    console.log("# Add this line for hourly updates:");
    console.log("0 * * * * cd /path/to/wrapped-doichain && npm run update-doi-price >> /tmp/doi-price-update.log 2>&1");
    console.log("");
    console.log("Or use PM2 for process management:");
    console.log("pm2 start scripts/price-updater-daemon.js --name doi-price-updater");
}

main()
    .then(() => {
        console.log("\n🎉 DOI price update completed!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });