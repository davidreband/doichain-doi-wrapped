<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';
	import { initNetworkListener, networkStore } from '$lib/stores/network.js';
	
	// Check if user is on wrong network
	$: isConnectedButWrongNetwork = $networkStore?.isConnected && $networkStore?.chainId !== 1;
	$: isNotConnected = !$networkStore?.isConnected;
	
	onMount(() => {
		// Initialize network detection
		initNetworkListener();
	});
</script>

<svelte:head>
	<title>{$_('trading.title')} - Doichain wDOI</title>
	<meta name="description" content="{$_('trading.subtitle')}" />
</svelte:head>

<div class="home-container">
	<div class="hero-section">
		<h1>{$_('trading.title')}</h1>
		<p class="hero-subtitle">{$_('trading.subtitle')}</p>
		<div class="hero-features">
			<a href="/reserves" class="feature-link">
				<span class="feature">🔒 {$_('trading.doiBacked')}</span>
			</a>
			<a href="/reserves" class="feature-link">
				<span class="feature">👁️ {$_('trading.fullyTransparent')}</span>
			</a>
			<a href="/reserves" class="feature-link">
				<span class="feature">👥 {$_('trading.verifiedMerchants')}</span>
			</a>
		</div>
	</div>

	<!-- Trading Options -->
	<div class="trading-options">
		<div class="option-card primary">
			<div class="option-header">
				<h3>{$_('trading.tradeOnUniswap')}</h3>
				<span class="badge recommended">{$_('trading.recommended')}</span>
			</div>
			<p>{$_('trading.tradeDescription')}</p>
			<div class="option-stats">
				<div class="stat">
					<span class="label">{$_('trading.pool')}</span>
					<span class="value">wDOI/USDT (0.3%)</span>
				</div>
				<div class="stat">
					<span class="label">{$_('trading.required')}</span>
					<span class="value">Ethereum Mainnet</span>
				</div>
				<div class="stat">
					<span class="label">{$_('trading.yourWallet')}</span>
					<span class="value network-status">
						<NetworkWarning compact={true} />
					</span>
				</div>
			</div>
			<a 
				href="https://app.uniswap.org/#/swap?inputCurrency=0xdAC17F958D2ee523a2206206994597C13D831ec7&outputCurrency=0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72&chain=mainnet" 
				target="_blank" 
				rel="noopener noreferrer"
				class="trade-button secondary"
			>
				<span class="button-text-full">{$_('trading.tradeButton')}</span>
				<span class="button-text-short">{$_('trading.tradeButtonShort')}</span>
			</a>
		</div>

	</div>

	<!-- Network Status Alert -->
	{#if isConnectedButWrongNetwork}
		<div class="network-alert warning">
			<div class="alert-icon">⚠️</div>
			<div class="alert-content">
				<h4>{$_('trading.wrongNetwork')}</h4>
				<p>{$_('trading.wrongNetworkDescription', { values: { currentNetwork: $networkStore?.name, requiredNetwork: 'Ethereum Mainnet' } })}</p>
				<p>{$_('trading.switchNetwork')}</p>
			</div>
		</div>
	{:else if isNotConnected}
		<div class="network-alert info">
			<div class="alert-icon">🔗</div>
			<div class="alert-content">
				<h4>{$_('trading.connectWallet')}</h4>
				<p>{$_('trading.connectWalletDescription', { values: { requiredNetwork: 'Ethereum Mainnet' } })}</p>
			</div>
		</div>
	{/if}

	<!-- Integration Info -->
	<div class="integration-info">
		<h2>{$_('trading.whereToFind')}</h2>
		<div class="integration-grid">
			<div class="integration-item">
				<div class="integration-icon">📱</div>
				<h4>{$_('trading.metamaskSwaps')}</h4>
				<p>{$_('trading.metamaskDescription')}</p>
			</div>
			<div class="integration-item">
				<div class="integration-icon">🦄</div>
				<h4>{$_('trading.uniswapV3')}</h4>
				<p>{$_('trading.uniswapDescription')}</p>
			</div>
			<div class="integration-item">
				<div class="integration-icon">🔗</div>
				<h4>{$_('trading.erc20Compatible')}</h4>
				<p>{$_('trading.erc20Description')}</p>
			</div>
		</div>
	</div>
</div>

<style>
	.home-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 1rem;
	}
	
	.hero-section {
		text-align: center;
		margin-bottom: 3rem;
	}
	
	.hero-section h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		background: var(--gradient-brand);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-weight: 700;
	}
	
	.hero-subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}

	.hero-features {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.feature {
		background: rgba(24, 214, 133, 0.1);
		color: var(--accent-color);
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
		border: 1px solid rgba(24, 214, 133, 0.2);
		display: inline-block;
	}

	.feature-link {
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.feature-link:hover .feature {
		background: rgba(24, 214, 133, 0.2);
		border-color: rgba(24, 214, 133, 0.4);
		transform: translateY(-2px);
		cursor: pointer;
	}

	.feature-link:active .feature {
		transform: translateY(0);
	}

	.trading-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.option-card {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
		transition: all 0.2s ease;
	}

	.option-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}

	.option-card.primary {
		border-color: var(--accent-color);
		background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(24, 214, 133, 0.05) 100%);
	}

	.option-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.option-header h3 {
		margin: 0;
		color: var(--text-primary);
		font-size: 1.25rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.badge.recommended {
		background: var(--accent-color);
		color: white;
	}


	.option-card p {
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 1rem;
	}

	.option-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.stat {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.stat .label {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.stat .value {
		color: var(--text-primary);
		font-weight: 500;
		font-size: 0.875rem;
	}

	.network-status {
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}

	.trade-button {
		width: 100%;
		padding: 1rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none !important;
		display: inline-block;
		text-align: center;
		box-sizing: border-box;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.trade-button:hover,
	.trade-button:focus,
	.trade-button:active,
	.trade-button:visited {
		text-decoration: none;
	}


	.button-text-short {
		display: none;
	}

	.button-text-full {
		display: inline;
	}

	.trade-button.secondary {
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.trade-button.secondary:hover {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
		transform: translateY(-1px);
	}


	.integration-info {
		text-align: center;
		margin-bottom: 2rem;
	}

	.integration-info h2 {
		color: var(--text-primary);
		margin-bottom: 2rem;
		font-size: 1.75rem;
	}

	.integration-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.integration-item {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
		transition: transform 0.2s ease;
	}

	.integration-item:hover {
		transform: translateY(-2px);
	}

	.integration-icon {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.integration-item h4 {
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		font-size: 1.125rem;
	}

	.integration-item p {
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
	}

	.network-alert {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.25rem;
		border-radius: 12px;
		margin: 2rem 0;
		border: 1px solid;
	}

	.network-alert.warning {
		background: rgba(245, 158, 11, 0.1);
		border-color: rgba(245, 158, 11, 0.2);
	}

	.network-alert.info {
		background: rgba(59, 130, 246, 0.1);
		border-color: rgba(59, 130, 246, 0.2);
	}

	.alert-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.alert-content h4 {
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.alert-content p {
		color: var(--text-secondary);
		margin: 0 0 0.5rem 0;
		line-height: 1.5;
	}

	.alert-content p:last-child {
		margin-bottom: 0;
	}
	
	@media (max-width: 768px) {
		.hero-section h1 {
			font-size: 2rem;
		}
		
		.hero-subtitle {
			font-size: 1rem;
		}

		.trading-options {
			grid-template-columns: 1fr;
		}

		.integration-grid {
			grid-template-columns: 1fr;
		}

		.option-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.trade-button {
			font-size: 0.9rem;
			padding: 0.9rem;
			line-height: 1.2;
		}

		.option-card {
			padding: 1.25rem;
		}

		.button-text-full {
			display: none;
		}

		.button-text-short {
			display: inline;
		}

		.network-alert {
			padding: 1rem;
			margin: 1.5rem 0;
			gap: 0.75rem;
		}

		.alert-icon {
			font-size: 1.25rem;
		}

		.alert-content h4 {
			font-size: 1rem;
		}

		.alert-content p {
			font-size: 0.9rem;
		}
	}
</style>