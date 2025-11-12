const express = require('express');
const { EthereumService } = require('../services/ethereum');

const router = express.Router();

/**
 * GET /security
 * Get security status and minting limits
 */
router.get('/', async (req, res) => {
  try {
    const ethereumService = new EthereumService();
    
    // Get minting status and security info
    const mintingStatus = await ethereumService.getMintingStatus();
    const reserves = await ethereumService.getReserves();
    
    const securityData = {
      // Security status
      emergencyMode: mintingStatus.emergencyMode,
      
      // Daily limits
      dailyLimits: {
        capacityRemaining: mintingStatus.dailyCapacityRemaining,
        todayMinted: mintingStatus.todayMinted,
        utilizationPercent: mintingStatus.dailyCapacityRemaining === '0.0' 
          ? 100 
          : Math.round((parseFloat(mintingStatus.todayMinted) / (parseFloat(mintingStatus.todayMinted) + parseFloat(mintingStatus.dailyCapacityRemaining))) * 100)
      },
      
      // Reserve backing
      reserves: {
        totalSupply: reserves.totalSupply,
        totalReserves: reserves.totalReserves,
        backingRatio: reserves.backingRatio,
        isFullyBacked: parseFloat(reserves.backingRatio) >= 1.0
      },
      
      // Status indicators
      status: {
        operational: !mintingStatus.emergencyMode && parseFloat(reserves.backingRatio) >= 1.0,
        mintingAvailable: !mintingStatus.emergencyMode && parseFloat(mintingStatus.dailyCapacityRemaining) > 0,
        fullyBacked: parseFloat(reserves.backingRatio) >= 1.0
      },
      
      timestamp: new Date().toISOString()
    };
    
    res.json(securityData);
    
  } catch (error) {
    console.error('Security status error:', error);
    res.status(500).json({
      error: 'Failed to get security status',
      message: error.message
    });
  }
});

/**
 * GET /security/limits
 * Get detailed minting limits information
 */
router.get('/limits', async (req, res) => {
  try {
    const ethereumService = new EthereumService();
    const mintingStatus = await ethereumService.getMintingStatus();
    
    const limitsData = {
      daily: {
        limit: "50000.0", // From contract constant
        used: mintingStatus.todayMinted,
        remaining: mintingStatus.dailyCapacityRemaining,
        resetTime: new Date(Math.ceil(Date.now() / 86400000) * 86400000).toISOString() // Next UTC midnight
      },
      perTransaction: {
        maximum: "10000.0", // From contract constant
        largeMintThreshold: "5000.0" // Half of max
      },
      emergencyMode: mintingStatus.emergencyMode,
      timestamp: new Date().toISOString()
    };
    
    res.json(limitsData);
    
  } catch (error) {
    console.error('Limits info error:', error);
    res.status(500).json({
      error: 'Failed to get limits information',
      message: error.message
    });
  }
});

module.exports = router;