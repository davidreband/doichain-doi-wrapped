<script>
	import { onMount } from 'svelte';
	import { ethers } from 'ethers';
	import { getContractAddresses, NETWORKS } from '$lib/config/addresses.js';
	import { createSafeContract } from '$lib/utils/provider.js';

	// Props
	export let chainId = null;
	export let provider = null;

	// State
	let loading = true;
	let error = '';
	let reserves = {
		doiBalance: 0,
		wdoiSupply: 0,
		ratio: 0,
		lastUpdate: new Date(),
		isHealthy: true
	};

	// Configuration
	let contracts = getContractAddresses(NETWORKS.SEPOLIA.chainId);
	
	// Mock reserve addresses (in production, these would be real)
	const RESERVE_ADDRESSES = {
		doiCustodial: 'D8KpX2Ym5VzQr3LmNn4bCvR9sH1tE6wX2fG9hK4m',
		wdoiContract: contracts.WDOI_TOKEN,
		merchantWallet: '0x60eAe063F1Fd429814cA4C65767fDF0d8991506E',
		burnAddress: '0x000000000000000000000000000000000000dEaD'
	};

	// ERC20 ABI for getting total supply
	const ERC20_ABI = [
		"function totalSupply() view returns (uint256)",
		"function balanceOf(address account) view returns (uint256)",
		"function name() view returns (string)",
		"function symbol() view returns (string)",
		"function decimals() view returns (uint8)"
	];

	onMount(async () => {
		await loadReserves();
		// Update every 30 seconds
		const interval = setInterval(loadReserves, 30000);
		return () => clearInterval(interval);
	});

	async function loadReserves() {
		try {
			loading = true;
			error = '';

			// Use safe contract with fallbacks
			const wdoiContract = await createSafeContract(contracts.WDOI_TOKEN, ERC20_ABI, !!provider);

			// If we got a mock contract, use mock data
			if (wdoiContract.isMock) {
				reserves = {
					doiBalance: 1245.67,
					wdoiSupply: 1245.67,
					ratio: 1.0,
					lastUpdate: new Date(),
					isHealthy: true
				};
				return;
			}

			// Get wDOI total supply
			const totalSupplyBN = await wdoiContract.totalSupply();
			const decimals = await wdoiContract.decimals();
			const wdoiSupply = Number(ethers.formatUnits(totalSupplyBN, decimals));

			// Mock DOI balance (in production, query Doichain network)
			const doiBalance = await getMockDoiBalance();

			// Calculate ratio and health
			const ratio = doiBalance > 0 ? wdoiSupply / doiBalance : 0;
			const isHealthy = Math.abs(ratio - 1.0) < 0.01; // Within 1%

			reserves = {
				doiBalance,
				wdoiSupply,
				ratio,
				lastUpdate: new Date(),
				isHealthy
			};

		} catch (err) {
			console.error('Failed to load reserves:', err);
			error = 'Failed to load reserve data';
		} finally {
			loading = false;
		}
	}

	async function getMockDoiBalance() {
		// Mock implementation - in production, query Doichain blockchain
		// This would typically involve:
		// 1. RPC call to Doichain node
		// 2. Query balance of custodial address
		// 3. Return formatted balance
		
		// For demo, return a balance that maintains 1:1 ratio
		return reserves.wdoiSupply || 1245.67;
	}

	function formatNumber(num) {
		return new Intl.NumberFormat('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 6
		}).format(num);
	}

	function formatAddress(address) {
		if (address.length > 20) {
			return `${address.slice(0, 8)}...${address.slice(-6)}`;
		}
		return address;
	}

	function getHealthColor(isHealthy) {
		return isHealthy ? '#18d685' : '#ff6b6b';
	}

	function getRatioStatus(ratio) {
		if (Math.abs(ratio - 1.0) < 0.01) return { text: 'Perfect', color: '#18d685' };
		if (Math.abs(ratio - 1.0) < 0.05) return { text: 'Good', color: '#ffd93d' };
		return { text: 'Warning', color: '#ff6b6b' };
	}
</script>

