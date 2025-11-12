const hre = require("hardhat");
const axios = require('axios');

async function main() {
    console.log("💲 Getting DOI Price Information...\n");

    try {
        // Метод 1: Попробуем получить цену с CoinGecko
        await getDOIPriceFromCoinGecko();
        
        // Метод 2: Попробуем получить цену с CoinMarketCap  
        await getDOIPriceFromCMC();
        
        // Метод 3: Проверим цену на DEX (если есть пул DOI)
        await getDOIPriceFromDEX();
        
        // Метод 4: Ручное указание цены
        console.log("📋 Manual Price Setting Guide:");
        console.log("─".repeat(50));
        console.log("If automated price discovery fails, you can manually set the price:");
        console.log("1. Check DOI price on exchanges where it's listed");
        console.log("2. Update the price in contract configuration");
        console.log("3. Use the price oracle integration below");
        console.log("");
        
        // Пример интеграции с оракулом цены
        await showPriceOracleIntegration();
        
    } catch (error) {
        console.error("❌ Error getting DOI price:", error.message);
        console.log("\n📌 Fallback: Manual price configuration required");
    }
}

async function getDOIPriceFromCoinGecko() {
    try {
        console.log("🦎 Checking CoinGecko for DOI price...");
        
        // Попробуем найти DOI на CoinGecko
        const searchResponse = await axios.get('https://api.coingecko.com/api/v3/search', {
            params: { query: 'doichain' }
        });
        
        if (searchResponse.data.coins.length > 0) {
            const coin = searchResponse.data.coins[0];
            console.log(`Found: ${coin.name} (${coin.symbol})`);
            console.log(`ID: ${coin.id}`);
            
            // Получаем цену
            const priceResponse = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
                params: {
                    ids: coin.id,
                    vs_currencies: 'usd,eur,btc'
                }
            });
            
            const priceData = priceResponse.data[coin.id];
            if (priceData) {
                console.log("✅ Current DOI Price from CoinGecko:");
                console.log(`   USD: $${priceData.usd}`);
                console.log(`   EUR: €${priceData.eur}`);
                console.log(`   BTC: ₿${priceData.btc}`);
                
                return priceData.usd;
            }
        } else {
            console.log("⚠️  DOI not found on CoinGecko");
        }
        
    } catch (error) {
        console.log("❌ CoinGecko API error:", error.message);
    }
    
    return null;
}

async function getDOIPriceFromCMC() {
    try {
        console.log("\n📊 Checking CoinMarketCap for DOI price...");
        
        // Note: CoinMarketCap requires API key for most endpoints
        // This is a placeholder for the implementation
        console.log("⚠️  CoinMarketCap requires API key - implement with your CMC_API_KEY");
        console.log("API endpoint: https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest");
        
    } catch (error) {
        console.log("❌ CoinMarketCap API error:", error.message);
    }
    
    return null;
}

async function getDOIPriceFromDEX() {
    try {
        console.log("\n🏪 Checking DEX for DOI price...");
        
        // Пример проверки цены DOI на DEX (если есть ликвидность)
        // Это нужно адаптировать под конкретный DEX где торгуется DOI
        
        const DOI_USDT_POOLS = [
            // Добавьте известные адреса пулов DOI/USDT
            "0x0000000000000000000000000000000000000000" // Placeholder
        ];
        
        for (const poolAddress of DOI_USDT_POOLS) {
            if (poolAddress === "0x0000000000000000000000000000000000000000") {
                console.log("⚠️  No known DOI/USDT pools configured");
                continue;
            }
            
            // Здесь был бы код для проверки цены в пуле
            console.log(`Checking pool: ${poolAddress}`);
        }
        
    } catch (error) {
        console.log("❌ DEX price check error:", error.message);
    }
    
    return null;
}

