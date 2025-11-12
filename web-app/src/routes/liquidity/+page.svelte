<script>
	import { onMount } from 'svelte';
	import { _, json } from 'svelte-i18n';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';
	import { initNetworkListener } from '$lib/stores/network.js';
	import { getContractAddresses, NETWORKS } from '$lib/config/addresses.js';

	// Pool address for mainnet - this should be verified/updated for actual mainnet deployment
	const UNISWAP_POOL_ADDRESS = "0xa23e7d3FF97A989B3f09B4Ea8b64A5f104e8721B"; // Current Sepolia address - needs mainnet verification

	onMount(() => {
		console.log('🏊 Liquidity page mounted');
		// Initialize network detection
		initNetworkListener();
	});
</script>

<svelte:head>
	<title>{$_('liquidity.title')} - Wrapped Doichain</title>
	<meta name="description" content="{$_('liquidity.description')}" />
</svelte:head>

<div class="liquidity-page">
	<div class="page-header">
		<h1>{$_('liquidity.pageTitle')}</h1>
		<p class="page-description">
			{$_('liquidity.description')}
		</p>
	</div>

	<!-- Liquidity Options -->
	<div class="liquidity-options">
		<div class="option-card primary">
			<div class="option-header">
				<h3>{$_('liquidity.uniswapV3Pool')}</h3>
				<span class="badge recommended">{$_('liquidity.recommended')}</span>
			</div>
			<p>{$_('liquidity.uniswapDescription')}</p>
			<div class="option-stats">
				<div class="stat">
					<span class="label">{$_('liquidity.poolAddress')}</span>
					<div class="pool-address-container">
						<code class="pool-address">{UNISWAP_POOL_ADDRESS.slice(0, 8)}...{UNISWAP_POOL_ADDRESS.slice(-6)}</code>
						<button 
							on:click={() => navigator.clipboard.writeText(UNISWAP_POOL_ADDRESS)}
							class="copy-btn"
							title="Copy full address"
						>📋</button>
					</div>
				</div>
				<div class="stat">
					<span class="label">{$_('liquidity.feeTier')}</span>
					<span class="value">0.3%</span>
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
				<div class="stat">
					<span class="label">{$_('liquidity.status')}</span>
					<span class="value active">{$_('liquidity.active')}</span>
				</div>
			</div>
			<a 
				href="https://app.uniswap.org/#/add/0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72/0xdAC17F958D2ee523a2206206994597C13D831ec7/3000?chain=mainnet" 
				target="_blank" 
				rel="noopener noreferrer"
				class="trade-button primary"
			>
				{$_('liquidity.addLiquidityButton')}
			</a>
		</div>

	</div>


	<div class="info-cards">
		<div class="info-card">
			<h3>{$_('liquidity.howItWorks')}</h3>
			<ul>
				{#each $json('liquidity.howItWorksSteps') as step}
					<li>{step}</li>
				{/each}
			</ul>
		</div>

		<div class="info-card">
			<h3>{$_('liquidity.importantNotes')}</h3>
			<ul>
				{#each $json('liquidity.importantNotesItems') as note}
					<li>{@html note}</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

<style>
	.liquidity-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		background: var(--gradient-brand);
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

	.liquidity-options {
		display: flex;
		justify-content: center;
		margin-bottom: 3rem;
	}

	.option-card {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
		transition: all 0.2s ease;
		width: 100%;
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

	.stat .value.active {
		color: #28a745;
		font-weight: 600;
	}

	.network-status {
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}

	.pool-address-container {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.pool-address {
		font-family: monospace;
		font-size: 0.75rem;
		background: var(--bg-primary);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		border: 1px solid var(--border-color);
		color: var(--text-primary);
	}

	.copy-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.15rem;
		border-radius: 3px;
		color: var(--text-secondary);
		transition: all 0.2s ease;
		font-size: 0.75rem;
		line-height: 1;
	}

	.copy-btn:hover {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
		transform: translateY(-1px);
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
		text-decoration: none;
		display: inline-block;
		text-align: center;
		box-sizing: border-box;
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trade-button.primary {
		background: var(--accent-color);
		color: white;
		box-shadow: 0 4px 12px rgba(24, 214, 133, 0.3);
	}

	.trade-button.primary:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(24, 214, 133, 0.4);
	}


	.info-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.info-card {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.info-card h3 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.info-card ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.info-card li {
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
		padding-left: 1.5rem;
		position: relative;
		line-height: 1.5;
	}

	.info-card li:last-child {
		margin-bottom: 0;
	}

	.info-card li::before {
		content: '•';
		color: var(--accent-color);
		font-weight: bold;
		position: absolute;
		left: 0;
	}


	@media (max-width: 768px) {
		.liquidity-page {
			padding: 0 1rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.liquidity-options {
			grid-template-columns: 1fr;
		}

		.info-cards {
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
		}

		.pool-address {
			font-size: 0.7rem;
		}
	}
</style>