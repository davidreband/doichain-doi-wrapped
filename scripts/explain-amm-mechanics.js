const hre = require("hardhat");

/**
 * AMM (Automated Market Maker) Mechanics Explanation
 * 
 * This script explains how liquidity pools work and demonstrates 
 * how trading affects prices in the pool.
 */

class AMMExplainer {
    constructor() {
        // Example pool state
        this.poolExample = {
            wdoiReserve: 1000,  // 1000 wDOI
            usdtReserve: 1000,  // 1000 USDT
            k: 1000 * 1000      // Constant product = 1,000,000
        };
    }
    
    explainBasicConcept() {
        console.log("🔄 AMM (Automated Market Maker) - Как это работает");
        console.log("=".repeat(60));
        console.log("");
        
        console.log("📊 Основной принцип: x * y = k (константа)");
        console.log("   где x = количество wDOI в пуле");
        console.log("       y = количество USDT в пуле");
        console.log("       k = константа (всегда постоянная)");
        console.log("");
        
        console.log("🌊 Пример пула:");
        console.log(`   wDOI: ${this.poolExample.wdoiReserve}`);
        console.log(`   USDT: ${this.poolExample.usdtReserve}`);
        console.log(`   Константа k: ${this.poolExample.k}`);
        console.log(`   Текущая цена: ${this.getPrice().toFixed(4)} USDT за 1 wDOI`);
        console.log("");
    }
    
    getPrice() {
        return this.poolExample.usdtReserve / this.poolExample.wdoiReserve;
    }
    
    demonstrateTrades() {
        console.log("💱 ДЕМОНСТРАЦИЯ ТОРГОВЛИ");
        console.log("=".repeat(60));
        console.log("");
        
        // Scenario 1: Buy wDOI (sell USDT)
        console.log("📈 СЦЕНАРИЙ 1: Покупка 100 wDOI за USDT");
        console.log("-".repeat(40));
        
        const buyAmount = 100;
        const { newWDOIReserve, newUSDTReserve, usdtCost, newPrice } = this.simulateBuy(buyAmount);
        
        console.log(`Покупаем: ${buyAmount} wDOI`);
        console.log(`Стоимость: ${usdtCost.toFixed(2)} USDT`);
        console.log("");
        console.log("📊 Состояние пула ДО торговли:");
        console.log(`   wDOI: ${this.poolExample.wdoiReserve}`);
        console.log(`   USDT: ${this.poolExample.usdtReserve}`);
        console.log(`   Цена: ${this.getPrice().toFixed(4)} USDT за wDOI`);
        console.log("");
        console.log("📊 Состояние пула ПОСЛЕ торговли:");
        console.log(`   wDOI: ${newWDOIReserve}`);
        console.log(`   USDT: ${newUSDTReserve}`);
        console.log(`   Цена: ${newPrice.toFixed(4)} USDT за wDOI`);
        console.log("");
        
        const priceImpact = ((newPrice - this.getPrice()) / this.getPrice()) * 100;
        console.log(`💥 Price Impact: +${priceImpact.toFixed(2)}% (цена выросла)`);
        console.log("");
        
        // Reset for next scenario
        console.log("📉 СЦЕНАРИЙ 2: Продажа 100 wDOI за USDT");
        console.log("-".repeat(40));
        
        const sellAmount = 100;
        const { newWDOIReserve: sellNewWDOI, newUSDTReserve: sellNewUSDT, usdtReceived, newPrice: sellNewPrice } = this.simulateSell(sellAmount);
        
        console.log(`Продаем: ${sellAmount} wDOI`);
        console.log(`Получаем: ${usdtReceived.toFixed(2)} USDT`);
        console.log("");
        console.log("📊 Состояние пула ДО торговли:");
        console.log(`   wDOI: ${this.poolExample.wdoiReserve}`);
        console.log(`   USDT: ${this.poolExample.usdtReserve}`);
        console.log(`   Цена: ${this.getPrice().toFixed(4)} USDT за wDOI`);
        console.log("");
        console.log("📊 Состояние пула ПОСЛЕ торговли:");
        console.log(`   wDOI: ${sellNewWDOI}`);
        console.log(`   USDT: ${sellNewUSDT}`);
        console.log(`   Цена: ${sellNewPrice.toFixed(4)} USDT за wDOI`);
        console.log("");
        
        const sellPriceImpact = ((sellNewPrice - this.getPrice()) / this.getPrice()) * 100;
        console.log(`💥 Price Impact: ${sellPriceImpact.toFixed(2)}% (цена упала)`);
        console.log("");
    }
    
