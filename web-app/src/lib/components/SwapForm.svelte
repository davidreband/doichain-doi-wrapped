<script>
	import { _ } from 'svelte-i18n';
	
	export let fromAmount = '';
	export let toAmount = '';
	export let isUSDTToWDOI = true;
	export let usdtBalance = 0;
	export let wdoiBalance = 0;
	export let onSwapDirectionChange = () => {};
	export let onAmountChange = () => {};
	export let onMaxClick = () => {};
	
	function switchDirection() {
		isUSDTToWDOI = !isUSDTToWDOI;
		fromAmount = '';
		toAmount = '';
		onSwapDirectionChange(isUSDTToWDOI);
	}
	
	function handleInputChange() {
		onAmountChange(fromAmount);
	}
	
	function setMaxAmount() {
		const maxBalance = isUSDTToWDOI ? usdtBalance : wdoiBalance;
		fromAmount = Math.max(0, maxBalance - 0.001).toFixed(4);
		onMaxClick(fromAmount);
	}
</script>

<div class="swap-form">
	<!-- From Token -->
	<div class="swap-card">
		<div class="swap-header">
			<span class="token-symbol {isUSDTToWDOI ? 'usdt-highlight' : ''}">
				{isUSDTToWDOI ? 'USDT' : 'wDOI'}
			</span>
			<span class="token-balance">
				{$_('swap.balance')}: {isUSDTToWDOI ? usdtBalance.toFixed(4) : wdoiBalance.toFixed(4)}
				<button class="max-btn" on:click={setMaxAmount}>
					{$_('swap.max')}
				</button>
			</span>
		</div>
		<input 
			type="number"
			class="amount-input"
			placeholder="0.0"
			bind:value={fromAmount}
			on:input={handleInputChange}
			step="0.0001"
		/>
	</div>
	
	<!-- Switch Button -->
	<div class="swap-arrow">
		<button class="switch-btn" on:click={switchDirection}>
			⇅
		</button>
	</div>
	
	<!-- To Token -->
	<div class="swap-card">
		<div class="swap-header">
			<span class="token-symbol {!isUSDTToWDOI ? 'usdt-highlight' : ''}">
				{isUSDTToWDOI ? 'wDOI' : 'USDT'}
			</span>
			<span class="token-balance">
				{$_('swap.balance')}: {isUSDTToWDOI ? wdoiBalance.toFixed(4) : usdtBalance.toFixed(4)}
			</span>
		</div>
		<input 
			type="number"
			class="amount-input"
			placeholder="0.0"
			value={toAmount}
			readonly
		/>
	</div>
</div>

<style>
	.swap-form {
		margin-bottom: 1rem;
	}
	
	.swap-card {
		background: var(--bg-primary);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 0.5rem;
		border: 1px solid var(--border-color);
	}
	
	.swap-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	
	.token-symbol {
		font-weight: 600;
		font-size: 1.1rem;
	}
	
	.usdt-highlight {
		color: var(--accent-color);
		font-weight: 600;
	}
	
	.token-balance {
		font-size: 0.9rem;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.max-btn {
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.2rem 0.5rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
	
	.amount-input {
		width: 100%;
		border: none;
		background: transparent;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		outline: none;
	}
	
	.amount-input::placeholder {
		color: var(--text-secondary);
	}
	
	.swap-arrow {
		display: flex;
		justify-content: center;
		margin: 0.5rem 0;
	}
	
	.switch-btn {
		background: var(--bg-secondary);
		border: 2px solid var(--accent-color);
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1.2rem;
		font-weight: bold;
		color: var(--accent-color);
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(24, 214, 133, 0.2);
	}
	
	.switch-btn:hover {
		background: var(--accent-color);
		color: white;
		transform: rotate(180deg);
		box-shadow: 0 4px 12px rgba(24, 214, 133, 0.3);
	}
</style>