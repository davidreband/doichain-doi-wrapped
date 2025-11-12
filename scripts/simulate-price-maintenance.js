const hre = require("hardhat");

/**
 * Automated Price Maintenance Simulation
 * 
 * Demonstrates how the price maintenance system works in real-time
 */

class PriceMaintenanceSimulation {
    constructor() {
        // Simulation pool data
        this.poolState = {
            wdoiReserve: 1000,  // 1000 wDOI в пуле
            usdtReserve: 25,    // 25 USDT в пуле (соответствует цене ~$0.025)
            k: 25000            // константа произведения
        };
        
        // Real DOI price from oracle: $0.02294166
        this.realDOIPrice = 0.02294166;
        
        this.simulationStep = 1;
        this.maxSteps = 10;
        
        this.config = {
            TARGET_DEVIATION: 1,   // 1% threshold
            MAJOR_DEVIATION: 5,    // 5% critical threshold
            REBALANCE_AMOUNT: 100  // maximum wDOI per operation
        };
    }
    
    getPoolPrice() {
        return this.poolState.usdtReserve / this.poolState.wdoiReserve;
    }
    
    calculateDeviation() {
        const poolPrice = this.getPoolPrice();
        return Math.abs((poolPrice - this.realDOIPrice) / this.realDOIPrice) * 100;
    }
    
    async runSimulation() {
        console.log("🎯 СИМУЛЯЦИЯ АВТОМАТИЧЕСКОГО ПОДДЕРЖАНИЯ ЦЕНЫ");
        console.log("=".repeat(70));
        console.log("");
        
        console.log("📊 Начальные условия:");
        console.log(`   Реальная цена DOI: $${this.realDOIPrice.toFixed(8)}`);
        console.log(`   Пул: ${this.poolState.wdoiReserve} wDOI + ${this.poolState.usdtReserve} USDT`);
        console.log(`   Цена в пуле: $${this.getPoolPrice().toFixed(8)}`);
        console.log(`   Отклонение: ${this.calculateDeviation().toFixed(2)}%`);
        console.log("");
        
        console.log("🤖 АВТОМАТИЧЕСКАЯ СИСТЕМА ЗАПУСКАЕТСЯ...");
        console.log("-".repeat(50));
        
        // Основной цикл симуляции
        while (this.simulationStep <= this.maxSteps) {
            await this.performMaintenanceCycle();
            
            if (this.calculateDeviation() < this.config.TARGET_DEVIATION) {
                console.log("✅ Цена стабилизирована! Система переходит в режим мониторинга.");
                break;
            }
            
            this.simulationStep++;
            
            // Пауза для имитации времени
            await this.sleep(1000);
        }
        
        this.showFinalResults();
    }
    
    async performMaintenanceCycle() {
        console.log(`\n🔄 ЦИКЛ ${this.simulationStep}: Проверка цены...`);
        
        const poolPrice = this.getPoolPrice();
        const deviation = this.calculateDeviation();
        
        console.log(`   Цена в пуле: $${poolPrice.toFixed(8)}`);
        console.log(`   Отклонение: ${deviation.toFixed(2)}%`);
        
        if (deviation < this.config.TARGET_DEVIATION) {
            console.log("✅ Отклонение в норме - никаких действий не требуется");
            return;
        }
        
        if (deviation >= this.config.MAJOR_DEVIATION) {
            console.log("🚨 КРИТИЧЕСКОЕ ОТКЛОНЕНИЕ - требуется агрессивная корректировка!");
        } else {
            console.log("⚠️  Отклонение превышает порог - запускаем корректировку");
        }
        
        // Определяем направление корректировки
        if (poolPrice > this.realDOIPrice) {
            console.log("📉 Цена в пуле ВЫШЕ реальной - добавляем wDOI");
            await this.rebalanceAddWDOI(deviation);
        } else {
            console.log("📈 Цена в пуле НИЖЕ реальной - убираем wDOI");
            await this.rebalanceRemoveWDOI(deviation);
        }
    }
    
    async rebalanceAddWDOI(deviation) {
        // Рассчитываем сколько wDOI нужно добавить
        const targetWDOIAmount = Math.sqrt(this.poolState.usdtReserve / this.realDOIPrice);
        let wdoiToAdd = targetWDOIAmount - this.poolState.wdoiReserve;
        
        // Ограничиваем максимальное количество за операцию
        wdoiToAdd = Math.min(wdoiToAdd, this.config.REBALANCE_AMOUNT);
        
        console.log(`   📊 Нужно добавить: ${wdoiToAdd.toFixed(2)} wDOI`);
        
        if (wdoiToAdd <= 0) {
            console.log("   ⚠️  Расчет показал отрицательное количество, пропускаем");
            return;
        }
        
        // Симуляция добавления wDOI (без изменения USDT)
        console.log("   ⚡ Выполняем: mint wDOI + добавление в пул");
        
        // В реальности: новый wDOI добавился бы в пул
        // Упрощенная симуляция: увеличиваем wDOI резерв
        this.poolState.wdoiReserve += wdoiToAdd;
        
        console.log(`   ✅ Добавлено ${wdoiToAdd.toFixed(2)} wDOI`);
        console.log(`   📊 Новое состояние: ${this.poolState.wdoiReserve.toFixed(2)} wDOI + ${this.poolState.usdtReserve} USDT`);
        console.log(`   💲 Новая цена: $${this.getPoolPrice().toFixed(8)}`);
    }
    
