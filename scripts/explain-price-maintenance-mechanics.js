const hre = require("hardhat");

/**
 * Detailed Price Maintenance Mechanics Explanation
 * 
 * Shows EXACTLY how the system maintains wDOI price equal to DOI price
 */

class PriceMaintenanceMechanics {
    constructor() {
        // Real example with current DOI price
        this.doiPrice = 0.02294166; // Real DOI price from CoinPaprika
        
        // Example pool scenarios
        this.scenarios = [
            {
                name: "SCENARIO 1: Pool price TOO HIGH",
                poolWDOI: 1000,
                poolUSDT: 25,     // $25 USDT = $0.025 per wDOI (TOO HIGH)
                poolPrice: 0.025,
                deviation: 8.97,  // 8.97% higher than DOI price
                action: "ADD_WDOI_OR_REMOVE_USDT"
            },
            {
                name: "SCENARIO 2: Pool price TOO LOW", 
                poolWDOI: 1000,
                poolUSDT: 20,     // $20 USDT = $0.02 per wDOI (TOO LOW)
                poolPrice: 0.02,
                deviation: -12.81, // 12.81% lower than DOI price
                action: "REMOVE_WDOI_OR_ADD_USDT"
            },
            {
                name: "SCENARIO 3: Pool price CORRECT",
                poolWDOI: 1000,
                poolUSDT: 22.94,  // $22.94 USDT = $0.02294 per wDOI (CORRECT)
                poolPrice: 0.02294,
                deviation: 0.07,  // Only 0.07% difference
                action: "NO_ACTION_NEEDED"
            }
        ];
    }
    
    async explainMechanics() {
        console.log("🔧 КОНКРЕТНЫЕ МЕХАНИЗМЫ ПОДДЕРЖАНИЯ ЦЕНЫ");
        console.log("=".repeat(70));
        console.log("");
        
        console.log("🎯 ЦЕЛЬ: Держать цену wDOI = цене DOI");
        console.log(`📊 Текущая цена DOI: $${this.doiPrice.toFixed(8)}`);
        console.log("");
        
        // Analyze each scenario
        for (const scenario of this.scenarios) {
            await this.explainScenario(scenario);
            console.log("");
        }
        
        // Show specific technical actions
        await this.showTechnicalActions();
        
        // Show automation workflow
        await this.showAutomationWorkflow();
    }
    
    async explainScenario(scenario) {
        console.log(`📋 ${scenario.name}`);
        console.log("-".repeat(50));
        
        console.log("📊 Состояние пула:");
        console.log(`   wDOI: ${scenario.poolWDOI}`);
        console.log(`   USDT: ${scenario.poolUSDT}`);
        console.log(`   Цена wDOI: $${scenario.poolPrice.toFixed(8)}`);
        console.log(`   Отклонение: ${scenario.deviation.toFixed(2)}%`);
        console.log("");
        
        if (scenario.action === "ADD_WDOI_OR_REMOVE_USDT") {
            console.log("🔧 ПРОБЛЕМА: Цена wDOI слишком высокая");
            console.log("⚡ РЕШЕНИЕ: Нужно СНИЗИТЬ цену wDOI");
            console.log("");
            
            console.log("📈 МЕТОД 1: Добавить wDOI в пул");
            const targetWDOI = scenario.poolUSDT / this.doiPrice;
            const wdoiToAdd = targetWDOI - scenario.poolWDOI;
            console.log(`   Нужно добавить: ${wdoiToAdd.toFixed(2)} wDOI`);
            console.log("   Действия кастодиана:");
            console.log("   1. Mint новые wDOI токены");
            console.log(`      await wdoi.mint(custodian, parseEther("${wdoiToAdd.toFixed(0)}"), doiTxHash, doiBalance)`);
            console.log("   2. Добавить wDOI в пул (single-sided liquidity)");
            console.log(`      await router.addLiquidityETH(wdoi, parseEther("${wdoiToAdd.toFixed(0)}"), ...)`);
            console.log("");
            
            console.log("📉 МЕТОД 2: Убрать USDT из пула");
            const targetUSDT = scenario.poolWDOI * this.doiPrice;
            const usdtToRemove = scenario.poolUSDT - targetUSDT;
            console.log(`   Нужно убрать: ${usdtToRemove.toFixed(2)} USDT`);
            console.log("   Действия кастодиана:");
            console.log("   1. Withdraw ликвидность из пула");
            console.log("   2. Забрать USDT, оставить wDOI");
            console.log("");
            
            console.log("🎯 РЕЗУЛЬТАТ: Цена wDOI снизится к целевой");
            
        } else if (scenario.action === "REMOVE_WDOI_OR_ADD_USDT") {
            console.log("🔧 ПРОБЛЕМА: Цена wDOI слишком низкая");
            console.log("⚡ РЕШЕНИЕ: Нужно ПОВЫСИТЬ цену wDOI");
            console.log("");
            
            console.log("📈 МЕТОД 1: Убрать wDOI из пула");
            const targetWDOI = scenario.poolUSDT / this.doiPrice;
            const wdoiToRemove = scenario.poolWDOI - targetWDOI;
            console.log(`   Нужно убрать: ${wdoiToRemove.toFixed(2)} wDOI`);
            console.log("   Действия кастодиана:");
            console.log("   1. Withdraw ликвидность из пула");
            console.log("   2. Забрать wDOI, оставить USDT");
            console.log("   3. Burn изъятые wDOI");
            console.log(`      await wdoi.burn(parseEther("${wdoiToRemove.toFixed(0)}"))`);
            console.log("");
            
            console.log("📉 МЕТОД 2: Добавить USDT в пул");
            const targetUSDT = scenario.poolWDOI * this.doiPrice;
            const usdtToAdd = targetUSDT - scenario.poolUSDT;
            console.log(`   Нужно добавить: ${usdtToAdd.toFixed(2)} USDT`);
            console.log("   Действия кастодиана:");
            console.log("   1. Купить USDT за DOI на бирже");
            console.log("   2. Добавить USDT в пул");
            console.log("");
            
            console.log("🎯 РЕЗУЛЬТАТ: Цена wDOI поднимется к целевой");
            
        } else {
            console.log("✅ СТАТУС: Цена в норме, действий не требуется");
        }
    }
    
