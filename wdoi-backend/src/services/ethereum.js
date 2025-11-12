const { ethers } = require('ethers');

class EthereumService {
  constructor() {
    // Use mainnet for production, fallback to Sepolia for development
    const rpcUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.ETHEREUM_RPC_URL || process.env.MAINNET_RPC_URL || 'https://rpc.ankr.com/eth')
      : (process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo');
    
    console.log(`🌐 Using Ethereum RPC: ${rpcUrl.replace(/\/[^\/]+$/, '/***')}`);
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Only create wallet if private key is provided
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey && privateKey !== '') {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    } else {
      console.warn('No PRIVATE_KEY provided, wallet transactions will not be available');
      this.wallet = null;
    }

    this.contractAddress = process.env.WDOI_CONTRACT_ADDRESS || '0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72';
    
    // Contract ABI (updated for V2)
    this.contractABI = [
      "function mint(address to, uint256 amount, string memory doiTxHash) external",
      "function burn(uint256 amount, string memory doiAddress) external",
      "function isDoiTxProcessed(string memory doiTxHash) external view returns (bool)",
      "function totalSupply() external view returns (uint256)",
      "function totalReserves() external view returns (uint256)",
      "function getBackingRatio() external view returns (uint256)",
      "function hasRole(bytes32 role, address account) external view returns (bool)",
      "function CUSTODIAN_ROLE() external view returns (bytes32)",
      "function emergencyMode() external view returns (bool)",
      "function getTodayMintCapacity() external view returns (uint256)",
      "function getTodayMintedAmount() external view returns (uint256)",
      "function enableEmergencyMode(string memory reason) external",
      "function disableEmergencyMode() external",
      "function updateDailyMintLimit(uint256 newLimit) external",
      "event Mint(address indexed to, uint256 amount, string indexed doiTxHash, address indexed custodian)",
      "event Burn(address indexed from, uint256 amount, string indexed doiAddress, address indexed initiator)",
      "event EmergencyModeEnabled(address indexed admin, string reason)",
      "event EmergencyModeDisabled(address indexed admin)",
      "event LargeMint(address indexed to, uint256 amount, string indexed doiTxHash, address indexed custodian)"
    ];

    // Create contract with provider (for read operations) or wallet (for write operations)
    this.contract = new ethers.Contract(
      this.contractAddress,
      this.contractABI,
      this.wallet || this.provider  // Use provider if no wallet available
    );
  }

  /**
   * Mint wDOI tokens
   */
  async mintWDOI(to, amount, doiTxHash) {
    try {
      console.log(`Minting ${amount} wDOI for ${to}, DOI tx: ${doiTxHash}`);
      
      // Check if caller has custodian role
      const custodianRole = await this.contract.CUSTODIAN_ROLE();
      const hasRole = await this.contract.hasRole(custodianRole, this.wallet.address);
      
      if (!hasRole) {
        throw new Error('Wallet does not have custodian role');
      }

      // Convert amount to wei (18 decimals)
      const amountWei = ethers.parseEther(amount.toString());
      
      // Call mint function
      const tx = await this.contract.mint(to, amountWei, doiTxHash);
      
      console.log(`Mint transaction sent: ${tx.hash}`);
      return tx;

    } catch (error) {
      console.error('Mint error:', error);
      throw error;
    }
  }

  /**
   * Check if DOI transaction has been processed
   */
  async isDoiTxProcessed(doiTxHash) {
    try {
      return await this.contract.isDoiTxProcessed(doiTxHash);
    } catch (error) {
      console.error('Error checking DOI tx:', error);
      return false;
    }
  }

  /**
   * Get contract reserves information
   */
  async getReserves() {
    try {
      // Get main metrics
      const totalSupply = await this.contract.totalSupply();
      const totalReserves = await this.contract.totalReserves();
      const backingRatio = await this.contract.getBackingRatio();

      return {
        totalSupply: ethers.formatEther(totalSupply),
        totalReserves: ethers.formatEther(totalReserves),
        backingRatio: (Number(backingRatio) / 1e18).toFixed(4), // Convert from 1e18 precision
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting reserves:', error);
      throw error;
    }
  }

  /**
   * Get minting status and limits
   */
  async getMintingStatus() {
    try {
      const emergencyMode = await this.contract.emergencyMode();
      const todayCapacity = await this.contract.getTodayMintCapacity();
      const todayMinted = await this.contract.getTodayMintedAmount();

      return {
        emergencyMode,
        dailyCapacityRemaining: ethers.formatEther(todayCapacity),
        todayMinted: ethers.formatEther(todayMinted),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting minting status:', error);
      throw error;
    }
  }

  /**
   * Monitor burn events
   */
  async monitorBurnEvents(callback) {
    const filter = this.contract.filters.Burn();
    
    this.contract.on(filter, (from, amount, doiAddress, initiator, event) => {
      callback({
        type: 'burn',
        from,
        amount: ethers.formatEther(amount),
        doiAddress,
        initiator,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });
  }

  /**
   * Monitor mint events
   */
  async monitorMintEvents(callback) {
    const filter = this.contract.filters.Mint();
    
    this.contract.on(filter, (to, amount, doiTxHash, custodian, event) => {
      callback({
        type: 'mint',
        to,
        amount: ethers.formatEther(amount),
        doiTxHash,
        custodian,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });
  }
}

module.exports = { EthereumService };