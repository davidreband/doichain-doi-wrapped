import { theme } from '$lib/stores/theme.js';

/**
 * Detect and sync theme with MetaMask if available
 */
export function detectMetaMaskTheme() {
	if (typeof window === 'undefined' || !window.ethereum) {
		return;
	}
	
	try {
		// Check if MetaMask has theme API (experimental)
		if (window.ethereum.isMetaMask && window.ethereum._metamask?.getProviderState) {
			window.ethereum._metamask.getProviderState().then(state => {
				if (state.theme) {
					theme.syncWithMetaMask(state.theme);
				}
			}).catch(console.warn);
		}
		
		// Listen for theme changes from MetaMask
		if (window.ethereum.on) {
			window.ethereum.on('accountsChanged', () => {
				// Re-check theme when accounts change
				setTimeout(detectMetaMaskTheme, 1000);
			});
		}
	} catch (error) {
		console.warn('MetaMask theme detection failed:', error);
	}
}

/**
 * Get MetaMask connection status
 */
export async function getMetaMaskStatus() {
	if (typeof window === 'undefined' || !window.ethereum) {
		return { available: false, connected: false };
	}
	
	try {
		const accounts = await window.ethereum.request({ method: 'eth_accounts' });
		let chainId = null;
		
		if (accounts.length > 0) {
			// Get chain ID if connected
			try {
				const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
				chainId = parseInt(chainIdHex, 16);
			} catch (chainError) {
				console.warn('Failed to get chain ID:', chainError);
			}
		}
		
		return {
			available: true,
			connected: accounts.length > 0,
			accounts,
			chainId
		};
	} catch (error) {
		return { available: true, connected: false, error: error.message };
	}
}

/**
 * Request MetaMask connection
 */
export async function connectMetaMask() {
	if (typeof window === 'undefined' || !window.ethereum) {
		throw new Error('MetaMask not detected');
	}
	
	try {
		const accounts = await window.ethereum.request({ 
			method: 'eth_requestAccounts' 
		});
		
		// Update theme after connection
		detectMetaMaskTheme();
		
		return accounts;
	} catch (error) {
		throw new Error(`Failed to connect MetaMask: ${error.message}`);
	}
}

/**
 * Clear MetaMask connection state
 * Note: MetaMask doesn't provide a direct disconnect method,
 * so this only clears local state
 */
export function clearMetaMaskConnection() {
	// Clear any cached connection data
	if (typeof window !== 'undefined') {
		// Remove any stored connection preferences
		localStorage.removeItem('metamask-connected');
		sessionStorage.removeItem('metamask-connected');
		
		console.log('MetaMask connection state cleared locally');
	}
}