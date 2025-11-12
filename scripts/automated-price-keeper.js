const hre = require("hardhat");
const fs = require('fs');
const { PoolPriceMaintenance } = require('./pool-price-maintenance.js');

/**
 * Automated Price Keeper - Keeps wDOI pool price aligned with real DOI price
 * 
 * This system automatically maintains wDOI pool price in accordance with 
 * the current DOI market price from the price oracle.
 */

class AutomatedPriceKeeper extends PoolPriceMaintenance {
    constructor() {
        super();
        
        // Override config for more aggressive price keeping
        this.priceKeepingConfig = {
            // More aggressive thresholds for price keeping
            TARGET_DEVIATION_THRESHOLD: 100,    // 1% - start rebalancing
            MAX_ALLOWED_DEVIATION: 300,         // 3% - maximum before emergency
            REBALANCE_FREQUENCY: 180000,        // 3 minutes between checks
            
            // Rebalancing parameters
            MAX_SINGLE_REBALANCE_USD: 2000,     // Max $2000 per rebalance
            GRADUAL_REBALANCE_STEPS: 3,         // Split large rebalances
            PRICE_SMOOTHING_FACTOR: 0.8,        // Smooth price movements
            
            // DOI price tracking
            DOI_PRICE_UPDATE_INTERVAL: 300000,  // Update DOI price every 5 minutes
            PRICE_CHANGE_THRESHOLD: 200,        // 2% DOI price change triggers rebalance
            
            // Safety limits
            MAX_DAILY_OPERATIONS: 50,           // Max 50 rebalancing operations per day
            MIN_OPERATION_INTERVAL: 60000,      // Min 1 minute between operations
            EMERGENCY_PAUSE_ON_DEVIATION: 1000, // 10% deviation triggers pause
        };
        
        this.operationsToday = 0;
        this.lastOperationTime = 0;
        this.lastDOIPrice = 0;
        this.rebalanceHistory = [];
        this.isActive = false;
    }
    
