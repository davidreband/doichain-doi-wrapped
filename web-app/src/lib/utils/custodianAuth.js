import { getContractAddresses, NETWORKS } from '$lib/config/addresses.js';

/**
 * Check if user is authorized as a custodian
 * This is a simplified version for demo - in production would check smart contract roles
 */
export async function checkCustodianAuthorization(userAddress, provider) {
	try {
		// Get authorized custodians from environment
		const authorizedCustodians = import.meta.env.VITE_AUTHORIZED_CUSTODIANS?.split(',') || [];
		
		// Normalize addresses for comparison
		const normalizedUserAddress = userAddress.toLowerCase();
		const normalizedCustodians = authorizedCustodians.map(addr => addr.toLowerCase());
		
		// Check if user is in the authorized list
		const isEnvironmentAuthorized = normalizedCustodians.includes(normalizedUserAddress);
		
		if (isEnvironmentAuthorized) {
			return true;
		}

		// TODO: In production, also check smart contract roles
		// const contracts = getContractAddresses(await provider.getNetwork().then(n => n.chainId));
		// if (contracts.CUSTODIAN_REGISTRY && contracts.CUSTODIAN_REGISTRY !== "0x0000000000000000000000000000000000000000") {
		//     return await checkContractCustodianRole(userAddress, provider, contracts.CUSTODIAN_REGISTRY);
		// }

		return false;
		
	} catch (error) {
		console.error('Error checking custodian authorization:', error);
		return false;
	}
}

/**
 * Get list of authorized custodians (for admin purposes)
 */
export function getAuthorizedCustodians() {
	const authorizedCustodians = import.meta.env.VITE_AUTHORIZED_CUSTODIANS?.split(',') || [];
	return authorizedCustodians.filter(addr => addr && addr.trim());
}

/**
 * Future: Check custodian role in smart contract
 */
async function checkContractCustodianRole(userAddress, provider, custodianRegistryAddress) {
	try {
		// This would implement actual contract call to check CUSTODIAN_ROLE
		// const custodianRegistry = new ethers.Contract(
		//     custodianRegistryAddress,
		//     CUSTODIAN_REGISTRY_ABI,
		//     provider
		// );
		// 
		// const CUSTODIAN_ROLE = await custodianRegistry.CUSTODIAN_ROLE();
		// return await custodianRegistry.hasRole(CUSTODIAN_ROLE, userAddress);
		
		return false;
	} catch (error) {
		console.error('Error checking contract custodian role:', error);
		return false;
	}
}