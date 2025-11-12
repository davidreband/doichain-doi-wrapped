const hre = require("hardhat");
const fs = require('fs');

/**
 * Demo Price Keeper - Демонстрация автоматического поддержания цены
 */

async function main() {
    console.log("🎯 ДЕМОНСТРАЦИЯ АВТОМАТИЧЕСКОГО ПОДДЕРЖАНИЯ ЦЕНЫ wDOI");
    console.log("=".repeat(70));
    console.log("");
    
    console.log("🔍 Как работает система:");
    console.log("");
    
    // 1. Объяснение принципа работы
    console.log("1️⃣  МОНИТОРИНГ ЦЕН");
    console.log("-".repeat(30));
    console.log("✅ Каждые 3 минуты система проверяет:");
    console.log("   📊 Текущую цену DOI из oracle (CoinPaprika)");
    console.log("   💧 Цену wDOI в Uniswap пуле");
    console.log("   📐 Отклонение между ценами");
    console.log("");
    
    console.log("2️⃣  ПОРОГИ РЕАГИРОВАНИЯ");  
    console.log("-".repeat(30));
    console.log("🟢 Отклонение < 1%: Все ОК, ничего не делаем");
    console.log("🟡 Отклонение 1-3%: Запускаем ребалансировку");
    console.log("🟠 Отклонение 3-10%: Агрессивная ребалансировка");
    console.log("🔴 Отклонение > 10%: Экстренная остановка торговли");
    console.log("");
    
    console.log("3️⃣  ДЕЙСТВИЯ ПО КОРРЕКТИРОВКЕ");
    console.log("-".repeat(30));
    
    // Симуляция сценариев
    await demonstrateScenarios();
    
    console.log("");
    console.log("4️⃣  БЕЗОПАСНОСТЬ");
    console.log("-".repeat(30));
    console.log("🔒 Максимум 50 операций в день");
    console.log("⏱️  Минимум 1 минута между операциями");
    console.log("📊 Максимум $2000 за одну операцию");
    console.log("📝 Полное логирование всех действий");
    console.log("");
    
    console.log("5️⃣  ЗАПУСК СИСТЕМЫ");
    console.log("-".repeat(30));
    console.log("🚀 Для запуска автоматического поддержания цены:");
    console.log("");
    console.log("   # Сначала деплоим оракул цены (если еще не сделано)");
    console.log("   npm run deploy-price-oracle");
    console.log("");
    console.log("   # Обновляем цену DOI");
    console.log("   npm run update-doi-price");
    console.log("");
    console.log("   # Проверяем статус один раз");
    console.log("   npm run pool-maintenance check");
    console.log("");
    console.log("   # Запускаем непрерывный мониторинг (демо режим)");
    console.log("   npm run pool-maintenance monitor");
    console.log("");
    
    // Показать текущий статус если контракты развернуты
    await showCurrentStatus();
}

async function demonstrateScenarios() {
    console.log("📋 ПРИМЕРЫ СЦЕНАРИЕВ КОРРЕКТИРОВКИ:");
    console.log("");
    
    console.log("🔺 СЦЕНАРИЙ A: Цена wDOI в пуле ВЫШЕ цены DOI");
    console.log("   💰 DOI цена: $0.0045");
    console.log("   🏊 wDOI в пуле: $0.0048 (+6.7% отклонение)");
    console.log("   ⚡ Действие: Добавить wDOI в пул или убрать USDT");
    console.log("   🎯 Результат: Цена wDOI снизится к цене DOI");
    console.log("");
    
    console.log("🔻 СЦЕНАРИЙ B: Цена wDOI в пуле НИЖЕ цены DOI");
    console.log("   💰 DOI цена: $0.0045");
    console.log("   🏊 wDOI в пуле: $0.0042 (-6.7% отклонение)");
    console.log("   ⚡ Действие: Убрать wDOI из пула или добавить USDT");
    console.log("   🎯 Результат: Цена wDOI поднимется к цене DOI");
    console.log("");
    
    console.log("📊 Математика корректировки:");
    
    // Пример расчета
    const poolWDOI = 1000;
    const poolUSDT = 4200; // $4200 USDT
    const currentPoolPrice = poolUSDT / poolWDOI; // $4.20 за wDOI (неправильно!)
    const targetDOIPrice = 0.0045; // $0.0045 за DOI
    
    console.log(`   Текущий пул: ${poolWDOI} wDOI + ${poolUSDT} USDT`);
    console.log(`   Цена в пуле: $${currentPoolPrice.toFixed(4)} за wDOI`);
    console.log(`   Целевая цена: $${targetDOIPrice.toFixed(4)} за DOI`);
    console.log(`   Требуется корректировка: MASSIVE (пример с большой ошибкой)`);
    
    // Более реалистичный пример
    console.log("");
    console.log("📊 Реалистичный пример:");
    const realPoolWDOI = 1000;
    const realPoolUSDT = 4.5; // $4.5 USDT (правильное соотношение)
    const realPoolPrice = realPoolUSDT / realPoolWDOI; // $0.0045
    const realTarget = 0.0048; // цена выросла на 6.7%
    
    console.log(`   Пул: ${realPoolWDOI} wDOI + ${realPoolUSDT} USDT`);
    console.log(`   Цена в пуле: $${realPoolPrice.toFixed(4)}`);
    console.log(`   Новая цена DOI: $${realTarget.toFixed(4)}`);
    console.log(`   Нужно добавить: ~65 wDOI для выравнивания`);
}

