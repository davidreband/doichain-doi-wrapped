import { ethers } from 'ethers';
import { CONTRACTS, AUTHORIZED_USERS, getContractAddresses } from '$lib/config/addresses.js';

// Mock registry contract ABI (in production, use actual deployed contract)
const MERCHANT_REGISTRY_ABI = [
    "function isMerchant(address account) external view returns (bool)",
    "function isCustodian(address account) external view returns (bool)", 
    "function getMerchantInfo(address account) external view returns (tuple(bool isActive, string businessName, uint256 registeredAt, uint256 totalProcessed, bool canMint, bool canBurn))",
    "function canMerchantMint(address account) external view returns (bool)",
    "function canMerchantBurn(address account) external view returns (bool)"
];

/**
 * Check if user is authorized merchant
 * @param {string} userAddress - User's wallet address
 * @param {Object} provider - Ethers provider
 * @returns {Promise<Object>} Authorization result
 */
export async function checkMerchantAuthorization(userAddress, provider) {
    try {
        // Get contract addresses for current network
        const contracts = getContractAddresses(await provider.getNetwork().then(n => n.chainId));
        
        // Method 1: Contract-based verification (production)
        if (contracts.MERCHANT_REGISTRY !== "0x0000000000000000000000000000000000000000") {
            return await checkContractAuthorization(userAddress, provider, contracts.MERCHANT_REGISTRY);
        }
        
        // Method 2: Environment-based authorization (development/demo)
        return checkEnvironmentAuthorization(userAddress);
        
    } catch (error) {
        console.error('Authorization check failed:', error);
        return {
            isMerchant: false,
            isCustodian: false,
            permissions: {
                canMint: false,
                canBurn: false
            },
            merchantInfo: null,
            error: error.message
        };
    }
}

/**
 * Contract-based authorization (production method)
 */
async function checkContractAuthorization(userAddress, provider, registryAddress) {
    const registry = new ethers.Contract(
        registryAddress, 
        MERCHANT_REGISTRY_ABI, 
        provider
    );
    
    // Parallel queries for efficiency
    const [
        isMerchant,
        isCustodian,
        merchantInfo,
        canMint,
        canBurn
    ] = await Promise.all([
        registry.isMerchant(userAddress),
        registry.isCustodian(userAddress),
        registry.getMerchantInfo(userAddress),
        registry.canMerchantMint(userAddress),
        registry.canMerchantBurn(userAddress)
    ]);
    
    return {
        isMerchant,
        isCustodian,
        permissions: {
            canMint,
            canBurn
        },
        merchantInfo: {
            isActive: merchantInfo.isActive,
            businessName: merchantInfo.businessName,
            registeredAt: new Date(Number(merchantInfo.registeredAt) * 1000),
            totalProcessed: Number(merchantInfo.totalProcessed),
            canMint: merchantInfo.canMint,
            canBurn: merchantInfo.canBurn
        },
        method: 'contract'
    };
}

/**
 * Environment-based authorization (development/demo method)
 */
function checkEnvironmentAuthorization(userAddress) {
    // Get authorized users from environment configuration
    const merchant = AUTHORIZED_USERS.MERCHANTS.find(m => 
        m.address.toLowerCase() === userAddress.toLowerCase()
    );
    
    const custodian = AUTHORIZED_USERS.CUSTODIANS.find(c => 
        c.address.toLowerCase() === userAddress.toLowerCase()
    );
    
    const isCustodian = !!custodian;
    
    if (merchant) {
        return {
            isMerchant: true,
            isCustodian,
            permissions: merchant.permissions,
            merchantInfo: {
                isActive: true,
                businessName: merchant.businessName,
                registeredAt: new Date('2024-01-01'), // Demo date
                totalProcessed: 0,
                canMint: merchant.permissions.canMint,
                canBurn: merchant.permissions.canBurn
            },
            method: 'environment'
        };
    }
    
    if (isCustodian) {
        return {
            isMerchant: false,
            isCustodian: true,
            permissions: {
                canMint: false,
                canBurn: false
            },
            merchantInfo: null,
            method: 'environment'
        };
    }
    
    return {
        isMerchant: false,
        isCustodian: false,
        permissions: {
            canMint: false,
            canBurn: false
        },
        merchantInfo: null,
        method: 'hardcoded'
    };
}

/**
 * Get user role display name
 */
export function getUserRoleDisplay(authResult) {
    if (authResult.isMerchant && authResult.isCustodian) {
        return 'Merchant & Custodian';
    } else if (authResult.isMerchant) {
        return 'Merchant';
    } else if (authResult.isCustodian) {
        return 'Custodian';
    } else {
        return 'Unauthorized';
    }
}

/**
 * Get permission display
 */
export function getPermissionDisplay(authResult) {
    if (!authResult.isMerchant) return 'No permissions';
    
    const perms = [];
    if (authResult.permissions.canMint) perms.push('Mint wDOI');
    if (authResult.permissions.canBurn) perms.push('Burn wDOI');
    
    return perms.length > 0 ? perms.join(', ') : 'No permissions';
}