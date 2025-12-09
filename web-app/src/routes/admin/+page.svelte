<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ethers } from 'ethers';
	import { walletStore } from '$lib/stores/wallet.js';
	import { getContractAddresses, NETWORKS } from '$lib/config/addresses.js';
	import { createSafeProvider, createSafeContract } from '$lib/utils/provider.js';

	// Check access and redirect if needed
	$: if (typeof window !== 'undefined' && $walletStore && !$walletStore.isLoading) {
		if ($walletStore.isConnected) {
			if (!$walletStore.isAdmin) {
				goto('/');
			}
		} else {
			goto('/');
		}
	}

	let loading = false;
	let error = '';
	let success = '';
	
	// Forms
	let addCustodianForm = {
		address: ''
	};
	
	let addMerchantForm = {
		address: ''
	};

	// Configuration
	let contracts = getContractAddresses(NETWORKS.SEPOLIA.chainId);
	
	// Contract ABI for admin functions
	const ADMIN_ABI = [
		"function addCustodian(address custodian) external",
		"function removeCustodian(address custodian) external", 
		"function addMerchant(address merchant) external",
		"function removeMerchant(address merchant) external",
		"function hasRole(bytes32 role, address account) view returns (bool)",
		"function CUSTODIAN_ROLE() view returns (bytes32)",
		"function MERCHANT_ROLE() view returns (bytes32)",
		"event CustodianAdded(address indexed custodian, address indexed admin)",
		"event CustodianRemoved(address indexed custodian, address indexed admin)",
		"event MerchantAdded(address indexed merchant, address indexed admin)",
		"event MerchantRemoved(address indexed merchant, address indexed admin)"
	];

	async function addCustodian() {
		try {
			loading = true;
			error = '';

			if (!ethers.isAddress(addCustodianForm.address)) {
				throw new Error('Invalid Ethereum address');
			}

			const provider = await createSafeProvider(true);
			const contract = await createSafeContract(contracts.WDOI_TOKEN_V3, ADMIN_ABI, true);
			
			if (contract.isMock) {
				// Mock success for demo
				await new Promise(resolve => setTimeout(resolve, 2000));
				success = `Custodian ${addCustodianForm.address.slice(0, 8)}...${addCustodianForm.address.slice(-6)} added successfully!`;
				addCustodianForm.address = '';
			} else {
				// Real transaction
				const tx = await contract.addCustodian(addCustodianForm.address);
				await tx.wait();
				
				success = `Custodian ${addCustodianForm.address.slice(0, 8)}...${addCustodianForm.address.slice(-6)} added successfully!`;
				addCustodianForm.address = '';
			}

			setTimeout(() => success = '', 5000);

		} catch (err) {
			console.error('Failed to add custodian:', err);
			error = 'Failed to add custodian: ' + err.message;
		} finally {
			loading = false;
		}
	}

	async function addMerchant() {
		try {
			loading = true;
			error = '';

			if (!ethers.isAddress(addMerchantForm.address)) {
				throw new Error('Invalid Ethereum address');
			}

			const provider = await createSafeProvider(true);
			const contract = await createSafeContract(contracts.WDOI_TOKEN_V3, ADMIN_ABI, true);
			
			if (contract.isMock) {
				// Mock success for demo
				await new Promise(resolve => setTimeout(resolve, 2000));
				success = `Merchant ${addMerchantForm.address.slice(0, 8)}...${addMerchantForm.address.slice(-6)} added successfully!`;
				addMerchantForm.address = '';
			} else {
				// Real transaction
				const tx = await contract.addMerchant(addMerchantForm.address);
				await tx.wait();
				
				success = `Merchant ${addMerchantForm.address.slice(0, 8)}...${addMerchantForm.address.slice(-6)} added successfully!`;
				addMerchantForm.address = '';
			}

			setTimeout(() => success = '', 5000);

		} catch (err) {
			console.error('Failed to add merchant:', err);
			error = 'Failed to add merchant: ' + err.message;
		} finally {
			loading = false;
		}
	}

	function formatAddress(address) {
		return `${address.slice(0, 8)}...${address.slice(-6)}`;
	}
</script>

<svelte:head>
	<title>Admin Panel - Wrapped Doichain</title>
	<meta name="description" content="Admin panel for managing custodians and merchants in the wDOI system." />
</svelte:head>