    simulateBuy(wdoiAmount) {
        // When buying wDOI, we remove wDOI from pool and add USDT
        const newWDOIReserve = this.poolExample.wdoiReserve - wdoiAmount;
        
        // Calculate how much USDT needs to be added to maintain k
        const newUSDTReserve = this.poolExample.k / newWDOIReserve;
        const usdtCost = newUSDTReserve - this.poolExample.usdtReserve;
        
        const newPrice = newUSDTReserve / newWDOIReserve;
        
        return {
            newWDOIReserve,
            newUSDTReserve,
            usdtCost,
            newPrice
        };
    }
    
    simulateSell(wdoiAmount) {
        // When selling wDOI, we add wDOI to pool and remove USDT
        const newWDOIReserve = this.poolExample.wdoiReserve + wdoiAmount;
        
        // Calculate how much USDT can be removed while maintaining k
        const newUSDTReserve = this.poolExample.k / newWDOIReserve;
        const usdtReceived = this.poolExample.usdtReserve - newUSDTReserve;
        
        const newPrice = newUSDTReserve / newWDOIReserve;
        
        return {
            newWDOIReserve,
            newUSDTReserve,
            usdtReceived,
            newPrice
        };
    }
    
    explainPriceImpact() {
        console.log("💥 PRICE IMPACT - Влияние на цену");
        console.log("=".repeat(60));
        console.log("");
        
        console.log("🔍 Что такое Price Impact:");
        console.log("   Price Impact = изменение цены в результате торговли");
        console.log("   Чем больше торговля относительно пула, тем больше impact");
        console.log("");
        
        console.log("📈 Примеры влияния разных сумм:");
        
        const testAmounts = [10, 50, 100, 200, 500];
        
        testAmounts.forEach(amount => {
            const { newPrice } = this.simulateBuy(amount);
            const priceImpact = ((newPrice - this.getPrice()) / this.getPrice()) * 100;
            console.log(`   Покупка ${amount} wDOI: +${priceImpact.toFixed(2)}% price impact`);
        });
        
        console.log("");
        console.log("💡 Правило: чем больше торговля, тем больше влияние на цену");
        console.log("💡 Это создает естественное сопротивление крупным сделкам");
    }
    
    explainArbitrage() {
        console.log("⚖️  АРБИТРАЖ - Механизм выравнивания цены");
        console.log("=".repeat(60));
        console.log("");
        
        console.log("🎯 Что такое арбитраж:");
        console.log("   Покупка актива там, где он дешевле");
        console.log("   Продажа актива там, где он дороже");
        console.log("   Получение прибыли на разнице цен");
        console.log("");
        
        console.log("📊 Пример арбитражной ситуации:");
        console.log(`   Цена wDOI в нашем пуле: ${this.getPrice().toFixed(4)} USDT`);
        console.log("   Цена DOI на бирже: 1.0500 USDT");
        console.log("   Разница: +4.76% (пул дешевле)");
        console.log("");
        
        console.log("⚡ Действия арбитражера:");
        console.log("   1. Покупает wDOI в нашем пуле (дешево)");
        console.log("   2. Обменивает wDOI на DOI (1:1)");
        console.log("   3. Продает DOI на бирже (дорого)");
        console.log("   4. Получает прибыль");
        console.log("");
        
        // Simulate arbitrage effect
        const arbitrageAmount = 200;
        const { newPrice: priceAfterArbitrage } = this.simulateBuy(arbitrageAmount);
        
        console.log("📈 Эффект арбитража:");
        console.log(`   После покупки ${arbitrageAmount} wDOI арбитражером:`);
        console.log(`   Новая цена в пуле: ${priceAfterArbitrage.toFixed(4)} USDT`);
        console.log("   Цена приблизилась к рыночной!");
        console.log("");
        
        console.log("✅ Результат: арбитраж автоматически выравнивает цены");
    }
    
