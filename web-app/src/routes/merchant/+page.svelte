<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { ethers } from 'ethers';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';
	import WalletConnection from '$lib/components/WalletConnection.svelte';
	import { checkMerchantAuthorization, getUserRoleDisplay, getPermissionDisplay } from '$lib/utils/merchantAuth.js';
	import { walletStore } from '$lib/stores/wallet.js';

	// Wallet state
	let connected = false;
	let userAddress = '';
	let chainId = null;
	let loading = false;

	// Check access and redirect if needed (only in browser)
	$: if (typeof window !== 'undefined' && $walletStore && !$walletStore.isLoading) {
		if ($walletStore.isConnected) {
			// User has connected wallet via global state
			if (!$walletStore.isMerchant && !$walletStore.isAdmin) {
				// No access - redirect to home
				console.log('🚫 Access denied: not merchant or admin');
				goto('/');
			}
		} else {
			// Wallet disconnected - redirect to home
			console.log('🚫 Access denied: wallet not connected');
			goto('/');
		}
	}

	// Merchant authorization state
	let authResult = {
		isMerchant: false,
		isCustodian: false,
		permissions: { canMint: false, canBurn: false },
		merchantInfo: null,
		method: null
	};
	let doiBalance = 0;
	let wdoiBalance = 0;
	let pendingOperations = [];
	
	// Operation state
	let activeTab = 'wrap'; // 'wrap' or 'unwrap'
	let amount = '';
	let userWalletAddress = '';
	let doichainAddress = '';
	let error = '';
	let success = '';

	// Import centralized configuration
	import { getContractAddresses, NETWORKS } from '$lib/config/addresses.js';
	
	// Get contract addresses for current network
	const SEPOLIA_CONFIG = {
		chainId: NETWORKS.SEPOLIA.chainId,
		addresses: getContractAddresses(NETWORKS.SEPOLIA.chainId)
	};

	onMount(async () => {
		// Check if user has auto-connect enabled
		const shouldAutoConnect = sessionStorage.getItem('wallet-auto-connect') === 'true';
		if (shouldAutoConnect) {
			// Auto-connect logic would go here
		}
	});

	async function handleWalletConnect({ userAddress: addr, chainId: chain }) {
		connected = true;
		userAddress = addr;
		chainId = chain;
		
		sessionStorage.setItem('wallet-auto-connect', 'true');
		
		// Check if user is authorized merchant
		await checkMerchantStatus();
		await loadDashboardData();
		
		success = 'Wallet connected successfully!';
		setTimeout(() => success = '', 3000);
	}

	function handleWalletDisconnect() {
		sessionStorage.setItem('wallet-auto-connect', 'false');
		
		connected = false;
		userAddress = '';
		chainId = null;
		authResult = {
			isMerchant: false,
			isCustodian: false,
			permissions: { canMint: false, canBurn: false },
			merchantInfo: null,
			method: null
		};
		doiBalance = 0;
		wdoiBalance = 0;
		pendingOperations = [];
	}

	async function checkMerchantStatus() {
		try {
			// Use the comprehensive authorization system
			const provider = new ethers.BrowserProvider(window.ethereum);
			authResult = await checkMerchantAuthorization(userAddress, provider);
			
			console.log('Authorization Result:', authResult);
			
		} catch (err) {
			console.error('Failed to check merchant status:', err);
			authResult = {
				isMerchant: false,
				isCustodian: false,
				permissions: { canMint: false, canBurn: false },
				merchantInfo: null,
				method: null,
				error: err.message
			};
		}
	}

	async function loadDashboardData() {
		if (!connected || !authResult.isMerchant) return;
		
		try {
			loading = true;
			
			// Load token balances
			await loadTokenBalances();
			
			// Load pending operations
			await loadPendingOperations();
			
		} catch (err) {
			console.error('Failed to load dashboard data:', err);
			error = 'Failed to load dashboard data';
			setTimeout(() => error = '', 5000);
		} finally {
			loading = false;
		}
	}

	async function loadTokenBalances() {
		// Mock balances for demo
		// In production, read from blockchain
		doiBalance = 1500.75; // DOI balance from Doichain network
		wdoiBalance = 245.30; // wDOI balance on Ethereum
	}

	async function loadPendingOperations() {
		// Mock pending operations
		// In production, read from database/blockchain events
		pendingOperations = [
			{
				id: 'wrap-001',
				type: 'wrap',
				amount: 100,
				userAddress: '0x742d35Cc6554C7294D9871C6F2B0356b3c...',
				doichainTx: 'd1a2b3c4e5f6...',
				status: 'pending_confirmation',
				timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 min ago
			},
			{
				id: 'unwrap-001', 
				type: 'unwrap',
				amount: 50,
				userAddress: '0x9876543210abcdef...',
				doichainAddress: 'D8KpX2Ym5VzQr3Lm...',
				status: 'pending_doi_send',
				timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 min ago
			}
		];
	}

	async function processWrapRequest() {
		if (!amount || !userWalletAddress || !doichainAddress) {
			error = 'Please fill all fields';
			setTimeout(() => error = '', 3000);
			return;
		}

		try {
			loading = true;
			error = '';

			// Step 1: Verify DOI transaction on Doichain network
			console.log('Verifying DOI transaction...');
			
			// Step 2: Submit mint request to custodian
			console.log('Submitting mint request...');
			
			// Step 3: Add to pending operations
			const newOperation = {
				id: `wrap-${Date.now()}`,
				type: 'wrap',
				amount: parseFloat(amount),
				userAddress: userWalletAddress,
				doichainAddress: doichainAddress,
				status: 'verification_pending',
				timestamp: new Date()
			};
			
			pendingOperations = [newOperation, ...pendingOperations];
			
			success = `Wrap request submitted for ${amount} DOI`;
			
			// Clear form
			amount = '';
			userWalletAddress = '';
			doichainAddress = '';
			
		} catch (err) {
			console.error('Failed to process wrap request:', err);
			error = 'Failed to process wrap request';
		} finally {
			loading = false;
			setTimeout(() => success = '', 5000);
			setTimeout(() => error = '', 5000);
		}
	}

	async function processUnwrapRequest() {
		if (!amount || !userWalletAddress || !doichainAddress) {
			error = 'Please fill all fields';
			setTimeout(() => error = '', 3000);
			return;
		}

		try {
			loading = true;
			error = '';

			// Step 1: Verify wDOI tokens received
			console.log('Verifying wDOI tokens...');
			
			// Step 2: Submit burn request to custodian  
			console.log('Submitting burn request...');
			
			// Step 3: Add to pending operations
			const newOperation = {
				id: `unwrap-${Date.now()}`,
				type: 'unwrap', 
				amount: parseFloat(amount),
				userAddress: userWalletAddress,
				doichainAddress: doichainAddress,
				status: 'burn_pending',
				timestamp: new Date()
			};
			
			pendingOperations = [newOperation, ...pendingOperations];
			
			success = `Unwrap request submitted for ${amount} wDOI`;
			
			// Clear form
			amount = '';
			userWalletAddress = '';
			doichainAddress = '';
			
		} catch (err) {
			console.error('Failed to process unwrap request:', err);
			error = 'Failed to process unwrap request';
		} finally {
			loading = false;
			setTimeout(() => success = '', 5000);
			setTimeout(() => error = '', 5000);
		}
	}

	function getStatusBadgeClass(status) {
		switch (status) {
			case 'pending_confirmation':
			case 'verification_pending':
			case 'burn_pending':
				return 'status-pending';
			case 'confirmed':
			case 'completed':
				return 'status-success';
			case 'failed':
			case 'rejected':
				return 'status-error';
			default:
				return 'status-pending';
		}
	}

	function formatStatus(status) {
		return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
	}