<div class="admin-page">
	<div class="page-header">
		<h1>🛠️ Admin Panel</h1>
		<p class="page-description">
			Manage custodians and merchants for the wDOI system. Only contract administrators can access this panel.
		</p>
	</div>

	<div class="admin-content">
		<!-- Status Messages -->
		{#if error}
			<div class="alert error">
				<span class="alert-icon">❌</span>
				<span class="alert-text">{error}</span>
				<button class="alert-close" on:click={() => error = ''}>×</button>
			</div>
		{/if}

		{#if success}
			<div class="alert success">
				<span class="alert-icon">✅</span>
				<span class="alert-text">{success}</span>
				<button class="alert-close" on:click={() => success = ''}>×</button>
			</div>
		{/if}

		<div class="admin-grid">
			<!-- Add Custodian -->
			<div class="admin-card">
				<h3>👨‍💼 Add Custodian</h3>
				<p>Grant custodian role to manage wDOI mint/burn operations</p>
				
				<div class="form-group">
					<label for="custodian-address">Custodian Address:</label>
					<input 
						id="custodian-address"
						type="text" 
						bind:value={addCustodianForm.address}
						placeholder="0x..."
						disabled={loading}
					/>
				</div>
				
				<button 
					class="admin-button primary"
					on:click={addCustodian}
					disabled={loading || !addCustodianForm.address.trim()}
				>
					{loading ? '⏳ Adding...' : '➕ Add Custodian'}
				</button>
			</div>

			<!-- Add Merchant -->
			<div class="admin-card">
				<h3>🏪 Add Merchant</h3>
				<p>Grant merchant role for automated trading operations</p>
				
				<div class="form-group">
					<label for="merchant-address">Merchant Address:</label>
					<input 
						id="merchant-address"
						type="text" 
						bind:value={addMerchantForm.address}
						placeholder="0x..."
						disabled={loading}
					/>
				</div>
				
				<button 
					class="admin-button primary"
					on:click={addMerchant}
					disabled={loading || !addMerchantForm.address.trim()}
				>
					{loading ? '⏳ Adding...' : '➕ Add Merchant'}
				</button>
			</div>

			<!-- Info Card -->
			<div class="admin-card info">
				<h3>📋 Role Information</h3>
				<div class="role-info">
					<div class="role-item">
						<strong>👨‍💼 Custodian Role:</strong>
						<ul>
							<li>Can mint new wDOI tokens</li>
							<li>Can burn wDOI tokens</li>
							<li>Access to custodian dashboard</li>
							<li>Can manage reserves</li>
						</ul>
					</div>
					
					<div class="role-item">
						<strong>🏪 Merchant Role:</strong>
						<ul>
							<li>Can request mint operations</li>
							<li>Access to merchant dashboard</li>
							<li>Can track transaction status</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.admin-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #0390CB, var(--accent-color));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 1rem;
	}

	.page-description {
		color: var(--text-secondary);
		font-size: 1.125rem;
		line-height: 1.6;
		max-width: 800px;
		margin: 0 auto;
	}

	.alert {
		display: flex;
		align-items: center;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		gap: 0.5rem;
	}

	.alert.error {
		background: rgba(255, 71, 87, 0.1);
		border: 1px solid rgba(255, 71, 87, 0.3);
		color: #ff4757;
	}

	.alert.success {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: #059669;
	}

	.alert-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		margin-left: auto;
		color: inherit;
	}

	.admin-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2rem;
	}

	.admin-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
	}

	.admin-card.info {
		grid-column: 1 / -1;
		background: var(--bg-primary);
	}

	.admin-card h3 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}

	.admin-card p {
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-family: monospace;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--accent-color);
		box-shadow: 0 0 0 2px rgba(24, 214, 133, 0.2);
	}

	.admin-button {
		width: 100%;
		padding: 0.875rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.admin-button.primary {
		background: var(--accent-color);
		color: white;
	}

	.admin-button.primary:hover:not(:disabled) {
		background: #15c77a;
		transform: translateY(-1px);
	}

	.admin-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.role-info {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.role-item ul {
		margin: 0.5rem 0 0 1rem;
		padding: 0;
	}

	.role-item li {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
	}

	@media (max-width: 768px) {
		.admin-grid {
			grid-template-columns: 1fr;
		}
		
		.admin-card.info {
			grid-column: 1;
		}
	}
</style>