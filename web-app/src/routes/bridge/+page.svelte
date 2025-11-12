<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import BridgeInterface from '$lib/components/BridgeInterface.svelte';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';
	import { walletStore } from '$lib/stores/wallet.js';

	// Check access and redirect if needed (only in browser)
	$: if (typeof window !== 'undefined' && $walletStore && !$walletStore.isLoading) {
		if ($walletStore.isConnected) {
			// User has connected wallet via global state
			if (!$walletStore.isAdmin) {
				// No access - redirect to home
				console.log('🚫 Access denied: not admin');
				goto('/');
			}
		} else {
			// Wallet disconnected - redirect to home
			console.log('🚫 Access denied: wallet not connected');
			goto('/');
		}
	}

	onMount(() => {
		console.log('🌉 Bridge page mounted');
	});
</script>

<svelte:head>
	<title>DOI Bridge - Wrapped Doichain</title>
	<meta name="description" content="Convert DOI to wDOI and access Ethereum DeFi. Secure custodial bridge with multi-signature protection." />
</svelte:head>

<div class="bridge-page">
	<NetworkWarning />
	
	<div class="page-header">
		<h1>DOI ↔ wDOI Bridge</h1>
		<p class="page-description">
			Convert your DOI tokens to wDOI for use in Ethereum DeFi, or unwrap wDOI back to native DOI. 
			Our secure custodial bridge uses multi-signature verification for maximum security.
		</p>
	</div>

	<div class="bridge-section">
		<BridgeInterface />
	</div>

	<div class="info-cards">
		<div class="info-card security">
			<div class="card-icon">🔒</div>
			<h3>Security First</h3>
			<ul>
				<li><strong>Multi-signature custodians</strong> - Requires 2+ confirmations</li>
				<li><strong>Cold storage</strong> - DOI held in secure offline wallets</li>
				<li><strong>Proof of reserves</strong> - Public verification of backing</li>
				<li><strong>Audited contracts</strong> - Professional security review</li>
			</ul>
		</div>

		<div class="info-card process">
			<div class="card-icon">⚡</div>
			<h3>How It Works</h3>
			<ul>
				<li><strong>Wrapping:</strong> Send DOI → Get wDOI tokens</li>
				<li><strong>Trading:</strong> Use wDOI in any Ethereum DeFi protocol</li>
				<li><strong>Unwrapping:</strong> Burn wDOI → Receive DOI back</li>
				<li><strong>1:1 Ratio:</strong> Always redeemable at par value</li>
			</ul>
		</div>

		<div class="info-card benefits">
			<div class="card-icon">🚀</div>
			<h3>Benefits</h3>
			<ul>
				<li><strong>DeFi Access:</strong> Trade on Uniswap, provide liquidity</li>
				<li><strong>Faster Transactions:</strong> Ethereum's instant settlements</li>
				<li><strong>Lower Fees:</strong> Reduced transaction costs</li>
				<li><strong>Composability:</strong> Use with other DeFi protocols</li>
			</ul>
		</div>

		<div class="info-card risks">
			<div class="card-icon">⚠️</div>
			<h3>Important Notes</h3>
			<ul>
				<li><strong>Custodial Risk:</strong> DOI held by trusted custodians</li>
				<li><strong>Processing Time:</strong> Requests require custodian verification</li>
				<li><strong>Network Fees:</strong> Ethereum gas costs apply</li>
				<li><strong>Address Accuracy:</strong> Double-check all addresses</li>
			</ul>
		</div>
	</div>

	<div class="stats-section">
		<h2>Bridge Statistics</h2>
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-number">0.00</div>
				<div class="stat-label">Total DOI Wrapped</div>
			</div>
			<div class="stat-card">
				<div class="stat-number">0.00</div>
				<div class="stat-label">Total wDOI Supply</div>
			</div>
			<div class="stat-card">
				<div class="stat-number">100%</div>
				<div class="stat-label">Reserve Ratio</div>
			</div>
			<div class="stat-card">
				<div class="stat-number">0</div>
				<div class="stat-label">Active Requests</div>
			</div>
		</div>
	</div>

	<div class="faq-section">
		<h2>Frequently Asked Questions</h2>
		<div class="faq-grid">
			<div class="faq-item">
				<h4>How long does wrapping take?</h4>
				<p>Wrapping typically takes 10-30 minutes after custodians verify your DOI transaction. Complex requests may take longer.</p>
			</div>
			<div class="faq-item">
				<h4>Are there any fees?</h4>
				<p>The bridge itself has no fees. You only pay standard Ethereum gas costs for transactions and Doichain network fees.</p>
			</div>
			<div class="faq-item">
				<h4>Can I unwrap anytime?</h4>
				<p>Yes, you can unwrap wDOI to DOI at any time. The process requires custodian confirmation for security.</p>
			</div>
			<div class="faq-item">
				<h4>Is my DOI safe?</h4>
				<p>DOI is held in cold storage by trusted custodians with multi-signature security. All reserves are publicly verifiable.</p>
			</div>
		</div>
	</div>
</div>

<style>
	.bridge-page {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, var(--accent-color), #16a085);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 1rem;
	}

	.page-description {
		color: var(--text-secondary);
		font-size: 1.125rem;
		line-height: 1.6;
		max-width: 700px;
		margin: 0 auto;
	}

	.bridge-section {
		margin-bottom: 4rem;
	}

	.info-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 4rem;
	}

	.info-card {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.info-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}

	.card-icon {
		font-size: 2rem;
		margin-bottom: 1rem;
		text-align: center;
	}

	.info-card h3 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-size: 1.25rem;
		font-weight: 600;
		text-align: center;
	}

	.info-card ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.info-card li {
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
		padding-left: 1.5rem;
		position: relative;
		line-height: 1.5;
	}

	.info-card li:last-child {
		margin-bottom: 0;
	}

	.info-card li::before {
		content: '•';
		font-weight: bold;
		position: absolute;
		left: 0;
	}

	.info-card.security li::before {
		color: #28a745;
	}

	.info-card.process li::before {
		color: var(--accent-color);
	}

	.info-card.benefits li::before {
		color: #007bff;
	}

	.info-card.risks li::before {
		color: #ffc107;
	}

	.info-card strong {
		color: var(--text-primary);
		font-weight: 600;
	}

	.stats-section {
		margin-bottom: 4rem;
	}

	.stats-section h2 {
		text-align: center;
		color: var(--text-primary);
		margin-bottom: 2rem;
		font-size: 2rem;
		font-weight: 600;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		border: 1px solid var(--border-color);
		transition: transform 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
	}

	.stat-number {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--accent-color);
		margin-bottom: 0.5rem;
	}

	.stat-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.faq-section {
		margin-bottom: 2rem;
	}

	.faq-section h2 {
		text-align: center;
		color: var(--text-primary);
		margin-bottom: 2rem;
		font-size: 2rem;
		font-weight: 600;
	}

	.faq-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.faq-item {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.faq-item h4 {
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.faq-item p {
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
	}

	@media (max-width: 768px) {
		.bridge-page {
			padding: 1rem;
		}

		.page-header h1 {
			font-size: 2rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.info-cards {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.faq-grid {
			grid-template-columns: 1fr;
		}

		.stat-number {
			font-size: 2rem;
		}
	}
</style>