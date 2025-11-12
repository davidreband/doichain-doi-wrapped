import { writable, derived } from 'svelte/store';
import { getMetaMaskStatus } from '$lib/utils/metamask.js';

// Network chain IDs
const NETWORKS = {
	1: { name: 'Ethereum Mainnet', short: 'MAINNET' },
	11155111: { name: 'Sepolia Testnet', short: 'SEPOLIA' },
	5: { name: 'Goerli Testnet', short: 'GOERLI' },
	137: { name: 'Polygon Mainnet', short: 'POLYGON' }
};

// Store for current network info
export const networkStore = writable({
	chainId: null,
	name: 'Unknown Network',
	short: 'UNKNOWN',
	isConnected: false,
	isSupported: false
});

// Derived store for checking if we're on mainnet
export const isMainnet = derived(networkStore, $network => $network.chainId === 1);

// Derived store for checking if we're on testnet
export const isTestnet = derived(networkStore, $network => 
	$network.chainId === 11155111 || $network.chainId === 5
);

/**
 * Update network information from MetaMask
 */
export async function updateNetworkInfo() {
	try {
		const status = await getMetaMaskStatus();
		
		if (status.available && status.connected && status.chainId) {
			const networkInfo = NETWORKS[status.chainId] || {
				name: `Unknown Network (${status.chainId})`,
				short: 'UNKNOWN'
			};
			
			networkStore.set({
				chainId: status.chainId,
				name: networkInfo.name,
				short: networkInfo.short,
				isConnected: true,
				isSupported: !!NETWORKS[status.chainId]
			});
		} else {
			// Default to mainnet when not connected (for display purposes)
			networkStore.set({
				chainId: 1,
				name: 'Ethereum Mainnet',
				short: 'MAINNET',
				isConnected: false,
				isSupported: true
			});
		}
	} catch (error) {
		console.warn('Failed to update network info:', error);
		// Fallback to mainnet
		networkStore.set({
			chainId: 1,
			name: 'Ethereum Mainnet',
			short: 'MAINNET',
			isConnected: false,
			isSupported: true
		});
	}
}

/**
 * Listen for network changes in MetaMask
 */
export function initNetworkListener() {
	if (typeof window === 'undefined' || !window.ethereum) {
		return;
	}

	// Listen for chain changes
	window.ethereum.on('chainChanged', (chainIdHex) => {
		updateNetworkInfo();
	});

	// Listen for account changes (might affect network)
	window.ethereum.on('accountsChanged', () => {
		updateNetworkInfo();
	});

	// Initial update
	updateNetworkInfo();
}