    async startPriceKeeping() {
        console.log("🎯 Starting Automated DOI Price Keeper...\n");
        
        if (!await this.initialize()) {
            console.error("❌ Failed to initialize price keeper");
            return;
        }
        
        this.isActive = true;
        console.log("✅ Price Keeper activated");
        console.log("🎯 Target: Keep wDOI pool price = DOI market price");
        console.log(`📊 Deviation tolerance: ${this.priceKeepingConfig.TARGET_DEVIATION_THRESHOLD / 100}%`);
        console.log(`⏱️  Check frequency: ${this.priceKeepingConfig.REBALANCE_FREQUENCY / 1000} seconds\n`);
        
        // Start monitoring loops
        this.startDOIPriceMonitoring();
        this.startPoolRebalancing();
        this.startDailyReset();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down Price Keeper...');
            this.isActive = false;
            process.exit(0);
        });
        
        console.log("🚀 Automated Price Keeper is running. Press Ctrl+C to stop.");
    }
    
    async startDOIPriceMonitoring() {
        console.log("📊 Starting DOI price monitoring...");
        
        // Get initial DOI price
        const { price: initialPrice } = await this.contracts.priceOracle.getPrice();
        this.lastDOIPrice = Number(initialPrice) / 100000000;
        
        const priceMonitoringLoop = async () => {
            if (!this.isActive) return;
            
            try {
                await this.updateDOIPrice();
            } catch (error) {
                console.error("❌ DOI price update failed:", error.message);
            }
            
            setTimeout(priceMonitoringLoop, this.priceKeepingConfig.DOI_PRICE_UPDATE_INTERVAL);
        };
        
        priceMonitoringLoop();
    }
    
    async updateDOIPrice() {
        // Update DOI price from CoinPaprika
        console.log("🔄 Updating DOI price from oracle...");
        
        const { price: newPrice, isStale } = await this.contracts.priceOracle.getPrice();
        const newDOIPrice = Number(newPrice) / 100000000;
        
        if (isStale) {
            console.log("⚠️  Warning: Oracle price is stale, triggering price update...");
            
            // Try to update price from external source
            try {
                const { execSync } = require('child_process');
                execSync('npm run update-doi-price', { stdio: 'inherit' });
                console.log("✅ DOI price updated from external source");
            } catch (error) {
                console.log("❌ Failed to update DOI price externally");
            }
            
            return;
        }
        
        const priceChange = Math.abs((newDOIPrice - this.lastDOIPrice) / this.lastDOIPrice) * 100;
        
        console.log(`📈 DOI Price: $${newDOIPrice.toFixed(6)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%)`);
        
        // If DOI price changed significantly, trigger immediate rebalance
        if (priceChange >= this.priceKeepingConfig.PRICE_CHANGE_THRESHOLD / 100) {
            console.log("🚨 Significant DOI price change detected - triggering rebalance");
            await this.performImmediateRebalance("DOI price change");
        }
        
        this.lastDOIPrice = newDOIPrice;
    }
    
    async startPoolRebalancing() {
        console.log("⚖️  Starting pool rebalancing loop...");
        
        const rebalancingLoop = async () => {
            if (!this.isActive) return;
            
            try {
                await this.maintainPriceAlignment();
            } catch (error) {
                console.error("❌ Rebalancing failed:", error.message);
            }
            
            setTimeout(rebalancingLoop, this.priceKeepingConfig.REBALANCE_FREQUENCY);
        };
        
        rebalancingLoop();
    }
    
    async maintainPriceAlignment() {
        if (!this.canPerformOperation()) {
            return;
        }
        
        try {
            // Get current prices
            const { price: doiOraclePrice } = await this.contracts.priceOracle.getPrice();
            const targetPrice = Number(doiOraclePrice) / 100000000;
            
            if (!this.contracts.uniswapPool) {
                console.log("ℹ️  No pool configured, skipping rebalancing");
                return;
            }
            
            const poolInfo = await this.getPoolInfo();
            const currentPoolPrice = poolInfo.poolPrice;
            const deviation = this.calculateDeviation(currentPoolPrice, targetPrice);
            
            console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Price Check:`);
            console.log(`   DOI Target Price: $${targetPrice.toFixed(6)}`);
            console.log(`   wDOI Pool Price:  $${currentPoolPrice.toFixed(6)}`);
            console.log(`   Deviation: ${deviation.toFixed(2)}%`);
            
            // Determine if rebalancing is needed
            if (deviation >= this.priceKeepingConfig.TARGET_DEVIATION_THRESHOLD / 100) {
                console.log(`📊 Deviation ${deviation.toFixed(2)}% exceeds target ${this.priceKeepingConfig.TARGET_DEVIATION_THRESHOLD / 100}%`);
                await this.executeRebalancing(poolInfo, targetPrice, deviation);
            } else {
                console.log("✅ Price within target range");
            }
            
        } catch (error) {
            console.error("❌ Price alignment check failed:", error.message);
        }
    }
    
    async executeRebalancing(poolInfo, targetPrice, deviation) {
        if (deviation >= this.priceKeepingConfig.EMERGENCY_PAUSE_ON_DEVIATION / 100) {
            await this.handleEmergencyDeviation(poolInfo, targetPrice, deviation);
            return;
        }
        
        console.log("🔄 Executing price rebalancing...");
        
        const rebalanceOperation = {
            timestamp: Date.now(),
            beforePrice: poolInfo.poolPrice,
            targetPrice: targetPrice,
            deviation: deviation,
            action: null,
            success: false
        };
        
        try {
            if (poolInfo.poolPrice > targetPrice) {
                // Pool price too high - need to reduce it
                await this.rebalanceReducePrice(poolInfo, targetPrice, rebalanceOperation);
            } else {
                // Pool price too low - need to increase it  
                await this.rebalanceIncreasePrice(poolInfo, targetPrice, rebalanceOperation);
            }
            
            rebalanceOperation.success = true;
            this.recordOperation(rebalanceOperation);
            
        } catch (error) {
            rebalanceOperation.error = error.message;
            this.recordOperation(rebalanceOperation);
            console.error("❌ Rebalancing execution failed:", error.message);
        }
    }
    
    async rebalanceReducePrice(poolInfo, targetPrice, operation) {
        console.log("📉 Reducing pool price (adding wDOI liquidity)");
        
        // Calculate optimal wDOI amount to add
        const currentK = poolInfo.wdoiReserve * poolInfo.usdtReserve;
        const targetWDOIReserve = Math.sqrt(currentK / targetPrice);
        const wdoiNeeded = targetWDOIReserve - poolInfo.wdoiReserve;
        
        // Limit the amount to prevent excessive impact
        const maxWDOIAmount = this.priceKeepingConfig.MAX_SINGLE_REBALANCE_USD / targetPrice;
        const wdoiToAdd = Math.min(wdoiNeeded, maxWDOIAmount);
        
        if (wdoiToAdd <= 0) {
            console.log("⚠️  Calculated wDOI amount is not positive, skipping");
            return;
        }
        
        console.log(`📊 Need to add ${wdoiToAdd.toFixed(2)} wDOI to reach target price`);
        
        operation.action = `ADD_WDOI_${wdoiToAdd.toFixed(2)}`;
        
        // Execute the rebalancing
        await this.executeAddWDOILiquidity(wdoiToAdd);
    }
    
    async rebalanceIncreasePrice(poolInfo, targetPrice, operation) {
        console.log("📈 Increasing pool price (removing wDOI liquidity)");
        
        // Calculate optimal wDOI amount to remove
        const currentK = poolInfo.wdoiReserve * poolInfo.usdtReserve;
        const targetWDOIReserve = Math.sqrt(currentK / targetPrice);
        const wdoiToRemove = poolInfo.wdoiReserve - targetWDOIReserve;
        
        // Limit the amount 
        const maxWDOIAmount = this.priceKeepingConfig.MAX_SINGLE_REBALANCE_USD / targetPrice;
        const wdoiToTake = Math.min(wdoiToRemove, maxWDOIAmount);
        
        if (wdoiToTake <= 0) {
            console.log("⚠️  Calculated wDOI removal amount is not positive, skipping");
            return;
        }
        
        console.log(`📊 Need to remove ${wdoiToTake.toFixed(2)} wDOI to reach target price`);
        
        operation.action = `REMOVE_WDOI_${wdoiToTake.toFixed(2)}`;
        
        // Execute the rebalancing
        await this.executeRemoveWDOILiquidity(wdoiToTake);
    }
    
    async executeAddWDOILiquidity(amount) {
        console.log(`⚡ Executing: Add ${amount.toFixed(2)} wDOI to pool`);
        
        // This would require:
        // 1. Check if we have enough DOI reserves
        // 2. Mint new wDOI
        // 3. Add to pool
        
        console.log("💡 Required actions:");
        console.log(`   1. Ensure sufficient DOI reserves for ${amount.toFixed(2)} wDOI`);
        console.log("   2. Mint wDOI tokens");
        console.log("   3. Add single-sided liquidity to pool");
        console.log("");
        console.log("🔧 Manual commands:");
        console.log(`   npx hardhat console --network ${hre.network.name}`);
        console.log(`   > await wdoi.mint(custodianAddress, ethers.parseEther("${amount.toFixed(2)}"), "price_rebalancing", currentDOIBalance)`);
        console.log(`   > npm run manage-liquidity add-single wdoi ${amount.toFixed(2)}`);
    }
    
    async executeRemoveWDOILiquidity(amount) {
        console.log(`⚡ Executing: Remove ${amount.toFixed(2)} wDOI from pool`);
        
        console.log("💡 Required actions:");
        console.log(`   1. Remove ${amount.toFixed(2)} wDOI from pool liquidity`);
        console.log("   2. Burn removed wDOI to maintain backing");
        console.log("   3. Update reserve declarations");
        console.log("");
        console.log("🔧 Manual commands:");
        console.log(`   npm run manage-liquidity remove-single wdoi ${amount.toFixed(2)}`);
        console.log(`   npx hardhat console --network ${hre.network.name}`);
        console.log(`   > await wdoi.burn(ethers.parseEther("${amount.toFixed(2)}"))`);
    }
    
    async handleEmergencyDeviation(poolInfo, targetPrice, deviation) {
        console.log("🚨 EMERGENCY: Critical price deviation detected!");
        
        const emergencyLog = {
            timestamp: new Date().toISOString(),
            event: "CRITICAL_PRICE_DEVIATION",
            poolPrice: poolInfo.poolPrice,
            targetPrice: targetPrice,
            deviation: deviation,
            action: "EMERGENCY_PAUSE_CONSIDERED"
        };
        
        // Save emergency log
        const emergencyFile = `./emergency-price-deviations-${hre.network.name}.json`;
        let logs = [];
        
        if (fs.existsSync(emergencyFile)) {
            logs = JSON.parse(fs.readFileSync(emergencyFile, 'utf8'));
        }
        
        logs.push(emergencyLog);
        fs.writeFileSync(emergencyFile, JSON.stringify(logs, null, 2));
        
        console.log(`📁 Emergency logged to: ${emergencyFile}`);
        console.log("");
        console.log("🚨 IMMEDIATE ACTIONS REQUIRED:");
        console.log("   1. Verify if DOI oracle price is correct");
        console.log("   2. Check for market manipulation or unusual activity");
        console.log("   3. Consider emergency pause if situation is critical");
        console.log("   4. Manually rebalance with larger amounts if legitimate");
        console.log("");
        console.log("🔧 Emergency commands:");
        console.log("   # Pause trading if needed:");
        console.log(`   npx hardhat console --network ${hre.network.name}`);
        console.log(`   > await wdoi.activateEmergencyPause("Critical price deviation: ${deviation.toFixed(2)}%")`);
    }
    
    async performImmediateRebalance(reason) {
        console.log(`⚡ Immediate rebalancing triggered: ${reason}`);
        
        if (!this.canPerformOperation()) {
            console.log("⏳ Operation cooldown active, queuing for next cycle");
            return;
        }
        
        await this.maintainPriceAlignment();
    }
    
    canPerformOperation() {
        const now = Date.now();
        
        // Check daily limits
        if (this.operationsToday >= this.priceKeepingConfig.MAX_DAILY_OPERATIONS) {
            console.log("⛔ Daily operation limit reached");
            return false;
        }
        
        // Check minimum interval
        if (now - this.lastOperationTime < this.priceKeepingConfig.MIN_OPERATION_INTERVAL) {
            return false;
        }
        
        return true;
    }
    
    recordOperation(operation) {
        this.operationsToday++;
        this.lastOperationTime = Date.now();
        this.rebalanceHistory.push(operation);
        
        // Keep only last 100 operations
        if (this.rebalanceHistory.length > 100) {
            this.rebalanceHistory = this.rebalanceHistory.slice(-100);
        }
        
        // Save to file for analysis
        const historyFile = `./price-keeping-history-${hre.network.name}.json`;
        fs.writeFileSync(historyFile, JSON.stringify(this.rebalanceHistory, null, 2));
        
        console.log(`✅ Operation recorded (${this.operationsToday}/${this.priceKeepingConfig.MAX_DAILY_OPERATIONS} today)`);
    }
    
    startDailyReset() {
        // Reset daily counters at midnight
        const now = new Date();
        const nextMidnight = new Date();
        nextMidnight.setDate(now.getDate() + 1);
        nextMidnight.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = nextMidnight.getTime() - now.getTime();
        
        setTimeout(() => {
            this.operationsToday = 0;
            console.log("🌅 Daily counters reset");
            
            // Schedule daily resets
            setInterval(() => {
                this.operationsToday = 0;
                console.log("🌅 Daily counters reset");
            }, 24 * 60 * 60 * 1000);
            
        }, timeUntilMidnight);
    }
    
    async showStatus() {
        console.log("\n📊 PRICE KEEPER STATUS");
        console.log("=".repeat(50));
        
        try {
            const { price: doiPrice } = await this.contracts.priceOracle.getPrice();
            const targetPrice = Number(doiPrice) / 100000000;
            
            console.log(`🎯 Target DOI Price: $${targetPrice.toFixed(6)}`);
            
            if (this.contracts.uniswapPool) {
                const poolInfo = await this.getPoolInfo();
                const deviation = this.calculateDeviation(poolInfo.poolPrice, targetPrice);
                
                console.log(`💧 Pool wDOI Price: $${poolInfo.poolPrice.toFixed(6)}`);
                console.log(`📐 Current Deviation: ${deviation.toFixed(2)}%`);
                console.log(`🎯 Target Deviation: <${this.priceKeepingConfig.TARGET_DEVIATION_THRESHOLD / 100}%`);
            }
            
            console.log(`⚡ Operations Today: ${this.operationsToday}/${this.priceKeepingConfig.MAX_DAILY_OPERATIONS}`);
            console.log(`🔄 Status: ${this.isActive ? 'ACTIVE' : 'INACTIVE'}`);
            
        } catch (error) {
            console.error("❌ Error getting status:", error.message);
        }
    }
}

// CLI interface
async function main() {
    const command = process.argv[2] || 'start';
    
    console.log("🎯 Automated DOI Price Keeper");
    console.log("============================\n");
    
    const priceKeeper = new AutomatedPriceKeeper();
    
    switch (command) {
        case 'start':
            await priceKeeper.startPriceKeeping();
            break;
            
        case 'status':
            await priceKeeper.initialize();
            await priceKeeper.showStatus();
            break;
            
        case 'check':
            await priceKeeper.initialize();
            await priceKeeper.maintainPriceAlignment();
            break;
            
        case 'help':
            console.log("Available commands:");
            console.log("  start  - Start automated price keeping");
            console.log("  status - Show current status");
            console.log("  check  - Perform one-time price check");
            console.log("  help   - Show this help");
            console.log("");
            console.log("Examples:");
            console.log("  npm run price-keeper start");
            console.log("  npm run price-keeper status");
            break;
            
        default:
            console.log("❌ Unknown command. Use 'help' to see available commands.");
            process.exit(1);
    }
}

if (require.main === module) {
    main()
        .then(() => {
            if (process.argv[2] !== 'start') {
                process.exit(0);
            }
        })
        .catch((error) => {
            console.error("❌ Price Keeper failed:", error);
            process.exit(1);
        });
}

module.exports = {
    AutomatedPriceKeeper
};