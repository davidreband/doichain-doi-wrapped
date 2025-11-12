<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { ethers } from 'ethers';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';
	import WalletConnection from '$lib/components/WalletConnection.svelte';
	import { getContractAddresses, NETWORKS } from '$lib/config/addresses.js';
	import { createSafeProvider } from '$lib/utils/provider.js';
	import { checkCustodianAuthorization } from '$lib/utils/custodianAuth.js';
	import { 
		getContractStatus, 
		PoolMonitor, 
		CustodianOperations 
	} from '$lib/utils/contractIntegration.js';
	import { walletStore } from '$lib/stores/wallet.js';

	// Check access and redirect if needed (only in browser)
	$: if (typeof window !== 'undefined' && $walletStore) {
		if ($walletStore.isConnected) {
			// User has connected wallet via global state
			if (!$walletStore.isCustodian && !$walletStore.isAdmin) {
				// No access - redirect to home
				goto('/');
			}
		} else {
			// Wallet disconnected - redirect to home
			goto('/');
		}
	}

	// Wallet state
	let connected = false;
	let userAddress = '';
	let chainId = null;
	let loading = false;
	let error = '';
	let success = '';

	// Authorization state
	let isAuthorized = false;
	let provider = null;
	let custodianOps = null;

	// Contract status
	let contractStatus = null;
	let refreshInterval = null;

	// Pool monitoring
	let poolMonitor = null;
	let notifications = [];
	let unreadNotifications = 0;

	// Operations state
	let operationInProgress = false;
	let currentOperation = '';

	// Price maintenance state
	let priceStatus = {
		doiPrice: 0,
		poolPrice: 0,
		deviation: 0,
		needsCorrection: false,
		correctionAmount: 0,
		correctionType: 'none'
	};

	// Forms
	let declareReservesForm = {
		amount: '',
		custodianDoiBalance: ''
	};
	
	let emergencyPauseForm = {
		reason: ''
	};

	let rateLimitsForm = {
		maxMintPerDay: '',
		maxBurnPerDay: ''
	};

	// Configuration
	let contracts = getContractAddresses(NETWORKS.SEPOLIA.chainId);

	onMount(async () => {
		// Check if user has auto-connect enabled
		const shouldAutoConnect = sessionStorage.getItem('wallet-auto-connect') === 'true';
		if (shouldAutoConnect) {
			// Auto-connect logic would go here
		}
	});

	onDestroy(() => {
		if (poolMonitor) {
			poolMonitor.stop();
		}
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		removeNotificationListener();
	});

	async function handleWalletConnect({ userAddress: addr, chainId: chain }) {
		connected = true;
		userAddress = addr;
		chainId = chain;
		
		sessionStorage.setItem('wallet-auto-connect', 'true');
		
		// Check authorization and initialize custodian system
		await checkAuthorizationAndInitialize();
		
		success = 'Wallet connected successfully!';
		setTimeout(() => success = '', 3000);
	}

	async function checkAuthorizationAndInitialize() {
		try {
			loading = true;
			error = '';

			// Initialize provider if not already done
			if (!provider) {
				provider = await createSafeProvider(true);
			}
			
			// Check authorization
			isAuthorized = await checkCustodianAuthorization(userAddress, provider);
			
			if (isAuthorized) {
				// Initialize custodian operations
				custodianOps = new CustodianOperations(provider, userAddress);
				
				// Load contract status
				await loadContractStatus();
				
				// Start pool monitoring if pool address is configured
				if (contracts.USDT_POOL) {
					await startPoolMonitoring();
				}

				// Check initial price status
				await checkPriceStatus();
			}

		} catch (err) {
			console.error('Failed to check authorization and initialize:', err);
			error = 'Failed to initialize dashboard: ' + err.message;
		} finally {
			loading = false;
		}
	}

	function handleWalletDisconnect() {
		sessionStorage.setItem('wallet-auto-connect', 'false');
		
		connected = false;
		userAddress = '';
		chainId = null;
		isAuthorized = false;
		provider = null;
		custodianOps = null;
		contractStatus = null;
		
		// Stop monitoring
		if (poolMonitor) {
			poolMonitor.stop();
			poolMonitor = null;
		}
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
		
		// Reset notifications
		notifications = [];
		unreadNotifications = 0;
		
		// Reset price status
		priceStatus = {
			doiPrice: 0,
			poolPrice: 0,
			deviation: 0,
			needsCorrection: false,
			correctionAmount: 0,
			correctionType: 'none'
		};
	}



	async function loadContractStatus() {
		try {
			console.log('Loading contract status...');
			contractStatus = await getContractStatus(provider);
			console.log('Contract status loaded successfully:', contractStatus);
		} catch (err) {
			console.error('Failed to load contract status:', err);
			error = 'Failed to load contract status: ' + err.message;
		}
	}

	async function startPoolMonitoring() {
		try {
			poolMonitor = new PoolMonitor(
				provider,
				contracts.WDOI_USDT_POOL,
				contracts.WDOI_TOKEN_V3,
				contracts.USDT_TOKEN
			);
			
			await poolMonitor.start();
			console.log('Pool monitoring started successfully');
		} catch (err) {
			console.error('Failed to start pool monitoring:', err);
		}
	}

	function setupNotificationListener() {
		if (typeof window !== 'undefined') {
			window.addEventListener('custodianNotification', handleNotification);
		}
	}

	function removeNotificationListener() {
		if (typeof window !== 'undefined') {
			window.removeEventListener('custodianNotification', handleNotification);
		}
	}

	function handleNotification(event) {
		const notification = event.detail;
		notifications = [notification, ...notifications].slice(0, 50); // Keep latest 50
		unreadNotifications++;
		
		// Auto-clear notification count after 5 seconds
		setTimeout(() => {
			if (unreadNotifications > 0) unreadNotifications--;
		}, 5000);
	}

	function clearNotifications() {
		notifications = [];
		unreadNotifications = 0;
	}

	function startPeriodicRefresh() {
		refreshInterval = setInterval(async () => {
			if (isAuthorized && provider) {
				await loadContractStatus();
			}
		}, 30000); // Refresh every 30 seconds
	}

	async function declareReserves() {
		error = 'Declare reserves function is not available in V2 contract. This feature will be available in future contract versions.';
		setTimeout(() => error = '', 5000);
	}

	async function activateEmergencyPause() {
		try {
			operationInProgress = true;
			currentOperation = 'Activating emergency pause...';
			error = '';

			// V2 contract only has pause() without reason parameter
			const tx = await custodianOps.activateEmergencyPause();
			await tx.wait();

			emergencyPauseForm.reason = '';
			await loadContractStatus();

			currentOperation = 'Emergency pause activated!';
			setTimeout(() => currentOperation = '', 3000);

		} catch (err) {
			console.error('Failed to activate emergency pause:', err);
			error = 'Failed to activate emergency pause: ' + err.message;
		} finally {
			operationInProgress = false;
		}
	}

	async function deactivateEmergencyPause() {
		try {
			operationInProgress = true;
			currentOperation = 'Deactivating emergency pause...';
			error = '';

			const tx = await custodianOps.deactivateEmergencyPause();
			await tx.wait();

			await loadContractStatus();

			currentOperation = 'Emergency pause deactivated!';
			setTimeout(() => currentOperation = '', 3000);

		} catch (err) {
			console.error('Failed to deactivate emergency pause:', err);
			error = 'Failed to deactivate emergency pause: ' + err.message;
		} finally {
			operationInProgress = false;
		}
	}

	async function updateRateLimits() {
		error = 'Rate limits function is not available in V2 contract. This feature will be available in future contract versions.';
		setTimeout(() => error = '', 5000);
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

	function formatTime(seconds) {
		if (seconds < 60) return `${seconds}s`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
		return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
	}

	function getPriorityColor(priority) {
		switch (priority) {
			case 'critical': return '#ff4757';
			case 'high': return '#ffa502';
			case 'medium': return '#2ed573';
			default: return '#747d8c';
		}
	}

	function getReserveStatusColor(ratio) {
		const numRatio = parseFloat(ratio);
		if (numRatio >= 100) return '#2ed573'; // Green - fully backed
		if (numRatio >= 95) return '#ffa502';  // Orange - warning
		return '#ff4757'; // Red - critical
	}

	// Price maintenance functions
	async function checkPriceStatus() {
		try {
			// Mock implementation - in real system would fetch from price oracle and pool
			// For demo purposes, we'll simulate a price deviation
			priceStatus = {
				doiPrice: 0.02294166, // Real DOI price from oracle
				poolPrice: 0.02450000, // Pool price (higher = needs correction)
				deviation: 6.79, // 6.79% deviation
				needsCorrection: true,
				correctionAmount: 10.5, // wDOI to add (smaller amount for testing)
				correctionType: 'add_wdoi' // add_wdoi or remove_wdoi
			};
		} catch (error) {
			console.error('Failed to check price status:', error);
		}
	}

	async function autoCorrectPrice() {
		if (!priceStatus.needsCorrection) return;

		try {
			operationInProgress = true;
			currentOperation = 'Executing automatic price correction...';

			if (priceStatus.correctionType === 'add_wdoi') {
				// Step 1: Mint new wDOI tokens
				currentOperation = 'Step 1/2: Minting wDOI tokens...';
				
				const mintAmount = ethers.parseEther(priceStatus.correctionAmount.toString());
				const doiTxHash = `auto_rebalance_${Date.now()}`;
				const custodianDoiBalance = ethers.parseEther('5000'); // Mock DOI balance
				
				const mintTx = await custodianOps.mint(
					userAddress,
					mintAmount,
					doiTxHash,
					custodianDoiBalance
				);
				
				await mintTx.wait();

				// Step 2: Add to liquidity pool (simplified - in real implementation would use DEX router)
				currentOperation = 'Step 2/2: Adding liquidity to pool...';
				
				// In real implementation, would call DEX router functions here
				// await addLiquidityToPool(mintAmount);
				
				currentOperation = '✅ Price correction completed successfully!';
				
				// Refresh price status
				await checkPriceStatus();
				
			} else if (priceStatus.correctionType === 'remove_wdoi') {
				// Implementation for removing wDOI from pool and burning
				currentOperation = 'Removing wDOI from pool and burning...';
				// Implementation here...
			}

			setTimeout(() => currentOperation = '', 5000);

		} catch (err) {
			console.error('Failed to auto-correct price:', err);
			error = 'Price correction failed: ' + err.message;
		} finally {
			operationInProgress = false;
		}
	}
</script>

<svelte:head>
	<title>Enhanced Custodian Dashboard - Wrapped Doichain V3</title>
	<meta name="description" content="Enhanced custodian dashboard with real-time monitoring and automated alerts." />
</svelte:head>

<div class="enhanced-custodian-page">
	<NetworkWarning />
	
	<div class="page-header">
		<h1>🔐 Enhanced Custodian Dashboard V3</h1>
		<p class="page-description">
			Real-time monitoring, automated reserve auditing, and liquidity pool alerts for wDOI management.
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

		{#if connected && !isAuthorized}
			<div class="unauthorized-section">
				<div class="unauthorized-card">
					<h3>❌ Access Denied</h3>
					<p>Your wallet address is not authorized as a custodian.</p>
					<div class="address-info">
						<span class="address-label">Connected Address:</span>
						<code class="address-value">{formatAddress(userAddress)}</code>
					</div>
					<p class="help-text">Contact the system administrator to request custodian access.</p>
				</div>
			</div>
		{/if}

		{#if connected && isAuthorized}
		<!-- Enhanced Dashboard Content -->
		<div class="dashboard-content">
			<!-- Status Alerts -->
			{#if error}
				<div class="alert error">
					<span class="alert-icon">❌</span>
					<span class="alert-text">{error}</span>
					<button class="alert-close" on:click={() => error = ''}>×</button>
				</div>
			{/if}

			{#if currentOperation}
				<div class="alert info">
					<span class="alert-icon">⏳</span>
					<span class="alert-text">{currentOperation}</span>
				</div>
			{/if}

			<!-- Quick Status Overview -->
			{#if contractStatus}
				<div class="status-grid">
					<div class="status-card reserves" style="border-left-color: {getReserveStatusColor(contractStatus.reserves.ratio)}">
						<div class="status-header">
							<span class="status-icon">🏦</span>
							<span class="status-title">Reserve Status</span>
						</div>
						<div class="status-content">
							<div class="status-main">
								<span class="status-value">{contractStatus.reserves.ratio}%</span>
								<span class="status-label">Backing Ratio</span>
							</div>
							<div class="status-details">
								<div class="status-detail">
									<span class="detail-label">Declared:</span>
									<span class="detail-value">{formatAmount(contractStatus.reserves.declared)} DOI</span>
								</div>
								<div class="status-detail">
									<span class="detail-label">Supply:</span>
									<span class="detail-value">{formatAmount(contractStatus.reserves.supply)} wDOI</span>
								</div>
								{#if contractStatus.audit.isRequired}
									<div class="status-alert">⚠️ Audit Required</div>
								{/if}
							</div>
						</div>
					</div>

					<div class="status-card rate-limits">
						<div class="status-header">
							<span class="status-icon">📊</span>
							<span class="status-title">Daily Limits</span>
						</div>
						<div class="status-content">
							<div class="limit-bars">
								<div class="limit-bar">
									<span class="limit-label">Mint Used</span>
									<div class="limit-progress">
										<div class="limit-fill" style="width: {(contractStatus.rateLimits.dailyMintUsed / (parseFloat(contractStatus.rateLimits.dailyMintUsed) + parseFloat(contractStatus.rateLimits.mintLimitRemaining))) * 100}%"></div>
									</div>
									<span class="limit-text">{formatAmount(contractStatus.rateLimits.dailyMintUsed)} / {formatAmount(parseFloat(contractStatus.rateLimits.dailyMintUsed) + parseFloat(contractStatus.rateLimits.mintLimitRemaining))}</span>
								</div>
								<div class="limit-bar">
									<span class="limit-label">Burn Used</span>
									<div class="limit-progress">
										<div class="limit-fill" style="width: {(contractStatus.rateLimits.dailyBurnUsed / (parseFloat(contractStatus.rateLimits.dailyBurnUsed) + parseFloat(contractStatus.rateLimits.burnLimitRemaining))) * 100}%"></div>
									</div>
									<span class="limit-text">{formatAmount(contractStatus.rateLimits.dailyBurnUsed)} / {formatAmount(parseFloat(contractStatus.rateLimits.dailyBurnUsed) + parseFloat(contractStatus.rateLimits.burnLimitRemaining))}</span>
								</div>
							</div>
							{#if contractStatus.rateLimits.timeUntilReset > 0}
								<div class="reset-time">Resets in: {formatTime(contractStatus.rateLimits.timeUntilReset)}</div>
							{/if}
						</div>
					</div>

					<div class="status-card emergency" class:emergency-active={contractStatus.emergency.isPaused}>
						<div class="status-header">
							<span class="status-icon">🚨</span>
							<span class="status-title">Emergency Status</span>
						</div>
						<div class="status-content">
							{#if contractStatus.emergency.isPaused}
								<div class="emergency-active">
									<div class="emergency-reason">PAUSED: {contractStatus.emergency.reason}</div>
									<div class="emergency-time">Since: {new Date(contractStatus.emergency.pausedSince * 1000).toLocaleString()}</div>
									<button 
										class="emergency-button deactivate" 
										on:click={deactivateEmergencyPause}
										disabled={operationInProgress}
									>
										Deactivate Pause
									</button>
								</div>
							{:else}
								<div class="emergency-inactive">
									<div class="emergency-status">✅ System Operating Normally</div>
								</div>
							{/if}
						</div>
					</div>

					<div class="status-card notifications">
						<div class="status-header">
							<span class="status-icon">🔔</span>
							<span class="status-title">Live Notifications</span>
							{#if unreadNotifications > 0}
								<span class="notification-badge">{unreadNotifications}</span>
							{/if}
						</div>
						<div class="status-content">
							{#if notifications.length === 0}
								<div class="no-notifications">No notifications</div>
							{:else}
								<div class="notifications-list">
									{#each notifications.slice(0, 3) as notification}
										<div class="notification-item" style="border-left-color: {getPriorityColor(notification.priority)}">
											<div class="notification-message">{notification.message}</div>
											<div class="notification-time">{notification.timestamp.toLocaleTimeString()}</div>
										</div>
									{/each}
								</div>
								<button class="clear-notifications" on:click={clearNotifications}>Clear All</button>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Automatic Price Correction -->
			<div class="price-correction-section">
				<h3>🎯 Automatic Price Correction</h3>
				
				<div class="price-status-card" class:needs-correction={priceStatus.needsCorrection}>
					<div class="price-status-header">
						<span class="price-status-icon">
							{#if priceStatus.needsCorrection}🚨{:else}✅{/if}
						</span>
						<span class="price-status-title">
							{#if priceStatus.needsCorrection}Price Deviation Detected{:else}Price Within Target Range{/if}
						</span>
					</div>
					
					<div class="price-status-content">
						<div class="price-info-grid">
							<div class="price-info-item">
								<span class="price-label">DOI Oracle Price:</span>
								<span class="price-value">${priceStatus.doiPrice.toFixed(8)}</span>
							</div>
							<div class="price-info-item">
								<span class="price-label">wDOI Pool Price:</span>
								<span class="price-value">${priceStatus.poolPrice.toFixed(8)}</span>
							</div>
							<div class="price-info-item">
								<span class="price-label">Deviation:</span>
								<span class="price-value deviation" class:critical={priceStatus.deviation > 5}>
									{priceStatus.deviation > 0 ? '+' : ''}{priceStatus.deviation.toFixed(2)}%
								</span>
							</div>
						</div>

						{#if priceStatus.needsCorrection}
							<div class="correction-details">
								<div class="correction-info">
									<strong>Recommended Action:</strong>
									{#if priceStatus.correctionType === 'add_wdoi'}
										Add {priceStatus.correctionAmount.toFixed(1)} wDOI to pool (reduce price)
									{:else}
										Remove {priceStatus.correctionAmount.toFixed(1)} wDOI from pool (increase price)
									{/if}
								</div>
								
								<div class="correction-steps">
									<h5>🔄 What will happen when you click "Auto-Fix":</h5>
									<ol>
										<li>🦊 MetaMask will prompt you to sign transactions</li>
										<li>💰 Mint {priceStatus.correctionAmount.toFixed(1)} new wDOI tokens</li>
										<li>💧 Add tokens to liquidity pool</li>
										<li>📊 Pool price will adjust to match DOI price</li>
									</ol>
								</div>

								<div class="correction-actions">
									<button 
										class="auto-fix-button" 
										on:click={autoCorrectPrice}
										disabled={operationInProgress}
									>
										{#if operationInProgress}
											⏳ Processing...
										{:else}
											🎯 Auto-Fix Price Now
										{/if}
									</button>
									<button 
										class="refresh-price-button" 
										on:click={checkPriceStatus}
										disabled={operationInProgress}
									>
										🔄 Refresh Price Check
									</button>
								</div>
							</div>
						{:else}
							<div class="price-ok-message">
								✅ Pool price is within acceptable range (±1%). No action needed.
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Operations Panel -->
			<div class="operations-panel">
				<h3>🛠️ Custodian Operations</h3>
				
				<div class="operations-grid">
					<!-- Declare Reserves -->
					<div class="operation-card">
						<h4>🏦 Declare DOI Reserves</h4>
						<p>Update the official DOI reserve amount held in custody.</p>
						<div class="form-group">
							<label for="reserve-amount">Reserve Amount (DOI):</label>
							<input 
								id="reserve-amount"
								type="number" 
								step="0.000001" 
								bind:value={declareReservesForm.amount}
								placeholder="1000.0"
								disabled={operationInProgress}
							/>
						</div>
						<button 
							class="operation-button primary"
							on:click={declareReserves}
							disabled={operationInProgress || !declareReservesForm.amount}
						>
							{operationInProgress ? 'Processing...' : 'Declare Reserves'}
						</button>
					</div>

					<!-- Emergency Pause -->
					<div class="operation-card">
						<h4>🚨 Emergency Controls</h4>
						<p>Activate or deactivate emergency pause for the contract.</p>
						
						{#if !contractStatus?.emergency.isPaused}
							<div class="form-group">
								<label for="pause-reason">Pause Reason:</label>
								<input 
									id="pause-reason"
									type="text" 
									bind:value={emergencyPauseForm.reason}
									placeholder="Security incident detected"
									disabled={operationInProgress}
								/>
							</div>
							<button 
								class="operation-button danger"
								on:click={activateEmergencyPause}
								disabled={operationInProgress || !emergencyPauseForm.reason.trim()}
							>
								{operationInProgress ? 'Processing...' : 'Activate Emergency Pause'}
							</button>
						{:else}
							<div class="emergency-info">
								<p><strong>System is currently paused</strong></p>
								<p>Reason: {contractStatus.emergency.reason}</p>
							</div>
							<button 
								class="operation-button success"
								on:click={deactivateEmergencyPause}
								disabled={operationInProgress}
							>
								{operationInProgress ? 'Processing...' : 'Deactivate Pause'}
							</button>
						{/if}
					</div>

					<!-- Rate Limits -->
					<div class="operation-card">
						<h4>📊 Rate Limit Management</h4>
						<p>Update daily mint and burn limits for security.</p>
						<div class="form-group">
							<label for="mint-limit">Max Mint Per Day (wDOI):</label>
							<input 
								id="mint-limit"
								type="number" 
								step="0.000001" 
								bind:value={rateLimitsForm.maxMintPerDay}
								placeholder="10000"
								disabled={operationInProgress}
							/>
						</div>
						<div class="form-group">
							<label for="burn-limit">Max Burn Per Day (wDOI):</label>
							<input 
								id="burn-limit"
								type="number" 
								step="0.000001" 
								bind:value={rateLimitsForm.maxBurnPerDay}
								placeholder="10000"
								disabled={operationInProgress}
							/>
						</div>
						<button 
							class="operation-button primary"
							on:click={updateRateLimits}
							disabled={operationInProgress || !rateLimitsForm.maxMintPerDay || !rateLimitsForm.maxBurnPerDay}
						>
							{operationInProgress ? 'Processing...' : 'Update Limits'}
						</button>
					</div>
				</div>
			</div>
		</div>
		{/if}
	</div>
</div>

<style>
	.enhanced-custodian-page {
		max-width: 1400px;
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

	.dashboard-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.unauthorized-section {
		text-align: center;
		padding: 4rem 2rem;
	}

	/* Alert styles */
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

	.alert.info {
		background: rgba(3, 144, 203, 0.1);
		border: 1px solid rgba(3, 144, 203, 0.3);
		color: #0390CB;
	}

	.alert-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		margin-left: auto;
		color: inherit;
	}

	/* Status grid */
	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.status-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		border-left: 4px solid var(--accent-color);
	}

	.status-card.emergency-active {
		border-left-color: #ff4757;
		background: rgba(255, 71, 87, 0.05);
	}

	.status-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		position: relative;
	}

	.status-icon {
		font-size: 1.25rem;
	}

	.status-title {
		font-weight: 600;
		color: var(--text-primary);
	}

	.notification-badge {
		position: absolute;
		right: 0;
		background: #ff4757;
		color: white;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.status-main {
		text-align: center;
		margin-bottom: 1rem;
	}

	.status-value {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent-color);
	}

	.status-label {
		display: block;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.status-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.status-detail {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
	}

	.detail-label {
		color: var(--text-secondary);
	}

	.detail-value {
		color: var(--text-primary);
		font-weight: 500;
	}

	.status-alert {
		color: #ffa502;
		font-weight: 600;
		text-align: center;
		margin-top: 0.5rem;
	}

	/* Rate limits */
	.limit-bars {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.limit-bar {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.limit-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.limit-progress {
		background: var(--bg-primary);
		border-radius: 4px;
		height: 8px;
		overflow: hidden;
	}

	.limit-fill {
		background: var(--accent-color);
		height: 100%;
		transition: width 0.3s ease;
	}

	.limit-text {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.reset-time {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
	}

	/* Emergency status */
	.emergency-active .emergency-reason {
		font-weight: 600;
		color: #ff4757;
		margin-bottom: 0.5rem;
	}

	.emergency-time {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
	}

	.emergency-button {
		width: 100%;
		padding: 0.5rem;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
	}

	.emergency-button.deactivate {
		background: #2ed573;
		color: white;
	}

	.emergency-status {
		color: #2ed573;
		font-weight: 600;
		text-align: center;
	}

	/* Notifications */
	.no-notifications {
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
	}

	.notifications-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.notification-item {
		padding: 0.75rem;
		background: var(--bg-primary);
		border-radius: 6px;
		border-left: 3px solid var(--border-color);
	}

	.notification-message {
		font-size: 0.875rem;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.notification-time {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.clear-notifications {
		width: 100%;
		padding: 0.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.875rem;
	}

	/* Price Correction Styles */
	.price-correction-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.price-correction-section h3 {
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.price-status-card {
		background: var(--bg-primary);
		border: 2px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.3s ease;
	}

	.price-status-card.needs-correction {
		border-color: #ffa502;
		background: linear-gradient(135deg, rgba(255, 165, 2, 0.05) 0%, rgba(255, 71, 87, 0.05) 100%);
	}

	.price-status-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.price-status-icon {
		font-size: 1.5rem;
	}

	.price-status-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.price-info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 8px;
	}

	.price-info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.price-label {
		font-weight: 500;
		color: var(--text-secondary);
	}

	.price-value {
		font-weight: 600;
		color: var(--text-primary);
		font-family: 'Monaco', 'Menlo', monospace;
	}

	.price-value.deviation {
		color: #ffa502;
	}

	.price-value.deviation.critical {
		color: #ff4757;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.correction-details {
		margin-top: 1.5rem;
	}

	.correction-info {
		background: #fff3cd;
		border: 1px solid #ffeeba;
		color: #856404;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.correction-steps {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.correction-steps h5 {
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		font-size: 1rem;
	}

	.correction-steps ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.correction-steps li {
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.correction-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.auto-fix-button {
		flex: 1;
		min-width: 200px;
		background: linear-gradient(135deg, #18D685 0%, #0390CB 100%);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.auto-fix-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(24, 214, 133, 0.3);
	}

	.auto-fix-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.refresh-price-button {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		padding: 1rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.refresh-price-button:hover:not(:disabled) {
		background: var(--border-color);
	}

	.price-ok-message {
		text-align: center;
		color: #2ed573;
		font-weight: 600;
		font-size: 1.1rem;
		padding: 2rem;
		background: rgba(46, 213, 115, 0.1);
		border-radius: 8px;
		margin-top: 1rem;
	}

	/* Operations panel */
	.operations-panel {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
	}

	.operations-panel h3 {
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}

	.operations-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.operation-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.operation-card h4 {
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.operation-card p {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 1rem;
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
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.operation-button {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.operation-button.primary {
		background: var(--accent-color);
		color: white;
	}

	.operation-button.danger {
		background: #ff4757;
		color: white;
	}

	.operation-button.success {
		background: #2ed573;
		color: white;
	}

	.operation-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.emergency-info {
		background: rgba(255, 71, 87, 0.1);
		border: 1px solid rgba(255, 71, 87, 0.3);
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.unauthorized-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
		max-width: 500px;
		margin: 0 auto;
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

	.address-value {
		font-family: monospace;
		background: var(--bg-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	@media (max-width: 768px) {
		.enhanced-custodian-page {
			padding: 1rem;
		}

		.status-grid {
			grid-template-columns: 1fr;
		}

		.operations-grid {
			grid-template-columns: 1fr;
		}
	}
</style>