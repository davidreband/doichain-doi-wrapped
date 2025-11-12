class DoichainService {
  constructor() {
    // ElectrumX servers from environment configuration (required)
    const serversList = process.env.DOICHAIN_ELECTRUMX_SERVERS;
    if (!serversList) {
      throw new Error('DOICHAIN_ELECTRUMX_SERVERS environment variable is required');
    }
    this.electrumServers = serversList.split(',').map(s => s.trim());
    this.currentServerIndex = 0; // Start with first server
    
    // Balance cache (5 minutes TTL)
    this.balanceCache = new Map();
    this.cacheTimeout = parseInt(process.env.DOI_CACHE_TTL || '300000'); // 5 minutes default
    
    // Test ElectrumX connectivity at startup
    this.testElectrumXConnectivity();
    
    // Traditional RPC fallbacks
    this.rpcUrl = process.env.DOICHAIN_RPC_URL || 'https://rpc.doichain.org';
    this.rpcUser = process.env.DOICHAIN_RPC_USER || '';
    this.rpcPassword = process.env.DOICHAIN_RPC_PASSWORD || '';
    this.fallbackUrls = []; // Initialize fallback URLs array
    
    // Configuration
    this.isProduction = process.env.NODE_ENV === 'production';
    this.useMockData = process.env.USE_MOCK_DOI_DATA === 'true';
    this.useElectrumX = process.env.USE_ELECTRUMX !== 'false'; // Default true
    
    // Production custodial address for reserves (required for production)
    this.custodialAddress = process.env.DOI_CUSTODIAL_ADDRESS;
    if (!this.custodialAddress) {
      throw new Error('DOI_CUSTODIAL_ADDRESS environment variable is required');
    }
    
    // Test address for development (different from production)
    this.testAddress = process.env.DOI_TEST_ADDRESS || this.custodialAddress;
  }

  /**
   * Test ElectrumX server connectivity at startup
   */
  async testElectrumXConnectivity() {
    console.log('Testing ElectrumX server connectivity...');
    
    for (const server of this.electrumServers) {
      try {
        const [host, port] = server.split(':');
        // Simple TCP connectivity test
        const net = require('net');
        const socket = new net.Socket();
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            socket.destroy();
            reject(new Error('Connection timeout'));
          }, 2000);
          
          socket.connect(port, host, () => {
            clearTimeout(timeout);
            console.log(`ElectrumX server ${server} - TCP connection OK`);
            socket.destroy();
            resolve(true);
          });
          
          socket.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
        
      } catch (error) {
        console.log(`ElectrumX server ${server} - Connection failed: ${error.message}`);
      }
    }
  }

  /**
   * Verify DOI transaction (mock implementation for testing)
   */
  async verifyTransaction(txHash) {
    try {
      console.log(`Verifying DOI transaction: ${txHash}`);
      
      // Production implementation would call actual Doichain RPC
      if (this.isProduction) {
        // TODO: Implement real transaction verification
        throw new Error('Production transaction verification not yet implemented');
      }
      
      // Mock verification for development/testing
      const mockTransaction = {
        txid: txHash,
        confirmations: 6,
        amount: 100.5,
        address: this.testAddress,
        time: Math.floor(Date.now() / 1000),
        blocktime: Math.floor(Date.now() / 1000)
      };

      return {
        confirmed: mockTransaction.confirmations >= 6,
        confirmations: mockTransaction.confirmations,
        amount: mockTransaction.amount,
        address: mockTransaction.address,
        timestamp: mockTransaction.time
      };

    } catch (error) {
      console.error('Error verifying DOI transaction:', error);
      return {
        confirmed: false,
        error: error.message
      };
    }
  }

  /**
   * Send DOI to address (mock implementation for testing)
   */
  async sendDOI(address, amount) {
    try {
      console.log(`Sending ${amount} DOI to ${address}`);
      
      // Production implementation would call actual Doichain RPC
      if (this.isProduction) {
        // TODO: Implement real DOI sending
        throw new Error('Production DOI sending not yet implemented');
      }
      
      // Mock send for development/testing
      const mockTxHash = `doi_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        txHash: mockTxHash,
        amount,
        address,
        fee: 0.001,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error sending DOI:', error);
      throw error;
    }
  }

  /**
   * Get DOI balance of address using ElectrumX
   */
  async getBalance(address) {
    try {
      console.log(`Getting DOI balance for ${address}`);
      
      // Check cache first
      const cached = this.balanceCache.get(address);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        const ageSeconds = Math.round((Date.now() - cached.timestamp) / 1000);
        console.log(`Returning cached balance for ${address} (${ageSeconds}s old)`);
        return cached.data;
      }
      
      // Use mock data if configured
      if (this.useMockData) {
        const mockBalance = parseFloat(process.env.MOCK_DOI_BALANCE || '1245.67');
        const result = {
          address,
          balance: mockBalance,
          currency: 'DOI',
          source: 'Mock'
        };
        // Cache mock data
        this.balanceCache.set(address, {
          data: result,
          timestamp: Date.now()
        });
        return result;
      }
      
      // Try ElectrumX first (preferred for production)
      if (this.useElectrumX) {
        try {
          const balance = await this.getBalanceFromElectrumX(address);
          const result = {
            address,
            balance: Math.round((balance / 100000000) * 100) / 100, // Convert satoshis to DOI and round to 2 decimals
            currency: 'DOI',
            source: 'ElectrumX'
          };
          
          // Cache successful ElectrumX result
          this.balanceCache.set(address, {
            data: result,
            timestamp: Date.now()
          });
          
          return result;
          
        } catch (electrumError) {
          console.warn('ElectrumX call failed, falling back to RPC:', electrumError.message);
        }
      }
      
      // Fallback to traditional RPC
      try {
        const response = await this.rpcCall('getaddressbalance', [{ addresses: [address] }]);
        
        const result = {
          address,
          balance: response.balance / 100000000, // Convert satoshis to DOI
          currency: 'DOI',
          source: 'RPC'
        };
        
        // Cache RPC result
        this.balanceCache.set(address, {
          data: result,
          timestamp: Date.now()
        });
        
        return result;
        
      } catch (rpcError) {
        console.warn('RPC call failed, falling back to mock data:', rpcError.message);
        
        // Final fallback to mock data
        const fallbackBalance = parseFloat(process.env.FALLBACK_DOI_BALANCE || '0');
        return {
          address,
          balance: fallbackBalance,
          currency: 'DOI',
          isEstimated: true,
          source: 'Fallback'
        };
      }

    } catch (error) {
      console.error('Error getting DOI balance:', error);
      throw error;
    }
  }

  /**
   * Get balance from ElectrumX server
   */
  async getBalanceFromElectrumX(address) {
    // Convert address to script hash for ElectrumX
    const scriptHash = this.addressToScriptHash(address);
    
    for (const server of this.electrumServers) {
      try {
        console.log(`Trying ElectrumX server: ${server}`);
        
        // ElectrumX JSON-RPC call - get balance for script hash
        const response = await this.electrumXCall(server, 'blockchain.scripthash.get_balance', [scriptHash]);
        
        return response.confirmed + response.unconfirmed;
        
      } catch (error) {
        console.warn(`ElectrumX server ${server} failed:`, error.message);
      }
    }
    
    throw new Error('All ElectrumX servers failed');
  }

  /**
   * Convert Doichain address to script hash for ElectrumX
   */
  addressToScriptHash(address) {
    try {
      const crypto = require('crypto');
      let script;
      
      if (address.startsWith('dc1')) {
        // Bech32 (Segwit) address
        const bech32 = require('bech32');
        const decoded = bech32.bech32.decode(address);
        const witnessProgram = bech32.bech32.fromWords(decoded.words.slice(1));
        
        if (decoded.words[0] === 0 && witnessProgram.length === 20) {
          // P2WPKH: OP_0 <20-byte-pubkey-hash>
          script = Buffer.concat([
            Buffer.from([0x00]), // OP_0
            Buffer.from([0x14]), // Push 20 bytes
            Buffer.from(witnessProgram)
          ]);
        } else {
          throw new Error('Unsupported witness version or program length');
        }
        
      } else {
        // Legacy base58check address
        const bs58check = require('bs58check').default;
        const decoded = bs58check.decode(address);
        const pubkeyHash = decoded.slice(1);
        
        // Create P2PKH script: OP_DUP OP_HASH160 <pubkeyHash> OP_EQUALVERIFY OP_CHECKSIG
        script = Buffer.concat([
          Buffer.from([0x76]), // OP_DUP
          Buffer.from([0xa9]), // OP_HASH160
          Buffer.from([0x14]), // Push 20 bytes
          pubkeyHash,          // pubkey hash
          Buffer.from([0x88]), // OP_EQUALVERIFY
          Buffer.from([0xac])  // OP_CHECKSIG
        ]);
      }
      
      // SHA256 hash of script
      const hash = crypto.createHash('sha256').update(script).digest();
      
      // Reverse bytes for ElectrumX format
      const reversedHash = Buffer.from(hash).reverse();
      
      return reversedHash.toString('hex');
      
    } catch (error) {
      console.warn(`Error converting address ${address} to script hash:`, error.message);
      // Fallback: return address as-is (will fail but shows the issue)
      return address;
    }
  }

  /**
   * Make ElectrumX JSON-RPC call via TLS
   */
  async electrumXCall(server, method, params) {
    const [host, port] = server.split(':');
    const tls = require('tls');
    
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    }) + '\n';
    
    return new Promise((resolve, reject) => {
      let responseData = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);
      
      // Use TLS connection for port 50002 (SSL ElectrumX)
      const options = {
        host,
        port,
        rejectUnauthorized: false // Accept self-signed certificates
      };
      
      const socket = tls.connect(options, () => {
        console.log(`Connected to ElectrumX server ${server} via TLS`);
        socket.write(payload);
      });
      
      socket.on('data', (data) => {
        responseData += data.toString();
        
        // Check if we have a complete JSON response
        try {
          const response = JSON.parse(responseData.trim());
          clearTimeout(timeout);
          socket.destroy();
          
          if (response.error) {
            reject(new Error(`ElectrumX Error: ${response.error.message}`));
          } else {
            resolve(response.result);
          }
        } catch (e) {
          // Still receiving data, continue
        }
      });
      
      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      
      socket.on('close', () => {
        clearTimeout(timeout);
        if (!responseData) {
          reject(new Error('Connection closed without response'));
        }
      });
    });
  }

  /**
   * Monitor DOI deposits to custodial address
   */
  async monitorDeposits(custodialAddress, callback) {
    console.log(`Monitoring DOI deposits to ${custodialAddress}`);
    
    if (this.isProduction) {
      // TODO: Implement production deposit monitoring
      throw new Error('Production deposit monitoring not yet implemented');
    }
    
    // Mock monitoring for development
    setInterval(async () => {
      // Simulate random deposit (10% chance every interval)
      if (Math.random() < 0.1) {
        const mockDeposit = {
          txHash: `doi_deposit_${Date.now()}`,
          amount: Math.floor(Math.random() * 1000) + 10,
          address: custodialAddress,
          confirmations: 6,
          timestamp: new Date().toISOString()
        };
        
        callback(mockDeposit);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get custodial address for reserves
   */
  getCustodialAddress() {
    return this.custodialAddress;
  }

  /**
   * Get test address for development
   */
  getTestAddress() {
    return this.testAddress;
  }

  /**
   * Clear balance cache (useful for testing)
   */
  clearCache() {
    this.balanceCache.clear();
    console.log('Balance cache cleared');
  }

  /**
   * Make RPC call to Doichain node with fallback support
   */
  async rpcCall(method, params = []) {
    const urls = [this.rpcUrl, ...this.fallbackUrls];
    
    for (const url of urls) {
      try {
        console.log(`Attempting RPC call to ${url}: ${method}`);
        
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add auth if credentials provided
        if (this.rpcUser && this.rpcPassword) {
          headers['Authorization'] = 'Basic ' + Buffer.from(`${this.rpcUser}:${this.rpcPassword}`).toString('base64');
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            jsonrpc: '1.0',
            id: Date.now(),
            method,
            params
          }),
          timeout: 10000 // 10 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(`RPC Error: ${data.error.message}`);
        }
        
        console.log(`RPC call successful: ${method}`);
        return data.result;
        
      } catch (error) {
        console.warn(`RPC call failed for ${url}: ${error.message}`);
        
        // Continue to next URL
        if (url === urls[urls.length - 1]) {
          // This was the last URL, throw error
          throw new Error(`All Doichain RPC endpoints failed. Last error: ${error.message}`);
        }
      }
    }
  }
}

module.exports = { DoichainService };