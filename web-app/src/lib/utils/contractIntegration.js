import { ethers } from 'ethers';
import { getContractAddresses, NETWORKS } from '$lib/config/addresses.js';

// Enhanced wDOI V3 ABI with new features
export const WDOI_V2_ABI = [
    // Standard ERC20 functions
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    
    // V2 specific functions that actually exist
    "function getBackingRatio() view returns (uint256)",
    "function isDoiTxProcessed(string doiTxHash) view returns (bool)",
    "function getTotalMinted(address account) view returns (uint256)",
    "function getTotalBurned(address account) view returns (uint256)",
    "function paused() view returns (bool)",
    
    // V2 operations (actual function signatures from deployed contract)
    "function mint(address to, uint256 amount, string doiTxHash) external",
    "function burn(uint256 amount, string doiAddress) external",
    "function pause() external",
    "function unpause() external",
    
    // Role management
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function CUSTODIAN_ROLE() view returns (bytes32)",
    "function MERCHANT_ROLE() view returns (bytes32)",
    "function PAUSER_ROLE() view returns (bytes32)",
    "function AUDITOR_ROLE() view returns (bytes32)",
    
    // Emergency functions
    "function activateEmergencyPause(string reason) external",
    "function deactivateEmergencyPause() external",
    "function setRateLimits(uint256 maxMintPerDay, uint256 maxBurnPerDay) external",
    
    // Events
    "event Mint(address indexed to, uint256 amount, string indexed doiTxHash, address indexed custodian)",
    "event Burn(address indexed from, uint256 amount, string indexed doiAddress, address indexed initiator)",
    "event ReservesDeclared(address indexed custodian, uint256 previousAmount, uint256 newAmount, uint256 timestamp)",
    "event ReserveAuditAlert(uint256 declaredReserves, uint256 totalSupply, uint256 reserveRatio, bool isUnderReserved)",
    "event EmergencyPauseActivated(address indexed initiator, string reason, uint256 timestamp)",
    "event RateLimitExceeded(address indexed user, string operationType, uint256 requestedAmount, uint256 availableLimit)"
];

// Pool monitoring ABI for DEX transactions
export const POOL_MONITOR_ABI = [
    "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
    "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
    "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)",
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function totalSupply() view returns (uint256)"
];

/**
 * Create enhanced wDOI contract instance
 */
export async function createWDOIV3Contract(provider, withSigner = false) {
    const network = await provider.getNetwork();
    const contracts = getContractAddresses(network.chainId);
    
    if (!contracts.WDOI_TOKEN_V3) {
        throw new Error('wDOI V3 contract address not configured for this network');
    }

    const signerOrProvider = withSigner ? provider.getSigner() : provider;
    return new ethers.Contract(contracts.WDOI_TOKEN_V3, WDOI_V2_ABI, signerOrProvider);
}

/**
 * Create pool monitoring contract for DEX notifications
 */
export async function createPoolMonitorContract(provider, poolAddress) {
    return new ethers.Contract(poolAddress, POOL_MONITOR_ABI, provider);
}

/**
 * Get comprehensive contract status for custodian dashboard
 */
export async function getContractStatus(provider) {
    try {
        const wdoiContract = await createWDOIV3Contract(provider);
        
        // Get available information from V2 contract
        const [
            totalSupply,
            isPaused
        ] = await Promise.all([
            wdoiContract.totalSupply(),
            wdoiContract.paused()
        ]);

        // Calculate backing ratio from totalReserves if available, otherwise use 100%
        let backingRatio;
        try {
            backingRatio = await wdoiContract.getBackingRatio();
        } catch (error) {
            console.warn('getBackingRatio not available, using 100%');
            backingRatio = ethers.parseUnits("1", 18); // 100% = 1e18
        }

        // Calculate mock values for features not yet implemented in V2
        const totalSupplyFormatted = ethers.formatEther(totalSupply);
        
        // Handle backing ratio - check if it's already in the correct format
        let backingRatioFormatted;
        if (backingRatio && backingRatio.toString() !== '0') {
            // If getBackingRatio returns a value in basis points (e.g., 10000 = 100%)
            const ratioValue = Number(ethers.formatEther(backingRatio));
            backingRatioFormatted = (ratioValue * 100).toFixed(2);
        } else {
            backingRatioFormatted = "100.00"; // Default 100%
        }

        return {
            reserves: {
                declared: totalSupplyFormatted, // Use total supply as proxy for declared reserves
                supply: totalSupplyFormatted,
                ratio: backingRatioFormatted,
                isFullyBacked: Number(backingRatio) >= 10000, // 100% = 10000 basis points
                timeSinceLastAudit: 0, // Not implemented in V2
                minimumRatio: "100.00" // Default minimum
            },
            rateLimits: {
                dailyMintUsed: "0", // Not implemented in V2
                dailyBurnUsed: "0", // Not implemented in V2
                mintLimitRemaining: "10000", // Mock limit
                burnLimitRemaining: "10000", // Mock limit
                timeUntilReset: 86400 // 24 hours
            },
            emergency: {
                isPaused: isPaused,
                reason: isPaused ? "Contract paused by admin" : "",
                pausedSince: isPaused ? Math.floor(Date.now() / 1000) : 0
            },
            audit: {
                isRequired: false // Not implemented in V2
            },
            general: {
                totalSupply: totalSupplyFormatted,
                declaredReserves: totalSupplyFormatted
            }
        };
    } catch (error) {
        console.error('Error getting contract status:', error);
        throw error;
    }
}

