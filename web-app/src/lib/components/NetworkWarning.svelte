<script>
	import { _ } from 'svelte-i18n';
	import { networkStore } from '$lib/stores/network.js';
	import { walletStore } from '$lib/stores/wallet.js';
	
	export let visible = true;
	export let compact = false;
	export let requiredChainId = 1; // Default to Ethereum Mainnet
	export let alwaysShow = false; // Show even when wallet not connected (for public pages)
	
	// Use store for network info, with fallback to mainnet
	$: networkInfo = $networkStore || { 
		name: 'Ethereum Mainnet', 
		short: 'MAINNET',
		isConnected: false,
		chainId: null
	};
	
	// Check wallet connection state
	$: walletConnected = $walletStore?.isConnected || false;
	
	// Check if the current network matches the required one
	$: isCorrectNetwork = walletConnected && networkInfo.isConnected && networkInfo.chainId === requiredChainId;
	$: isConnectedButWrongNetwork = walletConnected && networkInfo.isConnected && networkInfo.chainId !== requiredChainId;
	$: shouldShow = visible && (
		alwaysShow || // Show always on public pages
		(walletConnected && networkInfo.isConnected) // Show only when connected on private pages
	);
</script>

{#if shouldShow}
	<div class="network-info" class:compact>
		<div class="network-badge" 
			 class:connected={networkInfo.isConnected} 
			 class:correct={isCorrectNetwork}
			 class:wrong={isConnectedButWrongNetwork}>
			<span class="network-indicator">
				{#if isCorrectNetwork}
					✅
				{:else if isConnectedButWrongNetwork}
					⚠️
				{:else if walletConnected && networkInfo.isConnected}
					🟢
				{:else}
					🔗
				{/if}
			</span>
			<span class="network-text">
				{networkInfo.name}
				{#if networkInfo.chainId}
					(ID: {networkInfo.chainId})
				{/if}
			</span>
		</div>
		
		{#if !compact}
			<div class="network-description">
				{$_('network.connectSepolia')}
			</div>
		{/if}
	</div>
{/if}

<style>
	.network-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 1rem 0;
	}
	
	.network-info.compact {
		margin: 0;
	}
	
	.network-badge {
		display: inline-flex;
		align-items: center;
		background: rgba(24, 214, 133, 0.1);
		color: var(--accent-color);
		padding: 0.5rem 1rem;
		border-radius: 20px;
		border: 1px solid rgba(24, 214, 133, 0.2);
		font-weight: 600;
		font-size: 0.875rem;
		gap: 0.5rem;
		transition: all 0.2s ease;
	}
	
	.network-badge:not(.connected) {
		background: rgba(128, 128, 128, 0.1);
		color: var(--text-secondary);
		border-color: rgba(128, 128, 128, 0.2);
	}
	
	.network-badge.correct {
		background: rgba(34, 197, 94, 0.15);
		color: #059669;
		border-color: rgba(34, 197, 94, 0.3);
	}
	
	.network-badge.wrong {
		background: rgba(245, 158, 11, 0.15);
		color: #d97706;
		border-color: rgba(245, 158, 11, 0.3);
	}
	
	.network-indicator {
		font-size: 0.75rem;
	}
	
	.network-text {
		white-space: nowrap;
	}
	
	.network-description {
		margin-top: 0.75rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
		text-align: center;
		max-width: 400px;
	}
	
	.compact .network-description {
		display: none;
	}
	
	:global([data-theme="dark"]) .network-badge {
		background: rgba(24, 214, 133, 0.15);
		border-color: rgba(24, 214, 133, 0.3);
	}
</style>