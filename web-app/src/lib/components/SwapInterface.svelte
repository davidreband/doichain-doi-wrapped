<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import WalletConnection from './WalletConnection.svelte';
	import SwapForm from './SwapForm.svelte';
	import SwapButton from './SwapButton.svelte';
	import PriceInfo from './PriceInfo.svelte';
	
	// Contract configuration
	const SEPOLIA_CONFIG = {
		chainId: 0xaa36a7,
		chainName: "Sepolia Test Network",
		addresses: {
			WDOI_TOKEN: "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5",
			USDT_TOKEN: "0x584d5D62adaa8123E1726777AA6EEa154De6c76f",
			USDT_POOL: "0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C"
		}
	};
	
	// Component state
	let connected = false;
	let userAddress = '';
	let loading = false;
	let error = '';
	let success = '';
	let chainId = null;
	
	// Token balances
	let usdtBalance = 0;
	let wdoiBalance = 0;
	
	// Swap state
	let isUSDTToWDOI = true;
	let fromAmount = '';
	let toAmount = '';
	
	// Pool information
	let reserveUSDT = 500;
	let reserveWDOI = 500;
	let exchangeRate = '1.000000';
	let priceImpact = '0.00';
	
	// Debug state
	let showDebugInfo = false;
	
	import { getMetaMaskStatus } from '$lib/utils/metamask.js';
	
	// Reactive statements for debugging
	$: {
		console.log('🔄 SwapInterface state changed:', {
			connected,
			userAddress,
			chainId,
			usdtBalance,
			wdoiBalance
		});
	}
	
	$: {
		console.log('🎯 UI will show:', connected ? 'SWAP INTERFACE' : 'CONNECT BUTTON');
	}
	
	onMount(async () => {
		console.log('🚀 SwapInterface mounted');
		
		// Check if user wants to auto-connect (we can use sessionStorage to remember)
		const shouldAutoConnect = sessionStorage.getItem('wallet-auto-connect') === 'true';
		
		if (shouldAutoConnect) {
			const status = await getMetaMaskStatus();
			if (status.connected) {
				console.log('💼 Auto-connecting from saved state');
				handleWalletConnect({ userAddress: status.accounts[0], chainId: status.chainId });
			}
		} else {
			console.log('🚫 Auto-connect disabled - user must manually connect');
		}
	});
	
	async function handleWalletConnect({ userAddress: addr, chainId: chain }) {
		console.log('📥 handleWalletConnect called with:', { addr, chain });
		
		connected = true;
		userAddress = addr;
		chainId = chain;
		
		// Remember that user wants auto-connect
		sessionStorage.setItem('wallet-auto-connect', 'true');
		
		console.log('🔗 Wallet Connected - state updated:', { connected, userAddress, chainId });
		await loadBalances();
		
		success = 'Wallet connected successfully!';
		setTimeout(() => success = '', 3000);
	}
	
	function handleWalletDisconnect() {
		console.log('📤 handleWalletDisconnect called - BEFORE:', { connected, userAddress });
		
		// Disable auto-connect for future page loads
		sessionStorage.setItem('wallet-auto-connect', 'false');
		
		// Force state update by creating new variables
		connected = false;
		userAddress = '';
		chainId = null;
		usdtBalance = 0;
		wdoiBalance = 0;
		fromAmount = '';
		toAmount = '';
		
		console.log('🔌 handleWalletDisconnect - AFTER:', { connected, userAddress, chainId });
	}
	
	function handleSwapDirectionChange(newDirection) {
		isUSDTToWDOI = newDirection;
		calculateSwap();
	}
	
	function handleAmountChange(amount) {
		fromAmount = amount;
		calculateSwap();
	}
	
	function handleMaxClick(amount) {
		fromAmount = amount;
		calculateSwap();
	}
	
	function calculateSwap() {
		if (!fromAmount || isNaN(fromAmount) || parseFloat(fromAmount) <= 0) {
			toAmount = '';
			return;
		}
		
		const inputAmount = parseFloat(fromAmount);
		const rate = isUSDTToWDOI ? reserveWDOI / reserveUSDT : reserveUSDT / reserveWDOI;
		const output = inputAmount * rate * 0.997; // 0.3% fee
		
		toAmount = output.toFixed(6);
		exchangeRate = rate.toFixed(6);
		
		// Simple price impact calculation
		const totalReserve = isUSDTToWDOI ? reserveUSDT : reserveWDOI;
		priceImpact = ((inputAmount / totalReserve) * 100).toFixed(2);
	}
	
	async function loadBalances() {
		if (!connected || !userAddress || chainId !== SEPOLIA_CONFIG.chainId) {
			console.warn('Cannot load balances: not connected or wrong network');
			return;
		}
		
		try {
			// Import ethers dynamically
			const { ethers } = await import('ethers');
			const provider = new ethers.BrowserProvider(window.ethereum);
			
			// ERC20 ABI for balance checking
			const erc20Abi = [
				"function balanceOf(address owner) view returns (uint256)",
				"function decimals() view returns (uint8)"
			];
			
			// Create contract instances
			const usdtContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.USDT_TOKEN, erc20Abi, provider);
			const wdoiContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.WDOI_TOKEN, erc20Abi, provider);
			
			// Get balances
			const [usdtBalanceRaw, wdoiBalanceRaw, usdtDecimals, wdoiDecimals] = await Promise.all([
				usdtContract.balanceOf(userAddress),
				wdoiContract.balanceOf(userAddress),
				usdtContract.decimals(),
				wdoiContract.decimals()
			]);
			
			// Convert to human readable format
			usdtBalance = parseFloat(ethers.formatUnits(usdtBalanceRaw, usdtDecimals));
			wdoiBalance = parseFloat(ethers.formatUnits(wdoiBalanceRaw, wdoiDecimals));
			
			console.log('💰 Token Balances:', {
				usdt: { raw: usdtBalanceRaw.toString(), formatted: usdtBalance, decimals: usdtDecimals },
				wdoi: { raw: wdoiBalanceRaw.toString(), formatted: wdoiBalance, decimals: wdoiDecimals }
			});
			
		} catch (err) {
			console.error('Failed to load balances:', err);
			error = `Failed to load balances: ${err.message}`;
			setTimeout(() => error = '', 5000);
		}
	}

	async function executeSwap() {
		if (!connected || !fromAmount || !toAmount) return;
		
		try {
			loading = true;
			error = '';
			
			// Check network
			if (chainId !== SEPOLIA_CONFIG.chainId) {
				throw new Error('Please switch to Sepolia network');
			}
			
			// Import ethers
			const { ethers } = await import('ethers');
			const provider = new ethers.BrowserProvider(window.ethereum);
			const signer = await provider.getSigner();
			
			// Pool ABI for swap functions
			const poolAbi = [
				"function swapUSDTForWDOI(uint256 usdtAmountIn, uint256 minWDOIOut) external",
				"function swapWDOIForUSDT(uint256 wdoiAmountIn, uint256 minUSDTOut) external",
				"function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256)"
			];
			
			// ERC20 ABI for approve
			const erc20Abi = [
				"function approve(address spender, uint256 amount) external returns (bool)",
				"function allowance(address owner, address spender) external view returns (uint256)",
				"function decimals() external view returns (uint8)"
			];
			
			// Create contract instances
			const poolContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.USDT_POOL, poolAbi, signer);
			
			const inputAmount = parseFloat(fromAmount);
			const expectedOutput = parseFloat(toAmount);
			
			console.log('🔄 Starting swap:', {
				direction: isUSDTToWDOI ? 'USDT -> wDOI' : 'wDOI -> USDT',
				inputAmount,
				expectedOutput,
				inputToken: isUSDTToWDOI ? 'USDT' : 'wDOI',
				outputToken: isUSDTToWDOI ? 'wDOI' : 'USDT'
			});
			
			let inputAmountWei, minOutputWei;
			
			if (isUSDTToWDOI) {
				// USDT -> wDOI: input in 6 decimals, output in 18 decimals
				inputAmountWei = ethers.parseUnits(inputAmount.toString(), 6);
				minOutputWei = ethers.parseEther((expectedOutput * 0.95).toString()); // 5% slippage
				
				const usdtContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.USDT_TOKEN, erc20Abi, signer);
				
				// Check allowance first
				const currentAllowance = await usdtContract.allowance(userAddress, SEPOLIA_CONFIG.addresses.USDT_POOL);
				
				if (currentAllowance < inputAmountWei) {
					console.log('💰 Approving USDT...');
					const approveTx = await usdtContract.approve(SEPOLIA_CONFIG.addresses.USDT_POOL, inputAmountWei);
					success = 'USDT approval submitted...';
					await approveTx.wait();
					console.log('✅ USDT approved');
				}
				
				// Execute swap
				console.log('🔄 Executing USDT → wDOI swap...');
				const swapTx = await poolContract.swapUSDTForWDOI(inputAmountWei, minOutputWei, {
					gasLimit: 300000
				});
				
				success = `Swap transaction submitted: ${swapTx.hash.slice(0, 10)}...`;
				const receipt = await swapTx.wait();
				
				console.log('✅ Swap completed:', receipt.hash);
				success = `Swap successful! You received ${expectedOutput.toFixed(4)} wDOI for ${inputAmount} USDT`;
				
			} else {
				// wDOI -> USDT: input in 18 decimals, output in 6 decimals  
				inputAmountWei = ethers.parseEther(inputAmount.toString());
				const minOutputAmount = (expectedOutput * 0.95).toFixed(6); // Round to 6 decimals for USDT
				minOutputWei = ethers.parseUnits(minOutputAmount, 6); // 5% slippage
				
				const wdoiContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.WDOI_TOKEN, erc20Abi, signer);
				
				// Check allowance first
				const currentAllowance = await wdoiContract.allowance(userAddress, SEPOLIA_CONFIG.addresses.USDT_POOL);
				
				if (currentAllowance < inputAmountWei) {
					console.log('💰 Approving wDOI...');
					const approveTx = await wdoiContract.approve(SEPOLIA_CONFIG.addresses.USDT_POOL, inputAmountWei);
					success = 'wDOI approval submitted...';
					await approveTx.wait();
					console.log('✅ wDOI approved');
				}
				
				// Execute swap
				console.log('🔄 Executing wDOI → USDT swap...');
				const swapTx = await poolContract.swapWDOIForUSDT(inputAmountWei, minOutputWei, {
					gasLimit: 300000
				});
				
				success = `Swap transaction submitted: ${swapTx.hash.slice(0, 10)}...`;
				const receipt = await swapTx.wait();
				
				console.log('✅ Swap completed:', receipt.hash);
				success = `Swap successful! You received ${expectedOutput.toFixed(4)} USDT for ${inputAmount} wDOI`;
			}
			
			// Reset form
			fromAmount = '';
			toAmount = '';
			
			// Reload balances
			await loadBalances();
			
			setTimeout(() => success = '', 10000);
			
		} catch (err) {
			console.error('Swap failed:', err);
			
			// User-friendly error messages based on app.js
			let errorMessage = err.reason || err.message;
			if (errorMessage.includes('user rejected')) {
				errorMessage = 'Transaction was cancelled by user';
			} else if (errorMessage.includes('insufficient funds')) {
				errorMessage = 'Insufficient funds for gas or tokens';
			} else if (errorMessage.includes('Insufficient output amount')) {
				errorMessage = 'Price changed too much. Try again with higher slippage tolerance';
			} else if (errorMessage.includes('Insufficient liquidity')) {
				errorMessage = 'Not enough liquidity in the pool for this trade';
			}
			
			error = `Swap failed: ${errorMessage}`;
			setTimeout(() => error = '', 10000);
		} finally {
			loading = false;
		}
	}
