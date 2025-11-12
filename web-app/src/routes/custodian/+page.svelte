<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { ethers } from 'ethers';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';
	import { getContractAddresses, NETWORKS } from '$lib/config/addresses.js';
	import { createSafeProvider, createSafeContract } from '$lib/utils/provider.js';
	import { checkCustodianAuthorization } from '$lib/utils/custodianAuth.js';
	import { walletStore } from '$lib/stores/wallet.js';

	// State
	let loading = true;
	let error = '';
	let walletConnected = false;
	let userAddress = '';
	let isAuthorized = false;
	let provider = null;

	// Check access and redirect if needed (only in browser)
	$: if (typeof window !== 'undefined' && $walletStore && !$walletStore.isLoading) {
		if ($walletStore.isConnected) {
			// User has connected wallet via global state
			if (!$walletStore.isCustodian && !$walletStore.isAdmin) {
				// No access - redirect to home
				console.log('🚫 Access denied: not custodian or admin');
				goto('/');
			}
		} else {
			// Wallet disconnected - redirect to home
			console.log('🚫 Access denied: wallet not connected');
			goto('/');
		}
	}

	// Pending transactions
	let pendingRequests = [];
	let processingTx = null;

	// Configuration
	let contracts = getContractAddresses(NETWORKS.SEPOLIA.chainId);

	// Mock pending requests for demo
	const mockPendingRequests = [
		{
			id: 'req_001',
			type: 'mint',
			amount: 100.5,
			merchantAddress: '0x60eAe063F1Fd429814cA4C65767fDF0d8991506E',
			doiTxHash: 'doi_tx_abc123',
			timestamp: new Date('2024-11-05T10:30:00Z'),
			status: 'pending_confirmation'
		},
		{
			id: 'req_002', 
			type: 'burn',
			amount: 50.25,
			userAddress: '0x742d35Cc65C7a6123e18EBA0DA27Ad60DCD9F0dd',
			wdoiTxHash: '0x789def456',
			timestamp: new Date('2024-11-05T09:15:00Z'),
			status: 'pending_doi_release'
		},
		{
			id: 'req_003',
			type: 'mint',
			amount: 25.0,
			merchantAddress: '0x60eAe063F1Fd429814cA4C65767fDF0d8991506E',
			doiTxHash: 'doi_tx_xyz789',
			timestamp: new Date('2024-11-05T08:45:00Z'),
			status: 'pending_confirmation'
		}
	];

	// ERC20 ABI for contract interaction
	const ERC20_ABI = [
		"function mint(address to, uint256 amount) external",
		"function burn(uint256 amount) external",
		"function totalSupply() view returns (uint256)",
		"function balanceOf(address account) view returns (uint256)"
	];

	onMount(async () => {
		await initializePage();
	});

	async function initializePage() {
		try {
			loading = true;
			error = '';

			// Initialize provider
			provider = await createSafeProvider(true);
			
			// Check wallet connection
			if (typeof window !== 'undefined' && window.ethereum) {
				const accounts = await window.ethereum.request({ method: 'eth_accounts' });
				if (accounts.length > 0) {
					userAddress = accounts[0];
					walletConnected = true;
					
					// Check authorization
					isAuthorized = await checkCustodianAuthorization(userAddress, provider);
				}
			}

			// Load pending requests (mock data for demo)
			await loadPendingRequests();

		} catch (err) {
			console.error('Failed to initialize custodian dashboard:', err);
			error = 'Failed to initialize dashboard';
		} finally {
			loading = false;
		}
	}

	async function connectWallet() {
		try {
			if (typeof window === 'undefined' || !window.ethereum) {
				error = 'MetaMask not installed';
				return;
			}

			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			userAddress = accounts[0];
			walletConnected = true;

			// Check authorization
			isAuthorized = await checkCustodianAuthorization(userAddress, provider);
			
		} catch (err) {
			console.error('Failed to connect wallet:', err);
			error = 'Failed to connect wallet';
		}
	}

	async function loadPendingRequests() {
		// In production, this would query the backend API or smart contract events
		// For demo, use mock data
		pendingRequests = mockPendingRequests;
	}

	async function confirmMintRequest(request) {
		try {
			processingTx = request.id;
			error = '';

			// Create contract instance
			const wdoiContract = await createSafeContract(contracts.WDOI_TOKEN, ERC20_ABI, true);
			
			if (wdoiContract.isMock) {
				// Mock confirmation for demo
				await new Promise(resolve => setTimeout(resolve, 2000));
				
				// Update request status
				pendingRequests = pendingRequests.map(req => 
					req.id === request.id 
						? { ...req, status: 'confirmed', confirmationTx: 'mock_tx_' + Date.now() }
						: req
				);
			} else {
				// Real transaction
				const amountWei = ethers.parseUnits(request.amount.toString(), 18);
				const tx = await wdoiContract.mint(request.merchantAddress, amountWei);
				
				// Update request with transaction hash
				pendingRequests = pendingRequests.map(req => 
					req.id === request.id 
						? { ...req, status: 'confirming', confirmationTx: tx.hash }
						: req
				);

				// Wait for confirmation
				await tx.wait();
				
				// Update final status
				pendingRequests = pendingRequests.map(req => 
					req.id === request.id 
						? { ...req, status: 'confirmed' }
						: req
				);
			}

		} catch (err) {
			console.error('Failed to confirm mint request:', err);
			error = `Failed to confirm mint: ${err.message}`;
		} finally {
			processingTx = null;
		}
	}

	async function confirmBurnRequest(request) {
		try {
			processingTx = request.id;
			error = '';

			// In production, this would trigger DOI release on Doichain network
			// For demo, simulate the process
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Update request status
			pendingRequests = pendingRequests.map(req => 
				req.id === request.id 
					? { ...req, status: 'doi_released', doiReleaseTx: 'doi_release_' + Date.now() }
					: req
			);

		} catch (err) {
			console.error('Failed to confirm burn request:', err);
			error = `Failed to confirm burn: ${err.message}`;
		} finally {
			processingTx = null;
		}
	}

	function formatAddress(address) {
		return `${address.slice(0, 8)}...${address.slice(-6)}`;
	}

	function formatAmount(amount) {
		return new Intl.NumberFormat('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 6
		}).format(amount);
	}

	function getStatusColor(status) {
		switch (status) {
			case 'pending_confirmation': return '#ffd93d';
			case 'pending_doi_release': return '#ff6b6b';
			case 'confirming': return '#0390CB';
			case 'confirmed': return '#18d685';
			case 'doi_released': return '#18d685';
			default: return '#6c757d';
		}
	}

	function getStatusText(status) {
		switch (status) {
			case 'pending_confirmation': return $_('custodian.pendingConfirmation', { default: 'Pending Confirmation' });
			case 'pending_doi_release': return $_('custodian.pendingDoiRelease', { default: 'Pending DOI Release' });
			case 'confirming': return $_('custodian.processing', { default: 'Processing...' });
			case 'confirmed': return $_('custodian.confirmed', { default: 'Confirmed' });
			case 'doi_released': return $_('custodian.doiReleased', { default: 'DOI Released' });
			default: return status;
		}
	}