    async rebalanceRemoveWDOI(deviation) {
        // Рассчитываем сколько wDOI нужно убрать
        const targetWDOIAmount = Math.sqrt(this.poolState.usdtReserve / this.realDOIPrice);
        let wdoiToRemove = this.poolState.wdoiReserve - targetWDOIAmount;
        
        // Ограничиваем максимальное количество за операцию
        wdoiToRemove = Math.min(wdoiToRemove, this.config.REBALANCE_AMOUNT);
        
        console.log(`   📊 Нужно убрать: ${wdoiToRemove.toFixed(2)} wDOI`);
        
        if (wdoiToRemove <= 0) {
            console.log("   ⚠️  Расчет показал отрицательное количество, пропускаем");
            return;
        }
        
        // Симуляция удаления wDOI
        console.log("   ⚡ Выполняем: удаление из пула + burn wDOI");
        
        this.poolState.wdoiReserve -= wdoiToRemove;
        
        console.log(`   ✅ Убрано ${wdoiToRemove.toFixed(2)} wDOI`);
        console.log(`   📊 Новое состояние: ${this.poolState.wdoiReserve.toFixed(2)} wDOI + ${this.poolState.usdtReserve} USDT`);
        console.log(`   💲 Новая цена: $${this.getPoolPrice().toFixed(8)}`);
    }
    
    showFinalResults() {
        console.log("\n🎉 РЕЗУЛЬТАТЫ СИМУЛЯЦИИ");
        console.log("=".repeat(50));
        
        const finalPrice = this.getPoolPrice();
        const finalDeviation = this.calculateDeviation();
        
        console.log(`📊 Финальная статистика:`);
        console.log(`   Начальная цена в пуле: $${(25/1000).toFixed(8)}`);
        console.log(`   Финальная цена в пуле: $${finalPrice.toFixed(8)}`);
        console.log(`   Целевая цена (DOI): $${this.realDOIPrice.toFixed(8)}`);
        console.log(`   Финальное отклонение: ${finalDeviation.toFixed(2)}%`);
        console.log(`   Циклов выполнено: ${this.simulationStep - 1}`);
        
        if (finalDeviation < this.config.TARGET_DEVIATION) {
            console.log("✅ УСПЕХ: Цена стабилизирована в пределах допустимого отклонения");
        } else {
            console.log("⚠️  Требуется больше циклов для полной стабилизации");
        }
        
        console.log("\n💡 В реальной системе:");
        console.log("   🔄 Система работает каждые 3 минуты");
        console.log("   📊 Отслеживает изменения цены DOI");
        console.log("   ⚡ Автоматически корректирует ликвидность");
        console.log("   🔒 Соблюдает лимиты безопасности");
        console.log("   📝 Ведет полные логи операций");
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Симуляция внешних факторов
    async simulateMarketEvents() {
        console.log("\n🎲 СИМУЛЯЦИЯ РЫНОЧНЫХ СОБЫТИЙ");
        console.log("-".repeat(40));
        
        // Событие 1: Крупная покупка
        console.log("📈 СОБЫТИЕ: Кто-то покупает 200 wDOI");
        this.simulateLargeTrade(200, "buy");
        
        await this.performMaintenanceCycle();
        
        // Событие 2: Изменение цены DOI
        console.log("\n📊 СОБЫТИЕ: Цена DOI выросла на 10%");
        this.realDOIPrice *= 1.10;
        console.log(`   Новая цена DOI: $${this.realDOIPrice.toFixed(8)}`);
        
        await this.performMaintenanceCycle();
    }
    
    simulateLargeTrade(amount, direction) {
        if (direction === "buy") {
            // При покупке wDOI: убираем wDOI, добавляем USDT
            const newWDOIReserve = this.poolState.wdoiReserve - amount;
            const newUSDTReserve = this.poolState.k / newWDOIReserve;
            
            console.log(`   До: ${this.poolState.wdoiReserve} wDOI + ${this.poolState.usdtReserve.toFixed(2)} USDT`);
            
            this.poolState.wdoiReserve = newWDOIReserve;
            this.poolState.usdtReserve = newUSDTReserve;
            
            console.log(`   После: ${this.poolState.wdoiReserve} wDOI + ${this.poolState.usdtReserve.toFixed(2)} USDT`);
            console.log(`   Новая цена: $${this.getPoolPrice().toFixed(8)} (+${((this.getPoolPrice() / 0.025 - 1) * 100).toFixed(1)}%)`);
        }
    }
}

async function main() {
    const simulation = new PriceMaintenanceSimulation();
    
    console.log("Выберите режим симуляции:");
    console.log("1. Базовая симуляция стабилизации цены");
    console.log("2. Симуляция с рыночными событиями");
    console.log("");
    
    // Запускаем базовую симуляцию
    await simulation.runSimulation();
    
    console.log("\n🎯 СЛЕДУЮЩИЕ ШАГИ:");
    console.log("=".repeat(30));
    console.log("1. npm run deploy:v3:sepolia (деплой контракта с поддержкой oracle)");
    console.log("2. npm run check-price-system (проверить готовность)");
    console.log("3. Открыть дашборд: http://localhost:5173/custodian/enhanced");
    console.log("4. Запустить реальный мониторинг");
    console.log("");
    console.log("🎮 Текущий статус веб-интерфейса:");
    console.log("   Сервер запущен на: http://localhost:5173/");
    console.log("   Дашборд доступен: http://localhost:5173/custodian/enhanced");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Simulation failed:", error);
        process.exit(1);
    });