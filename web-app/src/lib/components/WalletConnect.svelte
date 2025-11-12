<script>
	import { walletStore, connectWallet, disconnectWallet } from '$lib/stores/wallet.js';
	import { _ } from 'svelte-i18n';

	let connecting = false;

	async function handleConnect() {
		connecting = true;
		try {
			await connectWallet();
		} catch (error) {
			alert(`Ошибка подключения: ${error.message}`);
		}
		connecting = false;
	}

	function handleDisconnect() {
		disconnectWallet();
	}

	// Format address for display
	function formatAddress(address) {
		if (!address) return '';
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}
</script>

<div class="wallet-connect">
	{#if $walletStore.isConnected}
		<div class="wallet-connected">
			<span class="address" title={$walletStore.address}>
				{formatAddress($walletStore.address)}
			</span>
			<button class="disconnect-btn" on:click={handleDisconnect}>
				Disconnect
			</button>
		</div>
	{:else}
		<button 
			class="connect-btn" 
			on:click={handleConnect} 
			disabled={connecting}
		>
			{#if connecting}
				Connecting...
			{:else}
				Connect Wallet
			{/if}
		</button>
	{/if}
</div>

<style>
	.wallet-connect {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.connect-btn {
		background: var(--accent-color);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.connect-btn:hover {
		background: var(--accent-hover);
	}

	.connect-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.wallet-connected {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 0.5rem;
	}

	.address {
		font-family: monospace;
		font-size: 0.875rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.disconnect-btn {
		background: var(--text-secondary);
		color: white;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.disconnect-btn:hover {
		background: var(--text-primary);
	}

	@media (max-width: 768px) {
		.address {
			font-size: 0.75rem;
		}
		
		.connect-btn {
			font-size: 0.8rem;
			padding: 0.4rem 0.8rem;
		}
	}
</style>