</script>

<div class="swap-container">
	<WalletConnection 
		bind:connected
		bind:userAddress
		bind:chainId
		bind:loading
		onConnect={handleWalletConnect}
		onDisconnect={handleWalletDisconnect}
	/>
	
	{#if connected}
		<div class="swap-interface">
			<SwapForm
				bind:fromAmount
				bind:toAmount
				bind:isUSDTToWDOI
				{usdtBalance}
				{wdoiBalance}
				onSwapDirectionChange={handleSwapDirectionChange}
				onAmountChange={handleAmountChange}
				onMaxClick={handleMaxClick}
			/>
			
			<PriceInfo 
				{exchangeRate}
				{priceImpact}
				{isUSDTToWDOI}
			/>
			
			<SwapButton
				{loading}
				{fromAmount}
				{toAmount}
				{isUSDTToWDOI}
				{usdtBalance}
				{wdoiBalance}
				onSwap={executeSwap}
			/>
		</div>
	{/if}
	
	<!-- Messages -->
	{#if error}
		<div class="error-message">{error}</div>
	{/if}
	
	{#if success}
		<div class="success-message">{success}</div>
	{/if}
	
	{#if loading}
		<div class="loading-overlay">
			<div class="loading-circle"></div>
			<div class="loading-text">{$_('swap.processing')}</div>
		</div>
	{/if}
</div>

<!-- Debug info toggle -->
<div class="debug-toggle">
	<button 
		class="debug-toggle-btn" 
		on:click={() => showDebugInfo = !showDebugInfo}
	>
		{showDebugInfo ? '▲ Debug' : '▼ Debug'}
	</button>
</div>

<!-- Debug info (collapsible) -->
{#if showDebugInfo}
	<div class="debug-info">
		<div class="debug-section">
			<div class="debug-title">Contracts</div>
			<div class="debug-grid">
				<span>wDOI:</span> <code class="address-full">{SEPOLIA_CONFIG.addresses.WDOI_TOKEN}</code>
				<span>USDT:</span> <code class="address-full">{SEPOLIA_CONFIG.addresses.USDT_TOKEN}</code>
				<span>Pool:</span> <code class="address-full">{SEPOLIA_CONFIG.addresses.USDT_POOL}</code>
			</div>
		</div>
		
		<div class="debug-section">
			<div class="debug-title">Network</div>
			<div class="debug-grid">
				<span>Chain:</span> <code>{chainId || 'N/A'}</code>
				<span>Status:</span> <span class="status {connected ? 'connected' : 'disconnected'}">{connected ? 'Connected' : 'Disconnected'}</span>
			</div>
			{#if connected && chainId && SEPOLIA_CONFIG.chainId && chainId !== SEPOLIA_CONFIG.chainId}
				<div class="warning">⚠️ Wrong network</div>
			{/if}
		</div>
		
		{#if connected}
		<div class="debug-section">
			<div class="debug-title">State</div>
			<div class="debug-grid">
				<span>Address:</span> <code class="address-full">{userAddress}</code>
				<span>USDT:</span> <code>{usdtBalance.toFixed(2)}</code>
				<span>wDOI:</span> <code>{wdoiBalance.toFixed(2)}</code>
				<span>Direction:</span> <code>{isUSDTToWDOI ? 'USDT→wDOI' : 'wDOI→USDT'}</code>
			</div>
		</div>
		{/if}
	</div>
{/if}

<style>
	.swap-container {
		max-width: 400px;
		margin: 0 auto;
		position: relative;
		min-height: 200px;
	}
	
	.swap-interface {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}
	
	.debug-toggle {
		margin-top: 1rem;
		text-align: center;
	}
	
	.debug-toggle-btn {
		background: transparent;
		color: var(--text-secondary);
		border: none;
		padding: 0.3rem 0.8rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border-radius: 4px;
	}
	
	.debug-toggle-btn:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}
	
	.debug-info {
		margin-top: 0.5rem;
		padding: 0.8rem;
		font-size: 0.7rem;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border-radius: 6px;
		border: 1px solid var(--border-color);
		animation: slideDown 0.2s ease-out;
	}
	
	.debug-section {
		margin-bottom: 0.8rem;
	}
	
	.debug-section:last-child {
		margin-bottom: 0;
	}
	
	.debug-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.3rem;
		font-size: 0.75rem;
	}
	
	.debug-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.2rem 0.5rem;
		align-items: center;
	}
	
	.debug-grid span {
		font-size: 0.7rem;
	}
	
	.debug-grid code, .address-full {
		background: var(--bg-primary);
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		font-family: 'Courier New', monospace;
		font-size: 0.65rem;
		border: 1px solid var(--border-color);
	}
	
	.address-full {
		word-break: break-all;
		line-height: 1.2;
	}
	
	.status.connected {
		color: #28a745;
		font-weight: 600;
	}
	
	.status.disconnected {
		color: #dc3545;
		font-weight: 600;
	}
	
	.warning {
		color: #dc3545;
		font-weight: 600;
		font-size: 0.7rem;
		margin-top: 0.3rem;
	}
	
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.error-message {
		background: #f8d7da;
		color: #721c24;
		padding: 1rem;
		border-radius: 8px;
		margin-top: 1rem;
		border: 1px solid #f5c6cb;
	}
	
	.success-message {
		background: #d4edda;
		color: #155724;
		padding: 1rem;
		border-radius: 8px;
		margin-top: 1rem;
		border: 1px solid #c3e6cb;
	}
	
	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(11, 62, 116, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		gap: 1.5rem;
		backdrop-filter: blur(8px);
		border-radius: 12px;
		z-index: 10;
	}
	
	.loading-circle {
		width: 50px;
		height: 50px;
		border: 4px solid rgba(24, 214, 133, 0.2);
		border-top: 4px solid #18D685;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		box-shadow: 0 0 20px rgba(24, 214, 133, 0.3);
	}
	
	.loading-text {
		font-size: 1rem;
		font-weight: 500;
		opacity: 0.9;
		text-align: center;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	:global([data-theme="dark"]) .error-message {
		background: #3d2426;
		color: #f8bfc4;
		border-color: #8b3a42;
	}
	
	:global([data-theme="dark"]) .success-message {
		background: #1e3d1e;
		color: #c8e6c8;
		border-color: #2d5a2d;
	}

	:global([data-theme="dark"]) .loading-overlay {
		background: rgba(42, 45, 62, 0.95);
	}
</style>