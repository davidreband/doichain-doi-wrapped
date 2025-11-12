/**
 * 🌐 CENTRALIZED ADDRESS CONFIGURATION
 * 
 * This file loads addresses from environment variables.
 * Configure addresses in .env or .env.local files.
 */

import { dev } from '$app/environment';

// Network configurations loaded from env
export const NETWORKS = {
	SEPOLIA: {
		chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '0xaa36a7'),
		name: 'Sepolia Testnet',
		rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID'
	},
	MAINNET: {
		chainId: 0x1,
		name: 'Ethereum Mainnet',
		rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID'
	}
};

// Contract addresses loaded from environment
export const CONTRACTS = {
	SEPOLIA: {
		// Core tokens
		WDOI_TOKEN: import.meta.env.VITE_WDOI_TOKEN_ADDRESS || "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5",
		WDOI_TOKEN_V3: import.meta.env.VITE_WDOI_TOKEN_V3_ADDRESS || "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72", // V2 proxy address
		USDT_TOKEN: import.meta.env.VITE_USDT_TOKEN_ADDRESS || "0x584d5D62adaa8123E1726777AA6EEa154De6c76f",
		
		// Custom pools
		USDT_POOL: import.meta.env.VITE_USDT_POOL_ADDRESS || "0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C",
		WDOI_USDT_POOL: import.meta.env.VITE_WDOI_USDT_POOL_ADDRESS || "0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C", // Use same pool for now
		
		// Uniswap V3 addresses
		UNISWAP_V3_FACTORY: import.meta.env.VITE_UNISWAP_V3_FACTORY || "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
		UNISWAP_V3_ROUTER: import.meta.env.VITE_UNISWAP_V3_ROUTER || "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
		UNISWAP_V3_POSITION_MANAGER: import.meta.env.VITE_UNISWAP_V3_POSITION_MANAGER || "0x1238536071E1c677A632429e3655c799b22cDA52",
		UNISWAP_V3_QUOTER: import.meta.env.VITE_UNISWAP_V3_QUOTER || "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3",
		
		// WETH address on Sepolia
		WETH: import.meta.env.VITE_WETH_ADDRESS || "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
		
		// Merchant/Custodian registry
		MERCHANT_REGISTRY: import.meta.env.VITE_MERCHANT_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000"
	},
	
	MAINNET: {
		// Core tokens (deployed on mainnet)
		WDOI_TOKEN: "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72",
		WDOI_TOKEN_V3: "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72", // Production wDOI V2
		USDT_TOKEN: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Real USDT
		
		// Custom pools
		USDT_POOL: "0x0000000000000000000000000000000000000000", // To be deployed
		WDOI_USDT_POOL: "0x0000000000000000000000000000000000000000", // To be deployed
		
		// Uniswap V3 addresses (mainnet)
		UNISWAP_V3_FACTORY: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
		UNISWAP_V3_ROUTER: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
		UNISWAP_V3_POSITION_MANAGER: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
		UNISWAP_V3_QUOTER: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
		
		// WETH address on mainnet
		WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		
		// Merchant/Custodian registry (to be deployed)
		MERCHANT_REGISTRY: "0x0000000000000000000000000000000000000000"
	}
};

// 👥 AUTHORIZED USERS - loaded from environment
const getMerchantsFromEnv = () => {
	const merchantAddresses = import.meta.env.VITE_AUTHORIZED_MERCHANTS?.split(',') || [
		'0xbe40fb82b1c56ab813ffcf171ea12b35d6afa83e',
		'0x742d35Cc65C7a6123e18EBA0DA27Ad60DCD9F0dd'
	];
	
	return merchantAddresses.map((address, index) => ({
		address: address.trim(),
		businessName: `Demo Merchant ${index + 1}`,
		permissions: { 
			canMint: true, 
			canBurn: index === 0 // First merchant can burn, others only mint
		},
		registeredAt: '2024-01-01',
		isActive: true
	}));
};

const getCustodiansFromEnv = () => {
	const custodianAddresses = import.meta.env.VITE_AUTHORIZED_CUSTODIANS?.split(',') || [
		'0xbe40fb82b1c56ab813ffcf171ea12b35d6afa83e'
	];
	
	return custodianAddresses.map((address, index) => ({
		address: address.trim(),
		name: `Custodian ${index + 1}`,
		isActive: true
	}));
};

const getAdminsFromEnv = () => {
	const adminAddresses = import.meta.env.VITE_AUTHORIZED_ADMINS?.split(',') || [
		'0xbe40fb82b1c56ab813ffcf171ea12b35d6afa83e'
	];
	
	return adminAddresses.map((address, index) => ({
		address: address.trim(),
		name: `Admin ${index + 1}`,
		isActive: true
	}));
};

export const AUTHORIZED_USERS = {
	MERCHANTS: getMerchantsFromEnv(),
	CUSTODIANS: getCustodiansFromEnv(),
	ADMINS: getAdminsFromEnv()
};

// 🔧 UTILITY FUNCTIONS
export function getContractAddresses(chainId) {
	switch (chainId) {
		case NETWORKS.SEPOLIA.chainId:
			return CONTRACTS.SEPOLIA;
		case NETWORKS.MAINNET.chainId:
			return CONTRACTS.MAINNET;
		default:
			console.warn(`Unsupported chain ID: ${chainId}, falling back to Sepolia`);
			return CONTRACTS.SEPOLIA;
	}
}

export function getNetworkConfig(chainId) {
	switch (chainId) {
		case NETWORKS.SEPOLIA.chainId:
			return NETWORKS.SEPOLIA;
		case NETWORKS.MAINNET.chainId:
			return NETWORKS.MAINNET;
		default:
			console.warn(`Unsupported chain ID: ${chainId}, falling back to Sepolia`);
			return NETWORKS.SEPOLIA;
	}
}

export function isMerchantAddress(address) {
	return AUTHORIZED_USERS.MERCHANTS.some(merchant => 
		merchant.address.toLowerCase() === address.toLowerCase() && merchant.isActive
	);
}

export function isCustodianAddress(address) {
	return AUTHORIZED_USERS.CUSTODIANS.some(custodian => 
		custodian.address.toLowerCase() === address.toLowerCase() && custodian.isActive
	);
}

export function isAdminAddress(address) {
	return AUTHORIZED_USERS.ADMINS.some(admin => 
		admin.address.toLowerCase() === address.toLowerCase() && admin.isActive
	);
}

export function getMerchantInfo(address) {
	return AUTHORIZED_USERS.MERCHANTS.find(merchant => 
		merchant.address.toLowerCase() === address.toLowerCase()
	);
}

export function getCustodianInfo(address) {
	return AUTHORIZED_USERS.CUSTODIANS.find(custodian => 
		custodian.address.toLowerCase() === address.toLowerCase()
	);
}

// Current network (can be changed based on environment)
export const CURRENT_NETWORK = NETWORKS.MAINNET;
export const CURRENT_CONTRACTS = CONTRACTS.MAINNET;