    async showTechnicalActions() {
        console.log("⚙️ ТЕХНИЧЕСКИЕ ДЕЙСТВИЯ АВТОМАТИЧЕСКОЙ СИСТЕМЫ");
        console.log("=".repeat(70));
        console.log("");
        
        console.log("🤖 АЛГОРИТМ РАБОТЫ:");
        console.log("1. Каждые 3 минуты проверяем:");
        console.log("   📊 Цену DOI из oracle");
        console.log("   💧 Цену wDOI в Uniswap пуле");
        console.log("   📐 Вычисляем отклонение: |poolPrice - doiPrice| / doiPrice * 100%");
        console.log("");
        
        console.log("2. Если отклонение > 1%:");
        console.log("   🔍 Анализируем направление отклонения");
        console.log("   🧮 Рассчитываем точное количество токенов для корректировки");
        console.log("   ⚡ Выполняем транзакции");
        console.log("");
        
        console.log("📝 КОНКРЕТНЫЕ КОМАНДЫ:");
        console.log("");
        
        console.log("🟢 Если цена wDOI слишком ВЫСОКАЯ:");
        console.log("```javascript");
        console.log("// Рассчитываем сколько wDOI добавить");
        console.log("const currentK = poolWDOI * poolUSDT;");
        console.log("const targetWDOI = Math.sqrt(currentK / doiPrice);");
        console.log("const wdoiToAdd = targetWDOI - poolWDOI;");
        console.log("");
        console.log("// Mint новые wDOI");
        console.log("await wdoi.mint(");
        console.log("  custodianAddress,");
        console.log("  ethers.parseEther(wdoiToAdd.toString()),");
        console.log("  'price_rebalancing',");
        console.log("  currentDOIBalance");
        console.log(");");
        console.log("");
        console.log("// Добавляем в пул");
        console.log("await router.swapExactTokensForTokens(");
        console.log("  ethers.parseEther((wdoiToAdd/2).toString()),");
        console.log("  0,");
        console.log("  [wdoiAddress, usdtAddress],");
        console.log("  custodianAddress");
        console.log(");");
        console.log("```");
        console.log("");
        
        console.log("🔴 Если цена wDOI слишком НИЗКАЯ:");
        console.log("```javascript");
        console.log("// Рассчитываем сколько wDOI убрать");
        console.log("const currentK = poolWDOI * poolUSDT;");
        console.log("const targetWDOI = Math.sqrt(currentK / doiPrice);");
        console.log("const wdoiToRemove = poolWDOI - targetWDOI;");
        console.log("");
        console.log("// Покупаем wDOI из пула за USDT");
        console.log("await router.swapExactTokensForTokens(");
        console.log("  requiredUSDT,");
        console.log("  ethers.parseEther(wdoiToRemove.toString()),");
        console.log("  [usdtAddress, wdoiAddress],");
        console.log("  custodianAddress");
        console.log(");");
        console.log("");
        console.log("// Burn купленные wDOI");
        console.log("await wdoi.burn(ethers.parseEther(wdoiToRemove.toString()));");
        console.log("```");
    }
    