async function showPriceOracleIntegration() {
    console.log("\n🔮 Price Oracle Integration Options:");
    console.log("─".repeat(50));
    
    console.log("Option 1: Chainlink Price Feed");
    console.log("```solidity");
    console.log("import \"@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol\";");
    console.log("");
    console.log("contract DOIPriceOracle {");
    console.log("    AggregatorV3Interface internal priceFeed;");
    console.log("    ");
    console.log("    function getDOIPrice() public view returns (uint256) {");
    console.log("        // Get latest DOI/USD price from Chainlink");
    console.log("        (,int price,,,) = priceFeed.latestRoundData();");
    console.log("        return uint256(price);");
    console.log("    }");
    console.log("}");
    console.log("```\n");
    
    console.log("Option 2: Custom Price Oracle");
    console.log("```javascript");
    console.log("// Update price manually or from trusted source");
    console.log("await priceOracle.updateDOIPrice(ethers.parseUnits('0.05', 8)); // $0.05");
    console.log("```\n");
    
    console.log("Option 3: DEX-based Price Discovery");
    console.log("```javascript");
    console.log("// Calculate price from DOI/USDT or DOI/ETH pool");
    console.log("const reserves = await poolContract.getReserves();");
    console.log("const doiPrice = reserves.usdt / reserves.doi;");
    console.log("```\n");
    
    console.log("💡 Recommended Implementation:");
    console.log("1. Create a price oracle contract");
    console.log("2. Update price daily from reliable source");
    console.log("3. Use TWAP (Time-Weighted Average Price) for stability");
    console.log("4. Implement price deviation checks");
}

// Функция для создания оракула цены
async function deployPriceOracle() {
    console.log("\n🚀 Deploying DOI Price Oracle...");
    
    const priceOracleCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract DOIPriceOracle is AccessControl {
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");
    
    uint256 public doiPriceUSD; // Price in USD with 8 decimals (like Chainlink)
    uint256 public lastUpdateTime;
    uint256 public constant PRICE_STALENESS_THRESHOLD = 86400; // 24 hours
    
    event PriceUpdated(uint256 newPrice, uint256 timestamp, address updater);
    
    constructor(uint256 _initialPrice) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRICE_UPDATER_ROLE, msg.sender);
        
        doiPriceUSD = _initialPrice;
        lastUpdateTime = block.timestamp;
    }
    
    function updatePrice(uint256 _newPrice) external onlyRole(PRICE_UPDATER_ROLE) {
        require(_newPrice > 0, "Invalid price");
        
        doiPriceUSD = _newPrice;
        lastUpdateTime = block.timestamp;
        
        emit PriceUpdated(_newPrice, block.timestamp, msg.sender);
    }
    
    function getPrice() external view returns (uint256 price, bool isStale) {
        price = doiPriceUSD;
        isStale = block.timestamp - lastUpdateTime > PRICE_STALENESS_THRESHOLD;
    }
    
    function getPriceInWei() external view returns (uint256) {
        // Convert 8-decimal price to 18-decimal wei
        return doiPriceUSD * 1e10;
    }
}`;

    console.log("📄 Price Oracle Contract:");
    console.log(priceOracleCode);
    
    console.log("\n📋 Deployment Steps:");
    console.log("1. Save contract as contracts/DOIPriceOracle.sol");
    console.log("2. Deploy with initial DOI price");
    console.log("3. Grant PRICE_UPDATER_ROLE to trusted addresses");
    console.log("4. Set up automated price updates");
}

// Пример использования цены в wDOI контракте
async function showWDOIIntegration() {
    console.log("\n🔗 Integration with wDOI Contract:");
    console.log("─".repeat(50));
    
    console.log("Modified mint function with dynamic pricing:");
    console.log("```solidity");
    console.log("contract WrappedDoichainV3 {");
    console.log("    DOIPriceOracle public priceOracle;");
    console.log("    ");
    console.log("    function mint(address to, uint256 doiAmount, string calldata doiTxHash)");
    console.log("        external onlyRole(CUSTODIAN_ROLE) whenNotPaused {");
    console.log("        ");
    console.log("        // Get current DOI price");
    console.log("        (uint256 doiPrice, bool isStale) = priceOracle.getPrice();");
    console.log("        require(!isStale, 'Price data is stale');");
    console.log("        ");
    console.log("        // Calculate wDOI amount based on DOI price");
    console.log("        uint256 wdoiAmount = (doiAmount * doiPrice) / 1e8; // Adjust for decimals");
    console.log("        ");
    console.log("        _mint(to, wdoiAmount);");
    console.log("    }");
    console.log("}");
    console.log("```");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });