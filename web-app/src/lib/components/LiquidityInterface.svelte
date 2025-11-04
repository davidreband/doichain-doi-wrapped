<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import WalletConnection from './WalletConnection.svelte';
	import { getMetaMaskStatus } from '$lib/utils/metamask.js';

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
	let lpBalance = 0;

	// Pool information
	let reserveUSDT = 500;
	let reserveWDOI = 500;
	let totalLPSupply = 1000;
	let wdoiPrice = '1.000000';

	// Liquidity operation state
	let isAddLiquidity = true;
	let wdoiAmount = '';
	let usdtAmount = '';
	let lpAmount = '';
	let slippageTolerance = 1; // 1%

	// Price impact calculation
	let priceImpact = '0.00';

	onMount(async () => {
		console.log('🏊 LiquidityInterface mounted');
		
		const shouldAutoConnect = sessionStorage.getItem('wallet-auto-connect') === 'true';
		
		if (shouldAutoConnect) {
			const status = await getMetaMaskStatus();
			if (status.connected) {
				console.log('💼 Auto-connecting from saved state');
				handleWalletConnect({ userAddress: status.accounts[0], chainId: status.chainId });
			}
		}
	});

	async function handleWalletConnect({ userAddress: addr, chainId: chain }) {
		console.log('📥 handleWalletConnect called with:', { addr, chain });
		
		connected = true;
		userAddress = addr;
		chainId = chain;
		
		sessionStorage.setItem('wallet-auto-connect', 'true');
		
		console.log('🔗 Wallet Connected - state updated:', { connected, userAddress, chainId });
		await loadBalances();
		await loadPoolInfo();
		
		success = 'Wallet connected successfully!';
		setTimeout(() => success = '', 3000);
	}

	function handleWalletDisconnect() {
		console.log('📤 handleWalletDisconnect called');
		
		sessionStorage.setItem('wallet-auto-connect', 'false');
		
		connected = false;
		userAddress = '';
		chainId = null;
		usdtBalance = 0;
		wdoiBalance = 0;
		lpBalance = 0;
		wdoiAmount = '';
		usdtAmount = '';
		lpAmount = '';
	}

	async function loadBalances() {
		if (!connected || !userAddress || chainId !== SEPOLIA_CONFIG.chainId) {
			console.warn('Cannot load balances: not connected or wrong network');
			return;
		}
		
		try {
			const { ethers } = await import('ethers');
			const provider = new ethers.BrowserProvider(window.ethereum);
			
			const erc20Abi = [
				"function balanceOf(address owner) view returns (uint256)",
				"function decimals() view returns (uint8)"
			];

			const poolAbi = [
				"function balanceOf(address owner) view returns (uint256)"
			];
			
			const usdtContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.USDT_TOKEN, erc20Abi, provider);
			const wdoiContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.WDOI_TOKEN, erc20Abi, provider);
			const poolContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.USDT_POOL, poolAbi, provider);
			
			const [usdtBalanceRaw, wdoiBalanceRaw, lpBalanceRaw, usdtDecimals, wdoiDecimals] = await Promise.all([
				usdtContract.balanceOf(userAddress),
				wdoiContract.balanceOf(userAddress),
				poolContract.balanceOf(userAddress),
				usdtContract.decimals(),
				wdoiContract.decimals()
			]);
			
			usdtBalance = parseFloat(ethers.formatUnits(usdtBalanceRaw, usdtDecimals));
			wdoiBalance = parseFloat(ethers.formatUnits(wdoiBalanceRaw, wdoiDecimals));
			lpBalance = parseFloat(ethers.formatEther(lpBalanceRaw));
			
			console.log('💰 Token Balances:', { usdt: usdtBalance, wdoi: wdoiBalance, lp: lpBalance });
			
		} catch (err) {
			console.error('Failed to load balances:', err);
			error = `Failed to load balances: ${err.message}`;
			setTimeout(() => error = '', 5000);
		}
	}

	async function loadPoolInfo() {
		if (!connected || chainId !== SEPOLIA_CONFIG.chainId) return;

		try {
			const { ethers } = await import('ethers');
			const provider = new ethers.BrowserProvider(window.ethereum);

			const poolAbi = [
				"function getPoolInfo() external view returns (uint256, uint256, uint256, uint256, uint256, uint256)"
			];

			const poolContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.USDT_POOL, poolAbi, provider);
			const poolInfo = await poolContract.getPoolInfo();

			reserveWDOI = parseFloat(ethers.formatEther(poolInfo[0]));
			reserveUSDT = parseFloat(ethers.formatUnits(poolInfo[1], 6));
			totalLPSupply = parseFloat(ethers.formatEther(poolInfo[2]));
			wdoiPrice = parseFloat(ethers.formatUnits(poolInfo[3], 18)).toFixed(6);

			console.log('🏊 Pool Info:', { reserveWDOI, reserveUSDT, totalLPSupply, wdoiPrice });

		} catch (err) {
			console.error('Failed to load pool info:', err);
		}
	}

	function calculateLiquidity() {
		if (isAddLiquidity) {
			calculateAddLiquidity();
		} else {
			calculateRemoveLiquidity();
		}
	}

	function calculateAddLiquidity() {
		if (!wdoiAmount && !usdtAmount) {
			return;
		}

		const wdoiInput = parseFloat(wdoiAmount) || 0;
		const usdtInput = parseFloat(usdtAmount) || 0;

		if (totalLPSupply === 0) {
			// First liquidity addition
			if (wdoiInput > 0 && usdtInput > 0) {
				const lpTokens = Math.sqrt(wdoiInput * usdtInput);
				priceImpact = '0.00';
				console.log('First liquidity:', { wdoiInput, usdtInput, lpTokens });
			}
		} else {
			// Proportional addition
			if (wdoiInput > 0 && reserveWDOI > 0) {
				const requiredUSDT = (wdoiInput * reserveUSDT) / reserveWDOI;
				if (!usdtAmount || Math.abs(parseFloat(usdtAmount) - requiredUSDT) > 0.01) {
					usdtAmount = requiredUSDT.toFixed(6);
				}
			} else if (usdtInput > 0 && reserveUSDT > 0) {
				const requiredWDOI = (usdtInput * reserveWDOI) / reserveUSDT;
				if (!wdoiAmount || Math.abs(parseFloat(wdoiAmount) - requiredWDOI) > 0.01) {
					wdoiAmount = requiredWDOI.toFixed(6);
				}
			}

			// Calculate price impact
			if (wdoiInput > 0 && reserveWDOI > 0) {
				priceImpact = ((wdoiInput / reserveWDOI) * 100).toFixed(2);
			}
		}
	}

	function calculateRemoveLiquidity() {
		const lpInput = parseFloat(lpAmount) || 0;
		
		if (lpInput > 0 && totalLPSupply > 0) {
			const wdoiOut = (lpInput * reserveWDOI) / totalLPSupply;
			const usdtOut = (lpInput * reserveUSDT) / totalLPSupply;
			
			wdoiAmount = wdoiOut.toFixed(6);
			usdtAmount = usdtOut.toFixed(6);
			
			// Price impact for removal
			priceImpact = ((lpInput / totalLPSupply) * 100).toFixed(2);
		}
	}

	function setMaxBalance(token) {
		if (token === 'wdoi') {
			wdoiAmount = wdoiBalance.toFixed(6);
		} else if (token === 'usdt') {
			usdtAmount = usdtBalance.toFixed(6);
		} else if (token === 'lp') {
			lpAmount = lpBalance.toFixed(6);
		}
		calculateLiquidity();
	}

	async function executeLiquidityOperation() {
		if (!connected || loading) return;

		try {
			loading = true;
			error = '';

			if (chainId !== SEPOLIA_CONFIG.chainId) {
				throw new Error('Please switch to Sepolia network');
			}

			const { ethers } = await import('ethers');
			const provider = new ethers.BrowserProvider(window.ethereum);
			const signer = await provider.getSigner();

			if (isAddLiquidity) {
				await executeAddLiquidity(signer, ethers);
			} else {
				await executeRemoveLiquidity(signer, ethers);
			}

		} catch (err) {
			console.error('Liquidity operation failed:', err);
			
			let errorMessage = err.reason || err.message;
			if (errorMessage.includes('user rejected')) {
				errorMessage = 'Transaction was cancelled by user';
			} else if (errorMessage.includes('insufficient funds')) {
				errorMessage = 'Insufficient funds for gas or tokens';
			}
			
			error = `Operation failed: ${errorMessage}`;
			setTimeout(() => error = '', 10000);
		} finally {
			loading = false;
		}
	}

	async function executeAddLiquidity(signer, ethers) {
		const wdoiInput = parseFloat(wdoiAmount);
		const usdtInput = parseFloat(usdtAmount);

		if (!wdoiInput || !usdtInput) {
			throw new Error('Please enter both token amounts');
		}

		console.log('🏊 Adding liquidity:', { wdoiInput, usdtInput });

		const poolAbi = [
			"function addLiquidity(uint256 wdoiAmount, uint256 usdtAmount, uint256 minWDOI, uint256 minUSDT) external returns (uint256)"
		];

		const erc20Abi = [
			"function approve(address spender, uint256 amount) external returns (bool)",
			"function allowance(address owner, address spender) external view returns (uint256)"
		];

		const poolContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.USDT_POOL, poolAbi, signer);
		const wdoiContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.WDOI_TOKEN, erc20Abi, signer);
		const usdtContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.USDT_TOKEN, erc20Abi, signer);

		const wdoiAmountWei = ethers.parseEther(wdoiInput.toString());
		const usdtAmountWei = ethers.parseUnits(usdtInput.toString(), 6);

		// Calculate minimum amounts with slippage
		const minWDOI = ethers.parseEther((wdoiInput * (1 - slippageTolerance / 100)).toString());
		const minUSDT = ethers.parseUnits((usdtInput * (1 - slippageTolerance / 100)).toString(), 6);

		// Check and approve wDOI
		const wdoiAllowance = await wdoiContract.allowance(userAddress, SEPOLIA_CONFIG.addresses.USDT_POOL);
		if (wdoiAllowance < wdoiAmountWei) {
			console.log('💰 Approving wDOI...');
			const wdoiApproveTx = await wdoiContract.approve(SEPOLIA_CONFIG.addresses.USDT_POOL, wdoiAmountWei);
			success = 'wDOI approval submitted...';
			await wdoiApproveTx.wait();
		}

		// Check and approve USDT
		const usdtAllowance = await usdtContract.allowance(userAddress, SEPOLIA_CONFIG.addresses.USDT_POOL);
		if (usdtAllowance < usdtAmountWei) {
			console.log('💰 Approving USDT...');
			const usdtApproveTx = await usdtContract.approve(SEPOLIA_CONFIG.addresses.USDT_POOL, usdtAmountWei);
			success = 'USDT approval submitted...';
			await usdtApproveTx.wait();
		}

		// Add liquidity
		console.log('🏊 Executing add liquidity...');
		const addTx = await poolContract.addLiquidity(wdoiAmountWei, usdtAmountWei, minWDOI, minUSDT, {
			gasLimit: 400000
		});

		success = `Add liquidity transaction submitted: ${addTx.hash.slice(0, 10)}...`;
		const receipt = await addTx.wait();

		console.log('✅ Liquidity added:', receipt.hash);
		success = `Liquidity added successfully! Added ${wdoiInput} wDOI and ${usdtInput} USDT`;

		// Reset form and reload balances
		wdoiAmount = '';
		usdtAmount = '';
		await loadBalances();
		await loadPoolInfo();

		setTimeout(() => success = '', 10000);
	}

	async function executeRemoveLiquidity(signer, ethers) {
		const lpInput = parseFloat(lpAmount);

		if (!lpInput) {
			throw new Error('Please enter LP token amount');
		}

		console.log('🏊 Removing liquidity:', { lpInput });

		const poolAbi = [
			"function removeLiquidity(uint256 lpTokens, uint256 minWDOI, uint256 minUSDT) external"
		];

		const poolContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.USDT_POOL, poolAbi, signer);

		const lpAmountWei = ethers.parseEther(lpInput.toString());

		// Calculate minimum amounts with slippage
		const expectedWDOI = parseFloat(wdoiAmount);
		const expectedUSDT = parseFloat(usdtAmount);
		const minWDOI = ethers.parseEther((expectedWDOI * (1 - slippageTolerance / 100)).toString());
		const minUSDT = ethers.parseUnits((expectedUSDT * (1 - slippageTolerance / 100)).toString(), 6);

		// Remove liquidity
		console.log('🏊 Executing remove liquidity...');
		const removeTx = await poolContract.removeLiquidity(lpAmountWei, minWDOI, minUSDT, {
			gasLimit: 300000
		});

		success = `Remove liquidity transaction submitted: ${removeTx.hash.slice(0, 10)}...`;
		const receipt = await removeTx.wait();

		console.log('✅ Liquidity removed:', receipt.hash);
		success = `Liquidity removed successfully! Received ${expectedWDOI.toFixed(4)} wDOI and ${expectedUSDT.toFixed(4)} USDT`;

		// Reset form and reload balances
		lpAmount = '';
		wdoiAmount = '';
		usdtAmount = '';
		await loadBalances();
		await loadPoolInfo();

		setTimeout(() => success = '', 10000);
	}

	// Reactive statements
	$: wdoiAmount && calculateLiquidity();
	$: usdtAmount && calculateLiquidity();
	$: lpAmount && calculateLiquidity();

	$: {
		console.log('🔄 LiquidityInterface state:', {
			connected,
			userAddress,
			isAddLiquidity,
			balances: { usdt: usdtBalance, wdoi: wdoiBalance, lp: lpBalance }
		});
	}