    async showAutomationWorkflow() {
        console.log("");
        console.log("🔄 АВТОМАТИЧЕСКИЙ РАБОЧИЙ ПРОЦЕСС");
        console.log("=".repeat(70));
        console.log("");
        
        console.log("⏰ КАЖДЫЕ 3 МИНУТЫ:");
        console.log("┌─────────────────────────────────────┐");
        console.log("│ 1. Получить цену DOI из oracle      │");
        console.log("│ 2. Получить цену wDOI из пула       │");
        console.log("│ 3. Вычислить отклонение             │");
        console.log("│ 4. Если отклонение > 1%:            │");
        console.log("│    - Рассчитать корректировку       │");
        console.log("│    - Выполнить транзакции           │");
        console.log("│    - Записать в лог                 │");
        console.log("│ 5. Обновить мониторинг              │");
        console.log("└─────────────────────────────────────┘");
        console.log("");
        
        console.log("📊 ПРИМЕР РЕАЛЬНОГО ЦИКЛА:");
        console.log("```");
        console.log("⏰ [14:03:15] Price Check:");
        console.log("   DOI Oracle Price: $0.02294166");
        console.log("   wDOI Pool Price:  $0.02450000");
        console.log("   Deviation: +6.79% (ABOVE threshold)");
        console.log("");
        console.log("🔧 Action: ADD wDOI to reduce price");
        console.log("   Required: +145.3 wDOI");
        console.log("   Minting: 145.3 wDOI (DOI balance: 2847.6 DOI)");
        console.log("   Adding to pool via single-sided liquidity...");
        console.log("   ✅ Transaction: 0x7a8b9c2d...ef34");
        console.log("");
        console.log("📊 Result:");
        console.log("   New Pool Price: $0.02295000");
        console.log("   New Deviation: +0.04% (WITHIN threshold)");
        console.log("   Status: ✅ Price stabilized");
        console.log("```");
        console.log("");
        
        console.log("🚀 ЗАПУСК АВТОМАТИЗАЦИИ:");
        console.log("```bash");
        console.log("# Для демонстрации (показывает что будет делать)");
        console.log("npm run pool-maintenance check");
        console.log("");
        console.log("# Для постоянной работы");
        console.log("npm run pool-maintenance monitor");
        console.log("```");
        console.log("");
        
        console.log("📱 МОНИТОРИНГ:");
        console.log("   Дашборд: http://localhost:5173/custodian/enhanced");
        console.log("   Логи: ./price-history-sepolia.json");
        console.log("   Экстренные события: ./emergency-logs-sepolia.json");
        console.log("");
        
        console.log("🔒 БЕЗОПАСНОСТЬ:");
        console.log("   ✅ Максимум 50 операций в день");
        console.log("   ✅ Минимум 1 минута между операциями");
        console.log("   ✅ Максимум $2000 за операцию");
        console.log("   ✅ Emergency pause при отклонении >10%");
        console.log("   ✅ Полное логирование всех действий");
    }
}

async function main() {
    const mechanics = new PriceMaintenanceMechanics();
    await mechanics.explainMechanics();
    
    console.log("");
    console.log("🎯 ЗАКЛЮЧЕНИЕ");
    console.log("=".repeat(50));
    console.log("Система поддерживает цену через:");
    console.log("1. 🔍 Постоянный мониторинг отклонений");
    console.log("2. 🧮 Точные математические расчеты корректировки");
    console.log("3. ⚡ Автоматическое выполнение mint/burn/swap операций");
    console.log("4. 🔒 Соблюдение лимитов безопасности");
    console.log("");
    console.log("💰 ЭКОНОМИКА: Кастодиан зарабатывает 0.3% с каждой сделки");
    console.log("🎯 РЕЗУЛЬТАТ: Цена wDOI всегда = цене DOI (±1%)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Explanation failed:", error);
        process.exit(1);
    });