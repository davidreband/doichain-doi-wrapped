<script>
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import LiquidityInterface from '$lib/components/LiquidityInterface.svelte';
	import NetworkWarning from '$lib/components/NetworkWarning.svelte';

	onMount(() => {
		console.log('🏊 Liquidity page mounted');
	});
</script>

<svelte:head>
	<title>wDOI Liquidity Pool - Wrapped Doichain</title>
	<meta name="description" content="Add or remove liquidity from the wDOI/USDT pool and earn trading fees." />
</svelte:head>

<div class="liquidity-page">
	<NetworkWarning />
	
	<div class="page-header">
		<h1>Liquidity Pool</h1>
		<p class="page-description">
			Provide liquidity to the wDOI/USDT pool and earn a share of trading fees. 
			Liquidity providers receive LP tokens representing their share of the pool.
		</p>
	</div>

	<div class="liquidity-section">
		<LiquidityInterface />
	</div>

	<div class="info-cards">
		<div class="info-card">
			<h3>How it works</h3>
			<ul>
				<li>Add equal value of wDOI and USDT tokens</li>
				<li>Receive LP tokens representing your pool share</li>
				<li>Earn 0.3% fee from all trades proportional to your share</li>
				<li>Remove liquidity anytime by burning LP tokens</li>
			</ul>
		</div>

		<div class="info-card">
			<h3>Important Notes</h3>
			<ul>
				<li><strong>Impermanent Loss:</strong> Value may fluctuate vs holding tokens</li>
				<li><strong>Price Impact:</strong> Large amounts may affect pool ratios</li>
				<li><strong>Slippage:</strong> Price may change during transaction</li>
				<li><strong>Gas Fees:</strong> Each transaction requires ETH for gas</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.liquidity-page {
		max-width: 800px;
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
		max-width: 600px;
		margin: 0 auto;
	}

	.liquidity-section {
		margin-bottom: 3rem;
	}

	.info-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.info-card {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.info-card h3 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-size: 1.25rem;
		font-weight: 600;
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
		color: var(--accent-color);
		font-weight: bold;
		position: absolute;
		left: 0;
	}

	.info-card strong {
		color: var(--text-primary);
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.liquidity-page {
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
	}
</style>