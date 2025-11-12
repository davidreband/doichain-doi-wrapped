const express = require('express');
const router = express.Router();

// Mock storage - in production use database
const allRequests = new Map();

/**
 * GET /api/v1/status/:requestId
 * Get request status
 */
router.get('/:requestId', (req, res) => {
  const { requestId } = req.params;
  
  // Check all request types
  const request = allRequests.get(requestId);
  
  if (!request) {
    return res.status(404).json({
      error: 'Request not found',
      requestId
    });
  }

  res.json(request);
});

/**
 * GET /api/v1/status
 * Get all requests (admin endpoint)
 */
router.get('/', (req, res) => {
  const { limit = 50, offset = 0, type } = req.query;
  
  let requests = Array.from(allRequests.values());
  
  // Filter by type if specified
  if (type) {
    requests = requests.filter(r => r.type === type);
  }
  
  // Sort by creation time (newest first)
  requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Pagination
  const total = requests.length;
  const paginatedRequests = requests.slice(offset, offset + limit);
  
  res.json({
    requests: paginatedRequests,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: offset + limit < total
    }
  });
});

module.exports = router;