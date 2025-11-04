<script>
	import { _ } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$_('footer.terms')} - {$_('meta.title')}</title>
</svelte:head>

<div class="legal-page">
	<h1>{$_('footer.terms')}</h1>
	<div class="last-updated">Last updated: October 31, 2024</div>
	
	<section>
		<h2>1. Acceptance of Terms</h2>
		<p>
			By accessing and using this decentralized application (DApp), you accept and agree to be bound by the terms and provision of this agreement.
		</p>
	</section>

	<section>
		<h2>2. Description of Service</h2>
		<p>
			Our DApp provides:
		</p>
		<ul>
			<li>Token swapping functionality between wDOI and USDT</li>
			<li>Access to decentralized liquidity pools</li>
			<li>Interface for blockchain transactions</li>
			<li>Educational resources about DeFi</li>
		</ul>
	</section>

	<section>
		<h2>3. Risks and Disclaimers</h2>
		<div class="warning-box">
			<h3>⚠️ Important Risks</h3>
			<ul>
				<li><strong>Smart Contract Risk:</strong> Smart contracts may contain bugs or vulnerabilities</li>
				<li><strong>Market Risk:</strong> Token prices can be volatile and unpredictable</li>
				<li><strong>Impermanent Loss:</strong> Providing liquidity may result in losses</li>
				<li><strong>Regulatory Risk:</strong> Regulatory changes may affect DeFi services</li>
				<li><strong>Technical Risk:</strong> Blockchain networks may experience downtime</li>
			</ul>
		</div>
	</section>

	<section>
		<h2>4. User Responsibilities</h2>
		<p>
			You are responsible for:
		</p>
		<ul>
			<li>Securing your wallet and private keys</li>
			<li>Understanding the risks of DeFi protocols</li>
			<li>Complying with applicable laws and regulations</li>
			<li>Conducting your own research before trading</li>
		</ul>
	</section>

	<section>
		<h2>5. Prohibited Uses</h2>
		<p>
			You may not use our service for:
		</p>
		<ul>
			<li>Money laundering or terrorist financing</li>
			<li>Any illegal activities</li>
			<li>Circumventing sanctions or embargoes</li>
			<li>Manipulating markets or prices</li>
		</ul>
	</section>

	<section>
		<h2>6. Limitation of Liability</h2>
		<p>
			We are not liable for any losses, damages, or claims arising from:
		</p>
		<ul>
			<li>Use of the DApp or smart contracts</li>
			<li>Market volatility or trading losses</li>
			<li>Technical failures or network issues</li>
			<li>Third-party services or integrations</li>
		</ul>
	</section>

	<section>
		<h2>7. Governing Law</h2>
		<p>
			These terms are governed by the laws of Germany and the European Union.
		</p>
	</section>
</div>

<style>
	.legal-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		line-height: 1.6;
	}
	
	.legal-page h1 {
		color: var(--accent-color);
		border-bottom: 2px solid var(--border-color);
		padding-bottom: 0.5rem;
	}
	
	.last-updated {
		color: var(--text-secondary);
		font-style: italic;
		margin-bottom: 2rem;
	}
	
	section {
		margin-bottom: 2rem;
	}
	
	section h2 {
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.warning-box {
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 8px;
		padding: 1.5rem;
		margin: 1rem 0;
	}
	
	.warning-box h3 {
		color: #856404;
		margin-top: 0;
	}
	
	:global([data-theme="dark"]) .warning-box {
		background: #3d3d00;
		border-color: #595900;
	}
	
	:global([data-theme="dark"]) .warning-box h3 {
		color: #ffeb3b;
	}
	
	ul {
		padding-left: 1.5rem;
	}
	
	li {
		margin-bottom: 0.5rem;
	}
</style>