</script>

<svelte:head>
	<title>{$_('custodian.dashboard', { default: 'Custodian Dashboard' })} - Wrapped Doichain</title>
	<meta name="description" content={$_('custodian.managementDesc', { default: 'Custodian dashboard for managing wDOI mint and burn confirmations.' })} />
</svelte:head>

<div class="custodian-page">
	<!-- Loading state while checking wallet authorization -->
	{#if $walletStore.isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>{$_('custodian.checkingAuth', { default: 'Checking wallet authorization...' })}</p>
		</div>
	{:else}
		<div class="page-header">
			<h1>🔐 {$_('custodian.dashboard', { default: 'Custodian Dashboard' })}</h1>
			<p class="page-description">
				{$_('custodian.managementDesc', { default: 'Manage and confirm wDOI mint/burn requests. Only authorized custodians can access this dashboard.' })}
			</p>
	</div>

	{#if loading}
		<div class="loading-section">
			<div class="spinner"></div>
			<p>{$_('custodian.loading', { default: 'Loading custodian dashboard...' })}</p>
		</div>
	{:else if !walletConnected}
		<div class="connect-section">
			<div class="connect-card">
				<h3>🔌 {$_('custodian.connectWallet', { default: 'Connect Wallet' })}</h3>
				<p>{$_('custodian.connectDesc', { default: 'Connect your MetaMask wallet to access the custodian dashboard.' })}</p>
				<button on:click={connectWallet} class="connect-button">
					{$_('custodian.connectMetaMask', { default: 'Connect MetaMask' })}
				</button>
			</div>
		</div>
	{:else if !isAuthorized}
		<div class="unauthorized-section">
			<div class="unauthorized-card">
				<h3>❌ {$_('custodian.accessDenied', { default: 'Access Denied' })}</h3>
				<p>{$_('custodian.unauthorized', { default: 'Your wallet address is not authorized as a custodian.' })}</p>
				<div class="address-info">
					<span class="address-label">{$_('custodian.connectedAddress', { default: 'Connected Address:' })}</span>
					<code class="address-value">{formatAddress(userAddress)}</code>
				</div>
				<p class="help-text">{$_('custodian.contactAdmin', { default: 'Contact the system administrator to request custodian access.' })}</p>
			</div>
		</div>
	{:else}
		<!-- Main Dashboard Content -->
		<div class="dashboard-content">
			<!-- Status Overview -->
			<div class="overview-cards">
				<div class="overview-card">
					<div class="card-icon">📋</div>
					<div class="card-content">
						<div class="card-value">{pendingRequests.filter(r => r.status.includes('pending')).length}</div>
						<div class="card-label">{$_('custodian.pendingRequests', { default: 'Pending Requests' })}</div>
					</div>
				</div>
				<div class="overview-card">
					<div class="card-icon">✅</div>
					<div class="card-content">
						<div class="card-value">{pendingRequests.filter(r => r.status === 'confirmed' || r.status === 'doi_released').length}</div>
						<div class="card-label">{$_('custodian.completedToday', { default: 'Completed Today' })}</div>
					</div>
				</div>
				<div class="overview-card">
					<div class="card-icon">🔄</div>
					<div class="card-content">
						<div class="card-value">{pendingRequests.filter(r => r.type === 'mint').length}</div>
						<div class="card-label">{$_('custodian.mintRequests', { default: 'Mint Requests' })}</div>
					</div>
				</div>
				<div class="overview-card">
					<div class="card-icon">🔥</div>
					<div class="card-content">
						<div class="card-value">{pendingRequests.filter(r => r.type === 'burn').length}</div>
						<div class="card-label">{$_('custodian.burnRequests', { default: 'Burn Requests' })}</div>
					</div>
				</div>
			</div>

			<!-- Connected Custodian Info -->
			<div class="custodian-info">
				<h3>👤 {$_('custodian.connectedCustodian', { default: 'Connected Custodian' })}</h3>
				<div class="custodian-details">
					<div class="detail-item">
						<span class="detail-label">{$_('custodian.address', { default: 'Address:' })}</span>
						<code class="detail-value">{formatAddress(userAddress)}</code>
					</div>
					<div class="detail-item">
						<span class="detail-label">{$_('custodian.status', { default: 'Status:' })}</span>
						<span class="status-badge authorized">✅ {$_('custodian.authorized', { default: 'Authorized' })}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">{$_('custodian.network', { default: 'Network:' })}</span>
						<span class="detail-value"><NetworkWarning compact={true} /></span>
					</div>
				</div>
			</div>

			<!-- Pending Requests -->
			<div class="requests-section">
				<h3>📋 {$_('custodian.pendingTransactions', { default: 'Pending Requests' })}</h3>
				
				{#if error}
					<div class="error-banner">
						<p>❌ {error}</p>
					</div>
				{/if}

				{#if pendingRequests.length === 0}
					<div class="empty-state">
						<p>🎉 {$_('custodian.noRequests', { default: 'No pending requests at the moment.' })}</p>
					</div>
				{:else}
					<div class="requests-table">
						{#each pendingRequests as request (request.id)}
							<div class="request-card">
								<div class="request-header">
									<div class="request-type" class:mint={request.type === 'mint'} class:burn={request.type === 'burn'}>
										{request.type === 'mint' ? '🔄 ' + $_('custodian.mint', { default: 'MINT' }) : '🔥 ' + $_('custodian.burn', { default: 'BURN' })}
									</div>
									<div class="request-status" style="color: {getStatusColor(request.status)}">
										{getStatusText(request.status)}
									</div>
								</div>

								<div class="request-content">
									<div class="request-amount">
										{formatAmount(request.amount)} {request.type === 'mint' ? 'wDOI' : 'wDOI'}
									</div>
									
									<div class="request-details">
										{#if request.type === 'mint'}
											<div class="detail-row">
												<span class="label">{$_('custodian.merchant', { default: 'Merchant:' })}</span>
												<code class="value">{formatAddress(request.merchantAddress)}</code>
											</div>
											<div class="detail-row">
												<span class="label">{$_('custodian.doiTxHash', { default: 'DOI Tx:' })}</span>
												<code class="value">{request.doiTxHash}</code>
											</div>
										{:else}
											<div class="detail-row">
												<span class="label">{$_('custodian.user', { default: 'User:' })}</span>
												<code class="value">{formatAddress(request.userAddress)}</code>
											</div>
											<div class="detail-row">
												<span class="label">{$_('custodian.wdoiTxHash', { default: 'wDOI Tx:' })}</span>
												<code class="value">{formatAddress(request.wdoiTxHash)}</code>
											</div>
										{/if}
										<div class="detail-row">
											<span class="label">{$_('custodian.timestamp', { default: 'Time:' })}</span>
											<span class="value">{request.timestamp.toLocaleString()}</span>
										</div>
									</div>
								</div>

								<div class="request-actions">
									{#if request.type === 'mint' && request.status === 'pending_confirmation'}
										<button 
											on:click={() => confirmMintRequest(request)}
											disabled={processingTx === request.id}
											class="action-button confirm"
										>
											{processingTx === request.id ? $_('custodian.processing', { default: 'Processing...' }) : $_('custodian.confirm', { default: 'Confirm' }) + ' ' + $_('custodian.mint', { default: 'Mint' })}
										</button>
									{:else if request.type === 'burn' && request.status === 'pending_doi_release'}
										<button 
											on:click={() => confirmBurnRequest(request)}
											disabled={processingTx === request.id}
											class="action-button confirm"
										>
											{processingTx === request.id ? $_('custodian.processing', { default: 'Processing...' }) : 'Release DOI'}
										</button>
									{:else if request.status === 'confirmed' || request.status === 'doi_released'}
										<div class="completed-badge">
											✅ Completed
										</div>
									{:else}
										<div class="processing-badge">
											🔄 Processing...
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
{/if} <!-- End of wallet loading check -->
</div>

<style>
	.custodian-page {
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

	.loading-section, .connect-section, .unauthorized-section {
		text-align: center;
		padding: 4rem 2rem;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid var(--border-color);
		border-top: 4px solid var(--accent-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1.5rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.connect-card, .unauthorized-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
		max-width: 500px;
		margin: 0 auto;
	}

	.connect-card h3, .unauthorized-card h3 {
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.connect-button {
		background: var(--accent-color);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		margin-top: 1rem;
		transition: background-color 0.2s ease;
	}

	.connect-button:hover {
		background: #15c77a;
	}

	.address-info {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 1rem;
		margin: 1rem 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.address-label {
		color: var(--text-secondary);
		font-weight: 500;
	}

	.address-value {
		font-family: monospace;
		background: var(--bg-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		color: var(--text-primary);
	}

	.help-text {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-top: 1rem;
	}

	.overview-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.overview-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.card-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.card-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent-color);
		margin-bottom: 0.25rem;
	}

	.card-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.custodian-info {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.custodian-info h3 {
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.custodian-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.detail-label {
		color: var(--text-secondary);
		font-weight: 500;
	}

	.detail-value {
		font-family: monospace;
		background: var(--bg-primary);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		color: var(--text-primary);
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.status-badge.authorized {
		background: rgba(24, 214, 133, 0.2);
		color: #18d685;
	}

	.requests-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
	}

	.requests-section h3 {
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}

	.error-banner {
		background: rgba(255, 107, 107, 0.1);
		border: 1px solid rgba(255, 107, 107, 0.3);
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
		color: #ff6b6b;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-secondary);
	}

	.requests-table {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.request-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.request-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border-color);
	}

	.request-type {
		font-weight: 700;
		font-size: 0.875rem;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
	}

	.request-type.mint {
		background: rgba(3, 144, 203, 0.2);
		color: #0390CB;
	}

	.request-type.burn {
		background: rgba(255, 107, 107, 0.2);
		color: #ff6b6b;
	}

	.request-status {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.request-amount {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--accent-color);
		margin-bottom: 1rem;
	}

	.request-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.detail-row .label {
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.detail-row .value {
		font-family: monospace;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.request-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.action-button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.action-button.confirm {
		background: var(--accent-color);
		color: white;
	}

	.action-button.confirm:hover:not(:disabled) {
		background: #15c77a;
	}

	.action-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.completed-badge, .processing-badge {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.completed-badge {
		background: rgba(24, 214, 133, 0.2);
		color: #18d685;
	}

	.processing-badge {
		background: rgba(3, 144, 203, 0.2);
		color: #0390CB;
	}

	@media (max-width: 768px) {
		.custodian-page {
			padding: 1rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.overview-cards {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 1rem;
		}

		.detail-item, .detail-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.request-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.request-actions {
			justify-content: stretch;
		}

		.action-button {
			flex: 1;
		}
	}

	/* Loading styles */
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		gap: 1rem;
		color: var(--text-secondary);
		text-align: center;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--border-color);
		border-top: 3px solid var(--accent-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>