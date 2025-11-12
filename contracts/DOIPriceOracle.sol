// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DOI Price Oracle
 * @dev Oracle for DOI token price with multiple price sources and TWAP calculation
 */
contract DOIPriceOracle is AccessControl, Pausable {
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    struct PriceData {
        uint256 price;      // Price in USD with 8 decimals
        uint256 timestamp;  // When price was updated
        address source;     // Who updated the price
    }
    
    // Current price data
    PriceData public currentPrice;
    
    // Historical prices for TWAP calculation
    PriceData[] public priceHistory;
    uint256 public constant MAX_HISTORY_LENGTH = 24; // 24 data points
    
    // Configuration
    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public priceStalenessThreshold = 86400; // 24 hours
    uint256 public maxPriceDeviation = 2000; // 20% in basis points
    uint256 public twapPeriod = 3600; // 1 hour for TWAP
    
    // Events
    event PriceUpdated(
        uint256 indexed price, 
        uint256 timestamp, 
        address indexed source,
        uint256 deviation
    );
    
    event PriceValidationFailed(
        uint256 attemptedPrice,
        uint256 currentPrice,
        uint256 deviation,
        address source
    );
    
    event ConfigurationUpdated(
        uint256 stalenessThreshold,
        uint256 maxDeviation,
        uint256 twapPeriod
    );

    constructor(uint256 _initialPrice) {
        require(_initialPrice > 0, "DOIPriceOracle: Invalid initial price");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRICE_UPDATER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        currentPrice = PriceData({
            price: _initialPrice,
            timestamp: block.timestamp,
            source: msg.sender
        });
        
        // Initialize price history
        priceHistory.push(currentPrice);
        
        emit PriceUpdated(_initialPrice, block.timestamp, msg.sender, 0);
    }
    
    /**
     * @dev Update DOI price with validation
     * @param _newPrice New price in USD with 8 decimals
     */
    function updatePrice(uint256 _newPrice) external onlyRole(PRICE_UPDATER_ROLE) whenNotPaused {
        require(_newPrice > 0, "DOIPriceOracle: Invalid price");
        
        // Validate price deviation if we have existing price
        if (currentPrice.price > 0) {
            uint256 deviation = _calculateDeviation(_newPrice, currentPrice.price);
            
            // Check if deviation is within acceptable range
            if (deviation > maxPriceDeviation) {
                emit PriceValidationFailed(_newPrice, currentPrice.price, deviation, msg.sender);
                revert("DOIPriceOracle: Price deviation too high");
            }
            
            emit PriceUpdated(_newPrice, block.timestamp, msg.sender, deviation);
        } else {
            emit PriceUpdated(_newPrice, block.timestamp, msg.sender, 0);
        }
        
        // Update current price
        currentPrice = PriceData({
            price: _newPrice,
            timestamp: block.timestamp,
            source: msg.sender
        });
        
        // Add to history
        _addToHistory(currentPrice);
    }
    
    /**
     * @dev Emergency price update with higher deviation tolerance
     * @param _newPrice New price in USD with 8 decimals
     * @param _reason Reason for emergency update
     */
    function emergencyUpdatePrice(uint256 _newPrice, string calldata _reason) 
        external 
        onlyRole(EMERGENCY_ROLE) 
    {
        require(_newPrice > 0, "DOIPriceOracle: Invalid price");
        require(bytes(_reason).length > 0, "DOIPriceOracle: Reason required");
        
        currentPrice = PriceData({
            price: _newPrice,
            timestamp: block.timestamp,
            source: msg.sender
        });
        
        _addToHistory(currentPrice);
        
        emit PriceUpdated(_newPrice, block.timestamp, msg.sender, 0);
    }
    
    /**
     * @dev Get current DOI price
     * @return price Current price in USD (8 decimals)
     * @return isStale Whether price data is stale
     */
    function getPrice() external view returns (uint256 price, bool isStale) {
        price = currentPrice.price;
        isStale = block.timestamp - currentPrice.timestamp > priceStalenessThreshold;
    }
    
    /**
     * @dev Get current price in wei (18 decimals)
     * @return Price in wei format
     */
    function getPriceInWei() external view returns (uint256) {
        return currentPrice.price * 10**(18 - PRICE_DECIMALS);
    }
    
    /**
     * @dev Calculate Time-Weighted Average Price (TWAP)
     * @return twapPrice TWAP over the specified period
     * @return dataPoints Number of data points used
     */
    function getTWAP() external view returns (uint256 twapPrice, uint256 dataPoints) {
        return _calculateTWAP(twapPeriod);
    }
    
    /**
     * @dev Get custom TWAP for specific period
     * @param _period Period in seconds
     * @return twapPrice TWAP over the specified period
     * @return dataPoints Number of data points used
     */
    function getCustomTWAP(uint256 _period) external view returns (uint256 twapPrice, uint256 dataPoints) {
        return _calculateTWAP(_period);
    }
    
    /**
     * @dev Get price history
     * @return Array of historical price data
     */
    function getPriceHistory() external view returns (PriceData[] memory) {
        return priceHistory;
    }
    
    /**
     * @dev Get latest N price entries
     * @param _count Number of entries to return
     * @return Array of latest price data
     */
    function getLatestPrices(uint256 _count) external view returns (PriceData[] memory) {
        require(_count > 0 && _count <= priceHistory.length, "DOIPriceOracle: Invalid count");
        
        PriceData[] memory result = new PriceData[](_count);
        uint256 startIndex = priceHistory.length - _count;
        
        for (uint256 i = 0; i < _count; i++) {
            result[i] = priceHistory[startIndex + i];
        }
        
        return result;
    }
    
    /**
     * @dev Calculate price statistics
     * @return min Minimum price in history
     * @return max Maximum price in history
     * @return avg Average price
     * @return current Current price
     */
    function getPriceStatistics() external view returns (
        uint256 min,
        uint256 max, 
        uint256 avg,
        uint256 current
    ) {
        require(priceHistory.length > 0, "DOIPriceOracle: No price data");
        
        min = type(uint256).max;
        max = 0;
        uint256 total = 0;
        
        for (uint256 i = 0; i < priceHistory.length; i++) {
            uint256 price = priceHistory[i].price;
            if (price < min) min = price;
            if (price > max) max = price;
            total += price;
        }
        
        avg = total / priceHistory.length;
        current = currentPrice.price;
    }
    
    /**
     * @dev Update oracle configuration
     */
    function updateConfiguration(
        uint256 _stalenessThreshold,
        uint256 _maxDeviation,
        uint256 _twapPeriod
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_stalenessThreshold > 0, "DOIPriceOracle: Invalid staleness threshold");
        require(_maxDeviation <= 10000, "DOIPriceOracle: Max deviation too high"); // Max 100%
        require(_twapPeriod > 0, "DOIPriceOracle: Invalid TWAP period");
        
        priceStalenessThreshold = _stalenessThreshold;
        maxPriceDeviation = _maxDeviation;
        twapPeriod = _twapPeriod;
        
        emit ConfigurationUpdated(_stalenessThreshold, _maxDeviation, _twapPeriod);
    }
    
    /**
     * @dev Add price updater role
     */
    function addPriceUpdater(address _updater) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(PRICE_UPDATER_ROLE, _updater);
    }
    
    /**
     * @dev Remove price updater role
     */
    function removePriceUpdater(address _updater) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(PRICE_UPDATER_ROLE, _updater);
    }
    
    /**
     * @dev Pause oracle (emergency only)
     */
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause oracle
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    // Internal functions
    
    function _calculateDeviation(uint256 _newPrice, uint256 _currentPrice) internal pure returns (uint256) {
        if (_currentPrice == 0) return 0;
        
        uint256 diff = _newPrice > _currentPrice ? 
            _newPrice - _currentPrice : 
            _currentPrice - _newPrice;
            
        return (diff * 10000) / _currentPrice; // Return in basis points
    }
    
    function _addToHistory(PriceData memory _priceData) internal {
        priceHistory.push(_priceData);
        
        // Keep history within max length
        if (priceHistory.length > MAX_HISTORY_LENGTH) {
            // Remove oldest entry (shift array left)
            for (uint256 i = 0; i < priceHistory.length - 1; i++) {
                priceHistory[i] = priceHistory[i + 1];
            }
            priceHistory.pop();
        }
    }
    
    function _calculateTWAP(uint256 _period) internal view returns (uint256 twapPrice, uint256 dataPoints) {
        require(_period > 0, "DOIPriceOracle: Invalid period");
        require(priceHistory.length > 0, "DOIPriceOracle: No price data");
        
        uint256 cutoffTime = block.timestamp - _period;
        uint256 weightedSum = 0;
        uint256 totalWeight = 0;
        dataPoints = 0;
        
        // Calculate TWAP from recent data points within the period
        for (uint256 i = priceHistory.length; i > 0; i--) {
            PriceData memory entry = priceHistory[i - 1];
            
            if (entry.timestamp < cutoffTime) {
                break; // Too old
            }
            
            uint256 weight = 1; // Simple equal weighting for now
            weightedSum += entry.price * weight;
            totalWeight += weight;
            dataPoints++;
        }
        
        if (totalWeight > 0) {
            twapPrice = weightedSum / totalWeight;
        } else {
            twapPrice = currentPrice.price; // Fallback to current price
            dataPoints = 1;
        }
    }
}