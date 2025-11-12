const express = require('express');
const router = express.Router();
const { EthereumService } = require('../services/ethereum');
const { DoichainService } = require('../services/doichain');

const ethereumService = new EthereumService();
const doichainService = new DoichainService();

/**
 * GET /api/v1/reserves
 * Get current reserve information
 */
router.get('/', async (req, res) => {
  try {
    // Get Ethereum contract data
    const contractReserves = await ethereumService.getReserves();
    
    // Get DOI custodial balance from production address
    const custodialAddress = doichainService.getCustodialAddress();
    const doiBalance = await doichainService.getBalance(custodialAddress);
    
    // Calculate health metrics
    const wdoiSupply = parseFloat(contractReserves.totalSupply);
    const doiReserves = doiBalance.balance;
    const backingRatio = doiReserves > 0 ? wdoiSupply / doiReserves : 0;
    const isHealthy = Math.abs(backingRatio - 1.0) < 0.01; // Within 1%
    
    const reserveData = {
      wdoi: {
        totalSupply: wdoiSupply,
        contractAddress: ethereumService.contractAddress,
        network: 'Ethereum Sepolia'
      },
      doi: {
        balance: doiReserves,
        custodialAddress,
        network: 'Doichain'
      },
      backing: {
        ratio: backingRatio,
        percentage: (backingRatio * 100).toFixed(2),
        isHealthy,
        status: isHealthy ? 'Fully Backed' : 'Attention Required'
      },
      addresses: {
        wdoiContract: ethereumService.contractAddress,
        doiCustodial: custodialAddress,
        burnAddress: '0x000000000000000000000000000000000000dEaD'
      },
      lastUpdate: new Date().toISOString()
    };

    res.json(reserveData);

  } catch (error) {
    console.error('Reserves error:', error);
    res.status(500).json({
      error: 'Failed to get reserve data',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/reserves/history
 * Get historical reserve data
 */
router.get('/history', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    // Mock historical data - in production, query from database
    const history = [];
    const now = new Date();
    
    for (let i = parseInt(days); i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Mock some variance in backing ratio
      const baseRatio = 1.0;
      const variance = (Math.random() - 0.5) * 0.02; // ±1% variance
      const ratio = baseRatio + variance;
      
      history.push({
        date: date.toISOString(),
        wdoiSupply: 1000 + (Math.random() * 500),
        doiReserves: 1000 + (Math.random() * 500),
        backingRatio: ratio,
        isHealthy: Math.abs(ratio - 1.0) < 0.01
      });
    }
    
    res.json({
      period: `${days} days`,
      dataPoints: history.length,
      history
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get reserve history',
      message: error.message
    });
  }
});

module.exports = router;