async function showCurrentStatus() {
    console.log("📊 ТЕКУЩИЙ СТАТУС СИСТЕМЫ");
    console.log("=".repeat(50));
    
    try {
        // Проверяем наличие оракула цены
        const oracleFile = `./deployments/${hre.network.name}-price-oracle.json`;
        if (fs.existsSync(oracleFile)) {
            const oracle = JSON.parse(fs.readFileSync(oracleFile, 'utf8'));
            console.log("✅ Price Oracle развернут:", oracle.address);
            
            // Подключаемся к контракту и получаем данные
            const priceOracle = await hre.ethers.getContractAt("DOIPriceOracle", oracle.address);
            const { price, isStale } = await priceOracle.getPrice();
            const priceUSD = Number(price) / 100000000;
            
            console.log(`📈 Текущая цена DOI: $${priceUSD.toFixed(8)}`);
            console.log(`📅 Цена актуальна: ${!isStale ? 'Да' : 'Нет (устарела)'}`);
            
        } else {
            console.log("❌ Price Oracle не развернут");
            console.log("   Запустите: npm run deploy-price-oracle");
        }
        
        // Проверяем наличие основного контракта
        const deploymentFile = `./deployments/${hre.network.name}-deployment.json`;
        if (fs.existsSync(deploymentFile)) {
            const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
            
            if (deployment.WrappedDoichainV3) {
                console.log("✅ wDOI Contract развернут:", deployment.WrappedDoichainV3);
            }
            
            if (deployment.WDOI_USDT_POOL) {
                console.log("✅ Uniswap Pool найден:", deployment.WDOI_USDT_POOL);
                console.log("🎯 Система готова к запуску автоматического поддержания цены!");
            } else {
                console.log("⚠️  Uniswap Pool не настроен");
                console.log("   Создайте пул ликвидности сначала");
            }
        } else {
            console.log("❌ wDOI контракт не развернут");
        }
        
    } catch (error) {
        console.log("❌ Ошибка проверки статуса:", error.message);
        console.log("💡 Убедитесь что контракты развернуты и .env настроен");
    }
    
    console.log("");
    console.log("🎮 СЛЕДУЮЩИЕ ШАГИ:");
    console.log("-".repeat(20));
    
    if (!fs.existsSync(`./deployments/${hre.network.name}-price-oracle.json`)) {
        console.log("1. npm run deploy-price-oracle");
    } else {
        console.log("✅ 1. Price oracle уже развернут");
    }
    
    console.log("2. npm run update-doi-price");
    console.log("3. npm run pool-maintenance check");
    console.log("4. Откройте http://localhost:5173/custodian/enhanced");
    console.log("5. npm run pool-maintenance monitor (для постоянного мониторинга)");
    console.log("");
    console.log("🎯 После этого система будет автоматически поддерживать");
    console.log("   цену wDOI в соответствии с ценой DOI!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Demo failed:", error);
        process.exit(1);
    });