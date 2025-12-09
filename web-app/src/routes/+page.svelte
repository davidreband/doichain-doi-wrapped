<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';
	import { initNetworkListener, networkStore } from '$lib/stores/network.js';
	import { getApiUrl, API_CONFIG } from '$lib/config/api.js';

	// Network state
	$: isConnectedButWrongNetwork = $networkStore?.isConnected && $networkStore?.chainId !== 1;
	$: isNotConnected = !$networkStore?.isConnected;

	// Live data state with fallback values
	let liveData = {
		price: 0.017,
		volume24h: 45000,
		tvl: 1100000,
		backing: 1.0,
		reserves: 65000
	};
	let dataLoading = true;

	onMount(async () => {
		// Initialize network detection
		initNetworkListener();
		
		// Load live data
		await loadLiveData();
		
		// Update every 5 minutes to be conservative with rate limits
		const interval = setInterval(loadLiveData, 300000);
		return () => clearInterval(interval);
	});

	async function loadLiveData() {
		try {
			dataLoading = true;
			
			// Load both reserves and price data
			const [reservesResponse, priceResponse] = await Promise.all([
				fetch(getApiUrl(API_CONFIG.ENDPOINTS.RESERVES)),
				fetch(getApiUrl(API_CONFIG.ENDPOINTS.PRICE))
			]);
			
			if (reservesResponse.ok && priceResponse.ok) {
				const reservesData = await reservesResponse.json();
				const priceData = await priceResponse.json();
				
				liveData = {
					price: priceData.wdoi.usd, // Real wDOI price (1:1 with DOI)
					volume24h: priceData.exchanges[0]?.volume24h || liveData.volume24h, // Volume from exchanges
					tvl: reservesData.doi.balance * priceData.doi.usd, // Real TVL calculation
					backing: reservesData.backing.ratio,
					reserves: reservesData.doi.balance
				};
			} else if (reservesResponse.status === 429 || priceResponse.status === 429) {
				console.warn('Rate limited - using cached data');
				// Keep existing liveData as fallback
			}
		} catch (error) {
			console.warn('Failed to load live data:', error);
		} finally {
			dataLoading = false;
		}
	}

	function formatNumber(num, decimals = 2) {
		if (num >= 1000000) {
			return `$${(num / 1000000).toFixed(decimals)}M`;
		} else if (num >= 1000) {
			return `$${(num / 1000).toFixed(decimals)}K`;
		}
		return `$${num.toFixed(decimals)}`;
	}

	function formatDOI(num) {
		return new Intl.NumberFormat('en-US').format(num);
	}
</script>

<svelte:head>
	<title>wDOI - Wrapped Doichain | DeFi Bridge to Doichain Network</title>
	<meta name="description" content="Trade Doichain (DOI) on Ethereum DeFi. Fully backed 1:1, transparent reserves, instant swaps on Uniswap." />
	<meta property="og:title" content="wDOI - Wrapped Doichain" />
	<meta property="og:description" content="Bridge Doichain to Ethereum DeFi with 1:1 backing and full transparency." />
</svelte:head>

