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
			WRAPPED_DOICHAIN: "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5" // WrappedDoichainCustodial contract
		}
	};

	// Custodian addresses (in production these would be loaded from contract)
	const CUSTODIAN_ADDRESSES = [
		"DQmCustodian1ExampleAddress12345...",
		"DQmCustodian2ExampleAddress67890...",
		"DQmCustodian3ExampleAddressABCDE..."
	];

	// Component state
	let connected = false;
	let userAddress = '';
	let loading = false;
	let error = '';
	let success = '';
	let chainId = null;

	// Bridge operation state
	let isWrapping = true; // true = DOI → wDOI, false = wDOI → DOI
	let amount = '';
	let doichainAddress = '';
	let doichainTxHash = '';
	let selectedCustodian = CUSTODIAN_ADDRESSES[0];

	// Balances and info
	let wdoiBalance = 0;
	let pendingRequests = [];
	let requestHistory = [];

	// Reserve information
	let totalSupply = 0;
	let totalReserves = 0;
	let reserveRatio = 0;

	onMount(async () => {
		const shouldAutoConnect = sessionStorage.getItem('wallet-auto-connect') === 'true';
		if (shouldAutoConnect) {
			const status = await getMetaMaskStatus();
			if (status.connected) {
				handleWalletConnect({ userAddress: status.accounts[0], chainId: status.chainId });
			}
		}
	});

	async function handleWalletConnect({ userAddress: addr, chainId: chain }) {
		connected = true;
		userAddress = addr;
		chainId = chain;
		
		sessionStorage.setItem('wallet-auto-connect', 'true');
		
		await loadUserData();
		
		success = 'Wallet connected successfully!';
		setTimeout(() => success = '', 3000);
	}

	function handleWalletDisconnect() {
		sessionStorage.setItem('wallet-auto-connect', 'false');
		
		connected = false;
		userAddress = '';
		chainId = null;
		wdoiBalance = 0;
		amount = '';
		doichainAddress = '';
		doichainTxHash = '';
		pendingRequests = [];
	}

	async function loadUserData() {
		if (!connected || !userAddress || chainId !== SEPOLIA_CONFIG.chainId) {
			console.warn('Cannot load user data: not connected or wrong network');
			return;
		}

		try {
			const { ethers } = await import('ethers');
			const provider = new ethers.BrowserProvider(window.ethereum);

			// Load wDOI balance
			const erc20Abi = [
				"function balanceOf(address owner) view returns (uint256)",
				"function totalSupply() view returns (uint256)"
			];

			const bridgeAbi = [
				"function getReservesInfo() external view returns (uint256, uint256, bool)"
			];

			const wdoiContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.WRAPPED_DOICHAIN, erc20Abi, provider);
			const bridgeContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.WRAPPED_DOICHAIN, bridgeAbi, provider);

			// Get balances and reserves
			const [balance, supply, reserves] = await Promise.all([
				wdoiContract.balanceOf(userAddress),
				wdoiContract.totalSupply(),
				bridgeContract.getReservesInfo()
			]);

			wdoiBalance = parseFloat(ethers.formatEther(balance));
			totalSupply = parseFloat(ethers.formatEther(supply));
			totalReserves = parseFloat(ethers.formatEther(reserves[1])); // totalReservesAmount
			reserveRatio = totalSupply > 0 ? (totalReserves / totalSupply * 100) : 0;

			console.log('💰 Bridge Data:', {
				wdoiBalance,
				totalSupply,
				totalReserves,
				reserveRatio
			});

			// Load pending requests for this user
			await loadPendingRequests();

		} catch (err) {
			console.error('Failed to load user data:', err);
			error = `Failed to load data: ${err.message}`;
			setTimeout(() => error = '', 5000);
		}
	}

	async function loadPendingRequests() {
		try {
			const { ethers } = await import('ethers');
			const provider = new ethers.BrowserProvider(window.ethereum);

			const bridgeAbi = [
				"event MintRequested(uint256 indexed requestId, address indexed recipient, uint256 amount, string doichainTxHash, address indexed merchant)",
				"event BurnRequested(uint256 indexed requestId, address indexed account, uint256 amount, string doichainWithdrawAddress, address indexed merchant)"
			];

			const bridgeContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.WRAPPED_DOICHAIN, bridgeAbi, provider);

			// Get recent events for this user
			const currentBlock = await provider.getBlockNumber();
			const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks

			const mintFilter = bridgeContract.filters.MintRequested(null, userAddress);
			const burnFilter = bridgeContract.filters.BurnRequested(null, userAddress);

			const [mintEvents, burnEvents] = await Promise.all([
				bridgeContract.queryFilter(mintFilter, fromBlock),
				bridgeContract.queryFilter(burnFilter, fromBlock)
			]);

			// Process and combine events
			const allRequests = [
				...mintEvents.map(event => ({
					type: 'mint',
					requestId: event.args.requestId.toString(),
					amount: ethers.formatEther(event.args.amount),
					hash: event.args.doichainTxHash,
					timestamp: 'Loading...', // Would need to get block timestamp
					status: 'pending'
				})),
				...burnEvents.map(event => ({
					type: 'burn',
					requestId: event.args.requestId.toString(),
					amount: ethers.formatEther(event.args.amount),
					address: event.args.doichainWithdrawAddress,
					timestamp: 'Loading...', 
					status: 'pending'
				}))
			];

			pendingRequests = allRequests.slice(0, 5); // Show last 5 requests

		} catch (err) {
			console.error('Failed to load pending requests:', err);
		}
	}

	async function submitWrapRequest() {
		if (!amount || !doichainTxHash || !connected) return;

		try {
			loading = true;
			error = '';

			if (chainId !== SEPOLIA_CONFIG.chainId) {
				throw new Error('Please switch to Sepolia network');
			}

			const { ethers } = await import('ethers');
			const provider = new ethers.BrowserProvider(window.ethereum);
			const signer = await provider.getSigner();

			const bridgeAbi = [
				"function requestMint(address recipient, uint256 amount, string memory doichainTxHash, string memory custodianAddress) external returns (uint256)"
			];

			const bridgeContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.WRAPPED_DOICHAIN, bridgeAbi, signer);

			console.log('🌉 Submitting wrap request:', {
				recipient: userAddress,
				amount: ethers.parseEther(amount),
				doichainTxHash,
				custodianAddress: selectedCustodian
			});

			const tx = await bridgeContract.requestMint(
				userAddress,
				ethers.parseEther(amount),
				doichainTxHash,
				selectedCustodian,
				{ gasLimit: 300000 }
			);

			success = `Wrap request submitted: ${tx.hash.slice(0, 10)}...`;
			const receipt = await tx.wait();

			console.log('✅ Wrap request submitted:', receipt.hash);
			success = `Wrap request submitted successfully! Request ID will be assigned and processed by custodians.`;
			
			// Reset form
			amount = '';
			doichainTxHash = '';
			
			// Reload data
			await loadUserData();
			setTimeout(() => success = '', 10000);

		} catch (err) {
			console.error('Wrap request failed:', err);
			
			let errorMessage = err.reason || err.message;
			if (errorMessage.includes('user rejected')) {
				errorMessage = 'Transaction was cancelled by user';
			} else if (errorMessage.includes('insufficient funds')) {
				errorMessage = 'Insufficient funds for gas';
			} else if (errorMessage.includes('already processed')) {
				errorMessage = 'This Doichain transaction has already been processed';
			}
			
			error = `Wrap request failed: ${errorMessage}`;
			setTimeout(() => error = '', 10000);
		} finally {
			loading = false;
		}
	}

	async function submitUnwrapRequest() {
		if (!amount || !doichainAddress || !connected) return;

		try {
			loading = true;
			error = '';

			if (chainId !== SEPOLIA_CONFIG.chainId) {
				throw new Error('Please switch to Sepolia network');
			}

			const parsedAmount = parseFloat(amount);
			if (parsedAmount > wdoiBalance) {
				throw new Error('Insufficient wDOI balance');
			}

			const { ethers } = await import('ethers');
			const provider = new ethers.BrowserProvider(window.ethereum);
			const signer = await provider.getSigner();

			const bridgeAbi = [
				"function requestBurn(address account, uint256 amount, string memory doichainWithdrawAddress) external returns (uint256)"
			];

			const bridgeContract = new ethers.Contract(SEPOLIA_CONFIG.addresses.WRAPPED_DOICHAIN, bridgeAbi, signer);

			console.log('🌉 Submitting unwrap request:', {
				account: userAddress,
				amount: ethers.parseEther(amount),
				doichainAddress
			});

			const tx = await bridgeContract.requestBurn(
				userAddress,
				ethers.parseEther(amount),
				doichainAddress,
				{ gasLimit: 300000 }
			);

			success = `Unwrap request submitted: ${tx.hash.slice(0, 10)}...`;
			const receipt = await tx.wait();

			console.log('✅ Unwrap request submitted:', receipt.hash);
			success = `Unwrap request submitted successfully! DOI will be sent to ${doichainAddress} after custodian confirmation.`;
			
			// Reset form
			amount = '';
			doichainAddress = '';
			
			// Reload data
			await loadUserData();
			setTimeout(() => success = '', 10000);

		} catch (err) {
			console.error('Unwrap request failed:', err);
			
			let errorMessage = err.reason || err.message;
			if (errorMessage.includes('user rejected')) {
				errorMessage = 'Transaction was cancelled by user';
			} else if (errorMessage.includes('insufficient funds')) {
				errorMessage = 'Insufficient funds for gas';
			} else if (errorMessage.includes('Insufficient balance')) {
				errorMessage = 'Insufficient wDOI balance';
			}
			
			error = `Unwrap request failed: ${errorMessage}`;
			setTimeout(() => error = '', 10000);
		} finally {
			loading = false;
		}
	}

	// Reactive statements (debug disabled for cleaner console)
	// $: {
	//	console.log('🌉 BridgeInterface state:', {
	//		connected,
	//		userAddress,
	//		isWrapping,
	//		wdoiBalance,
	//		totalReserves,
	//		reserveRatio
	//	});
	// }