</script>

<svelte:head>
	<title>Merchant Dashboard - Wrapped Doichain</title>
	<meta name="description" content="Merchant dashboard for managing DOI/wDOI wrapping operations" />
</svelte:head>

<div class="merchant-page">
	<NetworkWarning />
	
	<div class="page-header">
		<h1>🏪 Merchant Dashboard</h1>
		<p class="page-description">
			Manage DOI/wDOI wrapping operations for authorized merchants
		</p>
	</div>

	<div class="dashboard-container">
		<WalletConnection 
			bind:connected
			bind:userAddress
			bind:chainId
			bind:loading
			onConnect={handleWalletConnect}
			onDisconnect={handleWalletDisconnect}
		/>

		{#if connected && !authResult.isMerchant}
			<div class="unauthorized-message">
				<div class="unauthorized-card">
					<h3>🚫 Unauthorized Access</h3>
					<p>This dashboard is only available to authorized merchants.</p>
					<p>Your address: <code>{userAddress}</code></p>
					<p>Role: <strong>{getUserRoleDisplay(authResult)}</strong></p>
					{#if authResult.method}
						<p class="auth-method">Authorization method: {authResult.method}</p>
					{/if}
					<p>Contact the system administrator to request merchant access.</p>
				</div>
			</div>
		{/if}

		{#if connected && authResult.isMerchant}
			<!-- Merchant Dashboard Content -->
			<div class="dashboard-content">
				
				<!-- Merchant Info & Balance Overview -->
				<div class="merchant-info">
					<h2>👤 Merchant Information</h2>
					<div class="info-grid">
						<div class="info-item">
							<span class="info-label">Role:</span>
							<span class="info-value">{getUserRoleDisplay(authResult)}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Permissions:</span>
							<span class="info-value">{getPermissionDisplay(authResult)}</span>
						</div>
						{#if authResult.merchantInfo?.businessName}
							<div class="info-item">
								<span class="info-label">Business:</span>
								<span class="info-value">{authResult.merchantInfo.businessName}</span>
							</div>
						{/if}
						<div class="info-item">
							<span class="info-label">Auth Method:</span>
							<span class="info-value">{authResult.method}</span>
						</div>
					</div>
				</div>

				<div class="balance-overview">
					<h2>💰 Balance Overview</h2>
					<div class="balance-cards">
						<div class="balance-card">
							<div class="balance-label">DOI Balance</div>
							<div class="balance-amount">{doiBalance.toFixed(2)} DOI</div>
							<div class="balance-network">Doichain Network</div>
						</div>
						<div class="balance-card">
							<div class="balance-label">wDOI Balance</div>
							<div class="balance-amount">{wdoiBalance.toFixed(2)} wDOI</div>
							<div class="balance-network">Ethereum Network</div>
						</div>
					</div>
				</div>

				<!-- Operation Tabs -->
				<div class="operation-section">
					<h2>🔄 Process Operations</h2>
					
					<div class="tab-navigation">
						<button 
							class="tab-button {activeTab === 'wrap' ? 'active' : ''}"
							on:click={() => activeTab = 'wrap'}
						>
							📦 Wrap DOI → wDOI
						</button>
						<button 
							class="tab-button {activeTab === 'unwrap' ? 'active' : ''}"
							on:click={() => activeTab = 'unwrap'}
						>
							📤 Unwrap wDOI → DOI
						</button>
					</div>

					<div class="tab-content">
						{#if activeTab === 'wrap'}
							<div class="operation-form">
								<h3>Wrap DOI to wDOI</h3>
								<p class="form-description">Process user request to wrap DOI tokens into wDOI</p>
								
								<div class="form-group">
									<label for="wrap-amount">DOI Amount</label>
									<input 
										id="wrap-amount"
										type="number" 
										bind:value={amount}
										placeholder="100.00"
										step="0.01"
										min="0"
									/>
								</div>
								
								<div class="form-group">
									<label for="user-wallet">User Ethereum Wallet</label>
									<input 
										id="user-wallet"
										type="text" 
										bind:value={userWalletAddress}
										placeholder="0x742d35Cc..."
									/>
								</div>
								
								<div class="form-group">
									<label for="doichain-address">User Doichain Address</label>
									<input 
										id="doichain-address"
										type="text" 
										bind:value={doichainAddress}
										placeholder="D8KpX2Ym5VzQr3Lm..."
									/>
								</div>
								
								<button 
									class="process-button"
									on:click={processWrapRequest}
									disabled={loading || !amount || !userWalletAddress || !doichainAddress}
								>
									{loading ? 'Processing...' : 'Process Wrap Request'}
								</button>
							</div>
						{:else}
							<div class="operation-form">
								<h3>Unwrap wDOI to DOI</h3>
								<p class="form-description">Process user request to unwrap wDOI tokens back to DOI</p>
								
								<div class="form-group">
									<label for="unwrap-amount">wDOI Amount</label>
									<input 
										id="unwrap-amount"
										type="number" 
										bind:value={amount}
										placeholder="50.00"
										step="0.01"
										min="0"
									/>
								</div>
								
								<div class="form-group">
									<label for="user-wallet-unwrap">User Ethereum Wallet</label>
									<input 
										id="user-wallet-unwrap"
										type="text" 
										bind:value={userWalletAddress}
										placeholder="0x742d35Cc..."
									/>
								</div>
								
								<div class="form-group">
									<label for="doichain-address-unwrap">User Doichain Address</label>
									<input 
										id="doichain-address-unwrap"
										type="text" 
										bind:value={doichainAddress}
										placeholder="D8KpX2Ym5VzQr3Lm..."
									/>
								</div>
								
								<button 
									class="process-button"
									on:click={processUnwrapRequest}
									disabled={loading || !amount || !userWalletAddress || !doichainAddress}
								>
									{loading ? 'Processing...' : 'Process Unwrap Request'}
								</button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Pending Operations -->
				<div class="pending-section">
					<h2>⏳ Pending Operations</h2>
					
					{#if pendingOperations.length === 0}
						<div class="no-operations">
							<p>No pending operations</p>
						</div>
					{:else}
						<div class="operations-table">
							{#each pendingOperations as operation}
								<div class="operation-row">
									<div class="operation-info">
										<div class="operation-type">
											{operation.type === 'wrap' ? '📦' : '📤'} {operation.type.toUpperCase()}
										</div>
										<div class="operation-amount">{operation.amount} {operation.type === 'wrap' ? 'DOI' : 'wDOI'}</div>
									</div>
									<div class="operation-details">
										<div class="detail-row">
											<span>User:</span> 
											<code class="address-short">{operation.userAddress.slice(0, 8)}...{operation.userAddress.slice(-6)}</code>
										</div>
										<div class="detail-row">
											<span>Time:</span> 
											<span>{operation.timestamp.toLocaleString()}</span>
										</div>
									</div>
									<div class="operation-status">
										<span class="status-badge {getStatusBadgeClass(operation.status)}">
											{formatStatus(operation.status)}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Messages -->
	{#if error}
		<div class="error-message">{error}</div>
	{/if}
	
	{#if success}
		<div class="success-message">{success}</div>
	{/if}
</div>

<style>
	.merchant-page {
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
		max-width: 600px;
		margin: 0 auto;
	}

	.dashboard-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.unauthorized-message {
		display: flex;
		justify-content: center;
		margin: 2rem 0;
	}

	.unauthorized-card {
		background: var(--bg-secondary);
		border: 1px solid #dc3545;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		max-width: 500px;
	}

	.unauthorized-card h3 {
		color: #dc3545;
		margin-bottom: 1rem;
	}

	.auth-method {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-style: italic;
	}

	.dashboard-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.merchant-info {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.merchant-info h2 {
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.info-value {
		color: var(--text-primary);
		font-weight: 600;
	}

	.balance-overview {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.balance-overview h2 {
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.balance-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.balance-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1.5rem;
		text-align: center;
	}

	.balance-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.balance-amount {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--accent-color);
		margin-bottom: 0.25rem;
	}

	.balance-network {
		color: var(--text-secondary);
		font-size: 0.75rem;
	}

	.operation-section {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.operation-section h2 {
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.tab-navigation {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.tab-button {
		background: transparent;
		border: none;
		padding: 0.75rem 1.5rem;
		cursor: pointer;
		color: var(--text-secondary);
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.tab-button:hover {
		color: var(--text-primary);
	}

	.tab-button.active {
		color: var(--accent-color);
		border-bottom-color: var(--accent-color);
	}

	.operation-form {
		max-width: 500px;
	}

	.operation-form h3 {
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	.form-description {
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	.form-group {
		margin-bottom: 1rem;
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
		font-size: 1rem;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--accent-color);
		box-shadow: 0 0 0 2px rgba(24, 214, 133, 0.2);
	}

	.process-button {
		width: 100%;
		padding: 1rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 1rem;
	}

	.process-button:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	.process-button:disabled {
		background: var(--text-secondary);
		cursor: not-allowed;
		transform: none;
	}

	.pending-section {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.pending-section h2 {
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.no-operations {
		text-align: center;
		color: var(--text-secondary);
		padding: 2rem;
	}

	.operations-table {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.operation-row {
		display: grid;
		grid-template-columns: 150px 1fr auto;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
	}

	.operation-type {
		font-weight: 600;
		color: var(--text-primary);
	}

	.operation-amount {
		color: var(--accent-color);
		font-weight: 600;
	}

	.operation-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-row {
		display: flex;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.detail-row span:first-child {
		color: var(--text-secondary);
		min-width: 40px;
	}

	.address-short {
		font-family: monospace;
		background: var(--bg-secondary);
		padding: 0.125rem 0.25rem;
		border-radius: 3px;
		font-size: 0.75rem;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.status-pending {
		background: #ffc107;
		color: #000;
	}

	.status-success {
		background: var(--accent-color);
		color: white;
	}

	.status-error {
		background: #dc3545;
		color: white;
	}

	.error-message {
		background: #f8d7da;
		color: #721c24;
		padding: 1rem;
		border-radius: 8px;
		margin-top: 1rem;
		border: 1px solid #f5c6cb;
	}

	.success-message {
		background: #d4edda;
		color: #155724;
		padding: 1rem;
		border-radius: 8px;
		margin-top: 1rem;
		border: 1px solid #c3e6cb;
	}

	@media (max-width: 768px) {
		.merchant-page {
			padding: 1rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.balance-cards {
			grid-template-columns: 1fr;
		}

		.tab-navigation {
			flex-direction: column;
		}

		.operation-row {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.operation-details {
			order: 1;
		}

		.operation-status {
			order: 2;
			justify-self: start;
		}
	}

	:global([data-theme="dark"]) .error-message {
		background: #3d2426;
		color: #f8bfc4;
		border-color: #8b3a42;
	}

	:global([data-theme="dark"]) .success-message {
		background: #1e3d1e;
		color: #c8e6c8;
		border-color: #2d5a2d;
	}
</style>