/**
 * Monitor DEX pool for large purchases that require liquidity attention
 */
export class PoolMonitor {
    constructor(provider, poolAddress, wdoiAddress, usdtAddress) {
        this.provider = provider;
        this.poolAddress = poolAddress;
        this.wdoiAddress = wdoiAddress.toLowerCase();
        this.usdtAddress = usdtAddress.toLowerCase();
        this.notifications = [];
        this.listeners = [];
    }

    async start() {
        try {
            const poolContract = await createPoolMonitorContract(this.provider, this.poolAddress);
            
            // Determine token order in the pool
            const token0 = await poolContract.token0();
            const token1 = await poolContract.token1();
            
            this.isWDOIToken0 = token0.toLowerCase() === this.wdoiAddress;
            
            // Listen for swap events
            const swapListener = poolContract.on('Swap', (sender, amount0In, amount1In, amount0Out, amount1Out, to, event) => {
                this.handleSwapEvent(sender, amount0In, amount1In, amount0Out, amount1Out, to, event);
            });
            
            this.listeners.push(swapListener);
            console.log('Pool monitoring started for address:', this.poolAddress);
            
            return true;
        } catch (error) {
            console.error('Failed to start pool monitoring:', error);
            throw error;
        }
    }

    handleSwapEvent(sender, amount0In, amount1In, amount0Out, amount1Out, to, event) {
        try {
            let wdoiAmount, usdtAmount, isWDOIPurchase;
            
            if (this.isWDOIToken0) {
                // wDOI is token0
                wdoiAmount = amount0Out > 0 ? amount0Out : amount0In;
                usdtAmount = amount1In > 0 ? amount1In : amount1Out;
                isWDOIPurchase = amount0Out > 0; // User receives wDOI
            } else {
                // wDOI is token1
                wdoiAmount = amount1Out > 0 ? amount1Out : amount1In;
                usdtAmount = amount0In > 0 ? amount0In : amount0Out;
                isWDOIPurchase = amount1Out > 0; // User receives wDOI
            }

            const wdoiAmountFormatted = parseFloat(ethers.formatEther(wdoiAmount));
            const usdtAmountFormatted = parseFloat(ethers.formatUnits(usdtAmount, 6)); // USDT has 6 decimals

            // Alert for large wDOI purchases (>100 wDOI)
            if (isWDOIPurchase && wdoiAmountFormatted > 100) {
                const notification = {
                    id: `swap_${event.transactionHash}_${event.logIndex}`,
                    type: 'large_wdoi_purchase',
                    timestamp: new Date(),
                    data: {
                        buyer: to,
                        wdoiAmount: wdoiAmountFormatted,
                        usdtAmount: usdtAmountFormatted,
                        pricePerToken: usdtAmountFormatted / wdoiAmountFormatted,
                        txHash: event.transactionHash,
                        blockNumber: event.blockNumber
                    },
                    message: `Large wDOI purchase: ${wdoiAmountFormatted.toFixed(2)} wDOI for ${usdtAmountFormatted.toFixed(2)} USDT`,
                    priority: wdoiAmountFormatted > 1000 ? 'high' : 'medium'
                };

                this.notifications.push(notification);
                this.emitNotification(notification);
            }

            // Check liquidity levels after each swap
            this.checkLiquidityLevels();

        } catch (error) {
            console.error('Error handling swap event:', error);
        }
    }