</script>

<div class="bridge-container">
	<WalletConnection 
		bind:connected
		bind:userAddress
		bind:chainId
		bind:loading
		onConnect={handleWalletConnect}
		onDisconnect={handleWalletDisconnect}
	/>
	
	{#if connected}
		<div class="bridge-interface">
			<!-- Operation Toggle -->
			<div class="operation-toggle">
				<button 
					class="toggle-btn" 
					class:active={isWrapping}
					on:click={() => { isWrapping = true; amount = ''; doichainTxHash = ''; doichainAddress = ''; }}
				>
					Wrap DOI → wDOI
				</button>
				<button 
					class="toggle-btn" 
					class:active={!isWrapping}
					on:click={() => { isWrapping = false; amount = ''; doichainTxHash = ''; doichainAddress = ''; }}
				>
					Unwrap wDOI → DOI
				</button>
			</div>

			{#if isWrapping}
				<!-- DOI → wDOI Wrapping -->
				<div class="wrap-section">
					<h3>Wrap DOI to wDOI</h3>
					<p class="process-info">
						First send DOI to a custodian address, then submit this form with the transaction hash.
						Custodians will verify your transaction and mint wDOI tokens to your wallet.
					</p>

					<div class="custodian-selection">
						<label>Select Custodian:</label>
						<select bind:value={selectedCustodian} class="custodian-select">
							{#each CUSTODIAN_ADDRESSES as custodian, i}
								<option value={custodian}>Custodian {i + 1}: {custodian.slice(0, 20)}...</option>
							{/each}
						</select>
					</div>

					<div class="custodian-info">
						<h4>📤 Step 1: Send DOI to Custodian</h4>
						<div class="custodian-address">
							<code>{selectedCustodian}</code>
							<button class="copy-btn" on:click={() => navigator.clipboard.writeText(selectedCustodian)}>
								Copy
							</button>
						</div>
						<p class="warning">⚠️ Only send DOI to verified custodian addresses listed above</p>
					</div>

					<div class="form-section">
						<h4>📝 Step 2: Submit Wrap Request</h4>
						
						<div class="input-group">
							<label>DOI Amount Sent</label>
							<input
								type="number"
								step="0.000001"
								placeholder="Amount of DOI you sent"
								bind:value={amount}
								class="amount-input"
							/>
						</div>

						<div class="input-group">
							<label>Doichain Transaction Hash</label>
							<input
								type="text"
								placeholder="DOI transaction hash as proof of payment"
								bind:value={doichainTxHash}
								class="hash-input"
							/>
							<small class="input-help">This hash proves you sent DOI to the custodian</small>
						</div>
					</div>
				</div>
			{:else}
				<!-- wDOI → DOI Unwrapping -->
				<div class="unwrap-section">
					<h3>Unwrap wDOI to DOI</h3>
					<p class="process-info">
						Your wDOI tokens will be burned and equivalent DOI will be sent to your Doichain address.
						This process requires custodian confirmation and may take some time.
					</p>

					<div class="balance-info">
						<div class="balance-display">
							<span>Your wDOI Balance:</span>
							<span class="balance-amount">{wdoiBalance.toFixed(6)} wDOI</span>
						</div>
						<button 
							class="max-button" 
							on:click={() => amount = wdoiBalance.toString()}
							disabled={wdoiBalance === 0}
						>
							MAX
						</button>
					</div>

					<div class="input-group">
						<label>wDOI Amount to Unwrap</label>
						<input
							type="number"
							step="0.000001"
							placeholder="Amount of wDOI to burn"
							bind:value={amount}
							class="amount-input"
							max={wdoiBalance}
						/>
					</div>

					<div class="input-group">
						<label>Doichain Address</label>
						<input
							type="text"
							placeholder="Your DOI address to receive coins"
							bind:value={doichainAddress}
							class="address-input"
						/>
						<small class="input-help">Make sure this address is correct - transactions cannot be reversed</small>
					</div>
				</div>
			{/if}

			<!-- Submit Button -->
			<button 
				class="bridge-button"
				class:disabled={loading || !amount || (isWrapping && !doichainTxHash) || (!isWrapping && !doichainAddress)}
				on:click={isWrapping ? submitWrapRequest : submitUnwrapRequest}
				disabled={loading || !amount || (isWrapping && !doichainTxHash) || (!isWrapping && !doichainAddress)}
			>
				{#if loading}
					Processing Request...
				{:else}
					{isWrapping ? 'Submit Wrap Request' : 'Submit Unwrap Request'}
				{/if}
			</button>

			<!-- System Information -->
			<div class="system-info">
				<h4>🏦 System Status</h4>
				<div class="info-grid">
					<div class="info-item">
						<span>Total wDOI Supply:</span>
						<span>{totalSupply.toFixed(2)} wDOI</span>
					</div>
					<div class="info-item">
						<span>DOI Reserves:</span>
						<span>{totalReserves.toFixed(2)} DOI</span>
					</div>
					<div class="info-item">
						<span>Reserve Ratio:</span>
						<span class="reserve-ratio" class:healthy={reserveRatio >= 100}>{reserveRatio.toFixed(1)}%</span>
					</div>
				</div>
			</div>

			<!-- Recent Requests -->
			{#if pendingRequests.length > 0}
				<div class="recent-requests">
					<h4>📋 Your Recent Requests</h4>
					<div class="requests-list">
						{#each pendingRequests as request}
							<div class="request-item">
								<div class="request-header">
									<span class="request-type">{request.type === 'mint' ? '📤 Wrap' : '📥 Unwrap'}</span>
									<span class="request-amount">{parseFloat(request.amount).toFixed(4)} {request.type === 'mint' ? 'DOI → wDOI' : 'wDOI → DOI'}</span>
								</div>
								<div class="request-details">
									<small>Request ID: {request.requestId}</small>
									<small class="request-status">Status: {request.status}</small>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Process Information -->
			<div class="process-info-box">
				<h4>ℹ️ How Bridge Works</h4>
				<div class="process-steps">
					{#if isWrapping}
						<div class="step">
							<strong>1.</strong> Send DOI to custodian cold storage address
						</div>
						<div class="step">
							<strong>2.</strong> Submit transaction hash and amount here
						</div>
						<div class="step">
							<strong>3.</strong> Custodians verify DOI receipt (requires 2+ confirmations)
						</div>
						<div class="step">
							<strong>4.</strong> wDOI tokens automatically minted to your wallet
						</div>
					{:else}
						<div class="step">
							<strong>1.</strong> Submit unwrap request with your DOI address
						</div>
						<div class="step">
							<strong>2.</strong> wDOI tokens are locked/burned
						</div>
						<div class="step">
							<strong>3.</strong> Custodians confirm and release DOI (requires 2+ confirmations)
						</div>
						<div class="step">
							<strong>4.</strong> DOI sent to your Doichain address
						</div>
					{/if}
				</div>
			</div>
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
			<div class="loading-text">Processing Bridge Request...</div>
		</div>
	{/if}
</div>

<style>
	.bridge-container {
		max-width: 600px;
		margin: 0 auto;
		position: relative;
	}

	.bridge-interface {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 2rem;
		border: 1px solid var(--border-color);
	}

	.operation-toggle {
		display: flex;
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 4px;
		margin-bottom: 2rem;
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

	.wrap-section, .unwrap-section {
		margin-bottom: 2rem;
	}

	.wrap-section h3, .unwrap-section h3 {
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		font-size: 1.5rem;
	}

	.process-info {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
		line-height: 1.6;
		background: var(--bg-primary);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	.custodian-selection {
		margin-bottom: 1.5rem;
	}

	.custodian-selection label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.custodian-select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.custodian-info {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.custodian-info h4 {
		margin-bottom: 1rem;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.custodian-address {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.custodian-address code {
		flex: 1;
		background: var(--bg-secondary);
		padding: 0.75rem;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.8rem;
		word-break: break-all;
		border: 1px solid var(--border-color);
	}

	.copy-btn {
		padding: 0.5rem 1rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.warning {
		color: #dc3545;
		font-size: 0.8rem;
		margin: 0;
		font-weight: 500;
	}

	.form-section {
		margin-bottom: 1.5rem;
	}

	.form-section h4 {
		margin-bottom: 1rem;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.input-group {
		margin-bottom: 1rem;
	}

	.input-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.amount-input, .hash-input, .address-input {
		width: 100%;
		padding: 1rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.amount-input:focus, .hash-input:focus, .address-input:focus {
		border-color: var(--accent-color);
		box-shadow: 0 0 0 2px rgba(24, 214, 133, 0.2);
	}

	.input-help {
		display: block;
		margin-top: 0.25rem;
		color: var(--text-secondary);
		font-size: 0.75rem;
	}

	.balance-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding: 1rem;
		background: var(--bg-primary);
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	.balance-display {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.balance-amount {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1.1rem;
	}

	.max-button {
		padding: 0.5rem 1rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.75rem;
		transition: background 0.2s ease;
	}

	.max-button:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.max-button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.bridge-button {
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
		margin-bottom: 2rem;
		box-shadow: 0 4px 12px rgba(24, 214, 133, 0.3);
	}

	.bridge-button:hover:not(.disabled) {
		background: var(--accent-hover);
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(24, 214, 133, 0.4);
	}

	.bridge-button.disabled {
		background: #6c757d;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.system-info {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.system-info h4 {
		margin-bottom: 1rem;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.info-grid {
		display: grid;
		gap: 0.5rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.reserve-ratio {
		font-weight: 600;
	}

	.reserve-ratio.healthy {
		color: #28a745;
	}

	.recent-requests {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.recent-requests h4 {
		margin-bottom: 1rem;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.requests-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.request-item {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid var(--border-color);
	}

	.request-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.request-type {
		font-weight: 600;
		color: var(--text-primary);
	}

	.request-amount {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.request-details {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.request-status {
		color: #ffc107;
		font-weight: 500;
	}

	.process-info-box {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.process-info-box h4 {
		margin-bottom: 1rem;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.process-steps {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.step {
		color: var(--text-secondary);
		line-height: 1.5;
		padding-left: 1rem;
		position: relative;
	}

	.step strong {
		color: var(--accent-color);
		margin-right: 0.5rem;
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

	@media (max-width: 768px) {
		.bridge-interface {
			padding: 1.5rem;
		}

		.info-grid {
			font-size: 0.8rem;
		}

		.request-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>