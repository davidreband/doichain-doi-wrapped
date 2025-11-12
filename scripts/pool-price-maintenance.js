const hre = require("hardhat");
const fs = require('fs');

/**
 * Automated Pool Price Maintenance System
 * 
 * This script implements automated strategies for maintaining wDOI pool prices
 * close to the current DOI market price from the price oracle.
 */

class PoolPriceMaintenance {
    constructor() {
        this.config = {
            // Price deviation thresholds
            MINOR_DEVIATION_THRESHOLD: 200,    // 2% - start monitoring
            MAJOR_DEVIATION_THRESHOLD: 500,    // 5% - take action
            CRITICAL_DEVIATION_THRESHOLD: 1000, // 10% - emergency action
            
            // Liquidity management
            MIN_POOL_BALANCE: hre.ethers.parseEther("500"),   // Minimum wDOI in pool
            OPTIMAL_POOL_BALANCE: hre.ethers.parseEther("2000"), // Optimal wDOI in pool
            MAX_REBALANCE_AMOUNT: hre.ethers.parseEther("1000"), // Max per rebalance
            
            // Timing
            CHECK_INTERVAL: 300000,  // 5 minutes
            REBALANCE_COOLDOWN: 1800000, // 30 minutes
            
            // Oracle
            MAX_ORACLE_STALENESS: 3600, // 1 hour
        };
        
        this.lastRebalanceTime = 0;
        this.contracts = {};
        this.monitoring = false;
    }
    
    async initialize() {
        console.log("🔧 Initializing Pool Price Maintenance System...\n");
        
        try {
            await this.loadContracts();
            await this.validateSetup();
            console.log("✅ System initialized successfully\n");
            return true;
        } catch (error) {
            console.error("❌ Failed to initialize:", error.message);
            return false;
        }
    }
    
    async loadContracts() {
        const [signer] = await hre.ethers.getSigners();
        console.log("📝 Using account:", signer.address);
        
        // Load deployment addresses
        const deploymentFile = `./deployments/${hre.network.name}-deployment.json`;
        let deployment = {};
        
        if (fs.existsSync(deploymentFile)) {
            deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        }
        
        // Load price oracle
        const oracleFile = `./deployments/${hre.network.name}-price-oracle.json`;
        let oracle = {};
        
        if (fs.existsSync(oracleFile)) {
            oracle = JSON.parse(fs.readFileSync(oracleFile, 'utf8'));
            this.contracts.priceOracle = await hre.ethers.getContractAt(
                "DOIPriceOracle", 
                oracle.address, 
                signer
            );
            console.log("✅ Price Oracle connected:", oracle.address);
        } else {
            throw new Error("Price oracle not deployed. Run: npx hardhat run scripts/deploy-price-oracle.js");
        }
        
        // Load wDOI contract
        if (deployment.WrappedDoichainV3) {
            this.contracts.wdoi = await hre.ethers.getContractAt(
                "WrappedDoichainV3", 
                deployment.WrappedDoichainV3, 
                signer
            );
            console.log("✅ wDOI Contract connected:", deployment.WrappedDoichainV3);
        } else {
            throw new Error("wDOI contract not found in deployment");
        }
        
        // Load Uniswap pool (if available)
        if (deployment.WDOI_USDT_POOL) {
            this.contracts.uniswapPool = await hre.ethers.getContractAt(
                "IUniswapV2Pair", 
                deployment.WDOI_USDT_POOL, 
                signer
            );
            console.log("✅ Uniswap Pool connected:", deployment.WDOI_USDT_POOL);
        }
        
        // Load USDT contract (for calculations)
        if (deployment.USDT) {
            this.contracts.usdt = await hre.ethers.getContractAt(
                "IERC20", 
                deployment.USDT, 
                signer
            );
        }
    }
    
    async validateSetup() {
        console.log("🔍 Validating system setup...");
        
        // Check oracle price
        const { price: oraclePrice, isStale } = await this.contracts.priceOracle.getPrice();
        
        if (isStale) {
            console.log("⚠️  Warning: Oracle price is stale");
        }
        
        console.log(`📊 Current DOI Oracle Price: $${(Number(oraclePrice) / 100000000).toFixed(8)}`);
        
        // Check pool if available
        if (this.contracts.uniswapPool) {
            const poolInfo = await this.getPoolInfo();
            console.log("💧 Pool Status:");
            console.log(`   wDOI Balance: ${poolInfo.wdoiBalance} wDOI`);
            console.log(`   USDT Balance: ${poolInfo.usdtBalance} USDT`);
            console.log(`   Pool Price: $${poolInfo.poolPrice.toFixed(8)}`);
            
            const deviation = this.calculateDeviation(poolInfo.poolPrice, Number(oraclePrice) / 100000000);
            console.log(`   Price Deviation: ${deviation.toFixed(2)}%`);
        }
        
        // Check permissions
        const CUSTODIAN_ROLE = await this.contracts.wdoi.CUSTODIAN_ROLE();
        const [signer] = await hre.ethers.getSigners();
        const isCustodian = await this.contracts.wdoi.hasRole(CUSTODIAN_ROLE, signer.address);
        
        if (!isCustodian) {
            throw new Error("Account does not have CUSTODIAN_ROLE for wDOI contract");
        }
        
        console.log("✅ Account has required permissions");
    }
    