<div class="home-container">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<h1 class="hero-title">
				<span class="title-main">wDOI</span>
				<span class="title-sub">Wrapped Doichain</span>
			</h1>
			<p class="hero-description">
				Bridge your Doichain (DOI) to Ethereum DeFi. Trade, provide liquidity, and earn yield with fully transparent 1:1 backing.
			</p>
			
			<div class="hero-actions">
				<div class="action-buttons">
					<a 
						href="https://app.uniswap.org/#/swap?inputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&outputCurrency=0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72&chain=mainnet" 
						target="_blank" 
						rel="noopener noreferrer"
						class="cta-button primary"
					>
						🦄 Buy on Uniswap
					</a>
					<button 
						class="cta-button primary metamask-button"
						onclick="window.open('https://portfolio.metamask.io/swap/build-quote?srcChain=1&srcToken=0xdAC17F958D2ee523a2206206994597C13D831ec7&destChain=1&destToken=0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72', '_blank')"
					>
						🦊 Buy in MetaMask
					</button>
				</div>
				<a href="/reserves" class="cta-button secondary">
					📊 View Reserves
				</a>
			</div>
		</div>
	</section>

	<!-- Live Stats -->
	<section class="live-stats">
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-icon">💰</div>
				<div class="stat-content">
					<div class="stat-label">wDOI Price</div>
					<div class="stat-value">${liveData.price.toFixed(4)}</div>
					<div class="stat-note">1:1 with DOI</div>
				</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-icon">📈</div>
				<div class="stat-content">
					<div class="stat-label">24h Volume</div>
					<div class="stat-value">{formatNumber(liveData.volume24h)}</div>
				</div>
			</div>
			
			<div class="stat-card">
				<div class="stat-icon">🏦</div>
				<div class="stat-content">
					<div class="stat-label">TVL</div>
					<div class="stat-value">{formatNumber(liveData.tvl)}</div>
				</div>
			</div>
			
			<div class="stat-card trust">
				<div class="stat-icon">🔒</div>
				<div class="stat-content">
					<div class="stat-label">Backing Ratio</div>
					<div class="stat-value backing-ratio" class:healthy={liveData.backing >= 0.99}>
						{(liveData.backing * 100).toFixed(2)}%
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Quick Actions -->
	<section class="quick-actions">
		<h2>Get Started</h2>
		<div class="actions-grid">
			<div class="action-card primary">
				<div class="action-header">
					<h3>🦄 Uniswap Trading</h3>
					<span class="badge popular">Most Popular</span>
				</div>
				<p>Instantly swap USDT for wDOI on Uniswap. Best rates and deep liquidity.</p>
				<div class="action-stats">
					<span>• 0.3% trading fee</span>
					<span>• Deep liquidity</span>
					<span>• Instant settlement</span>
				</div>
				<a 
					href="https://app.uniswap.org/#/swap?inputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&outputCurrency=0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72&chain=mainnet" 
					target="_blank" 
					class="action-button"
				>
					Trade on Uniswap →
				</a>
			</div>

			<div class="action-card">
				<div class="action-header">
					<h3>🦊 MetaMask Swaps</h3>
					<span class="badge convenient">Convenient</span>
				</div>
				<p>Trade directly in your MetaMask wallet with automatic best price routing.</p>
				<div class="action-stats">
					<span>• Built into MetaMask</span>
					<span>• Best price aggregation</span>
					<span>• No external sites</span>
				</div>
				<button 
					onclick="window.open('https://portfolio.metamask.io/swap/build-quote?srcChain=1&srcToken=0xdAC17F958D2ee523a2206206994597C13D831ec7&destChain=1&destToken=0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72', '_blank')"
					class="action-button secondary"
				>
					Swap in MetaMask →
				</button>
			</div>

			<div class="action-card">
				<div class="action-header">
					<h3>💧 Provide Liquidity</h3>
					<span class="badge earn">Earn Fees</span>
				</div>
				<p>Earn fees by providing liquidity to the wDOI/USDT pool on Uniswap V3.</p>
				<div class="action-stats">
					<span>• ~12% APY</span>
					<span>• Earn trading fees</span>
					<span>• Withdraw anytime</span>
				</div>
				<a href="/custodian/liquidity" class="action-button secondary">
					Add Liquidity →
				</a>
			</div>
		</div>
	</section>

	<!-- Trust & Transparency -->
	<section class="trust-section">
		<h2>Built for Trust</h2>
		<div class="trust-grid">
			<div class="trust-item">
				<div class="trust-icon">🔐</div>
				<h4>1:1 Backing</h4>
				<p>Every wDOI is backed by real DOI held in secure custodial reserves. No fractional reserves.</p>
				<div class="trust-metric">
					<span class="metric-label">DOI Reserves:</span>
					<span class="metric-value">{formatDOI(liveData.reserves)} DOI</span>
				</div>
			</div>
			
			<div class="trust-item">
				<div class="trust-icon">👁️</div>
				<h4>Full Transparency</h4>
				<p>All reserve addresses are public. Real-time proof of reserves updated every block.</p>
				<a href="/reserves" class="trust-link">View Live Reserves →</a>
			</div>
			
			<div class="trust-item">
				<div class="trust-icon">🛡️</div>
				<h4>Battle-Tested</h4>
				<p>Based on the proven WBTC model with institutional-grade security practices.</p>
				<div class="trust-badges">
					<span class="badge">Audited</span>
					<span class="badge">Multi-sig</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Network Status -->
	{#if isConnectedButWrongNetwork}
		<div class="network-alert warning">
			<div class="alert-icon">⚠️</div>
			<div class="alert-content">
				<h4>Wrong Network</h4>
				<p>Please switch to Ethereum Mainnet to use wDOI.</p>
			</div>
		</div>
	{:else if isNotConnected}
		<div class="network-alert info">
			<div class="alert-icon">🔗</div>
			<div class="alert-content">
				<h4>Connect Wallet</h4>
				<p>Connect your wallet to start trading wDOI.</p>
			</div>
		</div>
	{/if}

</div>

<style>
	.home-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Hero Section */
	.hero {
		text-align: center;
		padding: 3rem 0 4rem;
		background: linear-gradient(135deg, rgba(24, 214, 133, 0.05) 0%, rgba(3, 144, 203, 0.05) 100%);
		margin: -2rem -1rem 3rem;
		border-radius: 0 0 2rem 2rem;
	}

	.hero-title {
		margin-bottom: 1rem;
	}

	.title-main {
		display: block;
		font-size: 3.5rem;
		font-weight: 800;
		background: linear-gradient(135deg, #18d685, #0390cb);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.title-sub {
		display: block;
		font-size: 1.5rem;
		color: var(--text-secondary);
		font-weight: 400;
		margin-top: 0.5rem;
	}

	.hero-description {
		font-size: 1.25rem;
		color: var(--text-secondary);
		max-width: 600px;
		margin: 0 auto 2rem;
		line-height: 1.6;
	}

	.hero-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
	}

	.action-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.cta-button {
		padding: 1rem 2rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1.1rem;
		text-decoration: none;
		transition: all 0.2s ease;
		border: none;
		cursor: pointer;
	}

	.cta-button.primary {
		background: linear-gradient(135deg, #18d685, #0390cb);
		color: white;
		box-shadow: 0 4px 15px rgba(24, 214, 133, 0.3);
	}

	.cta-button.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(24, 214, 133, 0.4);
	}

	.cta-button.secondary {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.cta-button.secondary:hover {
		background: var(--bg-primary);
		border-color: var(--accent-color);
		color: var(--accent-color);
	}

	/* Live Stats */
	.live-stats {
		margin-bottom: 4rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.stat-card.trust {
		border-color: var(--accent-color);
		background: linear-gradient(135deg, var(--bg-secondary), rgba(24, 214, 133, 0.05));
	}

	.stat-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.stat-note {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.backing-ratio.healthy {
		color: var(--accent-color);
	}

	/* Quick Actions */
	.quick-actions {
		margin-bottom: 4rem;
	}

	.quick-actions h2 {
		text-align: center;
		color: var(--text-primary);
		margin-bottom: 2rem;
		font-size: 2rem;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.action-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.2s ease;
	}

	.action-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}

	.action-card.primary {
		border-color: var(--accent-color);
		background: linear-gradient(135deg, var(--bg-secondary), rgba(24, 214, 133, 0.05));
	}

	.action-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.action-header h3 {
		margin: 0;
		color: var(--text-primary);
		font-size: 1.125rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge.popular {
		background: var(--accent-color);
		color: white;
	}

	.badge.convenient {
		background: #f97316;
		color: white;
	}

	.badge.earn {
		background: #10b981;
		color: white;
	}

	.action-card p {
		color: var(--text-secondary);
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.action-stats {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1.5rem;
	}

	.action-stats span {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.action-button {
		width: 100%;
		padding: 0.875rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		text-align: center;
		transition: all 0.2s ease;
		background: var(--accent-color);
		color: white;
		display: block;
	}

	.action-button:hover {
		background: #16c577;
		transform: translateY(-1px);
	}

	.action-button.secondary {
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.action-button.secondary:hover {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}

	/* Trust Section */
	.trust-section {
		margin-bottom: 4rem;
		padding: 3rem 2rem;
		background: var(--bg-secondary);
		border-radius: 16px;
		border: 1px solid var(--border-color);
	}

	.trust-section h2 {
		text-align: center;
		color: var(--text-primary);
		margin-bottom: 2rem;
		font-size: 2rem;
	}

	.trust-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.trust-item {
		text-align: center;
	}

	.trust-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.trust-item h4 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}

	.trust-item p {
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 1rem;
	}

	.trust-metric {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 0.75rem;
		margin-top: 1rem;
	}

	.metric-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
		display: block;
	}

	.metric-value {
		color: var(--accent-color);
		font-weight: 600;
		font-size: 1.1rem;
	}

	.trust-link {
		color: var(--accent-color);
		text-decoration: none;
		font-weight: 500;
	}

	.trust-link:hover {
		text-decoration: underline;
	}

	.trust-badges {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.trust-badges .badge {
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}


	/* Network Alerts */
	.network-alert {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-radius: 12px;
		margin: 2rem 0;
		border: 1px solid;
	}

	.network-alert.warning {
		background: rgba(245, 158, 11, 0.1);
		border-color: rgba(245, 158, 11, 0.3);
	}

	.network-alert.info {
		background: rgba(59, 130, 246, 0.1);
		border-color: rgba(59, 130, 246, 0.3);
	}

	.alert-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.alert-content h4 {
		margin: 0 0 0.25rem 0;
		color: var(--text-primary);
		font-size: 1rem;
	}

	.alert-content p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.title-main {
			font-size: 2.5rem;
		}

		.title-sub {
			font-size: 1.125rem;
		}

		.hero-description {
			font-size: 1.125rem;
		}

		.hero-actions {
			flex-direction: column;
			align-items: center;
		}

		.cta-button {
			width: 100%;
			max-width: 300px;
		}

		.actions-grid,
		.trust-grid {
			grid-template-columns: 1fr;
		}

		.action-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.trust-section {
			padding: 2rem 1rem;
		}
	}
</style>