    explainLiquidityProviderImpact() {
        console.log("💧 ВЛИЯНИЕ НА ПОСТАВЩИКОВ ЛИКВИДНОСТИ");
        console.log("=".repeat(60));
        console.log("");
        
        console.log("🏦 Как кастодиан зарабатывает:");
        console.log("   1. Комиссии с торговли: 0.3% с каждой сделки");
        console.log("   2. Арбитражные возможности: покупка/продажа по выгодной цене");
        console.log("   3. Управление спредом: поддержание ликвидности");
        console.log("");
        
        console.log("📈 Пример заработка на комиссиях:");
        const dailyVolume = 10000; // $10,000 дневной оборот
        const feeRate = 0.003; // 0.3%
        const dailyFees = dailyVolume * feeRate;
        const yearlyFees = dailyFees * 365;
        
        console.log(`   Дневной оборот: $${dailyVolume.toLocaleString()}`);
        console.log(`   Комиссия: ${(feeRate * 100)}%`);
        console.log(`   Дневной доход: $${dailyFees.toFixed(2)}`);
        console.log(`   Годовой доход: $${yearlyFees.toLocaleString()}`);
        console.log("");
        
        console.log("⚠️  Риски для LP:");
        console.log("   1. Impermanent Loss - потеря при изменении соотношения цен");
        console.log("   2. Smart contract риски");
        console.log("   3. Ликвидность может застрять в volatile периоды");
        console.log("");
        
        console.log("💡 Стратегия минимизации рисков:");
        console.log("   1. Поддерживать цену близко к рыночной");
        console.log("   2. Активно управлять ликвидностью");
        console.log("   3. Мониторить большие сделки");
        console.log("   4. Использовать автоматизацию для быстрых реакций");
    }
    
    provideMaintenanceStrategies() {
        console.log("🛠️  СТРАТЕГИИ ПОДДЕРЖАНИЯ ЦЕНЫ");
        console.log("=".repeat(60));
        console.log("");
        
        console.log("1️⃣  АВТОМАТИЧЕСКАЯ СТРАТЕГИЯ:");
        console.log("   ✅ Запустить систему мониторинга:");
        console.log("   npm run pool-maintenance monitor");
        console.log("   - Проверяет цену каждые 5 минут");
        console.log("   - Автоматически предлагает действия");
        console.log("   - Логирует все отклонения");
        console.log("");
        
        console.log("2️⃣  РЕАКТИВНАЯ СТРАТЕГИЯ:");
        console.log("   📊 Если цена в пуле > рыночной цены:");
        console.log("   - Добавить больше wDOI в пул");
        console.log("   - Или продать USDT из пула");
        console.log("   Команда: npm run manage-liquidity add-wdoi 500");
        console.log("");
        console.log("   📉 Если цена в пуле < рыночной цены:");
        console.log("   - Убрать wDOI из пула");
        console.log("   - Или добавить USDT в пул");
        console.log("   Команда: npm run manage-liquidity remove-wdoi 300");
        console.log("");
        
        console.log("3️⃣  ПРОАКТИВНАЯ СТРАТЕГИЯ:");
        console.log("   🎯 Предотвращение больших отклонений:");
        console.log("   - Увеличить размер пула (больше ликвидности = меньше impact)");
        console.log("   - Установить уведомления о крупных сделках");
        console.log("   - Подготовить резервы для быстрого реагирования");
        console.log("");
        
        console.log("4️⃣  АВАРИЙНАЯ СТРАТЕГИЯ:");
        console.log("   🚨 При критических отклонениях (>10%):");
        console.log("   - Приостановить торговлю: emergency pause");
        console.log("   - Проверить причину отклонения");
        console.log("   - Скорректировать ликвидность вручную");
        console.log("   Команда: npm run pool-maintenance emergency");
    }
    
    run() {
        this.explainBasicConcept();
        this.demonstrateTrades();
        this.explainPriceImpact();
        this.explainArbitrage();
        this.explainLiquidityProviderImpact();
        this.provideMaintenanceStrategies();
        
        console.log("");
        console.log("🎯 ЗАКЛЮЧЕНИЕ");
        console.log("=".repeat(60));
        console.log("Да, при покупке/продаже одного актива цена другого меняется автоматически.");
        console.log("Это основной принцип AMM - чем больше покупают, тем дороже становится.");
        console.log("Ваша задача как кастодиана - поддерживать цену близко к рыночной");
        console.log("через управление ликвидностью и быструю реакцию на отклонения.");
        console.log("");
        console.log("🚀 Запустите мониторинг: npm run pool-maintenance monitor");
    }
}

async function main() {
    const explainer = new AMMExplainer();
    explainer.run();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });