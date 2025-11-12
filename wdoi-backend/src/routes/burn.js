const express = require('express');
const router = express.Router();
const { DoichainService } = require('../services/doichain');

const doichainService = new DoichainService();
const burnRequests = new Map();

/**
 * POST /api/v1/burn
 * Process wDOI burn and release DOI
 */
router.post('/', async (req, res) => {
  try {
    const { burnTxHash, amount, doiAddress } = req.body;

    if (!burnTxHash || !amount || !doiAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['burnTxHash', 'amount', 'doiAddress']
      });
    }

    const requestId = `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const burnRequest = {
      id: requestId,
      type: 'burn',
      burnTxHash,
      amount: parseFloat(amount),
      doiAddress,
      status: 'pending_doi_release',
      createdAt: new Date().toISOString()
    };

    burnRequests.set(requestId, burnRequest);
    
    // Process DOI release
    processBurnRequest(requestId).catch(console.error);

    res.status(202).json({
      message: 'Burn request accepted',
      requestId,
      status: 'pending_doi_release'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:requestId', (req, res) => {
  const request = burnRequests.get(req.params.requestId);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }
  res.json(request);
});

async function processBurnRequest(requestId) {
  try {
    const request = burnRequests.get(requestId);
    request.status = 'releasing_doi';
    
    const doiTx = await doichainService.sendDOI(request.doiAddress, request.amount);
    
    request.doiReleaseTx = doiTx.txHash;
    request.status = 'completed';
    request.updatedAt = new Date().toISOString();

  } catch (error) {
    const request = burnRequests.get(requestId);
    if (request) {
      request.status = 'failed';
      request.error = error.message;
    }
  }
}

module.exports = router;