    async getPoolInfo() {
        if (!this.contracts.uniswapPool) {
            throw new Error("Uniswap pool not connected");
        }
        
        const reserves = await this.contracts.uniswapPool.getReserves();
        const token0 = await this.contracts.uniswapPool.token0();
        const token1 = await this.contracts.uniswapPool.token1();
        
        let wdoiReserve, usdtReserve;
        
        // Determine which token is wDOI and which is USDT
        const wdoiAddress = await this.contracts.wdoi.getAddress();
        
        if (token0.toLowerCase() === wdoiAddress.toLowerCase()) {
            wdoiReserve = reserves[0];
            usdtReserve = reserves[1];
        } else {
            wdoiReserve = reserves[1];
            usdtReserve = reserves[0];
        }
        
        const wdoiBalance = Number(hre.ethers.formatEther(wdoiReserve));
        const usdtBalance = Number(hre.ethers.formatUnits(usdtReserve, 6)); // USDT has 6 decimals
        
        const poolPrice = usdtBalance / wdoiBalance; // Price of wDOI in USDT
        
        return {
            wdoiReserve,
            usdtReserve,
            wdoiBalance,
            usdtBalance,
            poolPrice
        };
    }
    
    calculateDeviation(poolPrice, oraclePrice) {
        return Math.abs((poolPrice - oraclePrice) / oraclePrice) * 100;
    }
    
