<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import SwapInterface from '$lib/components/SwapInterface.svelte';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';
	import { walletStore } from '$lib/stores/wallet.js';

	// Check access and redirect if needed (only in browser)
	$: if (typeof window !== 'undefined' && $walletStore && !$walletStore.isLoading) {
		if ($walletStore.isConnected) {
			// User has connected wallet via global state
			if (!$walletStore.isCustodian && !$walletStore.isMerchant && !$walletStore.isAdmin) {
				// No access - redirect to home
				console.log('🚫 Access denied: not custodian, merchant or admin');
				goto('/');
			}
		} else {
			// Wallet disconnected - redirect to home
			console.log('🚫 Access denied: wallet not connected');
			goto('/');
		}
	}

	let showDebugInfo = false;

	onMount(() => {
		console.log('🔄 Direct trading page mounted');
	});
</script>

<svelte:head>
	<title>Direct Trading - Wrapped Doichain</title>
	<meta name="description" content="Direct trading interface for wDOI/USDT with our custom AMM pool." />
</svelte:head>

<div class="direct-page">
	<NetworkWarning />
	
	<div class="page-header">
		<h1>Direct Trading</h1>
		<p class="page-description">
			Trade wDOI/USDT directly through our custom AMM pool. 
			This interface is primarily for testing and development purposes.
		</p>
	</div>

	<div class="trading-section">
		<SwapInterface />
	</div>

	<div class="info-section">
		<div class="info-card">
			<h3>ℹ️ About Direct Trading</h3>
			<ul>
				<li><strong>Custom AMM:</strong> Uses our own liquidity pool contract</li>
				<li><strong>Testing Purpose:</strong> Designed for development and testing</li>
				<li><strong>Limited Liquidity:</strong> May have lower liquidity than Uniswap</li>
				<li><strong>0.3% Fee:</strong> Same fee structure as major DEXes</li>
			</ul>
		</div>

		<div class="info-card">
			<h3>🏦 Transparency & Reserves</h3>
			<p>View detailed information about wDOI backing reserves and system health:</p>
			<div class="external-links">
				<a href="/reserves" class="external-link">
					📊 View Reserves & Transparency
				</a>
			</div>
		</div>

		<div class="info-card">
			<h3>🦄 Prefer Uniswap?</h3>
			<p>For better liquidity and wider ecosystem integration, consider using:</p>
			<div class="external-links">
				<a 
					href="https://app.uniswap.org/#/swap?inputCurrency=0x584d5D62adaa8123E1726777AA6EEa154De6c76f&outputCurrency=0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5&chain=sepolia" 
					target="_blank" 
					rel="noopener noreferrer"
					class="external-link"
				>
					🦄 Trade on Uniswap →
				</a>
				<a 
					href="/"
					class="external-link secondary"
				>
					← Back to Main Page
				</a>
			</div>
		</div>

		<div class="info-card">
			<h3>🔧 Technical Details</h3>
			<ul>
				<li><strong>Pool Contract:</strong> Custom wDOIUSDTPool.sol</li>
				<li><strong>AMM Formula:</strong> x * y = k constant product</li>
				<li><strong>Slippage Protection:</strong> 5% maximum slippage</li>
				<li><strong>Gas Optimization:</strong> Optimized for lower gas costs</li>
			</ul>
		</div>
	</div>

	<!-- Debug Section (moved to bottom) -->
	<div class="debug-section-bottom">
		<button 
			class="debug-toggle-btn" 
			on:click={() => showDebugInfo = !showDebugInfo}
		>
			{showDebugInfo ? '▲ Hide Debug Info' : '▼ Show Debug Info'}
		</button>
		
		{#if showDebugInfo}
			<div class="debug-info">
				<div class="debug-panel">
					<div class="debug-title">📋 Contract Addresses</div>
					<div class="debug-grid">
						<span>wDOI Token:</span> <code class="address-full">0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5</code>
						<span>USDT Token:</span> <code class="address-full">0x584d5D62adaa8123E1726777AA6EEa154De6c76f</code>
						<span>Pool Contract:</span> <code class="address-full">0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C</code>
					</div>
				</div>
				
				<div class="debug-panel">
					<div class="debug-title">🌐 Network Information</div>
					<div class="debug-grid">
						<span>Network:</span> <code>Ethereum Sepolia Testnet</code>
						<span>Chain ID:</span> <code>11155111</code>
						<span>Explorer:</span> <a href="https://sepolia.etherscan.io" target="_blank" class="debug-link">sepolia.etherscan.io →</a>
					</div>
				</div>

				<div class="debug-panel">
					<div class="debug-title">🔧 Technical Details</div>
					<div class="debug-grid">
						<span>AMM Type:</span> <code>Constant Product (x * y = k)</code>
						<span>Fee Structure:</span> <code>0.3% per swap</code>
						<span>Slippage Protection:</span> <code>5% maximum</code>
						<span>Gas Optimization:</span> <code>Enabled</code>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.direct-page {
		max-width: 800px;
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

	.trading-section {
		display: flex;
		justify-content: center;
		margin-bottom: 3rem;
	}

	.info-section {
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
		transition: transform 0.2s ease;
	}

	.info-card:hover {
		transform: translateY(-2px);
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

	.info-card strong {
		color: var(--text-primary);
		font-weight: 600;
	}

	.info-card p {
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.external-links {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.external-link {
		padding: 0.75rem 1rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		text-align: center;
		transition: all 0.2s ease;
		display: inline-block;
	}

	.external-link:not(.secondary) {
		background: var(--accent-color);
		color: white;
		box-shadow: 0 2px 8px rgba(24, 214, 133, 0.3);
	}

	.external-link:not(.secondary):hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(24, 214, 133, 0.4);
	}

	.external-link.secondary {
		background: var(--bg-primary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.external-link.secondary:hover {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}

	@media (max-width: 768px) {
		.direct-page {
			padding: 1rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.info-section {
			grid-template-columns: 1fr;
		}

		.external-links {
			gap: 0.5rem;
		}
	}

	/* Debug Section Styles */
	.debug-section-bottom {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
		text-align: center;
	}

	.debug-toggle-btn {
		background: transparent;
		color: var(--text-secondary);
		border: none;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border-radius: 6px;
		border: 1px solid var(--border-color);
	}

	.debug-toggle-btn:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border-color: var(--accent-color);
	}

	.debug-info {
		margin-top: 1.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
		text-align: left;
		animation: slideDown 0.3s ease-out;
	}

	.debug-panel {
		background: var(--bg-secondary);
		border-radius: 8px;
		padding: 1rem;
		border: 1px solid var(--border-color);
	}

	.debug-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 0.5rem;
	}

	.debug-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem 1rem;
		align-items: center;
	}

	.debug-grid span {
		font-size: 0.8rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.debug-grid code {
		background: var(--bg-primary);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		border: 1px solid var(--border-color);
		color: var(--text-primary);
	}

	.address-full {
		word-break: break-all;
		line-height: 1.3;
	}

	.debug-link {
		color: var(--accent-color);
		text-decoration: none;
		font-size: 0.75rem;
		transition: color 0.2s ease;
	}

	.debug-link:hover {
		color: var(--accent-hover);
		text-decoration: underline;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>