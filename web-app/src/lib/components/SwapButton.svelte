<script>
	import { _ } from 'svelte-i18n';
	
	export let loading = false;
	export let fromAmount = '';
	export let toAmount = '';
	export let isUSDTToWDOI = true;
	export let usdtBalance = 0;
	export let wdoiBalance = 0;
	export let onSwap = () => {};
	
	$: disabled = loading || !fromAmount || !toAmount;
	$: userBalance = isUSDTToWDOI ? usdtBalance : wdoiBalance;
	$: fromToken = isUSDTToWDOI ? 'USDT' : 'wDOI';
	$: toToken = isUSDTToWDOI ? 'wDOI' : 'USDT';
	$: hasInsufficientBalance = fromAmount && parseFloat(fromAmount) > userBalance;
	
	function getButtonText() {
		if (loading) return $_('swap.processing');
		if (!fromAmount) return $_('swap.enterAmount', { values: { token: fromToken } });
		if (hasInsufficientBalance) return $_('swap.insufficientBalance', { values: { token: fromToken } });
		
		return $_('swap.swapButton', { 
			values: { 
				fromAmount, 
				fromToken,
				toAmount: parseFloat(toAmount || 0).toFixed(4),
				toToken
			}
		});
	}
</script>

<button 
	class="swap-btn"
	on:click={onSwap}
	disabled={disabled || hasInsufficientBalance}
>
	{getButtonText()}
</button>

<style>
	.swap-btn {
		width: 100%;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 1rem;
	}
	
	.swap-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--accent-color) 80%, black);
	}
	
	.swap-btn:disabled {
		background: var(--text-secondary);
		cursor: not-allowed;
	}
</style>