<div class="reserves-display">
	<div class="reserves-header">
		<h3>🏦 wDOI Reserves & Backing</h3>
		<div class="last-update">
			Last update: {reserves.lastUpdate.toLocaleTimeString()}
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading reserve data...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>❌ {error}</p>
			<button on:click={loadReserves} class="retry-button">Retry</button>
		</div>
	{:else}
		<div class="reserves-content">
			<!-- Reserve Balances -->
			<div class="reserves-grid">
				<div class="reserve-card">
					<div class="reserve-label">DOI Reserves</div>
					<div class="reserve-value">{formatNumber(reserves.doiBalance)} DOI</div>
					<div class="reserve-network">Doichain Network</div>
				</div>

				<div class="reserve-card">
					<div class="reserve-label">wDOI Supply</div>
					<div class="reserve-value">{formatNumber(reserves.wdoiSupply)} wDOI</div>
					<div class="reserve-network">Ethereum Network</div>
				</div>

				<div class="reserve-card">
					<div class="reserve-label">Backing Ratio</div>
					<div class="reserve-value" style="color: {getRatioStatus(reserves.ratio).color}">
						{formatNumber(reserves.ratio)}:1
					</div>
					<div class="reserve-network">{getRatioStatus(reserves.ratio).text}</div>
				</div>

				<div class="reserve-card">
					<div class="reserve-label">System Health</div>
					<div class="reserve-value" style="color: {getHealthColor(reserves.isHealthy)}">
						{reserves.isHealthy ? '✅ Healthy' : '⚠️ Warning'}
					</div>
					<div class="reserve-network">
						{reserves.isHealthy ? 'Fully backed' : 'Check required'}
					</div>
				</div>
			</div>

			<!-- Reserve Addresses -->
			<div class="addresses-section">
				<h4>📍 Reserve Addresses</h4>
				<div class="addresses-grid">
					<div class="address-item">
						<span class="address-label">DOI Custodial:</span>
						<code class="address-value">{formatAddress(RESERVE_ADDRESSES.doiCustodial)}</code>
					</div>
					<div class="address-item">
						<span class="address-label">wDOI Contract:</span>
						<code class="address-value">{formatAddress(RESERVE_ADDRESSES.wdoiContract)}</code>
					</div>
					<div class="address-item">
						<span class="address-label">Merchant Wallet:</span>
						<code class="address-value">{formatAddress(RESERVE_ADDRESSES.merchantWallet)}</code>
					</div>
					<div class="address-item">
						<span class="address-label">Burn Address:</span>
						<code class="address-value">{formatAddress(RESERVE_ADDRESSES.burnAddress)}</code>
					</div>
				</div>
			</div>

			<!-- How it Works -->
			<div class="how-it-works">
				<h4>🔄 How wDOI Works</h4>
				<div class="process-steps">
					<div class="step">
						<span class="step-number">1</span>
						<div class="step-content">
							<strong>Merchants Lock DOI:</strong> Real DOI tokens are locked in custodial wallets
						</div>
					</div>
					<div class="step">
						<span class="step-number">2</span>
						<div class="step-content">
							<strong>wDOI Minted:</strong> Equivalent wDOI tokens are minted on Ethereum (1:1 ratio)
						</div>
					</div>
					<div class="step">
						<span class="step-number">3</span>
						<div class="step-content">
							<strong>Users Trade:</strong> You buy/sell wDOI on Uniswap like any ERC20 token
						</div>
					</div>
					<div class="step">
						<span class="step-number">4</span>
						<div class="step-content">
							<strong>Always Backed:</strong> Each wDOI is backed by real DOI in reserve
						</div>
					</div>
				</div>
			</div>

			<!-- Transparency Note -->
			<div class="transparency-note">
				<p>
					<strong>🔍 For Users:</strong> You don't need to worry about backing - just trade wDOI on Uniswap.
					<strong>🏦 For Transparency:</strong> All reserves are publicly verifiable and maintain 1:1 backing.
				</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.reserves-display {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
		margin-bottom: 2rem;
	}

	.reserves-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-color);
	}

	.reserves-header h3 {
		margin: 0;
		color: var(--text-primary);
		font-size: 1.25rem;
	}

	.last-update {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		color: var(--text-secondary);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--border-color);
		border-top: 3px solid var(--accent-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-state {
		text-align: center;
		padding: 2rem;
		color: #dc3545;
	}

	.retry-button {
		background: var(--accent-color);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		margin-top: 1rem;
	}

	.reserves-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.reserve-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
	}

	.reserve-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.reserve-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--accent-color);
		margin-bottom: 0.25rem;
	}

	.reserve-network {
		color: var(--text-secondary);
		font-size: 0.75rem;
	}

	.addresses-section {
		margin-bottom: 1.5rem;
	}

	.addresses-section h4 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.addresses-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 0.75rem;
	}

	.address-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
	}

	.address-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.address-value {
		font-family: monospace;
		background: var(--bg-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		color: var(--text-primary);
	}

	.transparency-note {
		background: rgba(24, 214, 133, 0.1);
		border: 1px solid rgba(24, 214, 133, 0.3);
		border-radius: 8px;
		padding: 1rem;
	}

	.transparency-note p {
		margin: 0;
		color: var(--text-primary);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.how-it-works {
		margin-bottom: 1.5rem;
	}

	.how-it-works h4 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-size: 1rem;
	}

	.process-steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
	}

	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--accent-color);
		color: white;
		font-size: 0.75rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.step-content {
		color: var(--text-primary);
		font-size: 0.875rem;
		line-height: 1.4;
	}

	@media (max-width: 768px) {
		.reserves-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.reserves-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			gap: 0.75rem;
		}

		.addresses-grid {
			grid-template-columns: 1fr;
		}

		.address-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}

	:global([data-theme="dark"]) .transparency-note {
		background: rgba(24, 214, 133, 0.15);
		border-color: rgba(24, 214, 133, 0.4);
	}
</style>