    async checkLiquidityLevels() {
        try {
            const poolContract = await createPoolMonitorContract(this.provider, this.poolAddress);
            const reserves = await poolContract.getReserves();
            
            let wdoiReserve, usdtReserve;
            if (this.isWDOIToken0) {
                wdoiReserve = reserves.reserve0;
                usdtReserve = reserves.reserve1;
            } else {
                wdoiReserve = reserves.reserve1;
                usdtReserve = reserves.reserve0;
            }

            const wdoiReserveFormatted = parseFloat(ethers.formatEther(wdoiReserve));
            const usdtReserveFormatted = parseFloat(ethers.formatUnits(usdtReserve, 6));

            // Alert if wDOI liquidity is low (< 500 wDOI)
            if (wdoiReserveFormatted < 500) {
                const notification = {
                    id: `liquidity_low_${Date.now()}`,
                    type: 'low_liquidity',
                    timestamp: new Date(),
                    data: {
                        wdoiReserve: wdoiReserveFormatted,
                        usdtReserve: usdtReserveFormatted,
                        poolAddress: this.poolAddress
                    },
                    message: `Low wDOI liquidity detected: ${wdoiReserveFormatted.toFixed(2)} wDOI remaining`,
                    priority: wdoiReserveFormatted < 100 ? 'critical' : 'high'
                };

                this.emitNotification(notification);
            }

        } catch (error) {
            console.error('Error checking liquidity levels:', error);
        }
    }

    emitNotification(notification) {
        // Emit custom event for UI components to listen to
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('custodianNotification', { 
                detail: notification 
            }));
        }
    }

    getNotifications(limit = 10) {
        return this.notifications
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    clearNotifications() {
        this.notifications = [];
    }

    stop() {
        this.listeners.forEach(listener => {
            if (listener && typeof listener.removeAllListeners === 'function') {
                listener.removeAllListeners();
            }
        });
        this.listeners = [];
        console.log('Pool monitoring stopped');
    }
}

/**
 * Enhanced custodian operations for V3 contract
 */
export class CustodianOperations {
    constructor(provider, userAddress) {
        this.provider = provider;
        this.userAddress = userAddress;
    }

    async mintWDOI(recipientAddress, amount, doiTxHash, custodianDoiBalance) {
        // Ensure we have a signer (connected wallet)
        if (!this.provider || typeof this.provider.getSigner !== 'function') {
            throw new Error('Provider does not support signing transactions. Please connect your wallet.');
        }

        const contract = await createWDOIV3Contract(this.provider, true);
        const amountWei = ethers.parseEther(amount.toString());
        
        // V2 contract only takes 3 parameters: to, amount, doiTxHash
        return await contract.mint(recipientAddress, amountWei, doiTxHash);
    }

    // V2 contract doesn't have declareReserves function
    async declareReserves(amount) {
        console.log('declareReserves not implemented in V2 contract');
        throw new Error('declareReserves function not available in V2 contract');
    }

    // V2 contract has pause/unpause instead of activateEmergencyPause
    async activateEmergencyPause(reason) {
        if (!this.provider || typeof this.provider.getSigner !== 'function') {
            throw new Error('Provider does not support signing transactions. Please connect your wallet.');
        }
        const contract = await createWDOIV3Contract(this.provider, true);
        return await contract.pause();
    }

    async deactivateEmergencyPause() {
        if (!this.provider || typeof this.provider.getSigner !== 'function') {
            throw new Error('Provider does not support signing transactions. Please connect your wallet.');
        }
        const contract = await createWDOIV3Contract(this.provider, true);
        return await contract.unpause();
    }

    // V2 contract doesn't have setRateLimits function
    async setRateLimits(maxMintPerDay, maxBurnPerDay) {
        console.log('setRateLimits not implemented in V2 contract');
        throw new Error('setRateLimits function not available in V2 contract');
    }

    async checkCustodianRole() {
        const contract = await createWDOIV3Contract(this.provider);
        const custodianRole = await contract.CUSTODIAN_ROLE();
        return await contract.hasRole(custodianRole, this.userAddress);
    }

    // Alias for enhanced custodian page
    async mint(recipientAddress, amount, doiTxHash, custodianDoiBalance) {
        return await this.mintWDOI(recipientAddress, amount, doiTxHash, custodianDoiBalance);
    }
}

export default {
    createWDOIV3Contract,
    createPoolMonitorContract,
    getContractStatus,
    PoolMonitor,
    CustodianOperations,
    WDOI_V2_ABI,
    POOL_MONITOR_ABI
};