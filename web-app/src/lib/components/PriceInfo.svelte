<script>
	import { _ } from 'svelte-i18n';
	
	export let exchangeRate = '0';
	export let priceImpact = '0.00';
	export let isUSDTToWDOI = true;
</script>

<div class="price-info">
	<div>{$_('swap.rate')}: 1 {isUSDTToWDOI ? 'USDT' : 'wDOI'} = {exchangeRate} {isUSDTToWDOI ? 'wDOI' : 'USDT'}</div>
	<div>{$_('swap.priceImpact')}: {priceImpact}%</div>
	<div>{$_('swap.tradingFee')}: 0.3%</div>
</div>

<style>
	.price-info {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		border: 1px solid var(--border-color);
	}
</style>