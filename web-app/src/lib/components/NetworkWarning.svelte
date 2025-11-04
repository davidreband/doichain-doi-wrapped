<script>
	import { _ } from 'svelte-i18n';
	
	// This will be populated from stores when wallet is connected
	export let visible = true;
	export let networkName = 'SEPOLIA';
	
	let isVisible = true;
	
	function closeWarning() {
		isVisible = false;
	}
</script>

{#if visible && isVisible}
	<div class="network-warning">
		<div class="warning-header">
			<div class="warning-text">
				<span class="warning-icon">⚠️</span>
				<strong>{$_('network.testnetMode')}</strong>
			</div>
			<button class="close-btn" on:click={closeWarning} title="Close">
				✕
			</button>
		</div>
		
		<div class="warning-content">
			{$_('network.connectSepolia')}
		</div>
	</div>
{/if}

<style>
	.network-warning {
		background: #fff3cd;
		color: #856404;
		margin: 1rem 0;
		border: 1px solid #ffeaa7;
		border-radius: 8px;
		font-size: 0.9rem;
		overflow: hidden;
	}
	
	.warning-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.8rem 1rem 0.5rem 1rem;
	}
	
	.warning-text {
		display: flex;
		align-items: center;
	}
	
	.warning-icon {
		margin-right: 0.5rem;
	}
	
	.close-btn {
		background: none;
		border: none;
		color: inherit;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		transition: all 0.2s ease;
		opacity: 0.7;
		line-height: 1;
	}
	
	.close-btn:hover {
		background: rgba(0, 0, 0, 0.1);
		opacity: 1;
	}
	
	.warning-content {
		padding: 0 1rem 1rem 1rem;
		text-align: center;
	}
	
	:global([data-theme="dark"]) .network-warning {
		background: #2d2416;
		color: #f0c674;
		border-color: #5d4e2a;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}
	
	:global([data-theme="dark"]) .close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}
</style>