import { ethers } from 'ethers';

/**
 * 🌐 Provider utility for safe RPC connections
 * 
 * This module provides safe provider creation with fallbacks
 * to avoid RPC connection errors.
 */

// Safe RPC URLs for Sepolia
const SEPOLIA_RPC_URLS = [
	'https://rpc.sepolia.org',
	'https://sepolia.drpc.org',
	'https://ethereum-sepolia.blockpi.network/v1/rpc/public'
];

/**
 * Create a safe provider with fallbacks
 * @param {boolean} preferBrowser - Try browser provider first
 * @returns {Promise<ethers.Provider>}
 */
export async function createSafeProvider(preferBrowser = true) {
	// Try browser provider first if available and requested
	if (preferBrowser && typeof window !== 'undefined' && window.ethereum) {
		try {
			const browserProvider = new ethers.BrowserProvider(window.ethereum);
			// Test the connection
			await browserProvider.getNetwork();
			return browserProvider;
		} catch (error) {
			console.warn('Browser provider failed, falling back to RPC:', error);
		}
	}

	// Try public RPC URLs
	for (const rpcUrl of SEPOLIA_RPC_URLS) {
		try {
			const provider = new ethers.JsonRpcProvider(rpcUrl);
			// Test the connection
			await provider.getNetwork();
			return provider;
		} catch (error) {
			console.warn(`RPC ${rpcUrl} failed:`, error);
		}
	}

	// If all providers fail, return a mock provider
	console.warn('All providers failed, creating mock provider');
	return createMockProvider();
}

/**
 * Create a mock provider for development/demo
 * @returns {Object} Mock provider
 */
function createMockProvider() {
	return {
		getNetwork: () => Promise.resolve({ chainId: 11155111, name: 'sepolia' }),
		call: () => Promise.reject(new Error('Mock provider - no real calls')),
		send: () => Promise.reject(new Error('Mock provider - no real calls')),
		// Add other methods as needed
		isMock: true
	};
}

/**
 * Create a contract with safe provider
 * @param {string} address - Contract address
 * @param {Array} abi - Contract ABI
 * @param {boolean} preferBrowser - Prefer browser provider
 * @returns {Promise<ethers.Contract>}
 */
export async function createSafeContract(address, abi, preferBrowser = true) {
	const provider = await createSafeProvider(preferBrowser);
	
	if (provider.isMock) {
		// Return mock contract
		return createMockContract(address, abi);
	}
	
	return new ethers.Contract(address, abi, provider);
}

/**
 * Create a mock contract for development
 * @param {string} address - Contract address
 * @param {Array} abi - Contract ABI
 * @returns {Object} Mock contract
 */
function createMockContract(address, abi) {
	const contract = {
		target: address,
		interface: new ethers.Interface(abi),
		isMock: true
	};

	// Add mock methods based on ABI
	for (const fragment of abi) {
		if (typeof fragment === 'string') {
			try {
				const parsed = ethers.Fragment.from(fragment);
				if (parsed.type === 'function') {
					contract[parsed.name] = createMockFunction(parsed);
				}
			} catch (err) {
				console.warn('Failed to parse ABI fragment:', fragment);
			}
		}
	}

	return contract;
}

/**
 * Create mock function based on ABI fragment
 * @param {Object} fragment - ABI function fragment
 * @returns {Function} Mock function
 */
function createMockFunction(fragment) {
	return async (...args) => {
		console.warn(`Mock contract call: ${fragment.name}(${args.join(', ')})`);
		
		// Return reasonable mock values based on function name
		if (fragment.name === 'totalSupply') {
			return ethers.parseUnits('1245.67', 18);
		}
		if (fragment.name === 'decimals') {
			return 18;
		}
		if (fragment.name === 'name') {
			return 'Wrapped Doichain';
		}
		if (fragment.name === 'symbol') {
			return 'wDOI';
		}
		if (fragment.name === 'balanceOf') {
			return ethers.parseUnits('0', 18);
		}
		
		// Default return value
		return ethers.ZeroHash;
	};
}

/**
 * Check if provider is available and working
 * @param {ethers.Provider} provider - Provider to test
 * @returns {Promise<boolean>}
 */
export async function isProviderWorking(provider) {
	try {
		await provider.getNetwork();
		return true;
	} catch (error) {
		return false;
	}
}