    async checkAndMaintainPrice() {
        try {
            console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Checking pool price...`);
            
            // Get oracle price
            const { price: oraclePrice, isStale } = await this.contracts.priceOracle.getPrice();
            const oraclePriceUSD = Number(oraclePrice) / 100000000;
            
            if (isStale) {
                console.log("⚠️  Oracle price is stale, skipping maintenance");
                return;
            }
            
            if (!this.contracts.uniswapPool) {
                console.log("ℹ️  No Uniswap pool configured, skipping price check");
                return;
            }
            
            // Get pool info
            const poolInfo = await this.getPoolInfo();
            const deviation = this.calculateDeviation(poolInfo.poolPrice, oraclePriceUSD);
            
            console.log(`📊 Oracle Price: $${oraclePriceUSD.toFixed(8)}`);
            console.log(`🏊 Pool Price: $${poolInfo.poolPrice.toFixed(8)}`);
            console.log(`📐 Deviation: ${deviation.toFixed(2)}%`);
            
            // Determine action based on deviation
            if (deviation >= this.config.CRITICAL_DEVIATION_THRESHOLD / 100) {
                console.log("🚨 CRITICAL DEVIATION - Emergency rebalancing required!");
                await this.emergencyRebalance(poolInfo, oraclePriceUSD);
            } else if (deviation >= this.config.MAJOR_DEVIATION_THRESHOLD / 100) {
                console.log("⚠️  Major deviation detected - rebalancing...");
                await this.performRebalance(poolInfo, oraclePriceUSD);
            } else if (deviation >= this.config.MINOR_DEVIATION_THRESHOLD / 100) {
                console.log("📈 Minor deviation detected - monitoring...");
                await this.monitorDeviation(poolInfo, oraclePriceUSD);
            } else {
                console.log("✅ Price within acceptable range");
            }
            
            // Check liquidity levels
            await this.checkLiquidityLevels(poolInfo);
            
        } catch (error) {
            console.error("❌ Error in price maintenance:", error.message);
        }
    }
    
    async performRebalance(poolInfo, oraclePrice) {
        const now = Date.now();
        
        // Check cooldown
        if (now - this.lastRebalanceTime < this.config.REBALANCE_COOLDOWN) {
            const remainingTime = Math.ceil((this.config.REBALANCE_COOLDOWN - (now - this.lastRebalanceTime)) / 60000);
            console.log(`⏳ Rebalance cooldown active. Wait ${remainingTime} minutes.`);
            return;
        }
        
        console.log("🔄 Starting pool rebalancing...");
        
        try {
            if (poolInfo.poolPrice > oraclePrice) {
                // Pool price too high - need to add wDOI or remove USDT
                await this.rebalanceAddWDOI(poolInfo, oraclePrice);
            } else {
                // Pool price too low - need to remove wDOI or add USDT  
                await this.rebalanceRemoveWDOI(poolInfo, oraclePrice);
            }
            
            this.lastRebalanceTime = now;
            console.log("✅ Rebalancing completed");
            
        } catch (error) {
            console.error("❌ Rebalancing failed:", error.message);
        }
    }
    
    async rebalanceAddWDOI(poolInfo, targetPrice) {
        console.log("📈 Pool price too high - adding wDOI liquidity");
        
        // Calculate how much wDOI to add to bring price down
        const targetWDOIAmount = Math.sqrt(poolInfo.usdtBalance / targetPrice);
        const wdoiToAdd = Math.min(
            targetWDOIAmount - poolInfo.wdoiBalance,
            Number(hre.ethers.formatEther(this.config.MAX_REBALANCE_AMOUNT))
        );
        
        if (wdoiToAdd <= 0) {
            console.log("⚠️  Calculated wDOI amount is negative, skipping");
            return;
        }
        
        console.log(`📊 Adding ${wdoiToAdd.toFixed(2)} wDOI to pool`);
        
        // This would require:
        // 1. Mint new wDOI (need DOI reserves)
        // 2. Add single-sided liquidity 
        // 3. Or perform arbitrage trades
        
        // For now, we'll suggest manual intervention
        console.log("💡 Manual intervention required:");
        console.log(`   1. Mint ${wdoiToAdd.toFixed(2)} wDOI using available DOI`);
        console.log(`   2. Add liquidity to pool or sell wDOI for USDT`);
        console.log(`   3. Run: npm run manage-liquidity mint-and-add ${wdoiToAdd.toFixed(0)} <doi_tx_hash> <current_doi_balance>`);
    }
    
    async rebalanceRemoveWDOI(poolInfo, targetPrice) {
        console.log("📉 Pool price too low - removing wDOI or adding USDT");
        
        // Calculate optimal amounts
        const targetWDOIAmount = Math.sqrt(poolInfo.usdtBalance / targetPrice);
        const wdoiToRemove = Math.min(
            poolInfo.wdoiBalance - targetWDOIAmount,
            Number(hre.ethers.formatEther(this.config.MAX_REBALANCE_AMOUNT))
        );
        
        if (wdoiToRemove <= 0) {
            console.log("⚠️  Calculated wDOI removal amount is negative, skipping");
            return;
        }
        
        console.log(`📊 Removing ${wdoiToRemove.toFixed(2)} wDOI from pool`);
        
        console.log("💡 Manual intervention required:");
        console.log(`   1. Remove ${wdoiToRemove.toFixed(2)} wDOI from liquidity pool`);
        console.log(`   2. Burn removed wDOI to maintain reserve ratio`);
        console.log(`   3. Run: npm run manage-liquidity remove ${wdoiToRemove.toFixed(0)}`);
    }
    
    async emergencyRebalance(poolInfo, oraclePrice) {
        console.log("🚨 EMERGENCY REBALANCING REQUIRED");
        
        // Log the situation for manual review
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: "EMERGENCY_PRICE_DEVIATION",
            poolPrice: poolInfo.poolPrice,
            oraclePrice: oraclePrice,
            deviation: this.calculateDeviation(poolInfo.poolPrice, oraclePrice),
            poolBalances: {
                wdoi: poolInfo.wdoiBalance,
                usdt: poolInfo.usdtBalance
            },
            action: "MANUAL_INTERVENTION_REQUIRED"
        };
        
        // Save emergency log
        const logFile = `./emergency-logs-${hre.network.name}.json`;
        let logs = [];
        
        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        logs.push(logEntry);
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
        
        console.log("📁 Emergency log saved to:", logFile);
        console.log("🚨 IMMEDIATE ACTIONS REQUIRED:");
        console.log("   1. Review current market conditions");
        console.log("   2. Verify oracle price accuracy");
        console.log("   3. Consider emergency pause if needed");
        console.log("   4. Manually rebalance with larger amounts");
        
        // You could add automatic emergency pause here if needed
        // await this.contracts.wdoi.activateEmergencyPause("Critical price deviation detected");
    }
    
    async monitorDeviation(poolInfo, oraclePrice) {
        console.log("👁️  Monitoring price deviation...");
        
        // Just log for awareness, no action needed yet
        const trend = poolInfo.poolPrice > oraclePrice ? "overvalued" : "undervalued";
        console.log(`   Pool is currently ${trend} by ${this.calculateDeviation(poolInfo.poolPrice, oraclePrice).toFixed(2)}%`);
    }
    
    async checkLiquidityLevels(poolInfo) {
        const wdoiBalanceWei = hre.ethers.parseEther(poolInfo.wdoiBalance.toString());
        
        if (wdoiBalanceWei < this.config.MIN_POOL_BALANCE) {
            console.log("🔴 LOW LIQUIDITY WARNING");
            console.log(`   Pool has only ${poolInfo.wdoiBalance.toFixed(2)} wDOI`);
            console.log(`   Minimum required: ${hre.ethers.formatEther(this.config.MIN_POOL_BALANCE)} wDOI`);
            console.log("   Action: Add liquidity immediately");
        } else if (wdoiBalanceWei > this.config.OPTIMAL_POOL_BALANCE * 2n) {
            console.log("🔵 HIGH LIQUIDITY NOTICE");
            console.log(`   Pool has ${poolInfo.wdoiBalance.toFixed(2)} wDOI`);
            console.log("   Consider removing excess liquidity to improve capital efficiency");
        }
    }
    
    async startMonitoring() {
        console.log("🚀 Starting automated pool price maintenance...");
        console.log(`⏱️  Check interval: ${this.config.CHECK_INTERVAL / 1000} seconds`);
        console.log("📊 Monitoring thresholds:");
        console.log(`   Minor deviation: ${this.config.MINOR_DEVIATION_THRESHOLD / 100}%`);
        console.log(`   Major deviation: ${this.config.MAJOR_DEVIATION_THRESHOLD / 100}%`);
        console.log(`   Critical deviation: ${this.config.CRITICAL_DEVIATION_THRESHOLD / 100}%\n`);
        
        this.monitoring = true;
        
        // Immediate check
        await this.checkAndMaintainPrice();
        
        // Schedule regular checks
        const interval = setInterval(async () => {
            if (!this.monitoring) {
                clearInterval(interval);
                return;
            }
            
            await this.checkAndMaintainPrice();
        }, this.config.CHECK_INTERVAL);
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down pool maintenance...');
            this.monitoring = false;
            clearInterval(interval);
            process.exit(0);
        });
        
        console.log("✅ Pool maintenance system is running. Press Ctrl+C to stop.");
    }
    
    async stopMonitoring() {
        console.log("🛑 Stopping pool maintenance...");
        this.monitoring = false;
    }
}

// Main execution functions
async function runOnceCheck() {
    const maintenance = new PoolPriceMaintenance();
    
    if (await maintenance.initialize()) {
        await maintenance.checkAndMaintainPrice();
        console.log("\n✅ One-time price check completed");
    }
}

async function runContinuousMonitoring() {
    const maintenance = new PoolPriceMaintenance();
    
    if (await maintenance.initialize()) {
        await maintenance.startMonitoring();
    }
}

async function runEmergencyCheck() {
    console.log("🚨 Running emergency price check...\n");
    
    const maintenance = new PoolPriceMaintenance();
    
    if (await maintenance.initialize()) {
        // Force immediate check regardless of cooldown
        maintenance.lastRebalanceTime = 0;
        await maintenance.checkAndMaintainPrice();
        console.log("\n✅ Emergency check completed");
    }
}

// Parse command line arguments
async function main() {
    const command = process.argv[2] || 'check';
    
    console.log("💱 Pool Price Maintenance System");
    console.log("=================================\n");
    
    switch (command) {
        case 'check':
            await runOnceCheck();
            break;
            
        case 'monitor':
            await runContinuousMonitoring();
            break;
            
        case 'emergency':
            await runEmergencyCheck();
            break;
            
        case 'help':
            console.log("Available commands:");
            console.log("  check     - Perform one-time price check");
            console.log("  monitor   - Start continuous monitoring");
            console.log("  emergency - Emergency price check (ignores cooldown)");
            console.log("  help      - Show this help message");
            console.log("");
            console.log("Examples:");
            console.log("  npm run pool-maintenance check");
            console.log("  npm run pool-maintenance monitor");
            console.log("  npm run pool-maintenance emergency");
            break;
            
        default:
            console.log("❌ Unknown command. Use 'help' to see available commands.");
            process.exit(1);
    }
}

// Export for use in other scripts
module.exports = {
    PoolPriceMaintenance
};

// Run if called directly
if (require.main === module) {
    main()
        .then(() => {
            if (process.argv[2] !== 'monitor') {
                process.exit(0);
            }
        })
        .catch((error) => {
            console.error("❌ Script failed:", error);
            process.exit(1);
        });
}