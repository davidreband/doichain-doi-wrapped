const express = require('express');
const router = express.Router();
const { EthereumService } = require('../services/ethereum');
const { DoichainService } = require('../services/doichain');

const ethereumService = new EthereumService();
const doichainService = new DoichainService();

// In-memory storage for demo (use database in production)
const mintRequests = new Map();

/**
 * POST /api/v1/mint
 * Request wDOI minting
 */
router.post('/', async (req, res) => {
  try {
    const { doiTxHash, amount, recipientAddress } = req.body;

    // Validation
    if (!doiTxHash || !amount || !recipientAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['doiTxHash', 'amount', 'recipientAddress']
      });
    }

    // Check if DOI transaction exists and is valid
    const doiTx = await doichainService.verifyTransaction(doiTxHash);
    if (!doiTx.confirmed) {
      return res.status(400).json({
        error: 'DOI transaction not confirmed',
        doiTxHash,
        confirmations: doiTx.confirmations || 0,
        required: 6
      });
    }

    // Check if already processed
    if (await ethereumService.isDoiTxProcessed(doiTxHash)) {
      return res.status(409).json({
        error: 'DOI transaction already processed',
        doiTxHash
      });
    }

    // Create mint request
    const requestId = `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mintRequest = {
      id: requestId,
      type: 'mint',
      doiTxHash,
      amount: parseFloat(amount),
      recipientAddress,
      status: 'pending_mint',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mintRequests.set(requestId, mintRequest);

    // Process mint (in background)
    processMintRequest(requestId).catch(console.error);

    res.status(202).json({
      message: 'Mint request accepted',
      requestId,
      status: 'pending_mint',
      estimatedTime: '2-5 minutes'
    });

  } catch (error) {
    console.error('Mint request error:', error);
    res.status(500).json({
      error: 'Failed to process mint request',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/mint/:requestId
 * Get mint request status
 */
router.get('/:requestId', (req, res) => {
  const { requestId } = req.params;
  const mintRequest = mintRequests.get(requestId);

  if (!mintRequest) {
    return res.status(404).json({
      error: 'Mint request not found',
      requestId
    });
  }

  res.json(mintRequest);
});

/**
 * Process mint request asynchronously
 */
async function processMintRequest(requestId) {
  try {
    const request = mintRequests.get(requestId);
    if (!request) return;

    console.log(`Processing mint request: ${requestId}`);

    // Update status
    request.status = 'minting';
    request.updatedAt = new Date().toISOString();

    // Mint wDOI tokens
    const mintTx = await ethereumService.mintWDOI(
      request.recipientAddress,
      request.amount,
      request.doiTxHash
    );

    // Update with transaction hash
    request.mintTxHash = mintTx.hash;
    request.status = 'confirming';
    request.updatedAt = new Date().toISOString();

    // Wait for confirmation
    const receipt = await mintTx.wait();
    
    // Complete
    request.status = 'completed';
    request.blockNumber = receipt.blockNumber;
    request.gasUsed = receipt.gasUsed.toString();
    request.updatedAt = new Date().toISOString();

    console.log(`Mint request completed: ${requestId}`);

  } catch (error) {
    console.error(`Mint request failed: ${requestId}`, error);
    
    const request = mintRequests.get(requestId);
    if (request) {
      request.status = 'failed';
      request.error = error.message;
      request.updatedAt = new Date().toISOString();
    }
  }
}

module.exports = router;