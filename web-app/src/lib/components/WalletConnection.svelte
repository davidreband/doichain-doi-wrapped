<script>
	import { _ } from 'svelte-i18n';
	import { connectMetaMask, getMetaMaskStatus, clearMetaMaskConnection } from '$lib/utils/metamask.js';
	
	export let connected = false;
	export let userAddress = '';
	export let chainId = null;
	export let loading = false;
	export let onConnect = () => {};
	export let onDisconnect = () => {};
	
	const SEPOLIA_CONFIG = {
		chainId: 0xaa36a7,
		chainName: "Sepolia Test Network"
	};
	
	async function handleConnect() {
		try {
			loading = true;
			
			const accounts = await connectMetaMask();
			userAddress = accounts[0];
			
			// Get chain ID
			if (window.ethereum) {
				chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
			}
			
			connected = true;
			onConnect({ userAddress, chainId });
			
		} catch (err) {
			console.error('Connection failed:', err);
		} finally {
			loading = false;
		}
	}
	
	function handleDisconnect() {
		console.log('Disconnect button clicked', { currentConnected: connected });
		
		// Clear MetaMask connection state
		clearMetaMaskConnection();
		
		// IMMEDIATELY update local state to trigger UI change
		connected = false;
		userAddress = '';
		chainId = null;
		
		console.log('Local state updated', { connected, userAddress, chainId });
		
		// Notify parent component
		onDisconnect();
		
		console.log('Parent notified - should see UI change now');
		
		// Ask if user wants full reload for complete disconnect
		setTimeout(() => {
			if (confirm('Reload page for complete MetaMask disconnect?')) {
				location.reload();
			}
		}, 500);
	}
</script>

<div class="wallet-section">
	{#if !connected}
		<button 
			class="connect-btn"
			on:click={handleConnect}
			disabled={loading}
		>
			{#if loading}
				Connecting...
			{:else}
				{$_('swap.connectWallet')}
			{/if}
		</button>
	{:else}
		<div class="wallet-info">
			<div class="wallet-address">
				{userAddress.slice(0, 6)}...{userAddress.slice(-4)}
				<button class="disconnect-btn" on:click={handleDisconnect}>
					{$_('swap.disconnect')}
				</button>
			</div>
			{#if connected && chainId !== SEPOLIA_CONFIG.chainId}
				<div class="network-warning">
					⚠️ Wrong network! Please switch to Sepolia
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.wallet-section {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.connect-btn {
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.connect-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent-color) 80%, black);
		transform: translateY(-1px);
	}
	
	.connect-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
	
	.wallet-info {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}
	
	.wallet-address {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: monospace;
		font-size: 1.1rem;
	}
	
	.disconnect-btn {
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		cursor: pointer;
	}
	
	.network-warning {
		margin-top: 1rem;
		padding: 0.5rem;
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffeaa7;
		border-radius: 6px;
		font-size: 0.9rem;
	}
	
	:global([data-theme="dark"]) .network-warning {
		background: #3d2f00;
		color: #ffeb3b;
		border-color: #665c00;
	}
</style>