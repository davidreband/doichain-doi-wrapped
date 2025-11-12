const hre = require("hardhat");
const fs = require('fs');
const axios = require('axios');

async function main() {
    console.log("🔮 Deploying DOI Price Oracle...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying from account:", deployer.address);
    
    // Check deployer balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    try {
        // 1. Get current DOI price from CoinPaprika
        const initialPrice = await getCurrentDOIPrice();
        
        if (!initialPrice) {
            console.log("⚠️  Could not fetch current DOI price, using default: $0.001");
            initialPrice = 100000; // $0.001 with 8 decimals
        }

        console.log("💲 Initial DOI price:", (initialPrice / 100000000).toFixed(8), "USD");
        console.log("🔢 Price in 8 decimals:", initialPrice);
        console.log("");

        // 2. Deploy Price Oracle
        console.log("📦 Deploying DOIPriceOracle contract...");
        const DOIPriceOracle = await hre.ethers.getContractFactory("DOIPriceOracle");
        const priceOracle = await DOIPriceOracle.deploy(initialPrice);

        await priceOracle.waitForDeployment();
        const oracleAddress = await priceOracle.getAddress();

        console.log("✅ DOIPriceOracle deployed to:", oracleAddress);
        console.log("");

        // 3. Contract information
        console.log("📊 Oracle Information:");
        const currentPriceData = await priceOracle.getPrice();
        const currentPriceUSD = Number(currentPriceData.price) / 100000000;
        
        console.log("   Current Price:", currentPriceUSD.toFixed(8), "USD");
        console.log("   Is Stale:", currentPriceData.isStale);
        console.log("   Price Decimals:", await priceOracle.PRICE_DECIMALS());
        console.log("   Staleness Threshold:", await priceOracle.priceStalenessThreshold(), "seconds");
        console.log("   Max Deviation:", await priceOracle.maxPriceDeviation(), "basis points");
        console.log("");

        // 4. Check roles
        console.log("🔐 Access Control:");
        const DEFAULT_ADMIN_ROLE = await priceOracle.DEFAULT_ADMIN_ROLE();
        const PRICE_UPDATER_ROLE = await priceOracle.PRICE_UPDATER_ROLE();
        const EMERGENCY_ROLE = await priceOracle.EMERGENCY_ROLE();
        
        console.log("   Admin has DEFAULT_ADMIN_ROLE:", await priceOracle.hasRole(DEFAULT_ADMIN_ROLE, deployer.address));
        console.log("   Admin has PRICE_UPDATER_ROLE:", await priceOracle.hasRole(PRICE_UPDATER_ROLE, deployer.address));
        console.log("   Admin has EMERGENCY_ROLE:", await priceOracle.hasRole(EMERGENCY_ROLE, deployer.address));
        console.log("");
        
        console.log("🔑 Role Identifiers:");
        console.log("   DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
        console.log("   PRICE_UPDATER_ROLE:", PRICE_UPDATER_ROLE);
        console.log("   EMERGENCY_ROLE:", EMERGENCY_ROLE);
        console.log("");

        // 5. Save deployment information
        const deploymentInfo = {
            network: hre.network.name,
            contractName: "DOIPriceOracle",
            address: oracleAddress,
            deployer: deployer.address,
            initialPrice: initialPrice,
            initialPriceUSD: currentPriceUSD,
            deploymentTime: new Date().toISOString(),
            txHash: priceOracle.deploymentTransaction()?.hash,
            constructorArgs: [initialPrice],
            roles: {
                DEFAULT_ADMIN_ROLE,
                PRICE_UPDATER_ROLE,
                EMERGENCY_ROLE
            },
            configuration: {
                priceDecimals: 8,
                stalenessThreshold: 86400,
                maxDeviation: 2000,
                twapPeriod: 3600
            }
        };

        const deploymentsDir = './deployments';
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }

        fs.writeFileSync(
            `${deploymentsDir}/${hre.network.name}-price-oracle.json`,
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log(`💾 Deployment info saved to: ${deploymentsDir}/${hre.network.name}-price-oracle.json`);
        console.log("");

        // 6. Verification instructions
        if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
            console.log("🔍 To verify the contract on Etherscan, run:");
            console.log(`npx hardhat verify --network ${hre.network.name} ${oracleAddress} ${initialPrice}`);
            console.log("");
        }

        // 7. Usage examples
        console.log("📋 Usage Examples:");
        console.log("");
        
        console.log("💰 Update price manually:");
        console.log("   const newPrice = ethers.parseUnits('0.005', 8); // $0.005");
        console.log("   await priceOracle.updatePrice(newPrice);");
        console.log("");
        
        console.log("🚨 Emergency price update:");
        console.log("   const emergencyPrice = ethers.parseUnits('0.010', 8);");
        console.log('   await priceOracle.emergencyUpdatePrice(emergencyPrice, "Market correction");');
        console.log("");
        
        console.log("📊 Get current price:");
        console.log("   const { price, isStale } = await priceOracle.getPrice();");
        console.log("   const priceUSD = Number(price) / 100000000;");
        console.log("");
        
        console.log("⏱️  Get TWAP:");
        console.log("   const { twapPrice, dataPoints } = await priceOracle.getTWAP();");
        console.log("");
        
        console.log("👥 Add price updater:");
        console.log(`   await priceOracle.grantRole(PRICE_UPDATER_ROLE, "UPDATER_ADDRESS");`);
        console.log("");

        // 8. Automatic price updates setup
        console.log("⏰ Automatic Price Updates:");
        console.log("─".repeat(50));
        console.log("To set up automatic price updates from CoinPaprika:");
        console.log("");
        console.log("1. Update price manually:");
        console.log("   npm run update-doi-price");
        console.log("");
        console.log("2. Set up automated updates (cron job):");
        console.log("   # Add to crontab (runs every hour)");
        console.log("   0 * * * * cd /path/to/project && npm run update-doi-price");
        console.log("");
        console.log("3. Monitor price history:");
        console.log("   tail -f price-history-sepolia.json");
        console.log("");

        // 9. Integration with wDOI
        console.log("🔗 Integration with wDOI Contract:");
        console.log("─".repeat(50));
        console.log("To integrate with wDOI contract for dynamic pricing:");
        console.log("");
        console.log("1. Update wDOI contract to use oracle:");
        console.log("   await wdoiContract.setPriceOracle(oracleAddress);");
        console.log("");
        console.log("2. Mint wDOI with current DOI price:");
        console.log("   const doiAmount = ethers.parseEther('100'); // 100 DOI");
        console.log("   const { price } = await priceOracle.getPrice();");
        console.log("   const wdoiAmount = (doiAmount * price) / 1e8;");
        console.log("   await wdoiContract.mint(recipient, wdoiAmount, doiTxHash);");
        console.log("");

        console.log("🎉 DOI Price Oracle deployment completed successfully!");

    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        process.exit(1);
    }
}