</script>

<div class="liquidity-container">
	<WalletConnection 
		bind:connected
		bind:userAddress
		bind:chainId
		bind:loading
		onConnect={handleWalletConnect}
		onDisconnect={handleWalletDisconnect}
	/>
	
	{#if connected}
		<div class="liquidity-interface">
			<!-- Operation Toggle -->
			<div class="operation-toggle">
				<button 
					class="toggle-btn" 
					class:active={isAddLiquidity}
					on:click={() => { isAddLiquidity = true; wdoiAmount = ''; usdtAmount = ''; lpAmount = ''; }}
				>
					Add Liquidity
				</button>
				<button 
					class="toggle-btn" 
					class:active={!isAddLiquidity}
					on:click={() => { isAddLiquidity = false; wdoiAmount = ''; usdtAmount = ''; lpAmount = ''; }}
				>
					Remove Liquidity
				</button>
			</div>

			{#if isAddLiquidity}
				<!-- Add Liquidity Form -->
				<div class="input-section">
					<div class="input-group">
						<label class="input-label">
							<span>wDOI Amount</span>
							<span class="balance">Balance: {wdoiBalance.toFixed(4)}</span>
						</label>
						<div class="input-container">
							<input
								type="number"
								step="0.000001"
								placeholder="0.0"
								bind:value={wdoiAmount}
								class="amount-input"
							/>
							<button class="max-button" on:click={() => setMaxBalance('wdoi')}>MAX</button>
						</div>
					</div>

					<div class="plus-icon">+</div>

					<div class="input-group">
						<label class="input-label">
							<span>USDT Amount</span>
							<span class="balance">Balance: {usdtBalance.toFixed(2)}</span>
						</label>
						<div class="input-container">
							<input
								type="number"
								step="0.01"
								placeholder="0.0"
								bind:value={usdtAmount}
								class="amount-input"
							/>
							<button class="max-button" on:click={() => setMaxBalance('usdt')}>MAX</button>
						</div>
					</div>
				</div>
			{:else}
				<!-- Remove Liquidity Form -->
				<div class="input-section">
					<div class="input-group">
						<label class="input-label">
							<span>LP Tokens</span>
							<span class="balance">Balance: {lpBalance.toFixed(6)}</span>
						</label>
						<div class="input-container">
							<input
								type="number"
								step="0.000001"
								placeholder="0.0"
								bind:value={lpAmount}
								class="amount-input"
							/>
							<button class="max-button" on:click={() => setMaxBalance('lp')}>MAX</button>
						</div>
					</div>

					{#if lpAmount && wdoiAmount && usdtAmount}
						<div class="output-preview">
							<div class="output-item">
								<span>You will receive:</span>
							</div>
							<div class="output-item">
								<span>≈ {parseFloat(wdoiAmount).toFixed(4)} wDOI</span>
							</div>
							<div class="output-item">
								<span>≈ {parseFloat(usdtAmount).toFixed(4)} USDT</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Price Info -->
			{#if priceImpact !== '0.00'}
				<div class="price-info">
					<div class="price-row">
						<span>Price Impact:</span>
						<span class="price-impact" class:high={parseFloat(priceImpact) > 5}>{priceImpact}%</span>
					</div>
					<div class="price-row">
						<span>Slippage Tolerance:</span>
						<span>{slippageTolerance}%</span>
					</div>
				</div>
			{/if}

			<!-- Pool Stats -->
			<div class="pool-stats">
				<div class="stat-item">
					<span>Pool Reserves:</span>
					<span>{reserveWDOI.toFixed(2)} wDOI / {reserveUSDT.toFixed(2)} USDT</span>
				</div>
				<div class="stat-item">
					<span>wDOI Price:</span>
					<span>${wdoiPrice} USDT</span>
				</div>
				<div class="stat-item">
					<span>Your LP Share:</span>
					<span>{totalLPSupply > 0 ? ((lpBalance / totalLPSupply) * 100).toFixed(4) : '0.00'}%</span>
				</div>
			</div>

			<!-- Execute Button -->
			<button 
				class="liquidity-button"
				class:disabled={loading || (!isAddLiquidity && !lpAmount) || (isAddLiquidity && (!wdoiAmount || !usdtAmount))}
				on:click={executeLiquidityOperation}
				disabled={loading || (!isAddLiquidity && !lpAmount) || (isAddLiquidity && (!wdoiAmount || !usdtAmount))}
			>
				{#if loading}
					{$_('common.processing')}...
				{:else}
					{isAddLiquidity ? 'Add Liquidity' : 'Remove Liquidity'}
				{/if}
			</button>
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
			<div class="loading-text">{$_('common.processing')}</div>
		</div>
	{/if}
</div>

<style>
	.liquidity-container {
		max-width: 400px;
		margin: 0 auto;
		position: relative;
		min-height: 200px;
	}

	.liquidity-interface {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.operation-toggle {
		display: flex;
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 4px;
		margin-bottom: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.toggle-btn {
		flex: 1;
		padding: 0.75rem;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: var(--text-secondary);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.toggle-btn.active {
		background: var(--accent-color);
		color: white;
		box-shadow: 0 2px 8px rgba(24, 214, 133, 0.3);
	}

	.input-section {
		margin-bottom: 1.5rem;
	}

	.input-group {
		margin-bottom: 1rem;
	}

	.input-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.balance {
		color: var(--text-secondary);
		font-size: 0.75rem;
	}

	.input-container {
		display: flex;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		overflow: hidden;
	}

	.amount-input {
		flex: 1;
		padding: 1rem;
		border: none;
		background: transparent;
		color: var(--text-primary);
		font-size: 1.125rem;
		outline: none;
	}

	.amount-input::placeholder {
		color: var(--text-secondary);
	}

	.max-button {
		padding: 0.5rem 1rem;
		background: var(--accent-color);
		color: white;
		border: none;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.75rem;
		transition: all 0.2s ease;
	}

	.max-button:hover {
		background: var(--accent-hover);
	}

	.plus-icon {
		text-align: center;
		font-size: 1.25rem;
		color: var(--text-secondary);
		margin: 0.5rem 0;
	}

	.output-preview {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1rem;
		margin-top: 1rem;
		border: 1px solid var(--border-color);
	}

	.output-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.output-item:last-child {
		margin-bottom: 0;
	}

	.price-info {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
		border: 1px solid var(--border-color);
	}

	.price-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.price-row:last-child {
		margin-bottom: 0;
	}

	.price-impact.high {
		color: #dc3545;
		font-weight: 600;
	}

	.pool-stats {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.stat-item:last-child {
		margin-bottom: 0;
	}

	.liquidity-button {
		width: 100%;
		padding: 1rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(24, 214, 133, 0.3);
	}

	.liquidity-button:hover:not(.disabled) {
		background: var(--accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(24, 214, 133, 0.4);
	}

	.liquidity-button.disabled {
		background: #6c757d;
		cursor: not-allowed;
		box-shadow: none;
		transform: none;
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