async function getCurrentDOIPrice() {
    try {
        console.log("🔍 Fetching current DOI price from CoinPaprika...");
        
        // Try different possible DOI identifiers
        const possibleIds = ['doi-doichain', 'doichain'];
        
        for (const id of possibleIds) {
            try {
                const response = await axios.get(`https://api.coinpaprika.com/v1/tickers/${id}`);
                
                if (response.data && response.data.quotes && response.data.quotes.USD) {
                    const priceUSD = response.data.quotes.USD.price;
                    console.log(`✅ Found DOI price: $${priceUSD} (ID: ${id})`);
                    
                    // Convert to 8 decimals for oracle
                    return Math.round(priceUSD * 100000000);
                }
            } catch (error) {
                console.log(`⚠️  ID ${id} not found on CoinPaprika`);
            }
        }
        
        // If not found, try search
        const searchResponse = await axios.get('https://api.coinpaprika.com/v1/search', {
            params: { q: 'doichain', limit: 5 }
        });
        
        if (searchResponse.data.currencies && searchResponse.data.currencies.length > 0) {
            console.log("🔍 Found DOI-related currencies:");
            searchResponse.data.currencies.forEach(currency => {
                console.log(`   ${currency.name} (${currency.symbol}) - ID: ${currency.id}`);
            });
            
            // Try the first match
            const firstMatch = searchResponse.data.currencies[0];
            const priceResponse = await axios.get(`https://api.coinpaprika.com/v1/tickers/${firstMatch.id}`);
            
            if (priceResponse.data && priceResponse.data.quotes && priceResponse.data.quotes.USD) {
                const priceUSD = priceResponse.data.quotes.USD.price;
                console.log(`✅ Using price from ${firstMatch.name}: $${priceUSD}`);
                
                return Math.round(priceUSD * 100000000);
            }
        }
        
    } catch (error) {
        console.log("❌ Error fetching DOI price:", error.message);
    }
    
    return null;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });